module walgit::storage_optimization {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::event;
    use std::vector;
    use std::string::String;
    use std::option::{Self, Option};
    
    use walgit::enhanced_blob_object::{Self, EnhancedBlobObject};
    use walgit::delta_compression::{Self, DeltaObject};
    use walgit::pack_files::{Self, PackFile, PackIndex};
    use walgit::compression::{Self, CompressedData};
    use walgit::git_repository::{Self, GitRepository};
    
    /// Error codes
    const ERepositoryNotFound: u64 = 1;
    const EOptimizationFailed: u64 = 2;
    const EInvalidThreshold: u64 = 3;
    const EStorageQuotaExceeded: u64 = 4;
    
    /// Optimization strategies
    const STRATEGY_NONE: u8 = 0;
    const STRATEGY_COMPRESS: u8 = 1;
    const STRATEGY_DELTA: u8 = 2;
    const STRATEGY_PACK: u8 = 3;
    const STRATEGY_HYBRID: u8 = 4;
    
    /// Storage optimization manager
    public struct StorageOptimizer has key, store {
        id: UID,
        repository_id: ID,
        pack_files: Table<ID, PackFile>,
        pack_indices: Table<ID, PackIndex>,
        blob_index: Table<String, BlobMetadata>, // hash -> metadata
        statistics: OptimizationStats,
        config: OptimizationConfig
    }
    
    /// Blob metadata for optimization decisions
    public struct BlobMetadata has store, drop {
        blob_id: ID,
        hash: String,
        size: u64,
        storage_type: u8,
        pack_file_id: Option<ID>,
        similar_blobs: vector<ID>,
        last_optimized: u64
    }
    
    /// Optimization configuration
    public struct OptimizationConfig has store, drop {
        auto_pack_threshold: u64,      // Size threshold for auto-packing
        delta_size_threshold: u64,     // Min size for delta compression
        compression_threshold: u64,    // Min size for compression
        similarity_threshold: u64,     // Similarity score for delta
        pack_size_limit: u64,         // Max pack file size
        optimization_interval: u64     // Time between optimizations
    }
    
    /// Optimization statistics
    public struct OptimizationStats has store, drop {
        total_blobs: u64,
        packed_blobs: u64,
        delta_blobs: u64,
        compressed_blobs: u64,
        total_size: u64,
        optimized_size: u64,
        space_saved: u64,
        last_optimization: u64
    }
    
    /// Event for optimization completion
    public struct OptimizationComplete has copy, drop {
        repository_id: ID,
        blobs_optimized: u64,
        space_saved: u64,
        duration_ms: u64
    }
    
    /// Create storage optimizer for repository
    public fun create_optimizer(
        repository_id: ID,
        ctx: &mut TxContext
    ): StorageOptimizer {
        StorageOptimizer {
            id: object::new(ctx),
            repository_id,
            pack_files: table::new(ctx),
            pack_indices: table::new(ctx),
            blob_index: table::new(ctx),
            statistics: OptimizationStats {
                total_blobs: 0,
                packed_blobs: 0,
                delta_blobs: 0,
                compressed_blobs: 0,
                total_size: 0,
                optimized_size: 0,
                space_saved: 0,
                last_optimization: 0
            },
            config: OptimizationConfig {
                auto_pack_threshold: 10485760,   // 10 MB
                delta_size_threshold: 1024,      // 1 KB
                compression_threshold: 512,      // 512 bytes
                similarity_threshold: 80,        // 80% similarity
                pack_size_limit: 536870912,      // 512 MB
                optimization_interval: 86400     // 24 hours
            }
        }
    }
    
