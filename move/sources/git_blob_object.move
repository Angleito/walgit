#[allow(duplicate_alias, unused_use)]
module walgit::git_blob_object {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::dynamic_field as df;
    use std::vector;
    use sui::vec_map::{Self, VecMap};
    
    /// Error codes
    const EInvalidBlobId: u64 = 1;
    const EInvalidChunkSize: u64 = 2;
    const EInvalidChunkIndex: u64 = 3;
    const EChunkAlreadyUploaded: u64 = 4;
    const EIncompleteBlob: u64 = 5;
    const EInvalidReferenceOperation: u64 = 6;
    const EBlobAlreadyExists: u64 = 7;

    /// Constants for storage optimization
    const MAX_INLINE_SIZE: u64 = 2097152;  // 2 MB max size for inline storage
    const DEFAULT_CHUNK_SIZE: u64 = 1048576; // 1 MB default chunk size
    const MAX_CHUNK_SIZE: u64 = 8388608;  // 8 MB max chunk size
    const METADATA_KEY: vector<u8> = b"blob_metadata";
    const CHUNK_DATA_KEY: vector<u8> = b"chunk_data";
    const REF_COUNT_KEY: vector<u8> = b"ref_count";

    /// Content encoding types
    const ENCODING_RAW: u8 = 0;
    const ENCODING_BASE64: u8 = 1;
    const ENCODING_GZIP: u8 = 2;
    const ENCODING_ZSTD: u8 = 3;

    /// Storage types
    const STORAGE_INLINE: u8 = 0;   // Small blobs stored directly in the contract
    const STORAGE_CHUNKED: u8 = 1;  // Large blobs stored in chunks
    const STORAGE_WALRUS: u8 = 2;   // External storage in Walrus

    /// Represents file content in a git repository with optimized storage strategy
    public struct GitBlobObject has key, store {
        id: UID,
        walrus_blob_id: u256,  // Reference to blob ID in Walrus storage (0 if using inline/chunked)
        size: u64,             // File size in bytes
        hash: String,          // SHA-1 hash of the content (git standard)
        encoding: u8,          // Content encoding type
        storage_type: u8,      // Storage type (inline, chunked, walrus)
        deduplication_id: String, // Hash used for deduplication
        ref_count: u64,        // Reference count for this blob
    }

    /// Chunk metadata for chunked blobs
    struct ChunkMetadata has store {
        total_chunks: u64,
        chunk_size: u64,
        complete: bool,
        chunk_hashes: vector<String>,
    }

    /// Individual chunk data
    struct Chunk has key, store {
        id: UID,
        blob_id: ID,
        index: u64,
        data: vector<u8>,
        size: u64,
        hash: String,
    }

    /// BlobChunkUpload tracks the upload progress of a large blob
    struct BlobChunkUpload has key {
        id: UID,
        blob_id: ID,
        size: u64,
        chunk_size: u64,
        chunks_uploaded: VecMap<u64, bool>, // Chunk index -> uploaded status
        total_chunks: u64,
        created_at: u64,
    }

    /// Registry for blob deduplication
    struct BlobRegistry has key {
        id: UID,
        blobs: Table<String, ID>, // Deduplication hash -> Blob ID
    }

    // Events
    
    /// Event emitted when a git blob is created
    public struct GitBlobCreated has copy, drop {
        object_id: address,
        walrus_blob_id: u256,
        size: u64,
        hash: String,
        storage_type: u8,
        deduplication_id: String,
        is_deduplicated: bool,
    }

    /// Event emitted when a chunk is uploaded
    public struct ChunkUploaded has copy, drop {
        blob_id: ID,
        chunk_index: u64,
        total_chunks: u64,
        size: u64,
    }

    /// Event emitted when a chunked blob upload is completed
    public struct ChunkedBlobCompleted has copy, drop {
        blob_id: ID,
        size: u64,
        total_chunks: u64,
    }

    /// Event emitted when a blob reference count changes
    public struct BlobReferenceChanged has copy, drop {
        blob_id: ID,
        old_count: u64,
        new_count: u64,
    }

