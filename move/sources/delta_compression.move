module walgit::delta_compression {
    use std::vector;
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    
    /// Error codes
    const EInvalidDelta: u64 = 1;
    const EBaseBlobNotFound: u64 = 2;
    const EInvalidOperation: u64 = 3;
    const EOffsetOutOfBounds: u64 = 4;
    
    /// Delta operation types
    const OP_COPY: u8 = 0;      // Copy from base object
    const OP_INSERT: u8 = 1;    // Insert new data
    
    /// Maximum delta chain depth to prevent stack overflow
    const MAX_DELTA_DEPTH: u64 = 10;
    
    /// Getter for max delta depth
    public fun max_delta_depth(): u64 {
        MAX_DELTA_DEPTH
    }
    
    /// Delta instruction for reconstructing target from base
    public struct DeltaInstruction has store, drop, copy {
        op_type: u8,
        offset: u64,        // For copy: source offset in base
        length: u64,        // For copy: bytes to copy
        data: vector<u8>    // For insert: new data to insert
    }
    
    /// Get operation type from delta instruction
    public fun get_op_type(inst: &DeltaInstruction): u8 {
        inst.op_type
    }
    
    /// Get offset from delta instruction  
    public fun get_offset(inst: &DeltaInstruction): u64 {
        inst.offset
    }
    
    /// Get length from delta instruction
    public fun get_length(inst: &DeltaInstruction): u64 {
        inst.length
    }
    
    /// Get data from delta instruction
    public fun get_data(inst: &DeltaInstruction): &vector<u8> {
        &inst.data
    }
    
    /// Delta object representing differences between two blobs
    public struct DeltaObject has key, store {
        id: UID,
        base_object_id: ID,
        target_hash: String,
        delta_instructions: vector<DeltaInstruction>,
        compressed_size: u64,
        uncompressed_size: u64,
        delta_depth: u64    // Depth in delta chain
    }
    
    /// Get base object ID
    public fun get_base_object_id(delta: &DeltaObject): ID {
        delta.base_object_id
    }
    
    /// Get target hash
    public fun get_target_hash(delta: &DeltaObject): String {
        delta.target_hash  
    }
    
    /// Get delta instructions
    public fun get_delta_instructions(delta: &DeltaObject): &vector<DeltaInstruction> {
        &delta.delta_instructions
    }
    
    /// Get delta depth
    public fun get_delta_depth(delta: &DeltaObject): u64 {
        delta.delta_depth
    }
    
    /// Statistics for delta compression
    public struct DeltaStats has store, drop {
        total_objects: u64,
        delta_objects: u64,
        space_saved: u64,
        compression_ratio: u64
    }
    
    /// Create delta between two blobs using basic LCS algorithm
    public fun create_delta(
        base: &vector<u8>,
        target: &vector<u8>,
        base_object_id: ID,
        target_hash: String,
        delta_depth: u64,
        ctx: &mut TxContext
    ): DeltaObject {
        assert!(delta_depth < MAX_DELTA_DEPTH, EInvalidDelta);
        
        let instructions = calculate_delta_instructions(base, target);
        let compressed_size = calculate_compressed_size(&instructions);
        
        DeltaObject {
            id: object::new(ctx),
            base_object_id,
            target_hash,
            delta_instructions: instructions,
            compressed_size,
            uncompressed_size: vector::length(target),
            delta_depth: delta_depth + 1
        }
    }
    
    /// Apply delta to reconstruct target blob
    public fun apply_delta(
        base: &vector<u8>,
        delta: &DeltaObject
    ): vector<u8> {
        let result = vector::empty();
        let instructions = &delta.delta_instructions;
        
        let i = 0;
        while (i < vector::length(instructions)) {
            let inst = vector::borrow(instructions, i);
            
            if (inst.op_type == OP_COPY) {
                // Copy from base
                assert!(inst.offset + inst.length <= vector::length(base), EOffsetOutOfBounds);
                
                let j = inst.offset;
                let end = inst.offset + inst.length;
                while (j < end) {
                    vector::push_back(&mut result, *vector::borrow(base, j));
                    j = j + 1;
                };
            } else if (inst.op_type == OP_INSERT) {
                // Insert new data
                let j = 0;
                while (j < vector::length(&inst.data)) {
                    vector::push_back(&mut result, *vector::borrow(&inst.data, j));
                    j = j + 1;
                };
            } else {
                abort EInvalidOperation
            };
            
            i = i + 1;
        };
        
        result
    }
    
    /// Calculate delta instructions between base and target
    fun calculate_delta_instructions(
        base: &vector<u8>,
        target: &vector<u8>
    ): vector<DeltaInstruction> {
        let instructions = vector::empty();
        let target_pos = 0;
        let target_len = vector::length(target);
        
        while (target_pos < target_len) {
            // Try to find matching sequence in base
            let (match_offset, match_length) = find_longest_match(
                base, 
                target, 
                target_pos
            );
            
            if (match_length >= 4) { // Minimum match length for copy
                // Create copy instruction
                let copy_inst = DeltaInstruction {
                    op_type: OP_COPY,
                    offset: match_offset,
                    length: match_length,
                    data: vector::empty()
                };
                vector::push_back(&mut instructions, copy_inst);
                target_pos = target_pos + match_length;
            } else {
                // Gather insert data until next match
                let insert_start = target_pos;
                let mut insert_data = vector::empty();
                
                // Find next good match or end of target
                while (target_pos < target_len) {
                    let (next_offset, next_length) = find_longest_match(
                        base,
                        target,
                        target_pos
                    );
                    
                    if (next_length >= 4) {
                        break
                    };
                    
                    vector::push_back(
                        &mut insert_data, 
                        *vector::borrow(target, target_pos)
                    );
                    target_pos = target_pos + 1;
                };
                
                // Create insert instruction
                if (!vector::is_empty(&insert_data)) {
                    let insert_inst = DeltaInstruction {
                        op_type: OP_INSERT,
                        offset: 0,
                        length: vector::length(&insert_data),
                        data: insert_data
                    };
                    vector::push_back(&mut instructions, insert_inst);
                };
            }
        };
        
        instructions
    }
    
    /// Find longest matching sequence in base starting from target_pos
    fun find_longest_match(
        base: &vector<u8>,
        target: &vector<u8>,
        target_pos: u64
    ): (u64, u64) {
        let base_len = vector::length(base);
        let target_len = vector::length(target);
        let best_offset = 0;
        let best_length = 0;
        
        // Simple sliding window approach
        let base_pos = 0;
        while (base_pos < base_len) {
            let match_length = 0;
            
            while (
                base_pos + match_length < base_len &&
                target_pos + match_length < target_len &&
                *vector::borrow(base, base_pos + match_length) == 
                *vector::borrow(target, target_pos + match_length)
            ) {
                match_length = match_length + 1;
            };
            
            if (match_length > best_length) {
                best_offset = base_pos;
                best_length = match_length;
            };
            
            base_pos = base_pos + 1;
        };
        
        (best_offset, best_length)
    }
    
    /// Calculate compressed size of delta instructions
    fun calculate_compressed_size(instructions: &vector<DeltaInstruction>): u64 {
        let size = 0;
        let i = 0;
        
        while (i < vector::length(instructions)) {
            let inst = vector::borrow(instructions, i);
            
            if (inst.op_type == OP_COPY) {
                size = size + 9; // 1 byte op + 8 bytes (offset + length)
            } else {
                size = size + 1 + 8 + vector::length(&inst.data); // op + length + data
            };
            
            i = i + 1;
        };
        
        size
    }
    
    /// Check if creating a delta would save space
    public fun should_create_delta(
        base_size: u64,
        target_size: u64,
        delta_size: u64
    ): bool {
        // Only create delta if it saves at least 10% space
        delta_size < (target_size * 9 / 10)
    }
    
    /// Get delta compressed size
    public fun delta_compressed_size(delta: &DeltaObject): u64 {
        delta.compressed_size
    }
    
    /// Get delta uncompressed size  
    public fun delta_uncompressed_size(delta: &DeltaObject): u64 {
        delta.uncompressed_size
    }
    
    /// Get statistics about delta compression effectiveness
    public fun calculate_delta_stats(
        deltas: &vector<DeltaObject>,
        full_objects: u64
    ): DeltaStats {
        let delta_count = vector::length(deltas);
        let total_compressed = 0;
        let total_uncompressed = 0;
        
        let i = 0;
        while (i < delta_count) {
            let delta = vector::borrow(deltas, i);
            total_compressed = total_compressed + delta.compressed_size;
            total_uncompressed = total_uncompressed + delta.uncompressed_size;
            i = i + 1;
        };
        
        let space_saved = total_uncompressed - total_compressed;
        let compression_ratio = if (total_compressed > 0) {
            (total_uncompressed * 100) / total_compressed
        } else {
            0
        };
        
        DeltaStats {
            total_objects: full_objects + delta_count,
            delta_objects: delta_count,
            space_saved,
            compression_ratio
        }
    }
    
    // ====== Helper functions for integration ======
    
    /// Create delta if beneficial, otherwise return None
    public fun try_create_delta(
        base: &vector<u8>,
        target: &vector<u8>,
        base_id: ID,
        target_hash: String,
        delta_depth: u64,
        ctx: &mut TxContext
    ): Option<DeltaObject> {
        // Don't create deep delta chains
        if (delta_depth >= MAX_DELTA_DEPTH) {
            return option::none()
        };
        
        let base_size = vector::length(base);
        let target_size = vector::length(target);
        
        // Don't delta very small objects
        if (target_size < 50) {
            return option::none()
        };
        
        // Calculate delta
        let delta = create_delta(base, target, base_id, target_hash, delta_depth, ctx);
        
        // Check if delta saves space
        if (should_create_delta(base_size, target_size, delta.compressed_size)) {
            option::some(delta)
        } else {
            option::none()
        }
    }
}