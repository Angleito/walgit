#[test_only]
module walgit::integration_tests {
    use sui::test_scenario::{Self, next_tx, ctx};
    use std::string;
    use sui::coin::{mint_for_testing as mint_coin, burn_for_testing as burn_coin};
    use sui::sui::SUI;
    use walgit::storage::{Self as storage, StorageQuota};
    use walgit::git_repository::{Self as repository, GitRepository as Repository};
    use walgit::git_commit_object::{Self as commit, GitCommitObject as Commit};
    use walgit::git_tree_object::{Self as tree, GitTreeObject};
    use walgit::git_blob_object::{Self as blob, GitBlobObject};
    use walgit::git_reference::{Self as reference, GitReferenceCollection, GitReference};
    use walgit::git_index::{Self as index, GitIndex};
    use walgit::git_merge::{Self as merge, MergeResult};
    use sui::object;
    use sui::transfer::public_share_object;
    use std::option;
    use std::vector;
    
    const ADMIN: address = @0xA;
    const CONTRIBUTOR: address = @0xB;
    
    // Constants from modules
    const MERGE_STRATEGY_FAST_FORWARD: u8 = 1;
    const FILE_STATUS_ADDED: u8 = 1;
    const FILE_STATUS_MODIFIED: u8 = 2;
    
