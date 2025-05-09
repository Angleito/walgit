#[test_only]
#[allow(unused_use, duplicate_alias)]
module walgit::walgittests {
    use sui::test_scenario::{Self, next_tx, ctx}; // Used by all tests
    use std::string; // Used by all tests
    // Import necessary modules for storage tests
    use sui::coin::{Self, mint_for_testing as mint_coin, burn_for_testing as burn_coin};
    use sui::sui::SUI;
    use walgit::storage::{Self as storage, StorageQuota};
    // Import repository for testing create_repository calls
    use walgit::git_repository::{Self as repository, GitRepository as Repository};
    // Import commit for testing create_commit calls
    use walgit::git_commit_object::{Self as commit, GitCommitObject as Commit}; 
    // Import tree for testing tree creation
    use walgit::git_tree_object::{Self as tree, GitTreeObject};
    use walgit::git_blob_object::{Self as blob, GitBlobObject};
    use sui::transfer::public_share_object;
    use sui::clock; // Import clock for commit test
    // std::option is available without an explicit alias

    const ADMIN: address = @0x495ca410a2e2e83fe2e390ec0b8e0a25392a07b5c53e916c210ab050b5d49253;
    const USER1: address = @0xB; // Add a user for testing
    const ENotImplemented: u64 = 1;
    // We don't need this constant anymore as we're using storage::EInsufficientStorage
    // const EStorageInsufficientStorage: u64 = 2;


    #[test]
    fun test_create_repository() {
        // use walgit::repository::{Self as repository, Repository}; // Already imported above

        let mut scenario = test_scenario::begin(ADMIN);
        let name = string::utf8(b"test-repo");
        let description = string::utf8(b"A test repository");
        let _blob_id = string::utf8(b"blob123"); // Prefix with underscore as unused
        let _initial_size_bytes = 1024; // Example initial size needed

        // 1. Create StorageQuota for ADMIN first and include purchase in same transaction
        next_tx(&mut scenario, ADMIN);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        
        // 2. Take the quota and purchase storage
        next_tx(&mut scenario, ADMIN);
        {
            // Purchase some initial storage needed by create_repository
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(1_000_000, ctx(&mut scenario)); // Mint 1 SUI
            // Assuming 1 MiB is enough for initial repo size consumption
            storage::purchase_storage(&mut quota, &mut payment, 1024*1024, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment); // Clean up coin
        };


        // 3. Execute the create_repository function (6 arguments expected)
        next_tx(&mut scenario, ADMIN);
        {
            // Take the StorageQuota needed by create_repository
            let mut admin_quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                name,               // name: String
                description,        // description: String
                string::utf8(b"main"),  // default_branch: String
                &mut admin_quota,   // storage: &mut StorageQuota
                ctx(&mut scenario)  // ctx: &mut TxContext
            );
            // Return the quota after use
            test_scenario::return_to_sender(&scenario, admin_quota);
        };

        // 4. Check if Repository object exists and has correct owner
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            assert!(repository::owner(&repo) == ADMIN, 4);
            // Check for other fields instead since walrus_blob_id doesn't exist
            assert!(repository::default_branch(&repo) == string::utf8(b"main"), 5);
            test_scenario::return_shared(repo);
            // Also take and return the quota to clean up sender's state
             let quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
             test_scenario::return_to_sender(&scenario, quota);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_commit() {
        // This test is now a simplified version that focuses on the tree integration

        let mut scenario = test_scenario::begin(ADMIN);
        let name = string::utf8(b"test-repo");
        let description = string::utf8(b"A test repository");
        let _repo_blob_id = string::utf8(b"repo_blob1"); // Prefix with underscore as unused
        let _repo_initial_size = 1024; // Example size

        // 1. Create StorageQuota for ADMIN
        next_tx(&mut scenario, ADMIN);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        
        // 2. Purchase storage needed for repo creation + commit creation
        next_tx(&mut scenario, ADMIN);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(1_000_000, ctx(&mut scenario)); // Mint 1 SUI
            storage::purchase_storage(&mut quota, &mut payment, 2 * 1024*1024, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment); // Clean up coin
        };

