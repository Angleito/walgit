#[test_only]
module walgit::blob_tests {
    use sui::test_scenario as ts;
    use std::string::{Self, String};
    use sui::object::{Self, ID};
    use std::vector;
    
    use walgit::git_blob_object::{Self, GitBlobObject, BlobChunkUpload};
    
    #[test]
    fun test_create_inline_blob() {
        let owner = @0xA1;
        let test_scenario = ts::begin(owner);
        let ctx = ts::ctx(&mut test_scenario);
        
        // Test data
        let data = b"This is a test blob content that will be stored inline";
        let hash = string::utf8(b"abc123");
        let encoding = 0; // Raw encoding
        
        // Create inline blob
        let blob = git_blob_object::create_inline(vector::empty(data), hash, encoding, ctx);
        
        // Verify blob properties
        assert!(git_blob_object::size(&blob) == vector::length(&data), 0);
        assert!(git_blob_object::hash(&blob) == hash, 0);
        assert!(git_blob_object::encoding(&blob) == encoding, 0);
        assert!(git_blob_object::storage_type(&blob) == 0, 0); // STORAGE_INLINE
        assert!(git_blob_object::ref_count(&blob) == 1, 0);
        assert!(git_blob_object::is_complete(&blob), 0);
        
        // Verify inline data retrieval
        let retrieved_data = git_blob_object::get_inline_data(&blob);
        assert!(retrieved_data == data, 0);
        
        // Test reference counting
        git_blob_object::increment_ref_count(&mut blob);
        assert!(git_blob_object::ref_count(&blob) == 2, 0);
        
        let can_delete = git_blob_object::decrement_ref_count(&mut blob);
        assert!(!can_delete, 0);
        assert!(git_blob_object::ref_count(&blob) == 1, 0);
        
        let can_delete = git_blob_object::decrement_ref_count(&mut blob);
        assert!(can_delete, 0);
        assert!(git_blob_object::ref_count(&blob) == 0, 0);
        
        // Clean up
        ts::end(test_scenario);
    }
    
    #[test]
    fun test_create_walrus_blob() {
        let owner = @0xA1;
        let test_scenario = ts::begin(owner);
        let ctx = ts::ctx(&mut test_scenario);
        
        // Test data
        let walrus_blob_id = 12345678;
        let size = 1000000; // 1MB
        let hash = string::utf8(b"def456");
        let encoding = 1; // Base64 encoding
        
        // Create Walrus blob
        let blob = git_blob_object::create_walrus(walrus_blob_id, size, hash, encoding, ctx);
        
        // Verify blob properties
        assert!(git_blob_object::walrus_blob_id(&blob) == walrus_blob_id, 0);
        assert!(git_blob_object::size(&blob) == size, 0);
        assert!(git_blob_object::hash(&blob) == hash, 0);
        assert!(git_blob_object::encoding(&blob) == encoding, 0);
        assert!(git_blob_object::storage_type(&blob) == 2, 0); // STORAGE_WALRUS
        assert!(git_blob_object::ref_count(&blob) == 1, 0);
        assert!(git_blob_object::is_complete(&blob), 0);
        
        // Clean up
        ts::end(test_scenario);
    }
    
