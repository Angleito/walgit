# WalGit Optimization Implementation Guide

## 1. Delta Compression Implementation

### Problem
Current implementation stores full blob content for every version, leading to storage inefficiency.

### Solution: Delta Object System

```move
module walgit::delta_compression {
    use std::vector;
    use sui::object::{Self, UID, ID};
    
    /// Delta operation types
    const OP_COPY: u8 = 0;
    const OP_INSERT: u8 = 1;
    
    public struct DeltaInstruction has store, drop, copy {
        op_type: u8,
        offset: u64,    // For copy: source offset
        length: u64,    // For copy: bytes to copy
        data: vector<u8> // For insert: new data
    }
    
    public struct DeltaObject has key, store {
        id: UID,
        base_object_id: ID,
        delta_instructions: vector<DeltaInstruction>,
        compressed_size: u64,
        uncompressed_size: u64
    }
    
    /// Calculate delta between two blobs
    public fun create_delta(
        base: &vector<u8>,
        target: &vector<u8>,
        ctx: &mut TxContext
    ): DeltaObject {
        let instructions = calculate_delta_instructions(base, target);
        let id = object::new(ctx);
        
        DeltaObject {
            id,
            base_object_id: /* base blob ID */,
            delta_instructions: instructions,
            compressed_size: vector::length(&instructions) * 16, // estimate
            uncompressed_size: vector::length(target)
        }
    }
    
    /// Apply delta to reconstruct target
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
                let j = inst.offset;
                let end = inst.offset + inst.length;
                while (j < end) {
                    vector::push_back(&mut result, *vector::borrow(base, j));
                    j = j + 1;
                };
            } else if (inst.op_type == OP_INSERT) {
                // Insert new data
                vector::append(&mut result, inst.data);
            };
            
            i = i + 1;
        };
        
        result
    }
}
```

## 2. Pack File Implementation

### Problem
Individual object storage is inefficient for large repositories.

### Solution: Pack File System

```move
module walgit::pack_files {
    use sui::table::{Self, Table};
    use sui::object::{Self, UID};
    use std::vector;
    
    /// Pack file header
    const PACK_SIGNATURE: vector<u8> = b"PACK";
    const PACK_VERSION: u32 = 2;
    
    public struct PackedObject has store, drop {
        object_type: u8,    // blob, tree, commit, tag
        size: u64,
        data: vector<u8>,   // compressed data
        hash: vector<u8>    // SHA-1 hash
    }
    
    public struct PackFile has key, store {
        id: UID,
        version: u32,
        object_count: u64,
        objects: vector<PackedObject>,
        index: Table<vector<u8>, u64>, // hash -> position
        checksum: vector<u8>
    }
    
    public struct PackIndex has key, store {
        id: UID,
        pack_file_id: ID,
        fanout: vector<u32>,  // 256 entries for first byte
        entries: Table<vector<u8>, PackIndexEntry>
    }
    
    public struct PackIndexEntry has store, drop {
        offset: u64,
        crc32: u32,
        object_type: u8
    }
    
    /// Create pack file from loose objects
    public fun create_pack_file(
        objects: vector<ID>,
        ctx: &mut TxContext
    ): PackFile {
        let packed_objects = vector::empty();
        let index = table::new(ctx);
        
        // Sort objects by type and size for better compression
        let sorted_objects = sort_objects_for_packing(&objects);
        
        let i = 0;
        while (i < vector::length(&sorted_objects)) {
            let obj_id = vector::borrow(&sorted_objects, i);
            let packed = pack_object(obj_id);
            
            table::add(&mut index, packed.hash, i);
            vector::push_back(&mut packed_objects, packed);
            
            i = i + 1;
        };
        
        PackFile {
            id: object::new(ctx),
            version: PACK_VERSION,
            object_count: vector::length(&packed_objects),
            objects: packed_objects,
            index,
            checksum: calculate_pack_checksum(&packed_objects)
        }
    }
}
```

## 3. Reference Optimization

### Problem
Individual reference lookups are expensive on blockchain.

