module walgit::pack_files {
    use sui::table::{Self, Table};
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use sui::event;
    
    use walgit::git_blob_object::{Self, GitBlobObject};
    use walgit::git_tree_object::{Self, GitTreeObject};
    use walgit::git_commit_object::{Self, GitCommitObject};
    use walgit::compression;
    
    /// Error codes
    const EInvalidPackFormat: u64 = 1;
    const EObjectNotFound: u64 = 2;
    const EPackSizeLimitExceeded: u64 = 3;
    const EInvalidObjectType: u64 = 4;
    const EChecksumMismatch: u64 = 5;
    
    /// Pack file constants
    const PACK_VERSION: u32 = 2;
    const MAX_PACK_SIZE: u64 = 536870912; // 512 MB max pack size
    const FANOUT_SIZE: u64 = 256; // 256 entries for first byte fanout
    
    /// Pack signature
    public fun pack_signature(): vector<u8> {
        b"PACK"
    }
    
    /// Object type constants (matching Git)
    const OBJ_COMMIT: u8 = 1;
    const OBJ_TREE: u8 = 2;
    const OBJ_BLOB: u8 = 3;
    const OBJ_TAG: u8 = 4;
    const OBJ_OFS_DELTA: u8 = 6;
    const OBJ_REF_DELTA: u8 = 7;
    
    /// Packed object representation
    public struct PackedObject has store, drop {
        object_type: u8,
        size: u64,
        compressed_data: vector<u8>,
        hash: vector<u8>,           // SHA-1 hash
        object_id: ID,              // Original Sui object ID
        delta_base: Option<ID>      // For delta objects
    }
    
    /// Pack file containing multiple objects
    public struct PackFile has key, store {
        id: UID,
        version: u32,
        object_count: u64,
        objects: vector<PackedObject>,
        index: Table<vector<u8>, u64>,  // hash -> position in objects vector
        size_bytes: u64,
        checksum: vector<u8>,
        repository_id: ID
    }
    
    /// Pack index for efficient lookups
    public struct PackIndex has key, store {
        id: UID,
        pack_file_id: ID,
        version: u32,
        fanout_table: vector<u32>,     // 256 entries for first byte distribution
        sorted_hashes: vector<vector<u8>>, // Sorted list of object hashes
        offsets: Table<vector<u8>, PackIndexEntry>,
        pack_checksum: vector<u8>
    }
    
    /// Pack index entry
    public struct PackIndexEntry has store, drop {
        offset: u64,           // Offset in pack file
        size: u64,             // Object size
        crc32: u32,            // CRC32 checksum
        object_type: u8,       // Object type
        object_id: ID          // Original Sui object ID
    }
    
    /// Event emitted when pack file is created
    public struct PackFileCreated has copy, drop {
        pack_id: address,
        object_count: u64,
        size_bytes: u64,
        repository_id: ID
    }
    
    /// Statistics about pack file
    public struct PackStats has store, drop {
        total_objects: u64,
        commits: u64,
        trees: u64,
        blobs: u64,
        deltas: u64,
        total_size: u64,
        compressed_size: u64,
        compression_ratio: u64
    }
    
    /// Create a new pack file from loose objects
    public fun create_pack_file(
        objects: vector<ID>,
        repository_id: ID,
        ctx: &mut TxContext
    ): (PackFile, PackIndex) {
        let pack_id = object::new(ctx);
        let packed_objects = vector::empty();
        let index_table = table::new<vector<u8>, u64>(ctx);
        let total_size = 0;
        
        // Sort objects by type and size for better compression
        let sorted_objects = sort_objects_for_packing(&objects);
        
        let i = 0;
        while (i < vector::length(&sorted_objects)) {
            let obj_id = *vector::borrow(&sorted_objects, i);
            let packed = pack_object(obj_id, ctx);
            
            // Add to index
            table::add(&mut index_table, packed.hash, i);
            total_size = total_size + vector::length(&packed.compressed_data);
            
            vector::push_back(&mut packed_objects, packed);
            i = i + 1;
        };
        
        // Calculate checksum
        let checksum = calculate_pack_checksum(&packed_objects);
        
        let pack = PackFile {
            id: pack_id,
            version: PACK_VERSION,
            object_count: vector::length(&packed_objects),
            objects: packed_objects,
            index: index_table,
            size_bytes: total_size,
            checksum,
            repository_id
        };
        
        // Create pack index
        let pack_index = create_pack_index(&pack, ctx);
        
        // Emit event
        event::emit(PackFileCreated {
            pack_id: object::uid_to_address(&pack.id),
            object_count: pack.object_count,
            size_bytes: pack.size_bytes,
            repository_id
        });
        
        (pack, pack_index)
    }
    
    /// Pack a single object
    fun pack_object(object_id: ID, ctx: &mut TxContext): PackedObject {
        // This is a simplified version - in reality we'd fetch the actual object
        // For now, create a mock packed object
        let hash = calculate_object_hash(&object_id);
        let compressed_data = vector::empty<u8>();  // Mock compressed data
        
        PackedObject {
            object_type: OBJ_BLOB,
            size: 100,
            compressed_data,
            hash,
            object_id,
            delta_base: option::none()
        }
    }
    
