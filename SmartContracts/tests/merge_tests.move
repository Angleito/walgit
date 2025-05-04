#[test_only]
module walgit::merge_tests {
    use sui::test_scenario::{Self, next_tx, ctx};
    use std::string;
    use sui::coin::{mint_for_testing as mint_coin, burn_for_testing as burn_coin};
    use sui::sui::SUI;
    use walgit::storage::{Self as storage, StorageQuota};
    use walgit::git_repository::{Self as repository, GitRepository as Repository};
    use walgit::git_commit_object::{Self as commit, GitCommitObject as Commit};
    use walgit::git_tree_object::{Self as tree, GitTreeObject};
    use walgit::git_merge::{Self as merge, MergeResult};
    use sui::object;
    use sui::transfer::public_share_object;
    use std::option;
    
    const ADMIN: address = @0xA;
    
    // Merge strategy constants (from git_merge.move)
    const MERGE_STRATEGY_FAST_FORWARD: u8 = 1;
    const MERGE_STRATEGY_RECURSIVE: u8 = 2;
    
    #[test]
    fun test_fast_forward_merge() {
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
        
        // 2. Create a tree and base commit
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            
            // Create a tree for the base commit
            let base_tree = tree::create(
                string::utf8(b"base-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create base commit (parent)
            let base_commit = commit::create(
                object::id(&base_tree),
                option::none(), // No parent commit
                string::utf8(b"Base commit"),
                string::utf8(b"base-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(base_tree);
            public_share_object(base_commit);
            
            test_scenario::return_shared(repo);
        };
        
        // 3. Create a feature branch commit
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let base_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Create a tree for the feature branch
            let feature_tree = tree::create(
                string::utf8(b"feature-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create feature commit with base commit as parent
            let feature_commit = commit::create(
                object::id(&feature_tree),
                option::some(object::id(&base_commit)), // Parent is base commit
                string::utf8(b"Feature commit"),
                string::utf8(b"feature-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(feature_tree);
            public_share_object(feature_commit);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(base_commit);
        };
        
        // 4. Perform fast-forward merge
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let base_commit = test_scenario::take_shared<Commit>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Perform fast-forward merge (feature into base)
            let merge_result = merge::merge(
                &feature_commit, // Source commit (feature)
                &base_commit,    // Target commit (base/main)
                MERGE_STRATEGY_FAST_FORWARD,
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Verify merge was successful
            assert!(merge::is_success(&merge_result), 1);
            assert!(!merge::has_conflicts(&merge_result), 2);
            assert!(merge::conflict_count(&merge_result) == 0, 3);
            
            // Verify result commit ID is the feature commit
            let result_commit_id_opt = merge::result_commit_id(&merge_result);
            assert!(option::is_some(result_commit_id_opt), 4);
            assert!(option::borrow(result_commit_id_opt) == &object::id(&feature_commit), 5);
            
            // Share the merge result
            public_share_object(merge_result);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(base_commit);
            test_scenario::return_shared(feature_commit);
        };
        
        // 5. Verify merge result
        next_tx(&mut scenario, ADMIN);
        {
            let merge_result = test_scenario::take_shared<MergeResult>(&scenario);
            
            // Confirm merge properties
            assert!(merge::is_success(&merge_result), 6);
            assert!(!merge::has_conflicts(&merge_result), 7);
            
            test_scenario::return_shared(merge_result);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_merge_with_conflicts() {
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
        
        // 2. Create a tree and base commit
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            
            // Create a tree for the base commit
            let base_tree = tree::create(
                string::utf8(b"base-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create base commit (parent)
            let base_commit = commit::create(
                object::id(&base_tree),
                option::none(), // No parent commit
                string::utf8(b"Base commit"),
                string::utf8(b"base-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(base_tree);
            public_share_object(base_commit);
            
            test_scenario::return_shared(repo);
        };
        
        // 3. Create a feature branch commit
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let base_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Create a tree for the feature branch
            let feature_tree = tree::create(
                string::utf8(b"feature-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create feature commit with base commit as parent
            let feature_commit = commit::create(
                object::id(&feature_tree),
                option::some(object::id(&base_commit)), // Parent is base commit
                string::utf8(b"Feature commit"),
                string::utf8(b"feature-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(feature_tree);
            public_share_object(feature_commit);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(base_commit);
        };
        
        // 4. Perform recursive merge to simulate conflicts
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let base_commit = test_scenario::take_shared<Commit>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Perform recursive merge (feature into base)
            let merge_result = merge::merge(
                &feature_commit, // Source commit (feature)
                &base_commit,    // Target commit (base/main)
                MERGE_STRATEGY_RECURSIVE, // Will cause conflict in our implementation
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Verify merge has conflicts
            assert!(!merge::is_success(&merge_result), 8);
            assert!(merge::has_conflicts(&merge_result), 9);
            assert!(merge::conflict_count(&merge_result) == 1, 10); // Should have one conflict
            
            // Share the merge result
            public_share_object(merge_result);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(base_commit);
            test_scenario::return_shared(feature_commit);
        };
        
        // 5. Resolve conflict
        next_tx(&mut scenario, ADMIN);
        {
            let mut merge_result = test_scenario::take_shared<MergeResult>(&scenario);
            
            // Resolve the conflict
            merge::resolve_conflict(
                &mut merge_result,
                string::utf8(b"README.md"), // Path with conflict
                1, // Resolve using "ours" strategy
                ctx(&mut scenario)
            );
            
            // Verify conflict is resolved
            assert!(merge::is_success(&merge_result), 11);
            assert!(!merge::has_conflicts(&merge_result), 12);
            assert!(merge::conflict_count(&merge_result) == 0, 13);
            
            test_scenario::return_shared(merge_result);
        };
        
        test_scenario::end(scenario);
    }
}