### Solution: Packed References

```move
module walgit::packed_refs {
    use sui::table::{Self, Table};
    use std::string::String;
    
    public struct PackedRef has store, drop, copy {
        name: String,
        target_id: ID,
        ref_type: u8,
        is_peeled: bool,     // For annotated tags
        peeled_id: Option<ID> // Direct commit reference
    }
    
    public struct PackedRefs has key, store {
        id: UID,
        repository_id: ID,
        refs: Table<String, PackedRef>,
        sorted_names: vector<String>, // For efficient iteration
        last_modified: u64
    }
    
    /// Pack loose references
    public fun pack_refs(
        repo_id: ID,
        loose_refs: &vector<ID>,
        ctx: &mut TxContext
    ): PackedRefs {
        let refs = table::new(ctx);
        let sorted_names = vector::empty();
        
        // Process each loose reference
        let i = 0;
        while (i < vector::length(loose_refs)) {
            let ref_id = vector::borrow(loose_refs, i);
            let ref_obj = /* load reference object */;
            
            let packed = PackedRef {
                name: ref_obj.name,
                target_id: ref_obj.target_id,
                ref_type: ref_obj.ref_type,
                is_peeled: false,
                peeled_id: option::none()
            };
            
            // Peel annotated tags
            if (ref_obj.ref_type == REF_TYPE_TAG) {
                let peeled = peel_tag(ref_obj.target_id);
                packed.is_peeled = true;
                packed.peeled_id = option::some(peeled);
            };
            
            table::add(&mut refs, packed.name, packed);
            vector::push_back(&mut sorted_names, packed.name);
            
            i = i + 1;
        };
        
        // Sort names for efficient range queries
        vector::sort(&mut sorted_names);
        
        PackedRefs {
            id: object::new(ctx),
            repository_id: repo_id,
            refs,
            sorted_names,
            last_modified: tx_context::epoch(ctx)
        }
    }
}
```

## 4. Garbage Collection System

### Problem
Unreachable objects accumulate, consuming storage.

### Solution: Mark and Sweep GC

```move
module walgit::garbage_collector {
    use sui::table::{Self, Table};
    use std::vector;
    
    public struct GCStats has store, drop {
        scanned: u64,
        marked: u64,
        swept: u64,
        freed_bytes: u64,
        duration_ms: u64
    }
    
    public struct ReachabilityMap has store {
        reachable: Table<ID, bool>,
        roots: vector<ID>
    }
    
    /// Run garbage collection on repository
    public fun collect_garbage(
        repo: &mut GitRepository,
        aggressive: bool,
        ctx: &mut TxContext
    ): GCStats {
        let stats = GCStats {
            scanned: 0,
            marked: 0,
            swept: 0,
            freed_bytes: 0,
            duration_ms: 0
        };
        
        // Phase 1: Mark reachable objects
        let reachability = mark_reachable_objects(repo);
        stats.marked = table::length(&reachability.reachable);
        
        // Phase 2: Sweep unreachable objects
        let all_objects = get_all_objects(repo);
        let i = 0;
        while (i < vector::length(&all_objects)) {
            let obj_id = vector::borrow(&all_objects, i);
            
            if (!table::contains(&reachability.reachable, *obj_id)) {
                let size = delete_object(repo, *obj_id);
                stats.swept = stats.swept + 1;
                stats.freed_bytes = stats.freed_bytes + size;
            };
            
            i = i + 1;
        };
        
        // Phase 3: Compact if aggressive
        if (aggressive) {
            compact_storage(repo);
        };
        
        stats
    }
    
    /// Mark all objects reachable from roots
    fun mark_reachable_objects(repo: &GitRepository): ReachabilityMap {
        let reachable = table::new(ctx);
        let roots = get_gc_roots(repo);
        
        // BFS from roots
        let queue = vector::empty();
        vector::append(&mut queue, roots);
        
        while (!vector::is_empty(&queue)) {
            let obj_id = vector::pop_back(&mut queue);
            
            if (!table::contains(&reachable, obj_id)) {
                table::add(&mut reachable, obj_id, true);
                
                // Add referenced objects to queue
                let refs = get_object_references(obj_id);
                vector::append(&mut queue, refs);
            };
        };
        
        ReachabilityMap { reachable, roots }
    }
}
```

