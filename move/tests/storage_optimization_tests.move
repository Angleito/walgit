#[test_only]
module walgit::storage_optimization_tests {
    use walgit::delta_compression::{Self, DeltaObject};
    use walgit::pack_files::{Self, PackFile};
    use walgit::compression::{Self, CompressedData};
    use walgit::enhanced_blob_object::{Self, EnhancedBlobObject};
    use walgit::storage_optimization::{Self, StorageOptimizer};
    use walgit::git_blob_object;
    
    use std::string::{String};
    use std::vector;
    use std::option;
    use sui::test_scenario;
    use sui::object::{Self, ID};
    
    #[test]
    fun test_delta_compression() {
        let mut scenario = test_scenario::begin(@0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Create base content
            let base = vector::empty();
            vector::push_back(&mut base, 1);
            vector::push_back(&mut base, 2);
            vector::push_back(&mut base, 3);
            vector::push_back(&mut base, 4);
            
            // Create target content (similar to base)
            let target = vector::empty();
            vector::push_back(&mut target, 1);
            vector::push_back(&mut target, 2);
            vector::push_back(&mut target, 5); // Changed
            vector::push_back(&mut target, 4);
            vector::push_back(&mut target, 6); // Added
            
            // Create delta
            let base_id = object::id_from_address(@0x1);
            let delta = delta_compression::create_delta(
                &base,
                &target,
                base_id,
                String::utf8(b"target_hash"),
                0,
                ctx
            );
            
            // Verify delta is smaller than target
            assert!(delta.compressed_size < vector::length(&target), 1);
            
            // Apply delta to reconstruct target
            let reconstructed = delta_compression::apply_delta(&base, &delta);
            assert!(reconstructed == target, 2);
        };
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_compression() {
        let data = b"This is a test string that should compress well because it has repeated words. This string has repeated content.";
        
        // Test ZLIB compression
        let compressed = compression::compress(
            &data,
            1, // ALGO_ZLIB
            6  // LEVEL_DEFAULT
        );
        
        assert!(compressed.compressed_size < compressed.uncompressed_size, 1);
        
        // Decompress and verify
        let decompressed = compression::decompress(&compressed);
        assert!(decompressed == data, 2);
        
        // Test compression ratio
        let ratio = compression::get_compression_ratio(&compressed);
        assert!(ratio < 100, 3); // Should be compressed
    }
    
    #[test]
    fun test_pack_file_creation() {
        let mut scenario = test_scenario::begin(@0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Create mock object IDs
            let objects = vector::empty();
            vector::push_back(&mut objects, object::id_from_address(@0x1));
            vector::push_back(&mut objects, object::id_from_address(@0x2));
            vector::push_back(&mut objects, object::id_from_address(@0x3));
            
            let repo_id = object::id_from_address(@0xCAFE);
            
            // Create pack file
            let (pack, index) = pack_files::create_pack_file(
                objects,
                repo_id,
                ctx
            );
            
            // Verify pack file
            assert!(pack.object_count == 3, 1);
            assert!(pack.repository_id == repo_id, 2);
            assert!(pack_files::verify_pack(&pack), 3);
            
            // Get statistics
            let stats = pack_files::get_pack_stats(&pack);
            assert!(stats.total_objects == 3, 4);
            
            // Clean up
            test_scenario::return_shared(index);
        };
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_enhanced_blob_creation() {
        let mut scenario = test_scenario::begin(@0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            // Create test content
            let content = b"This is test content that should be optimized";
            let hash = String::utf8(b"test_hash");
            
            // Create enhanced blob without similar blob
            let blob1 = enhanced_blob_object::create_enhanced_blob(
                content,
                hash,
                option::none(),
                ctx
            );
            
            // Verify blob creation
            assert!(blob1.statistics.original_size == vector::length(&content), 1);
            assert!(blob1.statistics.compressed_size <= blob1.statistics.original_size, 2);
            
            // Create another blob with similar reference
            let blob1_id = object::id(&blob1);
            let blob2 = enhanced_blob_object::create_enhanced_blob(
                content,
                String::utf8(b"test_hash_2"),
                option::some(blob1_id),
                ctx
            );
            
            // Verify optimization attempted
            assert!(blob2.statistics.original_size == vector::length(&content), 3);
        };
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_storage_optimizer() {
        let mut scenario = test_scenario::begin(@0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            
            let repo_id = object::id_from_address(@0xCAFE);
            
            // Create optimizer
            let mut optimizer = storage_optimization::create_optimizer(repo_id, ctx);
            
            // Create and add blobs
            let content1 = b"Test content 1";
            let blob1 = enhanced_blob_object::create_enhanced_blob(
                content1,
                String::utf8(b"hash1"),
                option::none(),
                ctx
            );
            
            storage_optimization::add_blob(&mut optimizer, &blob1, ctx);
            
            // Verify statistics
            assert!(optimizer.statistics.total_blobs == 1, 1);
            assert!(optimizer.statistics.total_size > 0, 2);
            
            // Get recommendations
            let recommendations = storage_optimization::get_optimization_recommendations(&optimizer);
            assert!(vector::length(&recommendations) > 0, 3);
            
            test_scenario::return_shared(optimizer);
        };
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_compression_algorithms() {
        let data = b"Test data for compression algorithms";
        
        // Test each algorithm
        let algorithms = vector[
            0, // ALGO_NONE
            1, // ALGO_ZLIB
            2, // ALGO_GZIP
            3, // ALGO_ZSTD
            4  // ALGO_LZ4
        ];
        
        let i = 0;
        while (i < vector::length(&algorithms)) {
            let algo = *vector::borrow(&algorithms, i);
            
            let compressed = compression::compress(
                &data,
                algo,
                6 // LEVEL_DEFAULT
            );
            
            let decompressed = compression::decompress(&compressed);
            assert!(decompressed == data, i);
            
            i = i + 1;
        };
    }
    
    #[test]
    fun test_should_create_delta() {
        let base_size = 1000;
        let target_size = 1000;
        let delta_size = 100;
        
        assert!(delta_compression::should_create_delta(base_size, target_size, delta_size), 1);
        
        // Delta not worth it if too large
        let large_delta = 950;
        assert!(!delta_compression::should_create_delta(base_size, target_size, large_delta), 2);
    }
}