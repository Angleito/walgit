module walgit::enhanced_blob_object {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use std::vector;
    use std::option::{Self, Option};
    
    use walgit::git_blob_object::{Self, GitBlobObject};
    use walgit::delta_compression::{Self, DeltaObject};
    use walgit::compression::{Self, CompressedData};
    use walgit::pack_files::{Self, PackFile};
    
    friend walgit::storage_optimization;
    
    // Import constants we need
    const MAX_INLINE_SIZE: u64 = 2097152; // From git_blob_object
    const ENCODING_RAW: u8 = 0; // From git_blob_object
    
    /// Error codes
    const EInvalidBlobId: u64 = 1;
    const EStorageLimitExceeded: u64 = 2;
    const ECompressionFailed: u64 = 3;
    const EDeltaCreationFailed: u64 = 4;
    const EBlobNotFound: u64 = 5;
    
    /// Storage types with new additions
    const STORAGE_INLINE: u8 = 0;     // Small blobs stored directly
    const STORAGE_CHUNKED: u8 = 1;    // Large blobs in chunks
    const STORAGE_WALRUS: u8 = 2;     // External Walrus storage
    const STORAGE_DELTA: u8 = 3;      // Delta compressed
    const STORAGE_PACKED: u8 = 4;     // In pack file
    
    /// Enhanced blob object with compression and delta support
    public struct EnhancedBlobObject has key, store {
        id: UID,
        base_blob: GitBlobObject,
        compression_info: Option<CompressedData>,
        delta_info: Option<DeltaObject>,
        pack_info: Option<PackInfo>,
        statistics: BlobStatistics
    }
    
    /// Information about blob's location in pack file
    public struct PackInfo has store, drop, copy {
        pack_file_id: ID,
        offset: u64,
        size: u64
    }
    
    /// Blob statistics for optimization decisions
    public struct BlobStatistics has store, drop {
        original_size: u64,
        compressed_size: u64,
        delta_size: u64,
        access_count: u64,
        last_access: u64,
        similarity_score: u64
    }
    
    /// Event for blob optimization
    public struct BlobOptimized has copy, drop {
        blob_id: address,
        original_size: u64,
        optimized_size: u64,
        optimization_type: u8,
        space_saved: u64
    }
    
    /// Create enhanced blob with automatic optimization
    public fun create_enhanced_blob(
        content: vector<u8>,
        hash: String,
        similar_blob_id: Option<ID>,
        ctx: &mut TxContext
    ): EnhancedBlobObject {
        let original_size = vector::length(&content);
        let mut optimized_content = content;
        let mut storage_type = git_blob_object::STORAGE_INLINE;
        let mut compression_info = option::none();
        let mut delta_info = option::none();
        
        // Step 1: Try delta compression if similar blob exists
        if (option::is_some(&similar_blob_id)) {
            let similar_id = *option::borrow(&similar_blob_id);
            let delta_result = try_delta_compression(
                &content, 
                similar_id, 
                hash, 
                ctx
            );
            
            if (option::is_some(&delta_result)) {
                delta_info = delta_result;
                storage_type = STORAGE_DELTA;
            }
        };
        
        // Step 2: Apply compression if no delta or delta is not beneficial
        if (option::is_none(&delta_info)) {
            let algorithm = compression::choose_algorithm(&content, false);
            let level = compression::LEVEL_DEFAULT;
            let compressed = compression::compress(&content, algorithm, level);
            
            if (compression::should_compress(original_size, compressed.compressed_size, 90)) {
                compression_info = option::some(compressed);
                optimized_content = compressed.data;
                storage_type = STORAGE_INLINE; // Will be updated based on size
            }
        };
        
        // Step 3: Determine final storage type based on size
        let final_size = if (option::is_some(&delta_info)) {
            let delta = option::borrow(&delta_info);
            delta.compressed_size
        } else if (option::is_some(&compression_info)) {
            let compressed = option::borrow(&compression_info);
            compressed.compressed_size
        } else {
            original_size
        };
        
        if (final_size > MAX_INLINE_SIZE && storage_type != STORAGE_DELTA) {
            storage_type = STORAGE_CHUNKED;
        };
        
        // For now, we'll create a mock GitBlobObject since create doesn't exist
        // In production, this would integrate with actual blob creation
        // Create base blob object
        let base_blob = create_mock_blob(
            original_size,
            hash,
            storage_type,
            ctx
        );
        
        // Create enhanced blob
        let enhanced = EnhancedBlobObject {
            id: object::new(ctx),
            base_blob,
            compression_info,
            delta_info,
            pack_info: option::none(),
            statistics: BlobStatistics {
                original_size,
                compressed_size: final_size,
                delta_size: if (option::is_some(&delta_info)) { final_size } else { 0 },
                access_count: 0,
                last_access: tx_context::epoch(ctx),
                similarity_score: 0
            }
        };
        
        // Emit optimization event
        event::emit(BlobOptimized {
            blob_id: object::uid_to_address(&enhanced.id),
            original_size,
            optimized_size: final_size,
            optimization_type: storage_type,
            space_saved: original_size - final_size
        });
        
        enhanced
    }
    
    /// Try to create delta compression
    fun try_delta_compression(
        content: &vector<u8>,
        similar_blob_id: ID,
        hash: String,
        ctx: &mut TxContext
    ): Option<DeltaObject> {
        // In production, would fetch the similar blob's content
        // For now, simulate with mock data
        let base_content = vector::empty<u8>();
        vector::push_back(&mut base_content, 1);
        vector::push_back(&mut base_content, 2);
        vector::push_back(&mut base_content, 3);
        
        delta_compression::try_create_delta(
            &base_content,
            content,
            similar_blob_id,
            hash,
            0, // delta depth
            ctx
        )
    }
    
    /// Pack multiple blobs into a pack file
    public fun pack_blobs(
        blobs: vector<ID>,
        repository_id: ID,
        ctx: &mut TxContext
    ): (PackFile, vector<EnhancedBlobObject>) {
        let (pack_file, pack_index) = pack_files::create_pack_file(
            blobs,
            repository_id,
            ctx
        );
        
        let packed_blobs = vector::empty();
        
        // Update each blob with pack info
        let i = 0;
        while (i < vector::length(&blobs)) {
            let blob_id = *vector::borrow(&blobs, i);
            
            // Create pack info for the blob
            let pack_info = PackInfo {
                pack_file_id: object::uid_to_inner(&pack_file.id),
                offset: i * 1000, // Simplified offset calculation
                size: 1000 // Simplified size
            };
            
            // In production, would update existing blob
            // For now, create a mock enhanced blob
            let mock_blob = create_mock_enhanced_blob(pack_info, ctx);
            vector::push_back(&mut packed_blobs, mock_blob);
            
            i = i + 1;
        };
        
        transfer::share_object(pack_index);
        (pack_file, packed_blobs)
    }
    
    /// Get blob content with automatic decompression
    public fun get_blob_content(
        blob: &EnhancedBlobObject,
        pack_files: &Table<ID, PackFile>
    ): vector<u8> {
        let content = vector::empty();
        
        // Handle different storage types
        if (option::is_some(&blob.delta_info)) {
            // Reconstruct from delta
            let delta = option::borrow(&blob.delta_info);
            // In production, would fetch base content and apply delta
            content = vector::empty(); // Placeholder
        } else if (option::is_some(&blob.pack_info)) {
            // Extract from pack file
            let pack_info = option::borrow(&blob.pack_info);
            if (table::contains(pack_files, pack_info.pack_file_id)) {
                let pack = table::borrow(pack_files, pack_info.pack_file_id);
                // Extract content from pack
                content = vector::empty(); // Placeholder
            }
        } else if (option::is_some(&blob.compression_info)) {
            // Decompress
            let compressed = option::borrow(&blob.compression_info);
            content = compression::decompress(compressed);
        } else {
            // Get raw content from base blob
            content = vector::empty(); // Placeholder - would get from base blob
        };
        
        content
    }
    
    /// Optimize blob storage by finding best storage method
    public fun optimize_blob_storage(
        blob: &mut EnhancedBlobObject,
        similar_blobs: &vector<ID>,
        ctx: &mut TxContext
    ): u64 {
        let original_size = blob.statistics.original_size;
        let current_size = blob.statistics.compressed_size;
        
        // Try different optimization strategies
        let best_size = current_size;
        let best_strategy = git_blob_object::storage_type(&blob.base_blob);
        
        // Try delta compression with each similar blob
        let i = 0;
        while (i < vector::length(similar_blobs)) {
            let similar_id = *vector::borrow(similar_blobs, i);
            let delta_result = try_delta_compression(
                &vector::empty(), // Would fetch actual content
                similar_id,
                git_blob_object::hash(&blob.base_blob),
                ctx
            );
            
            if (option::is_some(&delta_result)) {
                let delta = option::borrow(&delta_result);
                if (delta_compression::delta_compressed_size(delta) < best_size) {
                    best_size = delta_compression::delta_compressed_size(delta);
                    best_strategy = STORAGE_DELTA;
                }
            };
            
            i = i + 1;
        };
        
        // Update blob if better strategy found
        if (best_strategy != git_blob_object::storage_type(&blob.base_blob)) {
            // Note: We cannot modify the storage type directly
            // In real implementation, would create new blob with different storage
            blob.statistics.compressed_size = best_size;
            
            event::emit(BlobOptimized {
                blob_id: object::uid_to_address(&blob.id),
                original_size,
                optimized_size: best_size,
                optimization_type: best_strategy,
                space_saved: current_size - best_size
            });
        };
        
        current_size - best_size // Space saved
    }
    
    /// Update access statistics
    public fun update_access_stats(
        blob: &mut EnhancedBlobObject,
        ctx: &TxContext
    ) {
        blob.statistics.access_count = blob.statistics.access_count + 1;
        blob.statistics.last_access = tx_context::epoch(ctx);
    }
    
    /// Check if blob should be repacked
    public fun should_repack(blob: &EnhancedBlobObject): bool {
        // Repack if frequently accessed and not in pack file
        blob.statistics.access_count > 10 && 
        option::is_none(&blob.pack_info)
    }
    
    // Helper function to create mock enhanced blob
    fun create_mock_enhanced_blob(
        pack_info: PackInfo,
        ctx: &mut TxContext
    ): EnhancedBlobObject {
        let base_blob = create_mock_blob(
            1000,
            String::utf8(b"mock_hash"),
            STORAGE_INLINE,
            ctx
        );
        
        EnhancedBlobObject {
            id: object::new(ctx),
            base_blob,
            compression_info: option::none(),
            delta_info: option::none(),
            pack_info: option::some(pack_info),
            statistics: BlobStatistics {
                original_size: 1000,
                compressed_size: 500,
                delta_size: 0,
                access_count: 0,
                last_access: tx_context::epoch(ctx),
                similarity_score: 0
            }
        }
    }
    
    // Helper function to create mock GitBlobObject
    fun create_mock_blob(
        size: u64,
        hash: String,
        storage_type: u8,
        ctx: &mut TxContext
    ): GitBlobObject {
        // This is a mock implementation since we can't create GitBlobObject directly
        // In production, this would integrate with the actual git_blob_object module
        GitBlobObject {
            id: object::new(ctx),
            walrus_blob_id: 0,
            size,
            hash,
            encoding: ENCODING_RAW,
            storage_type,
            deduplication_id: hash,
            ref_count: 1
        }
    }
}