    /// Initialize the module
    fun init(ctx: &mut TxContext) {
        // Create the blob registry for deduplication
        let registry = BlobRegistry {
            id: object::new(ctx),
            blobs: table::new(ctx),
        };
        
        // Share the registry as a shared object
        transfer::share_object(registry);
    }

    /// Creates a new GitBlobObject for a small file (< 2MB) that can be stored inline
    public fun create_inline(
        data: vector<u8>,
        hash: String,
        encoding: u8,
        ctx: &mut TxContext
    ): GitBlobObject {
        let size = vector::length(&data);
        
        // Ensure the data can be stored inline
        assert!(size <= MAX_INLINE_SIZE, EInvalidBlobId);
        
        let id = object::new(ctx);
        let object_id = object::uid_to_address(&id);
        let blob_id = object::uid_to_inner(&id);
        
        // Store the actual data as a dynamic field
        df::add(&mut id, CHUNK_DATA_KEY, data);
        
        // Create and store deduplication ID
        let deduplication_id = hash;
        
        // Check if this blob already exists in the registry
        let registry = borrow_registry_mut();
        let is_deduplicated = false;
        
        if (table::contains(&registry.blobs, deduplication_id)) {
            // Blob already exists, increment reference count on existing blob
            let existing_blob_id = *table::borrow(&registry.blobs, deduplication_id);
            let existing_blob = borrow_blob_mut(existing_blob_id);
            
            // Increment reference count
            existing_blob.ref_count = existing_blob.ref_count + 1;
            
            // Emit reference changed event
            event::emit(BlobReferenceChanged {
                blob_id: existing_blob_id,
                old_count: existing_blob.ref_count - 1,
                new_count: existing_blob.ref_count,
            });
            
            is_deduplicated = true;
        };
        
        // Create the blob object
        let blob = GitBlobObject {
            id,
            walrus_blob_id: 0, // Not using Walrus storage
            size,
            hash,
            encoding,
            storage_type: STORAGE_INLINE,
            deduplication_id,
            ref_count: 1,
        };
        
        // Add to registry if not already exists
        if (!is_deduplicated) {
            table::add(&mut registry.blobs, deduplication_id, blob_id);
        };
        
        // Emit event
        event::emit(GitBlobCreated {
            object_id,
            walrus_blob_id: 0,
            size,
            hash,
            storage_type: STORAGE_INLINE,
            deduplication_id,
            is_deduplicated,
        });
        
        blob
    }
    
    /// Creates a new GitBlobObject referencing content in Walrus storage
    public fun create_walrus(
        walrus_blob_id: u256,
        size: u64,
        hash: String,
        encoding: u8,
        ctx: &mut TxContext
    ): GitBlobObject {
        // Validate inputs
        assert!(walrus_blob_id != 0, EInvalidBlobId);
        
        let id = object::new(ctx);
        let object_id = object::uid_to_address(&id);
        let blob_id = object::uid_to_inner(&id);
        
        // Create deduplication ID (for Walrus, we use the hash + walrus_blob_id)
        let walrus_id_bytes = to_bytes(walrus_blob_id);
        let deduplication_id = generate_deduplication_id(hash, walrus_id_bytes);
        
        // Check if this blob already exists in the registry
        let registry = borrow_registry_mut();
        let is_deduplicated = false;
        
        if (table::contains(&registry.blobs, deduplication_id)) {
            // Blob already exists, increment reference count on existing blob
            let existing_blob_id = *table::borrow(&registry.blobs, deduplication_id);
            let existing_blob = borrow_blob_mut(existing_blob_id);
            
            // Increment reference count
            existing_blob.ref_count = existing_blob.ref_count + 1;
            
            // Emit reference changed event
            event::emit(BlobReferenceChanged {
                blob_id: existing_blob_id,
                old_count: existing_blob.ref_count - 1,
                new_count: existing_blob.ref_count,
            });
            
            is_deduplicated = true;
        };
        
        // Create the blob object
        let blob = GitBlobObject {
            id,
            walrus_blob_id,
            size,
            hash,
            encoding,
            storage_type: STORAGE_WALRUS,
            deduplication_id,
            ref_count: 1,
        };
        
        // Add to registry if not already exists
        if (!is_deduplicated) {
            table::add(&mut registry.blobs, deduplication_id, blob_id);
        };
        
        // Emit event
        event::emit(GitBlobCreated {
            object_id,
            walrus_blob_id,
            size,
            hash,
            storage_type: STORAGE_WALRUS,
            deduplication_id,
            is_deduplicated,
        });
        
        blob
    }
    