## 5. Performance Caching

### Problem
Repeated object fetches are expensive.

### Solution: Multi-Level Cache

```move
module walgit::object_cache {
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    
    const L1_SIZE: u64 = 100;    // Hot cache
    const L2_SIZE: u64 = 1000;   // Warm cache
    const TTL_L1: u64 = 300000;  // 5 minutes
    const TTL_L2: u64 = 1800000; // 30 minutes
    
    public struct CachedObject has store, drop {
        object_id: ID,
        object_type: u8,
        data: vector<u8>,
        last_access: u64,
        access_count: u64
    }
    
    public struct ObjectCache has key, store {
        id: UID,
        l1_cache: Table<ID, CachedObject>, // Hot objects
        l2_cache: Table<ID, CachedObject>, // Warm objects
        lru_queue: vector<ID>,
        stats: CacheStats
    }
    
    public struct CacheStats has store, drop {
        hits: u64,
        misses: u64,
        evictions: u64,
        promotions: u64
    }
    
    /// Get object from cache or storage
    public fun get_cached_object(
        cache: &mut ObjectCache,
        object_id: ID,
        clock: &Clock
    ): Option<CachedObject> {
        let now = clock::timestamp_ms(clock);
        
        // Check L1 cache
        if (table::contains(&cache.l1_cache, object_id)) {
            let obj = table::borrow_mut(&mut cache.l1_cache, object_id);
            obj.last_access = now;
            obj.access_count = obj.access_count + 1;
            cache.stats.hits = cache.stats.hits + 1;
            return option::some(*obj)
        };
        
        // Check L2 cache
        if (table::contains(&cache.l2_cache, object_id)) {
            let obj = table::remove(&mut cache.l2_cache, object_id);
            
            // Promote to L1 if hot
            if (obj.access_count > 5) {
                promote_to_l1(cache, obj, now);
                cache.stats.promotions = cache.stats.promotions + 1;
            };
            
            cache.stats.hits = cache.stats.hits + 1;
            return option::some(obj)
        };
        
        cache.stats.misses = cache.stats.misses + 1;
        option::none()
    }
    
    /// Add object to cache
    public fun cache_object(
        cache: &mut ObjectCache,
        object: CachedObject,
        clock: &Clock
    ) {
        let now = clock::timestamp_ms(clock);
        
        // Evict if necessary
        if (table::length(&cache.l1_cache) >= L1_SIZE) {
            evict_lru(cache, now);
        };
        
        table::add(&mut cache.l1_cache, object.object_id, object);
        update_lru_queue(cache, object.object_id);
    }
}
```

## Implementation Roadmap

### Phase 1: Storage Optimization (2-3 weeks)
1. Implement delta compression
2. Create pack file system
3. Add compression algorithms

### Phase 2: Performance (2-3 weeks)
1. Implement object caching
2. Optimize reference lookups
3. Add batch operations

### Phase 3: Advanced Features (3-4 weeks)
1. Garbage collection
2. Shallow clones
3. Advanced merge strategies

### Phase 4: Security & Monitoring (2 weeks)
1. Signed commits
2. Access logging
3. Performance metrics

## Testing Strategy

1. **Unit Tests**: Each module independently
2. **Integration Tests**: Cross-module interactions
3. **Performance Tests**: Gas usage and latency
4. **Load Tests**: Large repository scenarios
5. **Security Tests**: Permission and access control

## Deployment Considerations

1. **Gradual Rollout**: Deploy optimizations incrementally
2. **Backward Compatibility**: Maintain support for existing data
3. **Migration Scripts**: Convert existing objects to new formats
4. **Monitoring**: Track performance improvements
5. **Rollback Plan**: Ability to revert changes if issues arise