        // 3. Create Repository
        next_tx(&mut scenario, ADMIN);
        {
            let mut admin_quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                name,
                description,
                string::utf8(b"main"),  // default_branch: String
                &mut admin_quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, admin_quota);
        };

        // 4. Create and share a tree
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            
            // Create a tree
            // Create a tree with a hash
            let root_tree = tree::create(string::utf8(b"roottreehash"), ctx(&mut scenario));
            public_share_object(root_tree);
            
            // Return repo
            test_scenario::return_shared(repo);
        };
        
        // 5. Get repo, tree, and create commit
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let tree_obj = test_scenario::take_shared<GitTreeObject>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));
            let _message = string::utf8(b"Initial commit"); // Prefix with underscore as unused
            
            // Create commit
            let commit_obj = commit::create(
                object::id(&tree_obj),
                option::none(),
                string::utf8(b"Initial commit"),
                string::utf8(b"commithash"),
                option::none(),
                ctx(&mut scenario)
            );
            public_share_object(commit_obj);
            
            // Return objects
            test_scenario::return_shared(tree_obj);
            test_scenario::return_shared(repo);
            clock::destroy_for_testing(clock);
        };
        
        // 6. Check if Commit object exists
        next_tx(&mut scenario, ADMIN);
        {
            let commit_obj = test_scenario::take_shared<Commit>(&scenario);
            assert!(commit::author(&commit_obj) == ADMIN, 14);
            test_scenario::return_shared(commit_obj);
            
            // Cleanup
            let quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            test_scenario::return_to_sender(&scenario, quota);
        };

        test_scenario::end(scenario);
    }


    #[test]
    fun test_create_storage_quota() {
        let mut scenario = test_scenario::begin(USER1);

        // Execute create_storage_quota for USER1
        next_tx(&mut scenario, USER1);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };

        // Check if StorageQuota object exists and has correct owner and initial values
        next_tx(&mut scenario, USER1);
        {
            let quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            // Use the newly added storage::owner getter
            assert!(storage::owner(&quota) == USER1, 101); // Keep using storage::owner
            assert!(storage::bytes_available(&quota) == 0, 102);
            assert!(storage::bytes_used(&quota) == 0, 103);
            test_scenario::return_to_sender(&scenario, quota);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_purchase_storage() {
        let mut scenario = test_scenario::begin(USER1);

        // 1. Create initial quota for USER1
        next_tx(&mut scenario, USER1);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };

        // 2. Mint some SUI for USER1 to pay for storage
        let initial_sui_balance = 10_000_000; // Example: 10 SUI (assuming 8 decimals)
        let mut payment_coin = mint_coin<SUI>(initial_sui_balance, ctx(&mut scenario));

        // 3. Purchase storage
        next_tx(&mut scenario, USER1);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let bytes_to_buy: u64 = 2 * 1024 * 1024; // Buy 2 MiB
            let expected_cost: u64 = 2; // Cost is 1 SUI per MiB

            storage::purchase_storage(
                &mut quota,
                &mut payment_coin,
                bytes_to_buy,
                ctx(&mut scenario)
            );

            // Verify quota update
            assert!(storage::bytes_available(&quota) == bytes_to_buy, 104);
            assert!(storage::bytes_used(&quota) == 0, 105); // Used bytes shouldn't change

            // Verify payment coin balance reduction
            assert!(coin::value(&payment_coin) == initial_sui_balance - expected_cost, 106);

            test_scenario::return_to_sender(&scenario, quota);
        };

        // Cleanup payment coin
        burn_coin(payment_coin);

        test_scenario::end(scenario);
    }

    #[test]
    fun test_consume_storage() {
        let mut scenario = test_scenario::begin(USER1);

        // 1. Create quota and purchase some storage (e.g., 5 MiB)
        next_tx(&mut scenario, USER1);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        let initial_sui_balance = 10_000_000;
        let mut payment_coin = mint_coin<SUI>(initial_sui_balance, ctx(&mut scenario));
        let initial_bytes: u64 = 5 * 1024 * 1024;
        // Removed unused purchase_cost variable

        next_tx(&mut scenario, USER1);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            storage::purchase_storage(&mut quota, &mut payment_coin, initial_bytes, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
        };

        // 2. Consume some storage (e.g., 3 MiB)
        next_tx(&mut scenario, USER1);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let bytes_to_consume: u64 = 3 * 1024 * 1024;

            storage::consume_storage(&mut quota, bytes_to_consume);

            // Verify quota update
            assert!(storage::bytes_available(&quota) == initial_bytes - bytes_to_consume, 107);
            assert!(storage::bytes_used(&quota) == bytes_to_consume, 108);

            test_scenario::return_to_sender(&scenario, quota);
        };

        // Cleanup payment coin
        burn_coin(payment_coin);

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = storage::EInsufficientStorage)]
    fun test_consume_storage_insufficient() {
        let mut scenario = test_scenario::begin(USER1);

        // 1. Create quota and purchase some storage (e.g., 1 MiB)
        next_tx(&mut scenario, USER1);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        let initial_sui_balance = 10_000_000;
        let mut payment_coin = mint_coin<SUI>(initial_sui_balance, ctx(&mut scenario));
        let initial_bytes: u64 = 1 * 1024 * 1024;
        // Removed unused purchase_cost variable

        next_tx(&mut scenario, USER1);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            storage::purchase_storage(&mut quota, &mut payment_coin, initial_bytes, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
        };

        // 2. Attempt to consume more storage than available (e.g., 2 MiB)
        next_tx(&mut scenario, USER1);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let bytes_to_consume: u64 = 2 * 1024 * 1024;

            // This call is expected to abort
            storage::consume_storage(&mut quota, bytes_to_consume);

            // Code below should not execute, return quota to prevent state leak if it somehow did
            test_scenario::return_to_sender(&scenario, quota);
        };

        // Cleanup payment coin (might not be reached if test aborts as expected)
        burn_coin(payment_coin);

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = ENotImplemented)]
    fun test_walgit_dapp_fail() {
        abort ENotImplemented
    }
}