    /// Starts a chunked upload for a large blob
    public fun start_chunked_upload(
        size: u64,
        hash: String,
        encoding: u8,
        chunk_size: u64,
        ctx: &mut TxContext
    ): (GitBlobObject, BlobChunkUpload) {
        // Validate chunk size
        assert!(chunk_size > 0 && chunk_size <= MAX_CHUNK_SIZE, EInvalidChunkSize);
        
        // Calculate number of chunks needed
        let total_chunks = (size + chunk_size - 1) / chunk_size; // Ceiling division
        
        // Create blob object
        let blob_id = object::new(ctx);
        let object_id = object::uid_to_address(&blob_id);
        let blob_object_id = object::uid_to_inner(&blob_id);
        
        // Create deduplication ID
        let deduplication_id = hash;
        
        // Check if this blob already exists in the registry
        let registry = borrow_registry_mut();
        let is_deduplicated = false;
        
        if (table::contains(&registry.blobs, deduplication_id)) {
            // Blob already exists, increment reference count on existing blob
            let existing_blob_id = *table::borrow(&registry.blobs, deduplication_id);
            let existing_blob = borrow_blob_mut(existing_blob_id);
            
            // Increment reference count
            existing_blob.ref_count = existing_blob.ref_count + 1;
            
            // Emit reference changed event
            event::emit(BlobReferenceChanged {
                blob_id: existing_blob_id,
                old_count: existing_blob.ref_count - 1,
                new_count: existing_blob.ref_count,
            });
            
            is_deduplicated = true;
        };
        
        // Create chunk metadata
        let metadata = ChunkMetadata {
            total_chunks,
            chunk_size,
            complete: false,
            chunk_hashes: vector::empty<String>(),
        };
        
        // Initialize chunk_hashes vector
        let i = 0;
        while (i < total_chunks) {
            vector::push_back(&mut metadata.chunk_hashes, string::utf8(b""));
            i = i + 1;
        };
        
        // Store metadata as dynamic field
        df::add(&mut blob_id, METADATA_KEY, metadata);
        
        // Create the blob object
        let blob = GitBlobObject {
            id: blob_id,
            walrus_blob_id: 0, // Not using Walrus storage
            size,
            hash,
            encoding,
            storage_type: STORAGE_CHUNKED,
            deduplication_id,
            ref_count: 1,
        };
        
        // Add to registry if not already exists
        if (!is_deduplicated) {
            table::add(&mut registry.blobs, deduplication_id, blob_object_id);
        };
        
        // Create upload tracker
        let upload = BlobChunkUpload {
            id: object::new(ctx),
            blob_id: blob_object_id,
            size,
            chunk_size,
            chunks_uploaded: vec_map::empty(),
            total_chunks,
            created_at: tx_context::epoch(ctx),
        };
        
        // Initialize chunks_uploaded map
        let i = 0;
        while (i < total_chunks) {
            vec_map::insert(&mut upload.chunks_uploaded, i, false);
            i = i + 1;
        };
        
        // Emit event
        event::emit(GitBlobCreated {
            object_id,
            walrus_blob_id: 0,
            size,
            hash,
            storage_type: STORAGE_CHUNKED,
            deduplication_id,
            is_deduplicated,
        });
        
        (blob, upload)
    }
    
