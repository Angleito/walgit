#[test_only]
module walgit::walgittests {
    use sui::test_scenario::{Self, next_tx, ctx}; // Used by all tests
    use std::string; // Used by all tests

    const ADMIN: address = @0xA;
    const ENotImplemented: u64 = 1;

    #[test]
    fun test_create_repository() {
        use walgit::repository::{Self as repository, Repository};

        let mut scenario = test_scenario::begin(ADMIN);
        let name = string::utf8(b"test-repo");
        let description = string::utf8(b"A test repository");
        let blob_id = string::utf8(b"blob123");

        // Execute the create_repository function
        next_tx(&mut scenario, ADMIN);
        {
            repository::create_repository(
                name,
                description,
                blob_id,
                ctx(&mut scenario)
            );
        };

        // Check if Repository object exists and has correct owner
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            assert!(repository::owner(&repo) == ADMIN, 4);
            assert!(repository::walrus_blob_id(&repo) == string::utf8(b"blob123"), 5);
            test_scenario::return_shared(repo);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_commit() {
        use walgit::repository::{Self as repository, Repository};
        use walgit::commit::{Self as commit, Commit};
        use sui::clock;

        let mut scenario = test_scenario::begin(ADMIN);
        let name = string::utf8(b"test-repo");
        let description = string::utf8(b"A test repository");
        let repo_blob_id = string::utf8(b"repo_blob1");

        // 1. Create Repository first
        next_tx(&mut scenario, ADMIN);
        {
            repository::create_repository(
                name,
                description,
                repo_blob_id,
                ctx(&mut scenario)
            );
        };

        // 2. Get created repository and create clock
        next_tx(&mut scenario, ADMIN);
        {
            let repo = test_scenario::take_shared<Repository>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));
            let message = string::utf8(b"Initial commit");
            let commit_blob_id = string::utf8(b"commit_blob1");

            commit::create_commit(
                &repo,
                message,
                commit_blob_id,
                option::none(),
                &clock,
                ctx(&mut scenario)
            );

            clock::destroy_for_testing(clock);
            test_scenario::return_shared(repo);
        };

        // Check if Commit object exists
        next_tx(&mut scenario, ADMIN);
        {
            let commit_obj = test_scenario::take_shared<Commit>(&scenario);
            assert!(commit::author(&commit_obj) == ADMIN, 14);
            assert!(commit::walrus_blob_id(&commit_obj) == string::utf8(b"commit_blob1"), 15);
            test_scenario::return_shared(commit_obj);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = ENotImplemented)]
    fun test_walgit_dapp_fail() {
        abort ENotImplemented
    }
}