    /// Optimize all blobs in repository
    public fun optimize_repository(
        optimizer: &mut StorageOptimizer,
        repository: &mut GitRepository,
        ctx: &mut TxContext
    ): OptimizationStats {
        let start_time = tx_context::epoch(ctx);
        let blobs_to_optimize = collect_optimization_candidates(optimizer);
        let mut optimized_count = 0;
        let mut total_saved = 0;
        
        // Group blobs by similarity for delta compression
        let similarity_groups = group_similar_blobs(&blobs_to_optimize);
        
        // Optimize each group
        let i = 0;
        while (i < vector::length(&similarity_groups)) {
            let group = vector::borrow(&similarity_groups, i);
            let saved = optimize_blob_group(optimizer, group, ctx);
            total_saved = total_saved + saved;
            optimized_count = optimized_count + vector::length(group);
            i = i + 1;
        };
        
        // Pack loose objects if beneficial
        let pack_candidates = collect_pack_candidates(optimizer);
        if (vector::length(&pack_candidates) > 10) {
            let (pack_file, pack_index) = pack_files::create_pack_file(
                pack_candidates,
                optimizer.repository_id,
                ctx
            );
            
            let pack_id = object::uid_to_inner(&pack_file.id);
            table::add(&mut optimizer.pack_files, pack_id, pack_file);
            table::add(&mut optimizer.pack_indices, pack_id, pack_index);
            
            optimizer.statistics.packed_blobs = 
                optimizer.statistics.packed_blobs + vector::length(&pack_candidates);
        };
        
        // Update statistics
        optimizer.statistics.last_optimization = tx_context::epoch(ctx);
        optimizer.statistics.space_saved = optimizer.statistics.space_saved + total_saved;
        
        // Emit event
        event::emit(OptimizationComplete {
            repository_id: optimizer.repository_id,
            blobs_optimized: optimized_count,
            space_saved: total_saved,
            duration_ms: tx_context::epoch(ctx) - start_time
        });
        
        optimizer.statistics
    }
    
    /// Add blob to optimizer
    public fun add_blob(
        optimizer: &mut StorageOptimizer,
        blob: &EnhancedBlobObject,
        ctx: &TxContext
    ) {
        let metadata = BlobMetadata {
            blob_id: object::uid_to_inner(&blob.id),
            hash: blob.base_blob.hash,
            size: blob.statistics.original_size,
            storage_type: blob.base_blob.storage_type,
            pack_file_id: if (option::is_some(&blob.pack_info)) {
                let pack_info = option::borrow(&blob.pack_info);
                option::some(pack_info.pack_file_id)
            } else {
                option::none()
            },
            similar_blobs: vector::empty(),
            last_optimized: tx_context::epoch(ctx)
        };
        
        table::add(&mut optimizer.blob_index, blob.base_blob.hash, metadata);
        
        // Update statistics
        optimizer.statistics.total_blobs = optimizer.statistics.total_blobs + 1;
        optimizer.statistics.total_size = 
            optimizer.statistics.total_size + blob.statistics.original_size;
        optimizer.statistics.optimized_size = 
            optimizer.statistics.optimized_size + blob.statistics.compressed_size;
    }
    
    /// Collect blobs that need optimization
    fun collect_optimization_candidates(
        optimizer: &StorageOptimizer
    ): vector<BlobMetadata> {
        let candidates = vector::empty();
        let current_time = 0; // Would use actual time
        
        // Iterate through blob index
        // In production, would use table iteration
        // For now, return empty vector
        
        candidates
    }
    
    /// Group similar blobs for delta compression
    fun group_similar_blobs(
        blobs: &vector<BlobMetadata>
    ): vector<vector<BlobMetadata>> {
        let groups = vector::empty();
        
        // Simple grouping by size similarity
        // In production, would use content similarity
        let i = 0;
        while (i < vector::length(blobs)) {
            let blob = *vector::borrow(blobs, i);
            let mut found_group = false;
            
            // Find existing group
            let j = 0;
            while (j < vector::length(&groups)) {
                let group = vector::borrow_mut(&mut groups, j);
                if (vector::length(group) > 0) {
                    let first = vector::borrow(group, 0);
                    if (is_similar(blob.size, first.size)) {
                        vector::push_back(group, blob);
                        found_group = true;
                        break
                    };
                };
                j = j + 1;
            };
            
            // Create new group if not found
            if (!found_group) {
                let new_group = vector::empty();
                vector::push_back(&mut new_group, blob);
                vector::push_back(&mut groups, new_group);
            };
            
            i = i + 1;
        };
        
        groups
    }
    