    /// Uploads a chunk of data for a chunked blob
    public fun upload_chunk(
        blob: &mut GitBlobObject, 
        upload: &mut BlobChunkUpload,
        chunk_index: u64,
        chunk_data: vector<u8>,
        chunk_hash: String,
        ctx: &mut TxContext
    ) {
        // Verify blob is chunked
        assert!(blob.storage_type == STORAGE_CHUNKED, EInvalidBlobId);
        
        // Verify this is the right upload tracker for this blob
        assert!(object::uid_to_inner(&blob.id) == upload.blob_id, EInvalidBlobId);
        
        // Verify chunk index is valid
        assert!(chunk_index < upload.total_chunks, EInvalidChunkIndex);
        
        // Verify chunk wasn't already uploaded
        let (_, already_uploaded) = vec_map::get(&upload.chunks_uploaded, &chunk_index);
        assert!(!*already_uploaded, EChunkAlreadyUploaded);
        
        // Mark chunk as uploaded
        vec_map::remove(&mut upload.chunks_uploaded, &chunk_index);
        vec_map::insert(&mut upload.chunks_uploaded, chunk_index, true);
        
        // Create chunk object
        let chunk = Chunk {
            id: object::new(ctx),
            blob_id: upload.blob_id,
            index: chunk_index,
            data: chunk_data,
            size: vector::length(&chunk_data),
            hash: chunk_hash,
        };
        
        // Update metadata
        let metadata = df::borrow_mut<vector<u8>, ChunkMetadata>(&mut blob.id, METADATA_KEY);
        *vector::borrow_mut(&mut metadata.chunk_hashes, chunk_index) = chunk_hash;
        
        // Store chunk as shared object
        let chunk_id = object::id(&chunk);
        transfer::share_object(chunk);
        
        // Store chunk reference in blob
        let chunk_key = generate_chunk_key(chunk_index);
        df::add(&mut blob.id, chunk_key, chunk_id);
        
        // Emit event
        event::emit(ChunkUploaded {
            blob_id: upload.blob_id,
            chunk_index,
            total_chunks: upload.total_chunks,
            size: vector::length(&chunk_data),
        });
    }
    
    /// Completes a chunked blob upload
    public fun complete_chunked_upload(
        blob: &mut GitBlobObject,
        upload: &BlobChunkUpload
    ) {
        // Verify blob is chunked
        assert!(blob.storage_type == STORAGE_CHUNKED, EInvalidBlobId);
        
        // Verify this is the right upload tracker for this blob
        assert!(object::uid_to_inner(&blob.id) == upload.blob_id, EInvalidBlobId);
        
        // Verify all chunks are uploaded
        let i = 0;
        while (i < upload.total_chunks) {
            let (_, uploaded) = vec_map::get(&upload.chunks_uploaded, &i);
            assert!(*uploaded, EIncompleteBlob);
            i = i + 1;
        };
        
        // Mark blob as complete
        let metadata = df::borrow_mut<vector<u8>, ChunkMetadata>(&mut blob.id, METADATA_KEY);
        metadata.complete = true;
        
        // Emit completion event
        event::emit(ChunkedBlobCompleted {
            blob_id: upload.blob_id,
            size: upload.size,
            total_chunks: upload.total_chunks,
        });
    }
    
    /// Increments reference count for a blob
    public fun increment_ref_count(blob: &mut GitBlobObject) {
        let old_count = blob.ref_count;
        blob.ref_count = blob.ref_count + 1;
        
        // Emit event
        event::emit(BlobReferenceChanged {
            blob_id: object::uid_to_inner(&blob.id),
            old_count,
            new_count: blob.ref_count,
        });
    }
    
    /// Decrements reference count for a blob
    public fun decrement_ref_count(blob: &mut GitBlobObject): bool {
        assert!(blob.ref_count > 0, EInvalidReferenceOperation);
        
        let old_count = blob.ref_count;
        blob.ref_count = blob.ref_count - 1;
        
        // Emit event
        event::emit(BlobReferenceChanged {
            blob_id: object::uid_to_inner(&blob.id),
            old_count,
            new_count: blob.ref_count,
        });
        
        // Return true if reference count is zero (can be deleted)
        blob.ref_count == 0
    }
    
    /// Borrow blob registry (mutable)
    fun borrow_registry_mut(): &mut BlobRegistry {
        // This would need to be implemented with proper shared object borrowing
        abort 0 // Placeholder
    }
    
    /// Borrow blob by ID (mutable)
    fun borrow_blob_mut(id: ID): &mut GitBlobObject {
        // This would need to be implemented with proper shared object borrowing
        abort 0 // Placeholder
    }
    
