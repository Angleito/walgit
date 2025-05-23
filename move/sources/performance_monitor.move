module walgit::performance_monitor {
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::vector;
    use std::option::{Self, Option};
    
    // Metric types
    const METRIC_CACHE_HIT: u8 = 1;
    const METRIC_CACHE_MISS: u8 = 2;
    const METRIC_REF_LOOKUP: u8 = 3;
    const METRIC_BATCH_OP: u8 = 4;
    const METRIC_GAS_USED: u8 = 5;
    const METRIC_STORAGE_OP: u8 = 6;
    
    // Time buckets for histograms (microseconds)
    const BUCKET_1MS: u64 = 1000;
    const BUCKET_10MS: u64 = 10000;
    const BUCKET_100MS: u64 = 100000;
    const BUCKET_1S: u64 = 1000000;
    
    /// Performance metric entry
    public struct MetricEntry has store, drop, copy {
        metric_type: u8,
        timestamp: u64,
        duration_us: u64,     // Duration in microseconds
        gas_used: Option<u64>,
        metadata: vector<u8>  // Additional context
    }
    
    /// Performance monitor with ring buffer
    public struct PerformanceMonitor has store {
        metrics: vector<MetricEntry>,
        max_entries: u64,
        current_index: u64,
        start_time: u64,
        total_operations: u64
    }
    
    /// Aggregated performance statistics
    public struct PerformanceStats has drop {
        // Cache statistics
        cache_hits: u64,
        cache_misses: u64,
        cache_hit_rate: u64,
        avg_cache_lookup_us: u64,
        
        // Reference operations
        ref_lookups: u64,
        avg_ref_lookup_us: u64,
        
        // Batch operations
        batch_operations: u64,
        avg_batch_size: u64,
        avg_batch_duration_us: u64,
        
        // Storage operations
        storage_operations: u64,
        avg_storage_op_us: u64,
        
        // Gas metrics
        total_gas_used: u64,
        avg_gas_per_operation: u64,
        
        // Timing distributions
        p50_duration_us: u64,
        p90_duration_us: u64,
        p99_duration_us: u64
    }
    
    /// Performance event emitted for external monitoring
    public struct PerformanceEvent has copy, drop {
        metric_type: u8,
        duration_us: u64,
        gas_used: Option<u64>,
        timestamp: u64
    }
    
    /// Create new performance monitor
    public fun new_monitor(max_entries: u64, clock: &Clock): PerformanceMonitor {
        PerformanceMonitor {
            metrics: vector::empty(),
            max_entries,
            current_index: 0,
            start_time: clock::timestamp_ms(clock) * 1000, // Convert to microseconds
            total_operations: 0
        }
    }
    
    /// Record a performance metric
    public fun record_metric(
        monitor: &mut PerformanceMonitor,
        metric_type: u8,
        start_time_us: u64,
        end_time_us: u64,
        gas_used: Option<u64>,
        metadata: vector<u8>
    ) {
        let duration_us = end_time_us - start_time_us;
        
        let entry = MetricEntry {
            metric_type,
            timestamp: end_time_us,
            duration_us,
            gas_used,
            metadata
        };
        
        // Add to ring buffer
        if (vector::length(&monitor.metrics) < monitor.max_entries) {
            vector::push_back(&mut monitor.metrics, entry);
        } else {
            // Overwrite oldest entry
            let index = monitor.current_index % monitor.max_entries;
            *vector::borrow_mut(&mut monitor.metrics, index) = entry;
        };
        
        monitor.current_index = monitor.current_index + 1;
        monitor.total_operations = monitor.total_operations + 1;
        
        // Emit event for external monitoring
        event::emit(PerformanceEvent {
            metric_type,
            duration_us,
            gas_used,
            timestamp: end_time_us
        });
    }
    
    /// Record cache hit
    public fun record_cache_hit(
        monitor: &mut PerformanceMonitor,
        lookup_time_us: u64,
        clock: &Clock
    ) {
        record_metric(
            monitor,
            METRIC_CACHE_HIT,
            clock::timestamp_ms(clock) * 1000 - lookup_time_us,
            clock::timestamp_ms(clock) * 1000,
            option::none(),
            b"cache_hit"
        );
    }
    
    /// Record cache miss
    public fun record_cache_miss(
        monitor: &mut PerformanceMonitor,
        lookup_time_us: u64,
        clock: &Clock
    ) {
        record_metric(
            monitor,
            METRIC_CACHE_MISS,
            clock::timestamp_ms(clock) * 1000 - lookup_time_us,
            clock::timestamp_ms(clock) * 1000,
            option::none(),
            b"cache_miss"
        );
    }
    
    /// Start timing an operation
    public fun start_timing(clock: &Clock): u64 {
        clock::timestamp_ms(clock) * 1000 // Convert to microseconds
    }
    
    /// End timing and record metric
    public fun end_timing(
        monitor: &mut PerformanceMonitor,
        metric_type: u8,
        start_time: u64,
        gas_used: Option<u64>,
        clock: &Clock
    ) {
        let end_time = clock::timestamp_ms(clock) * 1000;
        record_metric(
            monitor,
            metric_type,
            start_time,
            end_time,
            gas_used,
            vector::empty()
        );
    }
    
    /// Calculate performance statistics
    public fun calculate_stats(monitor: &PerformanceMonitor): PerformanceStats {
        let mut cache_hits = 0;
        let mut cache_misses = 0;
        let mut ref_lookups = 0;
        let mut batch_operations = 0;
        let mut storage_operations = 0;
        let mut total_gas_used = 0;
        
        let mut cache_durations = vector::empty<u64>();
        let mut ref_durations = vector::empty<u64>();
        let mut batch_durations = vector::empty<u64>();
        let mut storage_durations = vector::empty<u64>();
        let mut all_durations = vector::empty<u64>();
        
        // Collect metrics
        let mut i = 0;
        while (i < vector::length(&monitor.metrics)) {
            let metric = vector::borrow(&monitor.metrics, i);
            
            vector::push_back(&mut all_durations, metric.duration_us);
            
            if (metric.metric_type == METRIC_CACHE_HIT) {
                cache_hits = cache_hits + 1;
                vector::push_back(&mut cache_durations, metric.duration_us);
            } else if (metric.metric_type == METRIC_CACHE_MISS) {
                cache_misses = cache_misses + 1;
                vector::push_back(&mut cache_durations, metric.duration_us);
            } else if (metric.metric_type == METRIC_REF_LOOKUP) {
                ref_lookups = ref_lookups + 1;
                vector::push_back(&mut ref_durations, metric.duration_us);
            } else if (metric.metric_type == METRIC_BATCH_OP) {
                batch_operations = batch_operations + 1;
                vector::push_back(&mut batch_durations, metric.duration_us);
            } else if (metric.metric_type == METRIC_STORAGE_OP) {
                storage_operations = storage_operations + 1;
                vector::push_back(&mut storage_durations, metric.duration_us);
            };
            
            if (option::is_some(&metric.gas_used)) {
                total_gas_used = total_gas_used + *option::borrow(&metric.gas_used);
            };
            
            i = i + 1;
        };
        
        // Calculate averages and percentiles
        let cache_hit_rate = if (cache_hits + cache_misses > 0) {
            (cache_hits * 100) / (cache_hits + cache_misses)
        } else {
            0
        };
        
        PerformanceStats {
            cache_hits,
            cache_misses,
            cache_hit_rate,
            avg_cache_lookup_us: calculate_average(&cache_durations),
            ref_lookups,
            avg_ref_lookup_us: calculate_average(&ref_durations),
            batch_operations,
            avg_batch_size: 0, // Would need additional tracking
            avg_batch_duration_us: calculate_average(&batch_durations),
            storage_operations,
            avg_storage_op_us: calculate_average(&storage_durations),
            total_gas_used,
            avg_gas_per_operation: if (monitor.total_operations > 0) {
                total_gas_used / monitor.total_operations
            } else {
                0
            },
            p50_duration_us: calculate_percentile(&all_durations, 50),
            p90_duration_us: calculate_percentile(&all_durations, 90),
            p99_duration_us: calculate_percentile(&all_durations, 99)
        }
    }
    
    /// Calculate average of a vector
    fun calculate_average(values: &vector<u64>): u64 {
        if (vector::is_empty(values)) {
            return 0
        };
        
        let mut sum = 0;
        let mut i = 0;
        while (i < vector::length(values)) {
            sum = sum + *vector::borrow(values, i);
            i = i + 1;
        };
        
        sum / vector::length(values)
    }
    
    /// Calculate percentile of a vector
    fun calculate_percentile(values: &vector<u64>, percentile: u64): u64 {
        if (vector::is_empty(values)) {
            return 0
        };
        
        // Sort values (simple bubble sort for small datasets)
        let mut sorted = *values;
        let n = vector::length(&sorted);
        let mut i = 0;
        
        while (i < n) {
            let mut j = 0;
            while (j < n - i - 1) {
                if (*vector::borrow(&sorted, j) > *vector::borrow(&sorted, j + 1)) {
                    vector::swap(&mut sorted, j, j + 1);
                };
                j = j + 1;
            };
            i = i + 1;
        };
        
        // Calculate percentile index
        let index = (percentile * n) / 100;
        if (index >= n) {
            *vector::borrow(&sorted, n - 1)
        } else {
            *vector::borrow(&sorted, index)
        }
    }
    
    /// Get performance summary
    public fun get_summary(monitor: &PerformanceMonitor): (u64, u64, u64) {
        (
            monitor.total_operations,
            monitor.current_index,
            vector::length(&monitor.metrics)
        )
    }
    
    /// Clear old metrics
    public fun clear_metrics(monitor: &mut PerformanceMonitor) {
        while (!vector::is_empty(&monitor.metrics)) {
            vector::pop_back(&mut monitor.metrics);
        };
        monitor.current_index = 0;
    }
    
    /// Export metrics for analysis
    public fun export_metrics(
        monitor: &PerformanceMonitor,
        start_index: u64,
        count: u64
    ): vector<MetricEntry> {
        let result = vector::empty();
        let i = start_index;
        let end_index = start_index + count;
        
        while (i < end_index && i < vector::length(&monitor.metrics)) {
            vector::push_back(&mut result, *vector::borrow(&monitor.metrics, i));
            i = i + 1;
        };
        
        result
    }
}