    /// Optimize a group of similar blobs
    fun optimize_blob_group(
        optimizer: &mut StorageOptimizer,
        group: &vector<BlobMetadata>,
        ctx: &mut TxContext
    ): u64 {
        let total_saved = 0;
        
        if (vector::length(group) < 2) {
            return 0
        };
        
        // Use first blob as base for deltas
        let base_blob = vector::borrow(group, 0);
        
        let i = 1;
        while (i < vector::length(group)) {
            let target_blob = vector::borrow(group, i);
            
            // Try delta compression
            // In production, would fetch actual content and create delta
            let saved = try_optimize_with_delta(
                optimizer,
                base_blob,
                target_blob,
                ctx
            );
            
            total_saved = total_saved + saved;
            i = i + 1;
        };
        
        total_saved
    }
    
    /// Try to optimize blob with delta compression
    fun try_optimize_with_delta(
        optimizer: &mut StorageOptimizer,
        base: &BlobMetadata,
        target: &BlobMetadata,
        ctx: &mut TxContext
    ): u64 {
        // In production, would:
        // 1. Fetch actual blob content
        // 2. Create delta
        // 3. Update blob storage
        // 4. Update metadata
        
        // For now, simulate optimization
        let simulated_savings = target.size / 10; // Assume 10% savings
        
        // Update statistics
        optimizer.statistics.delta_blobs = optimizer.statistics.delta_blobs + 1;
        optimizer.statistics.space_saved = 
            optimizer.statistics.space_saved + simulated_savings;
        
        simulated_savings
    }
    
    /// Collect candidates for packing
    fun collect_pack_candidates(
        optimizer: &StorageOptimizer
    ): vector<ID> {
        let candidates = vector::empty();
        
        // In production, would:
        // 1. Find loose objects
        // 2. Find frequently accessed objects
        // 3. Group by repository/branch
        
        candidates
    }
    
    /// Check if two sizes are similar
    fun is_similar(size1: u64, size2: u64): bool {
        let diff = if (size1 > size2) { size1 - size2 } else { size2 - size1 };
        let avg = (size1 + size2) / 2;
        
        if (avg == 0) {
            return true
        };
        
        // Similar if within 20% of average
        (diff * 100 / avg) < 20
    }
    
    /// Get optimization recommendations
    public fun get_optimization_recommendations(
        optimizer: &StorageOptimizer
    ): vector<String> {
        let recommendations = vector::empty();
        
        // Analyze current state
        let total_blobs = optimizer.statistics.total_blobs;
        let packed_ratio = if (total_blobs > 0) {
            (optimizer.statistics.packed_blobs * 100) / total_blobs
        } else {
            100
        };
        
        let delta_ratio = if (total_blobs > 0) {
            (optimizer.statistics.delta_blobs * 100) / total_blobs
        } else {
            0
        };
        
        let compression_ratio = if (optimizer.statistics.total_size > 0) {
            (optimizer.statistics.optimized_size * 100) / optimizer.statistics.total_size
        } else {
            100
        };
        
        // Generate recommendations
        if (packed_ratio < 50) {
            vector::push_back(&mut recommendations, 
                String::utf8(b"Consider packing more objects - only ") +
                String::utf8(b"% are packed"));
        };
        
        if (delta_ratio < 30) {
            vector::push_back(&mut recommendations,
                String::utf8(b"Delta compression usage is low - consider finding more similar files"));
        };
        
        if (compression_ratio > 80) {
            vector::push_back(&mut recommendations,
                String::utf8(b"Compression ratio is low - consider more aggressive compression"));
        };
        
        recommendations
    }
}