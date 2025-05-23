#[test_only]
module walgit::git_diff_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock::{Self, Clock};
    use sui::object::{Self, ID};
    use std::vector;
    use std::string::{Self, String};
    
    use walgit::git_diff::{Self, FileDiffHunk, FileDiffLine, CommitDiff};
    use walgit::git_repository::{Self, Repository};
    use walgit::git_commit_object::{Self, Commit};
    
    // Test setup helper
    fun setup_test(admin: address): Scenario {
        let scenario = ts::begin(admin);
        {
            let ctx = ts::ctx(&mut scenario);
            clock::create_for_testing(ctx);
        };
        scenario
    }
    
    // Test creation of a commit diff
    #[test]
    fun test_create_commit_diff() {
        let admin = @0xA1;
        let scenario = setup_test(admin);
        
        // Test block with repo and commit setup
        ts::next_tx(&mut scenario, admin);
        {
            let clock = ts::take_shared<Clock>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            
            // Create test repository
            let repo = git_repository::create_repository(
                string::utf8(b"test-repo"),
                admin,
                &mut clock,
                ctx
            );
            
            // Create test commit (simplified for testing)
            let commit = git_commit_object::create_commit(
                object::id(&repo),
                object::id_from_address(@0x123), // mock tree ID
                vector::empty<ID>(), // no parent commits
                string::utf8(b"Test commit message"),
                admin,
                &clock,
                ctx
            );
            
            // Create commit diff
            let diff_id = git_diff::create_commit_diff(&repo, &commit, ctx);
            
            // Check that diff was created
            assert!(object::id_to_address(&diff_id) != @0x0, 1);
            
            // Cleanup
            ts::return_shared(clock);
            ts::return_shared(repo);
            ts::return_shared(commit);
        };
        
        // Test adding file diff
        ts::next_tx(&mut scenario, admin);
        {
            let ctx = ts::ctx(&mut scenario);
            let diff = ts::take_shared<CommitDiff>(&scenario);
            
            // Create a test hunk
            let lines = vector::empty<FileDiffLine>();
            
            // Add a few diff lines
            vector::push_back(&mut lines, git_diff::create_added_line(10, string::utf8(b"+ New line 1")));
            vector::push_back(&mut lines, git_diff::create_removed_line(20, string::utf8(b"- Old line 2")));
            
            let hunk = git_diff::create_file_diff_hunk(
                10, 1, 10, 1,
                vector::empty<String>(),
                lines,
                vector::empty<String>()
            );
            
            let hunks = vector::empty<FileDiffHunk>();
            vector::push_back(&mut hunks, hunk);
            
            // Add file diff to commit diff
            let file_diff_id = git_diff::add_file_diff(
                &mut diff,
                string::utf8(b"test-file.txt"),
                hunks,
                false, // not binary
                ctx
            );
            
            // Check that file diff was created
            assert!(object::id_to_address(&file_diff_id) != @0x0, 2);
            
            // Verify that we can get file diffs for the commit diff
            let file_diffs = git_diff::get_file_diffs(&diff);
            assert!(vector::length(&file_diffs) == 1, 3);
            assert!(*vector::borrow(&file_diffs, 0) == file_diff_id, 4);
            
            // Get commit diff stats
            let (files_changed, added, removed, modified) = git_diff::get_commit_diff_stats(&diff);
            assert!(files_changed == 1, 5);
            assert!(added == 1, 6);
            assert!(removed == 1, 7);
            assert!(modified == 0, 8);
            
            // Cleanup
            ts::return_shared(diff);
        };
        
        ts::end(scenario);
    }
}