    #[test]
    fun test_chunked_blob_upload() {
        let owner = @0xA1;
        let test_scenario = ts::begin(owner);
        
        // Step 1: Start chunked upload
        ts::next_tx(&mut test_scenario, owner);
        {
            let ctx = ts::ctx(&mut test_scenario);
            
            // Test data
            let total_size = 3000000; // 3MB
            let hash = string::utf8(b"ghi789");
            let encoding = 2; // GZIP encoding
            let chunk_size = 1000000; // 1MB chunks
            
            // Start chunked upload
            let (blob, upload) = git_blob_object::start_chunked_upload(
                total_size, hash, encoding, chunk_size, ctx
            );
            
            // Verify blob properties
            assert!(git_blob_object::size(&blob) == total_size, 0);
            assert!(git_blob_object::hash(&blob) == hash, 0);
            assert!(git_blob_object::encoding(&blob) == encoding, 0);
            assert!(git_blob_object::storage_type(&blob) == 1, 0); // STORAGE_CHUNKED
            assert!(git_blob_object::ref_count(&blob) == 1, 0);
            assert!(!git_blob_object::is_complete(&blob), 0);
            assert!(git_blob_object::get_total_chunks(&blob) == 3, 0);
            assert!(git_blob_object::get_chunk_size(&blob) == chunk_size, 0);
            
            // Store objects for next transaction
            ts::transfer(test_scenario, blob);
            ts::transfer(test_scenario, upload);
        };
        
        // Step 2: Upload first chunk
        ts::next_tx(&mut test_scenario, owner);
        {
            let ctx = ts::ctx(&mut test_scenario);
            
            let blob = ts::take_from_sender<GitBlobObject>(&test_scenario);
            let upload = ts::take_from_sender<BlobChunkUpload>(&test_scenario);
            
            // Generate chunk data
            let chunk_data = generate_test_data(1000000); // 1MB of test data
            let chunk_hash = string::utf8(b"chunk0_hash");
            
            // Upload chunk
            git_blob_object::upload_chunk(
                &mut blob, &mut upload, 0, chunk_data, chunk_hash, ctx
            );
            
            // Store objects for next transaction
            ts::return_to_sender(&test_scenario, blob);
            ts::return_to_sender(&test_scenario, upload);
        };
        
        // Step 3: Upload second chunk
        ts::next_tx(&mut test_scenario, owner);
        {
            let ctx = ts::ctx(&mut test_scenario);
            
            let blob = ts::take_from_sender<GitBlobObject>(&test_scenario);
            let upload = ts::take_from_sender<BlobChunkUpload>(&test_scenario);
            
            // Generate chunk data
            let chunk_data = generate_test_data(1000000); // 1MB of test data
            let chunk_hash = string::utf8(b"chunk1_hash");
            
            // Upload chunk
            git_blob_object::upload_chunk(
                &mut blob, &mut upload, 1, chunk_data, chunk_hash, ctx
            );
            
            // Store objects for next transaction
            ts::return_to_sender(&test_scenario, blob);
            ts::return_to_sender(&test_scenario, upload);
        };
        
        // Step 4: Upload third chunk
        ts::next_tx(&mut test_scenario, owner);
        {
            let ctx = ts::ctx(&mut test_scenario);
            
            let blob = ts::take_from_sender<GitBlobObject>(&test_scenario);
            let upload = ts::take_from_sender<BlobChunkUpload>(&test_scenario);
            
            // Generate chunk data
            let chunk_data = generate_test_data(1000000); // 1MB of test data
            let chunk_hash = string::utf8(b"chunk2_hash");
            
            // Upload chunk
            git_blob_object::upload_chunk(
                &mut blob, &mut upload, 2, chunk_data, chunk_hash, ctx
            );
            
            // Store objects for next transaction
            ts::return_to_sender(&test_scenario, blob);
            ts::return_to_sender(&test_scenario, upload);
        };
        
        // Step 5: Complete chunked upload
        ts::next_tx(&mut test_scenario, owner);
        {
            let blob = ts::take_from_sender<GitBlobObject>(&test_scenario);
            let upload = ts::take_from_sender<BlobChunkUpload>(&test_scenario);
            
            // Complete the upload
            git_blob_object::complete_chunked_upload(&mut blob, &upload);
            
            // Verify blob is now complete
            assert!(git_blob_object::is_complete(&blob), 0);
            
            // Clean up
            ts::return_to_sender(&test_scenario, blob);
            ts::return_to_sender(&test_scenario, upload);
        };
        
        ts::end(test_scenario);
    }
    
    // Helper function to generate test data of specified size
    fun generate_test_data(size: u64): vector<u8> {
        let data = vector::empty<u8>();
        let i = 0;
        
        while (i < size) {
            vector::push_back(&mut data, ((i % 256) as u8));
            i = i + 1;
        };
        
        data
    }
}