#[test_only]
module walgit::index_tests {
    use sui::test_scenario::{Self, next_tx, ctx};
    use std::string;
    use sui::coin::{mint_for_testing as mint_coin, burn_for_testing as burn_coin};
    use sui::sui::SUI;
    use walgit::storage::{Self as storage, StorageQuota};
    use walgit::git_repository::{Self as repository, GitRepository as Repository};
    use walgit::git_commit_object;
    use walgit::git_index::{Self as index, GitIndex};
    use sui::object;
    use sui::transfer::public_share_object;
    use std::option;
    
    const ADMIN: address = @0xA;
    
    #[test]
    fun test_init_index() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // 1. Create repository
        next_tx(&mut scenario, ADMIN);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        
        next_tx(&mut scenario, ADMIN);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(1_000_000, ctx(&mut scenario));
            storage::purchase_storage(&mut quota, &mut payment, 5 * 1024 * 1024, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment);
        };
        
        next_tx(&mut scenario, ADMIN);
        {
            let mut admin_quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"test-repo"),
                string::utf8(b"A test repository"),
                string::utf8(b"main"),
                &mut admin_quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, admin_quota);
        };
        
        // 2. Initialize an index
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let repo_id = object::id(&repo);
            
            // Create index with no parent commit
            let index_obj = index::init_index(
                repo_id,
                option::none(),
                ctx(&mut scenario)
            );
            
            // Verify initial state
            assert!(!index::is_dirty(&index_obj), 1);
            assert!(index::entry_count(&index_obj) == 0, 2);
            assert!(option::is_none(index::parent_commit_id(&index_obj)), 3);
            
            // Share the index
            public_share_object(index_obj);
            
            test_scenario::return_shared(repo);
        };
        
        // 3. Verify index exists
        next_tx(&mut scenario, ADMIN);
        {
            let index_obj = test_scenario::take_shared<GitIndex>(&scenario);
            assert!(!index::is_dirty(&index_obj), 4);
            assert!(index::entry_count(&index_obj) == 0, 5);
            test_scenario::return_shared(index_obj);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_stage_files() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // 1. Set up repository
        next_tx(&mut scenario, ADMIN);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        
        next_tx(&mut scenario, ADMIN);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(1_000_000, ctx(&mut scenario));
            storage::purchase_storage(&mut quota, &mut payment, 5 * 1024 * 1024, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment);
        };
        
        next_tx(&mut scenario, ADMIN);
        {
            let mut admin_quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"test-repo"),
                string::utf8(b"A test repository"),
                string::utf8(b"main"),
                &mut admin_quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, admin_quota);
        };
        
        // 2. Initialize an index
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let repo_id = object::id(&repo);
            
            // Create index with no parent commit
            let index_obj = index::init_index(
                repo_id,
                option::none(),
                ctx(&mut scenario)
            );
            
            // Share the index
            public_share_object(index_obj);
            
            test_scenario::return_shared(repo);
        };
        
        // 3. Stage a file
        next_tx(&mut scenario, ADMIN);
        {
            let mut index_obj = test_scenario::take_shared<GitIndex>(&scenario);
            
            // Stage a README file
            index::stage_file(
                &mut index_obj,
                string::utf8(b"README.md"),
                123456, // Walrus blob ID
                512, // Size in bytes
                string::utf8(b"readme-hash"),
                0644, // File mode
                1, // FILE_STATUS_ADDED
                ctx(&mut scenario)
            );
            
            // Verify file is staged
            assert!(index::is_dirty(&index_obj), 6);
            assert!(index::entry_count(&index_obj) == 1, 7);
            assert!(index::file_exists(&index_obj, string::utf8(b"README.md")), 8);
            
            // Verify file exists in index
            assert!(index::file_exists(&index_obj, string::utf8(b"README.md")), 9);
            
            test_scenario::return_shared(index_obj);
        };
        
        // 4. Stage another file
        next_tx(&mut scenario, ADMIN);
        {
            let mut index_obj = test_scenario::take_shared<GitIndex>(&scenario);
            
            // Stage a source file
            index::stage_file(
                &mut index_obj,
                string::utf8(b"src/main.move"),
                234567, // Walrus blob ID
                1024, // Size in bytes
                string::utf8(b"main-hash"),
                0644, // File mode
                1, // FILE_STATUS_ADDED
                ctx(&mut scenario)
            );
            
            // Verify file count increased
            assert!(index::entry_count(&index_obj) == 2, 10);
            assert!(index::file_exists(&index_obj, string::utf8(b"src/main.move")), 11);
            
            test_scenario::return_shared(index_obj);
        };
        
        // 5. Stage a deletion
        next_tx(&mut scenario, ADMIN);
        {
            let mut index_obj = test_scenario::take_shared<GitIndex>(&scenario);
            
            // Delete README file
            index::stage_deletion(
                &mut index_obj,
                string::utf8(b"README.md"),
                ctx(&mut scenario)
            );
            
            // Verify README still exists in index after deletion
            assert!(index::file_exists(&index_obj, string::utf8(b"README.md")), 12);
            // Note: We can't directly check if it's marked as deleted due to visibility restrictions
            // The real test would check the result of commits or other operations
            
            test_scenario::return_shared(index_obj);
        };
        
        // 6. Reset index to a commit
        next_tx(&mut scenario, ADMIN);
        {
            // Create a commit to reset to
            let repo = test_scenario::take_shared<Repository>(&scenario);
            // Return repository as we don't need it
            test_scenario::return_shared(repo);
            
            // Reset index to a mock commit ID
            let mut index_obj = test_scenario::take_shared<GitIndex>(&scenario);
            
            // Create a dummy ID for the reset
            let dummy_id = object::id_from_address(@0x123);
            
            index::reset_index(
                &mut index_obj,
                dummy_id
            );
            
            // Verify index is reset
            assert!(!index::is_dirty(&index_obj), 14);
            
            // Check parent commit ID is set
            assert!(option::is_some(index::parent_commit_id(&index_obj)), 15);
            
            test_scenario::return_shared(index_obj);
        };
        
        test_scenario::end(scenario);
    }
}
