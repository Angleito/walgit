module walgit::object_cache {
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use sui::object::{Self, ID};
    use std::vector;
    use std::option::{Self, Option};
    
    // Cache configuration constants
    const L1_SIZE: u64 = 100;    // Hot cache
    const L2_SIZE: u64 = 1000;   // Warm cache  
    const TTL_L1: u64 = 300000;  // 5 minutes
    const TTL_L2: u64 = 900000;  // 15 minutes
    
    // Cache error codes
    const E_CACHE_FULL: u64 = 1;
    const E_OBJECT_NOT_FOUND: u64 = 2;
    const E_INVALID_SIZE: u64 = 3;
    
    /// Cached object with metadata
    public struct CachedObject has store, drop, copy {
        object_id: ID,
        object_type: u8,     // blob, tree, commit, etc
        data: vector<u8>,
        size: u64,
        cached_at: u64,      // timestamp
        last_accessed: u64,  // for LRU
        access_count: u64
    }
    
    /// Multi-level object cache
    public struct ObjectCache has store {
        l1_cache: Table<ID, CachedObject>,
        l2_cache: Table<ID, CachedObject>,
        lru_queue: vector<ID>,  // for L1 eviction
        l2_keys: vector<ID>,    // track L2 cache keys for eviction and clearing
        stats: CacheStats
    }
    
    /// Cache statistics
    public struct CacheStats has store, drop, copy {
        hits: u64,
        misses: u64,
        evictions: u64,
        l1_hits: u64,
        l2_hits: u64,
        l2_evictions: u64,
        promotions: u64,
        total_bytes: u64
    }
    
    /// Create new object cache
    public fun new_cache(ctx: &mut TxContext): ObjectCache {
        ObjectCache {
            l1_cache: table::new(ctx),
            l2_cache: table::new(ctx),
            lru_queue: vector::empty(),
            l2_keys: vector::empty(),
            stats: CacheStats {
                hits: 0,
                misses: 0,
                evictions: 0,
                l1_hits: 0,
                l2_hits: 0,
                l2_evictions: 0,
                promotions: 0,
                total_bytes: 0
            }
        }
    }
    
    /// Get object from cache
    public fun get_cached_object(
        cache: &mut ObjectCache,
        object_id: ID,
        clock: &Clock
    ): Option<CachedObject> {
        let now = clock::timestamp_ms(clock);
        
        // Check L1 cache first
        if (table::contains(&cache.l1_cache, object_id)) {
            let obj = table::borrow_mut(&mut cache.l1_cache, object_id);
            
            // Check if not expired
            if (now - obj.cached_at <= TTL_L1) {
                obj.last_accessed = now;
                obj.access_count = obj.access_count + 1;
                cache.stats.hits = cache.stats.hits + 1;
                cache.stats.l1_hits = cache.stats.l1_hits + 1;
                
                // Update LRU position
                update_lru_position(cache, object_id);
                
                return option::some(*obj)
            } else {
                // Expired, remove from L1
                let expired = table::remove(&mut cache.l1_cache, object_id);
                cache.stats.total_bytes = cache.stats.total_bytes - expired.size;
                remove_from_lru(cache, object_id);
            }
        };
        
        // Check L2 cache
        if (table::contains(&cache.l2_cache, object_id)) {
            let obj = table::borrow(&cache.l2_cache, object_id);
            
            // Check if not expired
            if (now - obj.cached_at <= TTL_L2) {
                let mut obj_copy = *obj;
                obj_copy.last_accessed = now;
                obj_copy.access_count = obj_copy.access_count + 1;
                
                // Promote to L1 if frequently accessed
                if (obj_copy.access_count > 3) {
                    promote_to_l1(cache, obj_copy, clock);
                };
                
                cache.stats.hits = cache.stats.hits + 1;
                cache.stats.l2_hits = cache.stats.l2_hits + 1;
                
                return option::some(obj_copy)
            } else {
                // Remove expired entry
                table::remove(&mut cache.l2_cache, object_id);
                remove_from_l2_keys(cache, object_id);
                cache.stats.l2_evictions = cache.stats.l2_evictions + 1;
            }
        };
        
        cache.stats.misses = cache.stats.misses + 1;
        option::none()
    }
    
    /// Add object to cache
    public fun cache_object(
        cache: &mut ObjectCache,
        object_id: ID,
        object_type: u8,
        data: vector<u8>,
        clock: &Clock
    ) {
        let now = clock::timestamp_ms(clock);
        let size = vector::length(&data);
        
        // Validate size constraints
        assert!(size > 0, E_INVALID_SIZE);
        
        let cached_obj = CachedObject {
            object_id,
            object_type,
            data,
            size,
            cached_at: now,
            last_accessed: now,
            access_count: 1
        };
        
        // Check if cache is at absolute capacity limit
        if (table::length(&cache.l1_cache) >= L1_SIZE && table::length(&cache.l2_cache) >= L2_SIZE) {
            // Ensure we can evict something
            assert!(!vector::is_empty(&cache.lru_queue) || !vector::is_empty(&cache.l2_keys), E_CACHE_FULL);
        }
        
        // Try to add to L1
        if (table::length(&cache.l1_cache) < L1_SIZE) {
            table::add(&mut cache.l1_cache, object_id, cached_obj);
            vector::push_back(&mut cache.lru_queue, object_id);
            cache.stats.total_bytes = cache.stats.total_bytes + size;
        } else {
            // L1 is full, evict LRU and add new
            evict_lru_from_l1(cache, clock);
            table::add(&mut cache.l1_cache, object_id, cached_obj);
            vector::push_back(&mut cache.lru_queue, object_id);
            cache.stats.total_bytes = cache.stats.total_bytes + size;
        }
    }
    
    /// Promote object from L2 to L1
    fun promote_to_l1(
        cache: &mut ObjectCache,
        object: CachedObject,
        clock: &Clock
    ) {
        let object_id = object.object_id;
        
        // Remove from L2
        if (table::contains(&cache.l2_cache, object_id)) {
            table::remove(&mut cache.l2_cache, object_id);
            remove_from_l2_keys(cache, object_id);
            cache.stats.promotions = cache.stats.promotions + 1;
        };
        
        // Add to L1 (may trigger eviction)
        cache_object(cache, object_id, object.object_type, object.data, clock);
    }
    
    /// Evict least recently used from L1
    fun evict_lru_from_l1(
        cache: &mut ObjectCache,
        clock: &Clock
    ) {
        if (!vector::is_empty(&cache.lru_queue)) {
            let lru_id = vector::remove(&mut cache.lru_queue, 0);
            
            if (table::contains(&cache.l1_cache, lru_id)) {
                let evicted = table::remove(&mut cache.l1_cache, lru_id);
                cache.stats.evictions = cache.stats.evictions + 1;
                cache.stats.total_bytes = cache.stats.total_bytes - evicted.size;
                
                // Move to L2 if there's space
                if (table::length(&cache.l2_cache) < L2_SIZE) {
                    table::add(&mut cache.l2_cache, lru_id, evicted);
                    vector::push_back(&mut cache.l2_keys, lru_id); // Track in L2 keys
                } else {
                    // L2 is full, need to evict from L2 as well
                    evict_oldest_from_l2(cache);
                    table::add(&mut cache.l2_cache, lru_id, evicted);
                    vector::push_back(&mut cache.l2_keys, lru_id); // Track in L2 keys
                }
            }
        }
    }
    
    /// Evict oldest entry from L2
    fun evict_oldest_from_l2(cache: &mut ObjectCache) {
        // Using our l2_keys vector to track L2 entries
        if (!vector::is_empty(&cache.l2_keys)) {
            // Remove oldest (first) entry from L2
            let l2_id = vector::remove(&mut cache.l2_keys, 0);
            
            if (table::contains(&cache.l2_cache, l2_id)) {
                let evicted = table::remove(&mut cache.l2_cache, l2_id);
                cache.stats.evictions = cache.stats.evictions + 1;
                cache.stats.l2_evictions = cache.stats.l2_evictions + 1;
                cache.stats.total_bytes = cache.stats.total_bytes - evicted.size;
            }
        }
    }
    
    /// Update LRU position in queue
    fun update_lru_position(cache: &mut ObjectCache, object_id: ID) {
        // Remove from current position
        let i = 0;
        while (i < vector::length(&cache.lru_queue)) {
            if (*vector::borrow(&cache.lru_queue, i) == object_id) {
                vector::remove(&mut cache.lru_queue, i);
                break
            };
            i = i + 1;
        };
        
        // Add to end (most recently used)
        vector::push_back(&mut cache.lru_queue, object_id);
    }
    
    /// Remove ID from LRU queue
    fun remove_from_lru(cache: &mut ObjectCache, object_id: ID) {
        let i = 0;
        while (i < vector::length(&cache.lru_queue)) {
            if (*vector::borrow(&cache.lru_queue, i) == object_id) {
                vector::remove(&mut cache.lru_queue, i);
                break
            };
            i = i + 1;
        };
    }
    
    /// Remove ID from L2 keys vector
    fun remove_from_l2_keys(cache: &mut ObjectCache, object_id: ID) {
        let i = 0;
        while (i < vector::length(&cache.l2_keys)) {
            if (*vector::borrow(&cache.l2_keys, i) == object_id) {
                vector::remove(&mut cache.l2_keys, i);
                break
            };
            i = i + 1;
        };
    }
    
    /// Clear cache
    public fun clear_cache(cache: &mut ObjectCache) {
        // Clear L1 cache entries using the LRU queue
        while (!vector::is_empty(&cache.lru_queue)) {
            let id = vector::pop_back(&mut cache.lru_queue);
            if (table::contains(&cache.l1_cache, id)) {
                table::remove(&mut cache.l1_cache, id);
            }
        };
        
        // Clear L2 cache entries using the L2 keys vector
        while (!vector::is_empty(&cache.l2_keys)) {
            let id = vector::pop_back(&mut cache.l2_keys);
            if (table::contains(&cache.l2_cache, id)) {
                table::remove(&mut cache.l2_cache, id);
            }
        };
        
        // Reset stats
        cache.stats = CacheStats {
            hits: 0,
            misses: 0,
            evictions: 0,
            l1_hits: 0,
            l2_hits: 0,
            l2_evictions: 0,
            promotions: 0,
            total_bytes: 0
        };
    }
    
    /// Get cache statistics
    public fun get_stats(cache: &ObjectCache): CacheStats {
        cache.stats
    }
    
    /// Calculate cache hit rate
    public fun get_hit_rate(cache: &ObjectCache): u64 {
        let total = cache.stats.hits + cache.stats.misses;
        if (total == 0) {
            0
        } else {
            (cache.stats.hits * 100) / total
        }
    }
    
    /// Get cache size info
    public fun get_cache_sizes(cache: &ObjectCache): (u64, u64, u64) {
        (
            table::length(&cache.l1_cache),
            table::length(&cache.l2_cache),
            cache.stats.total_bytes
        )
    }
}