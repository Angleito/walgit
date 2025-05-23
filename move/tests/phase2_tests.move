#[test_only]
module walgit::phase2_tests {
    use std::vector;
    use std::option::{Self, Option};
    use std::string;
    use sui::test_scenario::{Self, Scenario};
    use sui::clock;
    use sui::object;
    
    use walgit::object_cache::{Self};
    use walgit::reference_index::{Self};
    use walgit::batch_operations::{Self};
    use walgit::performance_monitor::{Self};
    use walgit::benchmark::{Self};
    
    const TEST_ADDR: address = @0xA11CE;
    
    #[test]
    fun test_object_cache_basic() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, TEST_ADDR);
        
        let clock = clock::create_for_testing(test_scenario::ctx(ctx));
        let cache = object_cache::new_cache(test_scenario::ctx(ctx));
        
        // Test cache write and read
        let test_id = object::new_id_from_bytes(b"test_object");
        let test_data = b"This is test data";
        
        object_cache::cache_object(
            &mut cache,
            test_id,
            1, // type
            test_data,
            &clock
        );
        
        let result = object_cache::get_cached_object(&mut cache, test_id, &clock);
        assert!(option::is_some(&result), 1);
        
        let cached_obj = option::extract(&mut result);
        assert!(cached_obj.data == test_data, 2);
        assert!(cached_obj.object_type == 1, 3);
        
        // Test cache statistics
        let stats = object_cache::get_stats(&cache);
        assert!(stats.hits == 1, 4);
        assert!(stats.misses == 0, 5);
        assert!(stats.l1_hits == 1, 6);
        
        clock::destroy_for_testing(clock);
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_cache_eviction() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, TEST_ADDR);
        
        let clock = clock::create_for_testing(test_scenario::ctx(ctx));
        let cache = object_cache::new_cache(test_scenario::ctx(ctx));
        
        // Fill L1 cache to trigger eviction
        let i = 0;
        while (i < 101) { // L1_SIZE is 100
            let test_id = object::new_id_from_bytes(&int_to_bytes(i));
            object_cache::cache_object(
                &mut cache,
                test_id,
                1,
                b"test",
                &clock
            );
            i = i + 1;
        };
        
        // First object should be evicted to L2
        let first_id = object::new_id_from_bytes(&int_to_bytes(0));
        let result = object_cache::get_cached_object(&mut cache, first_id, &clock);
        assert!(option::is_some(&result), 1);
        
        let stats = object_cache::get_stats(&cache);
        assert!(stats.l2_hits == 1, 2);
        assert!(stats.evictions >= 1, 3);
        
        clock::destroy_for_testing(clock);
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_reference_index() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, TEST_ADDR);
        
        let ref_index = reference_index::new_index(test_scenario::ctx(ctx));
        
        // Add references
        let metadata = reference_index::ReferenceMetadata {
            created_at: 0,
            updated_at: 0,
            created_by: TEST_ADDR,
            message: option::some(string::utf8(b"test"))
        };
        
        let target_id = object::new_id_from_bytes(b"commit_1");
        
        reference_index::add_reference(
            &mut ref_index,
            string::utf8(b"refs/heads/main"),
            target_id,
            0, // ref_type
            0, // target_type
            metadata
        );
        
        reference_index::add_reference(
            &mut ref_index,
            string::utf8(b"refs/heads/develop"),
            target_id,
            0,
            0,
            metadata
        );
        
        // Test lookup by name
        let ref_opt = reference_index::get_reference(
            &ref_index,
            string::utf8(b"refs/heads/main")
        );
        assert!(option::is_some(&ref_opt), 1);
        
        // Test reverse lookup by target
        let refs_by_target = reference_index::find_refs_by_target(&ref_index, target_id);
        assert!(vector::length(&refs_by_target) == 2, 2);
        
        // Test prefix search
        let refs_by_prefix = reference_index::find_refs_by_prefix(
            &ref_index,
            string::utf8(b"refs/heads/")
        );
        assert!(vector::length(&refs_by_prefix) == 2, 3);
        
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_batch_operations() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, TEST_ADDR);
        
        let clock = clock::create_for_testing(test_scenario::ctx(ctx));
        let cache = object_cache::new_cache(test_scenario::ctx(ctx));
        let ref_index = reference_index::new_index(test_scenario::ctx(ctx));
        
        // Create batch with dependencies
        let batch = vector::empty();
        
        // Operation 1: Create blob
        let op1_data = batch_operations::OperationData {
            blob_data: option::some(b"test blob"),
            tree_entries: option::none(),
            commit_data: option::none(),
            ref_name: option::none(),
            ref_target: option::none(),
            object_id: option::none(),
            object_type: option::none()
        };
        
        let op1 = batch_operations::BatchOperation {
            op_type: 1, // OP_CREATE_BLOB
            operation_id: 1,
            depends_on: vector::empty(),
            data: op1_data
        };
        
        vector::push_back(&mut batch, op1);
        
        // Operation 2: Update ref (depends on op1)
        let op2_data = batch_operations::OperationData {
            blob_data: option::none(),
            tree_entries: option::none(),
            commit_data: option::none(),
            ref_name: option::some(string::utf8(b"refs/heads/test")),
            ref_target: option::some(object::new_id_from_bytes(b"target")),
            object_id: option::none(),
            object_type: option::none()
        };
        
        let op2 = batch_operations::BatchOperation {
            op_type: 4, // OP_UPDATE_REF
            operation_id: 2,
            depends_on: vector[1],
            data: op2_data
        };
        
        vector::push_back(&mut batch, op2);
        
        // Execute batch
        let results = batch_operations::execute_batch(
            batch,
            &mut cache,
            &mut ref_index,
            test_scenario::ctx(ctx)
        );
        
        assert!(vector::length(&results) == 2, 1);
        
        let result1 = vector::borrow(&results, 0);
        assert!(result1.success, 2);
        
        let result2 = vector::borrow(&results, 1);
        assert!(result2.success, 3);
        
        clock::destroy_for_testing(clock);
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_performance_monitor() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, TEST_ADDR);
        
        let clock = clock::create_for_testing(test_scenario::ctx(ctx));
        let monitor = performance_monitor::new_monitor(1000, &clock);
        
        // Record some metrics
        let start_time = performance_monitor::start_timing(&clock);
        
        // Simulate some work
        clock::increment_for_testing(&mut clock, 1000); // 1ms
        
        performance_monitor::end_timing(
            &mut monitor,
            1, // METRIC_CACHE_HIT
            start_time,
            option::some(100), // gas used
            &clock
        );
        
        // Record cache miss
        performance_monitor::record_cache_miss(&mut monitor, 500, &clock);
        
        // Calculate stats
        let stats = performance_monitor::calculate_stats(&monitor);
        
        assert!(stats.cache_hits == 1, 1);
        assert!(stats.cache_misses == 1, 2);
        assert!(stats.cache_hit_rate == 50, 3);
        assert!(stats.total_gas_used == 100, 4);
        
        clock::destroy_for_testing(clock);
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_benchmark_cache() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, TEST_ADDR);
        
        let clock = clock::create_for_testing(test_scenario::ctx(ctx));
        let cache = object_cache::new_cache(test_scenario::ctx(ctx));
        let monitor = performance_monitor::new_monitor(1000, &clock);
        
        // Run cache benchmark
        let result = benchmark::benchmark_cache_stress(
            &mut cache,
            &mut monitor,
            &clock,
            10 // Small iteration count for testing
        );
        
        assert!(result.scenario == 1, 1); // SCENARIO_CACHE_STRESS
        assert!(result.iterations == 10, 2);
        assert!(result.success_rate == 100, 3);
        assert!(result.ops_per_second > 0, 4);
        
        clock::destroy_for_testing(clock);
        test_scenario::end(ctx);
    }
    
    // Helper functions
    
    fun int_to_bytes(n: u64): vector<u8> {
        let bytes = vector::empty();
        let i = 0;
        while (i < 8) {
            vector::push_back(&mut bytes, ((n >> (i * 8)) & 0xFF as u8));
            i = i + 1;
        };
        bytes
    }
}