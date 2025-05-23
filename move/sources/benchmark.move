module walgit::benchmark {
    use sui::clock::{Self, Clock};
    use sui::tx_context::{Self, TxContext};
    use std::vector;
    use std::string::{Self, String};
    
    use walgit::object_cache::{Self, ObjectCache};
    use walgit::reference_index::{Self, ReferenceIndex};
    use walgit::performance_monitor::{Self, PerformanceMonitor};
    use walgit::batch_operations::{Self, BatchOperation};
    use sui::object::{Self, ID};
    
    // Benchmark scenarios
    const SCENARIO_CACHE_STRESS: u8 = 1;
    const SCENARIO_REF_LOOKUP: u8 = 2;
    const SCENARIO_BATCH_OPS: u8 = 3;
    const SCENARIO_MIXED_LOAD: u8 = 4;
    
    /// Test object for creating IDs
    struct TestObject has key {
        id: UID,
        index: u64
    }
    
    /// Benchmark result
    public struct BenchmarkResult has drop {
        scenario: u8,
        iterations: u64,
        total_duration_ms: u64,
        avg_duration_us: u64,
        ops_per_second: u64,
        gas_used: u64,
        memory_used: u64,
        success_rate: u64
    }
    
    /// Benchmark suite results
    public struct BenchmarkSuite has drop {
        started_at: u64,
        completed_at: u64,
        results: vector<BenchmarkResult>,
        summary: BenchmarkSummary
    }
    
    /// Benchmark summary
    public struct BenchmarkSummary has drop {
        total_scenarios: u64,
        total_operations: u64,
        total_duration_ms: u64,
        avg_ops_per_second: u64,
        best_scenario: u8,
        worst_scenario: u8
    }
    
    /// Run complete benchmark suite
    public fun run_benchmark_suite(
        cache: &mut ObjectCache,
        ref_index: &mut ReferenceIndex,
        monitor: &mut PerformanceMonitor,
        clock: &Clock,
        ctx: &mut TxContext
    ): BenchmarkSuite {
        let start_time = clock::timestamp_ms(clock);
        let results = vector::empty();
        
        // Run cache stress test
        let cache_result = benchmark_cache_stress(cache, monitor, clock, ctx, 1000);
        vector::push_back(&mut results, cache_result);
        
        // Run reference lookup test
        let ref_result = benchmark_ref_lookups(ref_index, monitor, clock, ctx, 500);
        vector::push_back(&mut results, ref_result);
        
        // Run batch operations test
        let batch_result = benchmark_batch_ops(cache, ref_index, monitor, clock, ctx, 100);
        vector::push_back(&mut results, batch_result);
        
        // Run mixed load test
        let mixed_result = benchmark_mixed_load(cache, ref_index, monitor, clock, ctx, 200);
        vector::push_back(&mut results, mixed_result);
        
        let end_time = clock::timestamp_ms(clock);
        
        // Calculate summary
        let summary = calculate_summary(&results);
        
        BenchmarkSuite {
            started_at: start_time,
            completed_at: end_time,
            results,
            summary
        }
    }
    
    /// Benchmark cache performance
    public fun benchmark_cache_stress(
        cache: &mut ObjectCache,
        monitor: &mut PerformanceMonitor,
        clock: &Clock,
        ctx: &mut TxContext,
        iterations: u64
    ): BenchmarkResult {
        let start_time = clock::timestamp_ms(clock);
        let successes = 0;
        let i = 0;
        
        // Warm up cache
        warm_up_cache(cache, clock, ctx);
        
        while (i < iterations) {
            let op_start = performance_monitor::start_timing(clock);
            
            // Create test object to get a valid ID
            let test_obj = TestObject {
                id: object::new(ctx),
                index: i
            };
            let test_id = object::id(&test_obj);
            
            // Cache write
            object_cache::cache_object(
                cache,
                test_id,
                1, // type
                generate_test_data(i),
                clock
            );
            
            // Cache read
            let result = object_cache::get_cached_object(cache, test_id, clock);
            if (option::is_some(&result)) {
                successes = successes + 1;
            };
            
            performance_monitor::end_timing(
                monitor,
                6, // METRIC_STORAGE_OP
                op_start,
                option::none(),
                clock
            );
            
            // Clean up test object
            let TestObject { id: obj_id, index: _ } = test_obj;
            object::delete(obj_id);
            
            i = i + 1;
        };
        
        let end_time = clock::timestamp_ms(clock);
        let duration_ms = end_time - start_time;
        
        BenchmarkResult {
            scenario: SCENARIO_CACHE_STRESS,
            iterations,
            total_duration_ms: duration_ms,
            avg_duration_us: (duration_ms * 1000) / iterations,
            ops_per_second: (iterations * 1000) / duration_ms,
            gas_used: 0, // Would be tracked in real scenario
            memory_used: 0,
            success_rate: (successes * 100) / iterations
        }
    }
    
    /// Benchmark reference lookups
    public fun benchmark_ref_lookups(
        ref_index: &mut ReferenceIndex,
        monitor: &mut PerformanceMonitor,
        clock: &Clock,
        ctx: &mut TxContext,
        iterations: u64
    ): BenchmarkResult {
        let start_time = clock::timestamp_ms(clock);
        let successes = 0;
        
        // Populate reference index
        populate_ref_index(ref_index, ctx);
        
        let i = 0;
        while (i < iterations) {
            let op_start = performance_monitor::start_timing(clock);
            
            let ref_name = generate_ref_name(i);
            
            // Lookup by name
            let result = reference_index::get_reference(ref_index, ref_name);
            if (option::is_some(&result)) {
                successes = successes + 1;
            };
            
            // Prefix search
            let prefix_results = reference_index::find_refs_by_prefix(
                ref_index,
                string::utf8(b"refs/")
            );
            
            performance_monitor::end_timing(
                monitor,
                3, // METRIC_REF_LOOKUP
                op_start,
                option::none(),
                clock
            );
            
            i = i + 1;
        };
        
        let end_time = clock::timestamp_ms(clock);
        let duration_ms = end_time - start_time;
        
        BenchmarkResult {
            scenario: SCENARIO_REF_LOOKUP,
            iterations,
            total_duration_ms: duration_ms,
            avg_duration_us: (duration_ms * 1000) / iterations,
            ops_per_second: (iterations * 1000) / duration_ms,
            gas_used: 0,
            memory_used: 0,
            success_rate: (successes * 100) / iterations
        }
    }
    
    /// Benchmark batch operations
    public fun benchmark_batch_ops(
        cache: &mut ObjectCache,
        ref_index: &mut ReferenceIndex,
        monitor: &mut PerformanceMonitor,
        clock: &Clock,
        ctx: &mut TxContext,
        iterations: u64
    ): BenchmarkResult {
        let start_time = clock::timestamp_ms(clock);
        let total_ops = 0;
        let successful_ops = 0;
        
        let i = 0;
        while (i < iterations) {
            let op_start = performance_monitor::start_timing(clock);
            
            // Create batch of operations
            let batch = create_test_batch(i);
            let batch_size = vector::length(&batch);
            total_ops = total_ops + batch_size;
            
            // Execute batch
            let results = batch_operations::execute_batch(
                batch,
                cache,
                ref_index,
                ctx
            );
            
            // Count successes
            let j = 0;
            while (j < vector::length(&results)) {
                let result = vector::borrow(&results, j);
                if (result.success) {
                    successful_ops = successful_ops + 1;
                };
                j = j + 1;
            };
            
            performance_monitor::end_timing(
                monitor,
                4, // METRIC_BATCH_OP
                op_start,
                option::none(),
                clock
            );
            
            i = i + 1;
        };
        
        let end_time = clock::timestamp_ms(clock);
        let duration_ms = end_time - start_time;
        
        BenchmarkResult {
            scenario: SCENARIO_BATCH_OPS,
            iterations,
            total_duration_ms: duration_ms,
            avg_duration_us: (duration_ms * 1000) / total_ops,
            ops_per_second: (total_ops * 1000) / duration_ms,
            gas_used: 0,
            memory_used: 0,
            success_rate: (successful_ops * 100) / total_ops
        }
    }
    
    /// Benchmark mixed workload
    public fun benchmark_mixed_load(
        cache: &mut ObjectCache,
        ref_index: &mut ReferenceIndex,
        monitor: &mut PerformanceMonitor,
        clock: &Clock,
        ctx: &mut TxContext,
        iterations: u64
    ): BenchmarkResult {
        let start_time = clock::timestamp_ms(clock);
        let operations = 0;
        let successes = 0;
        
        let i = 0;
        while (i < iterations) {
            let op_type = i % 4;
            
            if (op_type == 0) {
                // Cache operation
                let op_start = performance_monitor::start_timing(clock);
                cache_operation(cache, i, clock);
                performance_monitor::end_timing(monitor, 6, op_start, option::none(), clock);
                operations = operations + 1;
                successes = successes + 1;
            } else if (op_type == 1) {
                // Reference operation
                let op_start = performance_monitor::start_timing(clock);
                reference_operation(ref_index, i);
                performance_monitor::end_timing(monitor, 3, op_start, option::none(), clock);
                operations = operations + 1;
                successes = successes + 1;
            } else if (op_type == 2) {
                // Batch operation
                let op_start = performance_monitor::start_timing(clock);
                let batch = create_small_batch(i);
                let results = batch_operations::execute_batch(batch, cache, ref_index, ctx);
                performance_monitor::end_timing(monitor, 4, op_start, option::none(), clock);
                operations = operations + vector::length(&results);
                successes = successes + count_successes(&results);
            } else {
                // Combined operation
                mixed_operation(cache, ref_index, monitor, clock, i);
                operations = operations + 3;
                successes = successes + 3;
            };
            
            i = i + 1;
        };
        
        let end_time = clock::timestamp_ms(clock);
        let duration_ms = end_time - start_time;
        
        BenchmarkResult {
            scenario: SCENARIO_MIXED_LOAD,
            iterations: operations,
            total_duration_ms: duration_ms,
            avg_duration_us: (duration_ms * 1000) / operations,
            ops_per_second: (operations * 1000) / duration_ms,
            gas_used: 0,
            memory_used: 0,
            success_rate: (successes * 100) / operations
        }
    }
    
    // Helper functions
    
    fun warm_up_cache(cache: &mut ObjectCache, clock: &Clock, ctx: &mut TxContext) {
        let i = 0;
        while (i < 50) {
            let test_obj = TestObject {
                id: object::new(ctx),
                index: i
            };
            let test_id = object::id(&test_obj);
            
            object_cache::cache_object(
                cache,
                test_id,
                1,
                generate_test_data(i),
                clock
            );
            
            // Clean up test object
            let TestObject { id: obj_id, index: _ } = test_obj;
            object::delete(obj_id);
            
            i = i + 1;
        };
    }
    
    fun populate_ref_index(ref_index: &mut ReferenceIndex, ctx: &mut TxContext) {
        let i = 0;
        while (i < 100) {
            // Create a temporary test object to get a valid ID
            let test_obj = TestObject {
                id: object::new(ctx),
                index: i
            };
            let test_id = object::id(&test_obj);
            
            let metadata = reference_index::ReferenceMetadata {
                created_at: 0,
                updated_at: 0,
                created_by: @0x0,
                message: option::none()
            };
            
            reference_index::add_reference(
                ref_index,
                generate_ref_name(i),
                test_id,
                0,
                0,
                metadata
            );
            
            // Clean up test object
            let TestObject { id: obj_id, index: _ } = test_obj;
            object::delete(obj_id);
            
            i = i + 1;
        };
    }
    
    fun generate_test_data(index: u64): vector<u8> {
        let data = vector::empty();
        let i = 0;
        while (i < 100) {
            vector::push_back(&mut data, ((index + i) % 256 as u8));
            i = i + 1;
        };
        data
    }
    
    fun generate_ref_name(index: u64): String {
        let prefix = if (index % 3 == 0) {
            b"refs/heads/"
        } else if (index % 3 == 1) {
            b"refs/tags/"
        } else {
            b"refs/remotes/"
        };
        
        let full_name = vector::empty();
        vector::append(&mut full_name, prefix);
        vector::append(&mut full_name, b"test-");
        vector::append(&mut full_name, to_bytes(index));
        
        string::utf8(full_name)
    }
    
    fun create_test_batch(index: u64): vector<BatchOperation> {
        let batch = vector::empty();
        let i = 0;
        
        while (i < 5) {
            let op_data = batch_operations::new_operation_data(
                option::some(generate_test_data(index + i)),  // blob_data
                option::none(),  // tree_entries
                option::none(),  // commit_data
                option::none(),  // ref_name
                option::none(),  // ref_target
                option::none(),  // object_id
                option::none()   // object_type
            );
            
            let operation = batch_operations::new_batch_operation(
                1, // OP_CREATE_BLOB
                index * 10 + i,
                vector::empty(),
                op_data
            );
            
            vector::push_back(&mut batch, operation);
            i = i + 1;
        };
        
        batch
    }
    
    fun create_small_batch(index: u64): vector<BatchOperation> {
        let batch = vector::empty();
        
        let op_data = batch_operations::new_operation_data(
            option::some(generate_test_data(index)),  // blob_data
            option::none(),  // tree_entries
            option::none(),  // commit_data
            option::none(),  // ref_name
            option::none(),  // ref_target
            option::none(),  // object_id
            option::none()   // object_type
        );
        
        let operation = batch_operations::new_batch_operation(
            1, // OP_CREATE_BLOB
            index,
            vector::empty(),
            op_data
        );
        
        vector::push_back(&mut batch, operation);
        batch
    }
    
    fun cache_operation(cache: &mut ObjectCache, index: u64, clock: &Clock, ctx: &mut TxContext) {
        // Create a test object to get a valid ID
        let test_obj = TestObject {
            id: object::new(ctx),
            index
        };
        let id = object::id(&test_obj);
        object_cache::cache_object(cache, id, 1, generate_test_data(index), clock);
        object_cache::get_cached_object(cache, id, clock);
        
        // Clean up test object
        let TestObject { id: test_id, index: _ } = test_obj;
        object::delete(test_id);
    }
    
    fun reference_operation(ref_index: &mut ReferenceIndex, index: u64) {
        let ref_name = generate_ref_name(index);
        reference_index::get_reference(ref_index, ref_name);
        reference_index::find_refs_by_prefix(ref_index, string::utf8(b"refs/"));
    }
    
    fun mixed_operation(
        cache: &mut ObjectCache,
        ref_index: &mut ReferenceIndex,
        monitor: &mut PerformanceMonitor,
        clock: &Clock,
        index: u64,
        ctx: &mut TxContext
    ) {
        cache_operation(cache, index, clock, ctx);
        reference_operation(ref_index, index);
    }
    
    fun count_successes(results: &vector<batch_operations::BatchResult>): u64 {
        let count = 0;
        let i = 0;
        while (i < vector::length(results)) {
            if (batch_operations::is_successful(vector::borrow(results, i))) {
                count = count + 1;
            };
            i = i + 1;
        };
        count
    }
    
    fun to_bytes(n: u64): vector<u8> {
        let bytes = vector::empty();
        let i = 0;
        while (i < 8) {
            vector::push_back(&mut bytes, ((n >> (i * 8)) & 0xFF as u8));
            i = i + 1;
        };
        bytes
    }
    
    fun calculate_summary(results: &vector<BenchmarkResult>): BenchmarkSummary {
        let total_scenarios = vector::length(results);
        let mut total_operations = 0;
        let mut total_duration_ms = 0;
        let mut total_ops_per_second = 0;
        let mut best_ops_per_second = 0;
        let mut worst_ops_per_second = 0xFFFFFFFFFFFFFFFF;
        let mut best_scenario = 0;
        let mut worst_scenario = 0;
        
        let i = 0;
        while (i < total_scenarios) {
            let result = vector::borrow(results, i);
            total_operations = total_operations + result.iterations;
            total_duration_ms = total_duration_ms + result.total_duration_ms;
            total_ops_per_second = total_ops_per_second + result.ops_per_second;
            
            if (result.ops_per_second > best_ops_per_second) {
                best_ops_per_second = result.ops_per_second;
                best_scenario = result.scenario;
            };
            
            if (result.ops_per_second < worst_ops_per_second) {
                worst_ops_per_second = result.ops_per_second;
                worst_scenario = result.scenario;
            };
            
            i = i + 1;
        };
        
        BenchmarkSummary {
            total_scenarios,
            total_operations,
            total_duration_ms,
            avg_ops_per_second: total_ops_per_second / total_scenarios,
            best_scenario,
            worst_scenario
        }
    }
}