    #[test]
    fun test_full_git_workflow() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        // 1. Set up storage for both users
        next_tx(&mut scenario, ADMIN);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        
        next_tx(&mut scenario, CONTRIBUTOR);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        
        // 2. Purchase storage
        next_tx(&mut scenario, ADMIN);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(10_000_000, ctx(&mut scenario));
            storage::purchase_storage(&mut quota, &mut payment, 10 * 1024 * 1024, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment);
        };
        
        next_tx(&mut scenario, CONTRIBUTOR);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(10_000_000, ctx(&mut scenario));
            storage::purchase_storage(&mut quota, &mut payment, 10 * 1024 * 1024, ctx(&mut scenario));
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment);
        };
        
        // 3. Create repository
        next_tx(&mut scenario, ADMIN);
        {
            let mut admin_quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"walgit-demo"),
                string::utf8(b"A demonstration repository for WalGit"),
                string::utf8(b"main"),
                &mut admin_quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, admin_quota);
        };
        
        // 4. Initialize references and index
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
            
            // Create index
            let index_obj = index::init_index(
                repo_id,
                option::none(),
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(refs);
            public_share_object(index_obj);
            
            test_scenario::return_shared(repo);
        };
        
        // 5. Create initial files and stage them
        next_tx(&mut scenario, ADMIN);
        {
            // Create blobs for initial files
            let repo = test_scenario::take_shared<Repository>(&scenario);
            
            // Create README blob
            let readme_blob = blob::create(
                111222, // Walrus blob ID
                512, // Size in bytes
                string::utf8(b"readme-hash"),
                0, // encoding
                ctx(&mut scenario)
            );
            
            // Create main code blob
            let main_code_blob = blob::create(
                222333, // Walrus blob ID
                1024, // Size in bytes
                string::utf8(b"main-code-hash"),
                0, // encoding
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(readme_blob);
            public_share_object(main_code_blob);
            
            test_scenario::return_shared(repo);
        };
        
        // 6. Stage the files in the index
        next_tx(&mut scenario, ADMIN);
        {
            let mut index_obj = test_scenario::take_shared<GitIndex>(&scenario);
            
            // Stage README file
            index::stage_file(
                &mut index_obj,
                string::utf8(b"README.md"),
                111222, // Walrus blob ID
                512, // Size in bytes
                string::utf8(b"readme-hash"),
                0644, // File mode
                FILE_STATUS_ADDED,
                ctx(&mut scenario)
            );
            
            // Stage main code file
            index::stage_file(
                &mut index_obj,
                string::utf8(b"src/main.move"),
                222333, // Walrus blob ID
                1024, // Size in bytes
                string::utf8(b"main-code-hash"),
                0644, // File mode
                FILE_STATUS_ADDED,
                ctx(&mut scenario)
            );
            
            // Verify files are staged
            assert!(index::entry_count(&index_obj) == 2, 1);
            assert!(index::is_dirty(&index_obj), 2);
            
            test_scenario::return_shared(index_obj);
        };
        
        // 7. Create a tree structure for the initial commit
        next_tx(&mut scenario, ADMIN);
        {
            let readme_blob = test_scenario::take_shared<GitBlobObject>(&scenario);
            let main_code_blob = test_scenario::take_shared<GitBlobObject>(&scenario);
            
            // Create trees
            let mut root_tree = tree::create(
                string::utf8(b"root-tree-hash"),
                ctx(&mut scenario)
            );
            
            let mut src_tree = tree::create(
                string::utf8(b"src-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Add main.move to src tree
            tree::add_entry(
                &mut src_tree, 
                string::utf8(b"main.move"), 
                0, // ENTRY_TYPE_BLOB
                object::id(&main_code_blob),
                string::utf8(b"main-code-hash"),
                ctx(&mut scenario)
            );
            
            // Add README to root tree
            tree::add_entry(
                &mut root_tree, 
                string::utf8(b"README.md"), 
                0, // ENTRY_TYPE_BLOB
                object::id(&readme_blob),
                string::utf8(b"readme-hash"),
                ctx(&mut scenario)
            );
            
            // Add src tree to root tree
            tree::add_entry(
                &mut root_tree, 
                string::utf8(b"src"), 
                1, // ENTRY_TYPE_TREE
                object::id(&src_tree),
                string::utf8(b"src-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(root_tree);
            public_share_object(src_tree);
            
            test_scenario::return_shared(readme_blob);
            test_scenario::return_shared(main_code_blob);
        };
        
        // 8. Create initial commit
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let root_tree = test_scenario::take_shared<GitTreeObject>(&scenario);
            
            // Create initial commit
            let initial_commit = commit::create(
                object::id(&root_tree),
                option::none(), // No parent
                string::utf8(b"Initial commit"),
                string::utf8(b"initial-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share the commit
            public_share_object(initial_commit);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(root_tree);
        };
        
        // 9. Create main branch and reset index
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let commit_obj = test_scenario::take_shared<Commit>(&scenario);
            let mut index_obj = test_scenario::take_shared<GitIndex>(&scenario);
            
            // Get reference collection
            let mut refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            
            // Create main branch pointing to initial commit
            reference::create_branch(
                &mut refs,
                string::utf8(b"main"),
                object::id(&commit_obj),
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Reset index to match the commit
            index::reset_index(
                &mut index_obj,
                object::id(&commit_obj)
            );
            
            // Verify index is clean
            assert!(!index::is_dirty(&index_obj), 3);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(commit_obj);
            test_scenario::return_shared(index_obj);
            test_scenario::return_shared(refs);
        };
        
        // 10. Contributor creates a feature branch
        next_tx(&mut scenario, CONTRIBUTOR);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let commit_obj = test_scenario::take_shared<Commit>(&scenario);
            let mut refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            
            // Create feature branch based on main branch commit
            reference::create_branch(
                &mut refs,
                string::utf8(b"feature"),
                object::id(&commit_obj),
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Verify branch exists
            assert!(reference::branch_exists(&refs, string::utf8(b"feature")), 4);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(commit_obj);
            test_scenario::return_shared(refs);
        };
        
        // 11. Contributor makes changes on feature branch
        next_tx(&mut scenario, CONTRIBUTOR);
        {
            // Create a new blob for updated README
            let repo = test_scenario::take_shared<Repository>(&scenario);
            
            // Create updated README blob
            let updated_readme_blob = blob::create(
                333444, // New Walrus blob ID
                768, // Size in bytes
                string::utf8(b"updated-readme-hash"),
                0, // encoding
                ctx(&mut scenario)
            );
            
            // Create new feature file blob
            let feature_blob = blob::create(
                444555, // Walrus blob ID
                2048, // Size in bytes
                string::utf8(b"feature-hash"),
                0, // encoding
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(updated_readme_blob);
            public_share_object(feature_blob);
            
            test_scenario::return_shared(repo);
        };
        
        // 12. Create feature branch commit
        next_tx(&mut scenario, CONTRIBUTOR);
        {
            let commit_obj = test_scenario::take_shared<Commit>(&scenario); // initial commit
            let updated_readme_blob = test_scenario::take_shared<GitBlobObject>(&scenario);
            let feature_blob = test_scenario::take_shared<GitBlobObject>(&scenario);
            let src_tree = test_scenario::take_shared<GitTreeObject>(&scenario);
            
            // Create a new root tree for feature branch
            let mut feature_root_tree = tree::create(
                string::utf8(b"feature-root-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Add updated README to root tree
            tree::add_entry(
                &mut feature_root_tree, 
                string::utf8(b"README.md"), 
                0, // ENTRY_TYPE_BLOB
                object::id(&updated_readme_blob),
                string::utf8(b"updated-readme-hash"),
                ctx(&mut scenario)
            );
            
            // Add feature file to root tree
            tree::add_entry(
                &mut feature_root_tree, 
                string::utf8(b"feature.txt"), 
                0, // ENTRY_TYPE_BLOB
                object::id(&feature_blob),
                string::utf8(b"feature-hash"),
                ctx(&mut scenario)
            );
            
            // Add src tree to root tree
            tree::add_entry(
                &mut feature_root_tree, 
                string::utf8(b"src"), 
                1, // ENTRY_TYPE_TREE
                object::id(&src_tree),
                string::utf8(b"src-tree-hash"),
                ctx(&mut scenario)
            );
            
            // Create feature commit
            let feature_commit = commit::create(
                object::id(&feature_root_tree),
                option::some(object::id(&commit_obj)), // Parent is initial commit
                string::utf8(b"Add feature implementation"),
                string::utf8(b"feature-commit-hash"),
                option::none(), // No metadata
                ctx(&mut scenario)
            );
            
            // Share objects
            public_share_object(feature_root_tree);
            public_share_object(feature_commit);
            
            test_scenario::return_shared(commit_obj);
            test_scenario::return_shared(updated_readme_blob);
            test_scenario::return_shared(feature_blob);
            test_scenario::return_shared(src_tree);
        };
        
        // 13. Update reference to feature branch commit
        next_tx(&mut scenario, CONTRIBUTOR);
        {
            let mut refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            let mut feature_ref = test_scenario::take_shared<GitReference>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            
            // Update feature branch reference
            if (reference::reference_name(&feature_ref) == string::utf8(b"feature")) {
                reference::update_branch(
                    &mut refs,
                    string::utf8(b"feature"),
                    &mut feature_ref,
                    object::id(&feature_commit)
                );
            };
            
            test_scenario::return_shared(refs);
            test_scenario::return_shared(feature_ref);
            test_scenario::return_shared(feature_commit);
        };
        
        // 14. Admin merges feature branch into main
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let initial_commit = test_scenario::take_shared<Commit>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            let mut feature_ref = test_scenario::take_shared<GitReference>(&scenario);
            let mut main_ref = test_scenario::take_shared<GitReference>(&scenario);
            
            // We're passing both references to the merge function, and determining which one to use
            // based on the name. We don't need to store the check result in variables.
            
            // Perform merge
            let merge_result = merge::merge(
                &feature_commit, // Source commit (feature)
                &initial_commit, // Target commit (main)
                MERGE_STRATEGY_FAST_FORWARD,
                object::id(&repo),
                ctx(&mut scenario)
            );
            
            // Verify merge was successful
            assert!(merge::is_success(&merge_result), 5);
            assert!(!merge::has_conflicts(&merge_result), 6);
            
            // Share merge result
            public_share_object(merge_result);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(initial_commit);
            test_scenario::return_shared(feature_commit);
            test_scenario::return_shared(feature_ref);
            test_scenario::return_shared(main_ref);
        };
        
        // 15. Update main branch to point to merged result
        next_tx(&mut scenario, ADMIN);
        {
            let mut refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            let mut main_ref = test_scenario::take_shared<GitReference>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            let merge_result = test_scenario::take_shared<MergeResult>(&scenario);
            
            // Get the result commit ID
            let result_id_opt = merge::result_commit_id(&merge_result);
            assert!(option::is_some(result_id_opt), 7);
            
            // Update main branch to point to feature commit
            if (reference::reference_name(&main_ref) == string::utf8(b"main")) {
                reference::update_branch(
                    &mut refs,
                    string::utf8(b"main"),
                    &mut main_ref,
                    object::id(&feature_commit)
                );
            };
            
            test_scenario::return_shared(refs);
            test_scenario::return_shared(main_ref);
            test_scenario::return_shared(feature_commit);
            test_scenario::return_shared(merge_result);
        };
        
        // 16. Create a tag for the release
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let feature_commit = test_scenario::take_shared<Commit>(&scenario);
            let mut refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            
            // Create a tag for v1.0.0
            reference::create_tag(
                &mut refs,
                string::utf8(b"v1.0.0"),
                object::id(&feature_commit),
                object::id(&repo),
                string::utf8(b"First release with feature"),
                ctx(&mut scenario)
            );
            
            // Verify tag exists
            assert!(reference::tag_exists(&refs, string::utf8(b"v1.0.0")), 8);
            
            test_scenario::return_shared(repo);
            test_scenario::return_shared(feature_commit);
            test_scenario::return_shared(refs);
        };
        
        // Verify final state
        next_tx(&mut scenario, ADMIN);
        {
            let refs = test_scenario::take_shared<GitReferenceCollection>(&scenario);
            
            // Verify branches and tags
            assert!(reference::branch_exists(&refs, string::utf8(b"main")), 9);
            assert!(reference::branch_exists(&refs, string::utf8(b"feature")), 10);
            assert!(reference::tag_exists(&refs, string::utf8(b"v1.0.0")), 11);
            
            test_scenario::return_shared(refs);
        };
        
        test_scenario::end(scenario);
    }
}
