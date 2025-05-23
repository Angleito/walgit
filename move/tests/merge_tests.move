#[test_only]
#[allow(unused_use, duplicate_alias)]
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
    
    const ADMIN: address = @0x495ca410a2e2e83fe2e390ec0b8e0a25392a07b5c53e916c210ab050b5d49253;
    
    // Merge strategy constants (from git_merge.move)
    const MERGE_STRATEGY_FAST_FORWARD: u8 = 1;
    const MERGE_STRATEGY_RECURSIVE: u8 = 2;
    const MERGE_STRATEGY_OURS: u8 = 3;
    const MERGE_STRATEGY_THEIRS: u8 = 4;
    
    // Resolution strategy constants
    const RESOLUTION_OURS: u8 = 1;
    const RESOLUTION_THEIRS: u8 = 2;
    const RESOLUTION_MANUAL: u8 = 3;
    
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
                RESOLUTION_OURS, // Resolve using "ours" strategy
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
    
    #[test]
    fun test_ours_merge_strategy() {
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
        
        // 4. Create another branch from base for main branch development
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let base_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Create a tree for the main branch
            let main_tree = tree::create(
                string::utf8(b"main-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create main branch commit with base commit as parent
            let main_commit = commit::create(
                object::id(&main_tree),
                option::some(object::id(&base_commit)), // Parent is base commit
                string::utf8(b"Main branch commit"),
                string::utf8(b"main-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(main_tree);
            public_share_object(main_commit);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(base_commit);
        };
        
        // 5. Perform merge with 'ours' strategy (should auto-resolve in favor of main branch)
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            let main_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Merge feature into main with 'ours' strategy
            let merge_result = merge::merge(
                &feature_commit, // Source commit (feature)
                &main_commit,    // Target commit (main)
                MERGE_STRATEGY_OURS, // Use 'ours' strategy to auto-resolve
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Verify merge was successful (auto-resolved)
            assert!(merge::is_success(&merge_result), 14);
            assert!(merge::has_conflicts(&merge_result), 15); // Conflicts were detected but auto-resolved
            assert!(merge::conflict_count(&merge_result) == 1, 16);
            
            // Verify result commit ID uses main commit (ours)
            let result_commit_id_opt = merge::result_commit_id(&merge_result);
            assert!(option::is_some(result_commit_id_opt), 17);
            assert!(option::borrow(result_commit_id_opt) == &object::id(&main_commit), 18);
            
            // Check that merge strategy is correctly stored
            assert!(merge::strategy(&merge_result) == MERGE_STRATEGY_OURS, 19);
            
            // Share the merge result
            public_share_object(merge_result);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(feature_commit);
            test_scenario::return_shared(main_commit);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_theirs_merge_strategy() {
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
        
        // 4. Create another branch from base for main branch development
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let base_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Create a tree for the main branch
            let main_tree = tree::create(
                string::utf8(b"main-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create main branch commit with base commit as parent
            let main_commit = commit::create(
                object::id(&main_tree),
                option::some(object::id(&base_commit)), // Parent is base commit
                string::utf8(b"Main branch commit"),
                string::utf8(b"main-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(main_tree);
            public_share_object(main_commit);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(base_commit);
        };
        
        // 5. Perform merge with 'theirs' strategy (should auto-resolve in favor of feature branch)
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            let main_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Merge feature into main with 'theirs' strategy
            let merge_result = merge::merge(
                &feature_commit, // Source commit (feature)
                &main_commit,    // Target commit (main)
                MERGE_STRATEGY_THEIRS, // Use 'theirs' strategy to auto-resolve
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Verify merge was successful (auto-resolved)
            assert!(merge::is_success(&merge_result), 20);
            assert!(merge::has_conflicts(&merge_result), 21); // Conflicts were detected but auto-resolved
            assert!(merge::conflict_count(&merge_result) == 1, 22);
            
            // Verify result commit ID uses feature commit (theirs)
            let result_commit_id_opt = merge::result_commit_id(&merge_result);
            assert!(option::is_some(result_commit_id_opt), 23);
            assert!(option::borrow(result_commit_id_opt) == &object::id(&feature_commit), 24);
            
            // Check that merge strategy is correctly stored
            assert!(merge::strategy(&merge_result) == MERGE_STRATEGY_THEIRS, 25);
            
            // Share the merge result
            public_share_object(merge_result);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(feature_commit);
            test_scenario::return_shared(main_commit);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_create_merged_tree_and_commit() {
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
        
        // 4. Create another branch from base for main branch development
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let base_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Create a tree for the main branch
            let main_tree = tree::create(
                string::utf8(b"main-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create main branch commit with base commit as parent
            let main_commit = commit::create(
                object::id(&main_tree),
                option::some(object::id(&base_commit)), // Parent is base commit
                string::utf8(b"Main branch commit"),
                string::utf8(b"main-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(main_tree);
            public_share_object(main_commit);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(base_commit);
        };
        
        // 5. Perform recursive merge
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            let main_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Merge feature into main with recursive strategy
            let merge_result = merge::merge(
                &feature_commit, // Source commit (feature)
                &main_commit,    // Target commit (main)
                MERGE_STRATEGY_RECURSIVE,
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Share the merge result
            public_share_object(merge_result);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(feature_commit);
            test_scenario::return_shared(main_commit);
        };
        
        // 6. Resolve conflicts and create merged tree
        next_tx(&mut scenario, ADMIN);
        {
            let mut merge_result = test_scenario::take_shared<MergeResult>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            let main_commit = test_scenario::take_shared<Commit>(&scenario);
            let feature_tree = test_scenario::take_shared<GitTreeObject>(&scenario);
            let main_tree = test_scenario::take_shared<GitTreeObject>(&scenario);
            
            // Resolve the conflict
            merge::resolve_conflict(
                &mut merge_result,
                string::utf8(b"README.md"), // Path with conflict
                RESOLUTION_MANUAL, // Resolve manually
                ctx(&mut scenario)
            );
            
            // Create a merged tree based on the resolution
            let merged_tree = merge::create_merged_tree(
                &merge_result,
                &feature_tree,
                &main_tree,
                ctx(&mut scenario)
            );
            
            // Create a merge commit
            let merge_commit = merge::create_merge_commit(
                &merge_result,
                &merged_tree,
                ctx(&mut scenario)
            );
            
            // Verify the merge commit has the right tree and parent
            assert!(commit::tree_id(&merge_commit) == object::id(&merged_tree), 26);
            assert!(commit::has_parent(&merge_commit), 27);
            assert!(option::borrow(commit::parent_commit_id(&merge_commit)) == &object::id(&main_commit), 28);
            
            // Share the new objects
            public_share_object(merged_tree);
            public_share_object(merge_commit);
            
            test_scenario::return_shared(merge_result);
            test_scenario::return_shared(feature_commit);
            test_scenario::return_shared(main_commit);
            test_scenario::return_shared(feature_tree);
            test_scenario::return_shared(main_tree);
        };
        
        test_scenario::end(scenario);
    }
}