#[test_only]
module walgit::phase1_tests {
    use std::vector;
    use std::option::{Self, Option};
    use std::string;
    use sui::test_scenario;
    use sui::object;
    
    use walgit::compression::{Self};
    use walgit::delta_compression::{Self};
    use walgit::pack_files::{Self};
    use walgit::storage::{Self};
    
    // Test addresses
    const ALICE: address = @0xA11CE;
    
    #[test]
    fun test_compression_basic() {
        let data = b"This is test data for compression";
        
        // Test compress and decompress
        let compressed = compression::compress(
            &data,
            1, // ALGO_ZLIB
            6  // LEVEL_DEFAULT
        );
        
        assert!(compressed.compressed_size > 0, 1);
        assert!(compressed.uncompressed_size == vector::length(&data), 2);
        
        let decompressed = compression::decompress(&compressed);
        assert!(decompressed == data, 3);
    }
    
    #[test]
    fun test_compression_algorithms() {
        let data = b"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        
        // Test different algorithms
        let algos = vector[0, 1, 2, 3, 4]; // NONE, ZLIB, GZIP, ZSTD, LZ4
        let i = 0;
        
        while (i < vector::length(&algos)) {
            let algo = *vector::borrow(&algos, i);
            
            let compressed = compression::compress(&data, algo, 6);
            let decompressed = compression::decompress(&compressed);
            
            assert!(decompressed == data, 100 + i);
            
            if (algo != 0) { // Not NONE
                assert!(compressed.compressed_size < compressed.uncompressed_size, 200 + i);
            };
            
            i = i + 1;
        };
    }
    
    #[test]
    fun test_delta_compression() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, ALICE);
        
        let base = b"Hello, World! This is the base content.";
        let target = b"Hello, World! This is the modified content.";
        
        // Create delta
        let delta_opt = delta_compression::try_create_delta(
            &base,
            &target,
            object::new_id_from_bytes(b"base_id"),
            string::utf8(b"target_hash"),
            0,
            test_scenario::ctx(ctx)
        );
        
        assert!(option::is_some(&delta_opt), 1);
        
        let delta = option::extract(&mut delta_opt);
        
        // Apply delta
        let reconstructed = delta_compression::apply_delta(&base, &delta);
        assert!(reconstructed == target, 2);
        
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_pack_files() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, ALICE);
        
        // Create mock object IDs
        let objects = vector[
            object::new_id_from_bytes(b"obj1"),
            object::new_id_from_bytes(b"obj2"),
            object::new_id_from_bytes(b"obj3")
        ];
        
        // Create pack file  
        let (pack, index) = pack_files::create_pack_file(
            objects,
            object::new_id_from_bytes(b"repo_id"),
            test_scenario::ctx(ctx)
        );
        
        // Test pack properties
        assert!(pack.object_count == 3, 1);
        assert!(pack.version == 2, 2); // PACK_VERSION
        
        // Test pack index
        assert!(index.pack_file_id == object::get_id(&pack), 3);
        
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_storage_optimization() {
        let ctx = &mut test_scenario::create();
        test_scenario::next_tx(ctx, ALICE);
        
        // Create storage quota
        let quota = storage::create_test_quota(1000000, ALICE, test_scenario::ctx(ctx));
        
        // Test inline storage (small data)
        let small_data = b"Hello, World!";
        let ref1 = storage::store_optimized(
            &small_data,
            &mut quota,
            false,
            option::none(),
            test_scenario::ctx(ctx)
        );
        
        assert!(ref1.tier == 0, 1); // TIER_INLINE
        assert!(!ref1.compressed, 2);
        assert!(option::is_some(&ref1.inline_data), 3);
        
        // Test compressed storage (large data)  
        let large_data = b"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
        let ref2 = storage::store_optimized(
            &large_data,
            &mut quota,
            false,
            option::none(),
            test_scenario::ctx(ctx)
        );
        
        assert!(ref2.tier > 0, 4); // Not inline
        assert!(ref2.compressed, 5);
        assert!(ref2.stored_size < ref2.original_size, 6);
        
        // Test delta storage
        let similar_data = b"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Some modifications here.";
        let ref3 = storage::store_optimized(
            &similar_data,
            &mut quota,
            true,
            ref2.object_id,
            test_scenario::ctx(ctx)
        );
        
        // Test statistics
        let refs = vector[ref1, ref2, ref3];
        let stats = storage::calculate_storage_stats(&refs);
        
        assert!(stats.total_objects == 3, 7);
        assert!(stats.inline_objects == 1, 8);
        assert!(stats.bytes_saved_compression > 0, 9);
        
        test_scenario::end(ctx);
    }
    
    #[test]
    fun test_storage_tier_determination() {
        // Test size thresholds
        assert!(storage::determine_storage_tier(512) == 0, 1);    // TIER_INLINE
        assert!(storage::determine_storage_tier(5000) == 1, 2);   // TIER_CHUNKED  
        assert!(storage::determine_storage_tier(20000) == 2, 3);  // TIER_WALRUS
        assert!(storage::determine_storage_tier(100000) == 3, 4); // TIER_DELTA
        assert!(storage::determine_storage_tier(2000000) == 4, 5); // TIER_PACKED
    }
    
    #[test]
    fun test_compression_ratio() {
        let data = b"AAAAAAAAAA"; // Highly compressible
        
        let compressed = compression::compress(&data, 1, 6); // ZLIB
        let ratio = compression::get_compression_ratio(&compressed);
        
        assert!(ratio < 100, 1); // Should be compressed
        assert!(compression::should_compress(10, 3, 50), 2); // 3/10 < 50%
    }
}