    /// Generate a unique key for storing chunk references
    fun generate_chunk_key(chunk_index: u64): vector<u8> {
        let key = b"chunk_";
        // Convert chunk_index to string and append
        // This is simplified - you'd need proper conversion
        vector::append(&mut key, to_bytes(chunk_index));
        key
    }
    
    /// Generate deduplication ID
    fun generate_deduplication_id(hash: String, extra_data: vector<u8>): String {
        // In a real implementation, this would concatenate the hash and extra data
        // and then hash the result
        // This is a simplified placeholder
        hash
    }
    
    /// Convert u64 to bytes (simplified)
    fun to_bytes(value: u64): vector<u8> {
        let result = vector::empty<u8>();
        // Simplified conversion, in a real implementation you'd do proper conversion
        vector::push_back(&mut result, (value & 0xFF as u8));
        result
    }
    
    /// Convert u256 to bytes (simplified)
    fun to_bytes(value: u256): vector<u8> {
        let result = vector::empty<u8>();
        // Simplified conversion, in a real implementation you'd do proper conversion
        vector::push_back(&mut result, 0);
        result
    }
    
    // Getter functions
    public fun walrus_blob_id(self: &GitBlobObject): u256 { self.walrus_blob_id }
    public fun size(self: &GitBlobObject): u64 { self.size }
    public fun hash(self: &GitBlobObject): String { self.hash }
    public fun encoding(self: &GitBlobObject): u8 { self.encoding }
    public fun storage_type(self: &GitBlobObject): u8 { self.storage_type }
    public fun ref_count(self: &GitBlobObject): u64 { self.ref_count }
    
    /// Check if blob is complete (all chunks uploaded for chunked blobs)
    public fun is_complete(self: &GitBlobObject): bool {
        if (self.storage_type != STORAGE_CHUNKED) {
            // Inline and Walrus blobs are always complete
            return true
        };
        
        // For chunked blobs, check the metadata
        let metadata = df::borrow<vector<u8>, ChunkMetadata>(&self.id, METADATA_KEY);
        metadata.complete
    }
    
    /// Get the data for an inline blob
    public fun get_inline_data(self: &GitBlobObject): vector<u8> {
        assert!(self.storage_type == STORAGE_INLINE, EInvalidBlobId);
        *df::borrow<vector<u8>, vector<u8>>(&self.id, CHUNK_DATA_KEY)
    }
    
    /// Get chunk data for a specific chunk of a chunked blob
    public fun get_chunk_data(self: &GitBlobObject, chunk_index: u64): vector<u8> {
        assert!(self.storage_type == STORAGE_CHUNKED, EInvalidBlobId);
        
        // Get metadata to verify chunk index is valid
        let metadata = df::borrow<vector<u8>, ChunkMetadata>(&self.id, METADATA_KEY);
        assert!(chunk_index < metadata.total_chunks, EInvalidChunkIndex);
        
        // Get chunk key
        let chunk_key = generate_chunk_key(chunk_index);
        
        // Get chunk ID
        assert!(df::exists_(&self.id, chunk_key), EInvalidChunkIndex);
        let chunk_id = *df::borrow<vector<u8>, ID>(&self.id, chunk_key);
        
        // Borrow chunk and return data
        // This would need proper implementation for shared object borrowing
        vector::empty<u8>() // Placeholder
    }
    
    /// Get number of chunks for a chunked blob
    public fun get_total_chunks(self: &GitBlobObject): u64 {
        assert!(self.storage_type == STORAGE_CHUNKED, EInvalidBlobId);
        let metadata = df::borrow<vector<u8>, ChunkMetadata>(&self.id, METADATA_KEY);
        metadata.total_chunks
    }
    
    /// Get chunk size for a chunked blob
    public fun get_chunk_size(self: &GitBlobObject): u64 {
        assert!(self.storage_type == STORAGE_CHUNKED, EInvalidBlobId);
        let metadata = df::borrow<vector<u8>, ChunkMetadata>(&self.id, METADATA_KEY);
        metadata.chunk_size
    }
}