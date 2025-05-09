#[test_only]
#[allow(unused_use, duplicate_alias, unused_const)]
module walgit::reference_tests {
    use sui::test_scenario::{Self, next_tx, ctx};
    use std::string;
    use sui::coin::{mint_for_testing as mint_coin, burn_for_testing as burn_coin};
    use sui::sui::SUI;
    use walgit::storage::{Self as storage, StorageQuota};
    use walgit::git_repository::{Self as repository, GitRepository as Repository};
    use walgit::git_reference::{Self as reference, GitReferenceCollection, GitReference};
    use walgit::git_commit_object::{Self as commit, GitCommitObject as Commit};
    use walgit::git_tree_object::{Self as tree, GitTreeObject};
    use sui::object;
    use sui::transfer::public_share_object;
    use std::option;

    const ADMIN: address = @0x495ca410a2e2e83fe2e390ec0b8e0a25392a07b5c53e916c210ab050b5d49253;
    const USER1: address = @0xB;

    #[test]
    fun test_create_reference_collection() {
        let mut scenario = test_scenario::begin(ADMIN);

        // 1. Initialize storage quota
        next_tx(&mut scenario, ADMIN);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };

        // 2. Purchase storage
        next_tx(&mut scenario, ADMIN);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(1_000_000, ctx(&mut scenario)); // Mint 1 SUI
            storage::purchase_storage(&mut quota, &mut payment, 5 * 1024 * 1024, ctx(&mut scenario)); // 5 MiB
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment);
        };

        // 3. Create repository
        next_tx(&mut scenario, ADMIN);
        {
            let mut admin_quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"test-repo"),
                string::utf8(b"A test repository"),
                string::utf8(b"main"), // default_branch
                &mut admin_quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, admin_quota);
        };

        // 4. Initialize references collection
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let repo_id = object::id(&repo);
            
            // Create reference collection
            let refs = reference::init_references(
                repo_id,
                string::utf8(b"main"),
                ctx(&mut scenario)
            );
            
            // Verify initial state
            assert!(reference::get_head_name(&refs) == string::utf8(b"main"), 1);
            
            // Share the reference collection
            public_share_object(refs);
            
            test_scenario::return_shared(repo);
        };
        
        // 5. Verify reference collection exists
        next_tx(&mut scenario, ADMIN);
        {
            let refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            assert!(reference::get_head_name(&refs) == string::utf8(b"main"), 2);
            test_scenario::return_shared(refs);
        };

        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_create_branches() {
        let mut scenario = test_scenario::begin(ADMIN);

        // 1. Set up repository and commit
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
        
        // 2. Create a test tree and commit to reference
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            
            // Create a tree
            let test_tree = tree::create(
                string::utf8(b"test-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create a commit
            let test_commit = commit::create(
                object::id(&test_tree),
                option::none(), // No parent commit
                string::utf8(b"Initial commit"),
                string::utf8(b"commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(test_tree);
            public_share_object(test_commit);
            
            test_scenario::return_shared(repo);
        };
        
        // 3. Initialize references and create branches
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let commit_obj = test_scenario::take_shared<Commit>(&scenario);
            let repo_id = object::id(&repo);
            let commit_id = object::id(&commit_obj);
            
            // Create reference collection
            let mut refs = reference::init_references(
                repo_id,
                string::utf8(b"main"),
                ctx(&mut scenario)
            );
            
            // Create main branch
            reference::create_branch(
                &mut refs,
                string::utf8(b"main"),
                commit_id,
                repo_id,
                ctx(&mut scenario)
            );
            
            // Create a development branch
            reference::create_branch(
                &mut refs,
                string::utf8(b"develop"),
                commit_id,
                repo_id,
                ctx(&mut scenario)
            );
            
            // Check branch creation
            assert!(reference::branch_exists(&refs, string::utf8(b"main")), 3);
            assert!(reference::branch_exists(&refs, string::utf8(b"develop")), 4);
            
            // Share the reference collection
            public_share_object(refs);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(commit_obj);
        };
        
        // 4. Check branches and head reference
        next_tx(&mut scenario, ADMIN);
        {
            let refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            let main_ref = test_scenario::take_shared<GitReference>(&scenario);
            let develop_ref = test_scenario::take_shared<GitReference>(&scenario);
            
            // Verify the references exist
            assert!(reference::reference_name(&main_ref) == string::utf8(b"main")
                || reference::reference_name(&develop_ref) == string::utf8(b"main"), 5);
            
            assert!(reference::reference_name(&main_ref) == string::utf8(b"develop")
                || reference::reference_name(&develop_ref) == string::utf8(b"develop"), 6);
            
            // Verify that main is the HEAD reference
            assert!(reference::get_head_name(&refs) == string::utf8(b"main"), 7);
            
            // Verify reference types
            assert!(reference::is_branch(&main_ref) || reference::is_branch(&develop_ref), 8);
            
            // Return the objects
            test_scenario::return_shared(refs);
            test_scenario::return_shared(main_ref);
            test_scenario::return_shared(develop_ref);
        };
        
        test_scenario::end(scenario);
    }
    
    #[test]
    fun test_create_tag_and_change_head() {
        let mut scenario = test_scenario::begin(ADMIN);

        // 1. Set up repository and commit
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
        
        // 2. Create a test tree and commit to reference
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            
            // Create a tree
            let test_tree = tree::create(
                string::utf8(b"test-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create a commit
            let test_commit = commit::create(
                object::id(&test_tree),
                option::none(), // No parent commit
                string::utf8(b"Initial commit"),
                string::utf8(b"commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(test_tree);
            public_share_object(test_commit);
            
            test_scenario::return_shared(repo);
        };
        
        // 3. Initialize references, create branches and tag
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let commit_obj = test_scenario::take_shared<Commit>(&scenario);
            let repo_id = object::id(&repo);
            let commit_id = object::id(&commit_obj);
            
            // Create reference collection
            let mut refs = reference::init_references(
                repo_id,
                string::utf8(b"main"),
                ctx(&mut scenario)
            );
            
            // Create main branch
            reference::create_branch(
                &mut refs,
                string::utf8(b"main"),
                commit_id,
                repo_id,
                ctx(&mut scenario)
            );
            
            // Create develop branch
            reference::create_branch(
                &mut refs,
                string::utf8(b"develop"),
                commit_id,
                repo_id,
                ctx(&mut scenario)
            );
            
            // Create a tag
            reference::create_tag(
                &mut refs,
                string::utf8(b"v1.0.0"),
                commit_id,
                repo_id,
                string::utf8(b"First stable release"),
                ctx(&mut scenario)
            );
            
            // Check tag creation
            assert!(reference::tag_exists(&refs, string::utf8(b"v1.0.0")), 9);
            
            // Share the reference collection
            public_share_object(refs);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(commit_obj);
        };
        
        // 4. Change HEAD to develop branch
        next_tx(&mut scenario, ADMIN);
        {
            let mut refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            
            // Change HEAD to develop branch
            reference::change_head(
                &mut refs,
                string::utf8(b"develop")
            );
            
            // Verify HEAD changed
            assert!(reference::get_head_name(&refs) == string::utf8(b"develop"), 10);
            
            test_scenario::return_shared(refs);
        };
        
        // 5. Verify tag and branches
        next_tx(&mut scenario, ADMIN);
        {
            let refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            // Need to take all references to verify they exist - main, develop and tag
            let ref1 = test_scenario::take_shared<GitReference>(&scenario);
            let ref2 = test_scenario::take_shared<GitReference>(&scenario);
            let ref3 = test_scenario::take_shared<GitReference>(&scenario);
            
            // Just verify that all references exist without needing to identify each one specifically
            // We've already verified tag and branch existence above
            assert!(reference::branch_exists(&refs, string::utf8(b"main")), 11);
            assert!(reference::branch_exists(&refs, string::utf8(b"develop")), 12);
            assert!(reference::tag_exists(&refs, string::utf8(b"v1.0.0")), 13);
            
            // Verify HEAD is develop
            assert!(reference::get_head_name(&refs) == string::utf8(b"develop"), 14);
            
            // Return all objects
            test_scenario::return_shared(refs);
            test_scenario::return_shared(ref1);
            test_scenario::return_shared(ref2);
            test_scenario::return_shared(ref3);
        };
        
        test_scenario::end(scenario);
    }
}