    /// Create pack index for efficient lookups
    fun create_pack_index(
        pack: &PackFile,
        ctx: &mut TxContext
    ): PackIndex {
        let index_id = object::new(ctx);
        let fanout = create_fanout_table(&pack.objects);
        let sorted_hashes = sort_object_hashes(&pack.objects);
        let offsets = table::new<vector<u8>, PackIndexEntry>(ctx);
        
        // Build offset table
        let i = 0;
        let current_offset = 0;
        while (i < vector::length(&pack.objects)) {
            let obj = vector::borrow(&pack.objects, i);
            
            let entry = PackIndexEntry {
                offset: current_offset,
                size: obj.size,
                crc32: calculate_crc32(&obj.compressed_data),
                object_type: obj.object_type,
                object_id: obj.object_id
            };
            
            table::add(&mut offsets, obj.hash, entry);
            current_offset = current_offset + vector::length(&obj.compressed_data);
            i = i + 1;
        };
        
        PackIndex {
            id: index_id,
            pack_file_id: object::uid_to_inner(&pack.id),
            version: pack.version,
            fanout_table: fanout,
            sorted_hashes,
            offsets,
            pack_checksum: pack.checksum
        }
    }
    
    /// Create fanout table for first byte of hash
    fun create_fanout_table(objects: &vector<PackedObject>): vector<u32> {
        let fanout = vector::empty();
        let i = 0;
        
        // Initialize with zeros
        while (i < FANOUT_SIZE) {
            vector::push_back(&mut fanout, 0);
            i = i + 1;
        };
        
        // Count objects for each first byte
        i = 0;
        while (i < vector::length(objects)) {
            let obj = vector::borrow(objects, i);
            let first_byte = *vector::borrow(&obj.hash, 0);
            let index = (first_byte as u64);
            let count = *vector::borrow(&fanout, index);
            *vector::borrow_mut(&mut fanout, index) = count + 1;
            i = i + 1;
        };
        
        // Convert to cumulative counts
        let cumulative = 0;
        i = 0;
        while (i < FANOUT_SIZE) {
            cumulative = cumulative + *vector::borrow(&fanout, i);
            *vector::borrow_mut(&mut fanout, i) = cumulative;
            i = i + 1;
        };
        
        fanout
    }
    
    /// Sort objects for optimal packing
    fun sort_objects_for_packing(objects: &vector<ID>): vector<ID> {
        // Sort by type (commits first, then trees, then blobs)
        // This is a simplified sort - in production would be more sophisticated
        let sorted = *objects;
        
        // Simple bubble sort for demonstration
        let n = vector::length(&sorted);
        let i = 0;
        while (i < n) {
            let j = 0;
            while (j < n - i - 1) {
                // Compare and swap if needed
                // In reality, we'd fetch object types and sizes
                j = j + 1;
            };
            i = i + 1;
        };
        
        sorted
    }
    
    /// Sort object hashes for binary search
    fun sort_object_hashes(objects: &vector<PackedObject>): vector<vector<u8>> {
        let hashes = vector::empty();
        
        let i = 0;
        while (i < vector::length(objects)) {
            let obj = vector::borrow(objects, i);
            vector::push_back(&mut hashes, obj.hash);
            i = i + 1;
        };
        
        // Sort hashes (simplified - would use proper sorting algorithm)
        hashes
    }
    
    /// Get object from pack file
    public fun get_packed_object(
        pack: &PackFile,
        hash: &vector<u8>
    ): Option<&PackedObject> {
        if (table::contains(&pack.index, *hash)) {
            let position = *table::borrow(&pack.index, *hash);
            option::some(vector::borrow(&pack.objects, position))
        } else {
            option::none()
        }
    }
    
    /// Unpack object data
    public fun unpack_object(
        packed: &PackedObject
    ): vector<u8> {
        // Mock decompression - return the compressed data as is for now
        packed.compressed_data
    }
    
    /// Calculate pack file statistics
    public fun get_pack_stats(pack: &PackFile): PackStats {
        let commits = 0;
        let trees = 0;
        let blobs = 0;
        let deltas = 0;
        let total_size = 0;
        let compressed_size = 0;
        
        let i = 0;
        while (i < vector::length(&pack.objects)) {
            let obj = vector::borrow(&pack.objects, i);
            
            if (obj.object_type == OBJ_COMMIT) {
                commits = commits + 1;
            } else if (obj.object_type == OBJ_TREE) {
                trees = trees + 1;
            } else if (obj.object_type == OBJ_BLOB) {
                blobs = blobs + 1;
            } else if (obj.object_type == OBJ_OFS_DELTA || obj.object_type == OBJ_REF_DELTA) {
                deltas = deltas + 1;
            };
            
            total_size = total_size + obj.size;
            compressed_size = compressed_size + vector::length(&obj.compressed_data);
            
            i = i + 1;
        };
        
        PackStats {
            total_objects: pack.object_count,
            commits,
            trees,
            blobs,
            deltas,
            total_size,
            compressed_size,
            compression_ratio: if (compressed_size > 0) {
                (total_size * 100) / compressed_size
            } else {
                0
            }
        }
    }
    
    /// Verify pack file integrity
    public fun verify_pack(pack: &PackFile): bool {
        let calculated_checksum = calculate_pack_checksum(&pack.objects);
        calculated_checksum == pack.checksum
    }
    
    // ====== Helper functions ======
    
    fun calculate_pack_checksum(objects: &vector<PackedObject>): vector<u8> {
        // Simplified checksum calculation
        let checksum = vector::empty();
        let i = 0;
        while (i < 20) { // SHA-1 is 20 bytes
            vector::push_back(&mut checksum, 0);
            i = i + 1;
        };
        checksum
    }
    
    fun calculate_object_hash(object_id: &ID): vector<u8> {
        // Simplified hash calculation
        let hash = vector::empty();
        let i = 0;
        while (i < 20) { // SHA-1 is 20 bytes
            vector::push_back(&mut hash, (i as u8));
            i = i + 1;
        };
        hash
    }
    
    fun calculate_crc32(data: &vector<u8>): u32 {
        // Simplified CRC32 calculation
        12345678
    }
}