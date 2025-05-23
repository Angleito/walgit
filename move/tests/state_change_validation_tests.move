#[test_only]
#[allow(unused_use, duplicate_alias)]
module walgit::state_change_validation_tests {
    use sui::test_scenario::{Self, next_tx, ctx};
    use std::string;
    use sui::coin::{Self, mint_for_testing as mint_coin, burn_for_testing as burn_coin};
    use sui::sui::SUI;
    use walgit::storage::{Self as storage, StorageQuota};
    use walgit::git_repository::{Self as repository, Repo, OwnerCap, WriteCap};
    use sui::clock;

    // Test addresses
    const OWNER: address = @0x495ca410a2e2e83fe2e390ec0b8e0a25392a07b5c53e916c210ab050b5d49253;
    const COLLABORATOR1: address = @0x123456789abcdef;
    const COLLABORATOR2: address = @0x987654321fedcba;

    // Role constants
    const ROLE_READER: u8 = 1;
    const ROLE_WRITER: u8 = 2;
    const ROLE_ADMIN: u8 = 3;

    /// Test complete repository lifecycle state changes
    #[test]
    fun test_repository_lifecycle_state_changes() {
        let mut scenario = test_scenario::begin(OWNER);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initial state: Setup storage
        setup_storage_quota(&mut scenario, OWNER);
        
        // State 1: Create repository
        next_tx(&mut scenario, OWNER);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"lifecycle-repo"),
                string::utf8(b"Repository for lifecycle testing"),
                string::utf8(b"initial_commit_cid"),
                string::utf8(b"initial_dek_cid"),
                string::utf8(b"seal_policy_lifecycle"),
                string::utf8(b"main"),
                &mut quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, quota);
        };

        // Verify initial state
        next_tx(&mut scenario, OWNER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            
            assert!(repository::name(&repo) == string::utf8(b"lifecycle-repo"), 1);
            assert!(repository::owner(&repo) == OWNER, 2);
            assert!(repository::latest_commit_manifest_cid(&repo) == string::utf8(b"initial_commit_cid"), 3);
            assert!(repository::default_branch(&repo) == string::utf8(b"main"), 4);
            
            test_scenario::return_shared(repo);
        };

        // State 2: Add collaborators
        add_collaborator(&mut scenario, OWNER, COLLABORATOR1, ROLE_WRITER);
        add_collaborator(&mut scenario, OWNER, COLLABORATOR2, ROLE_READER);

        // Verify collaborator state
        next_tx(&mut scenario, OWNER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            
            assert!(repository::get_collaborator_role(&repo, COLLABORATOR1) == option::some(ROLE_WRITER), 5);
            assert!(repository::get_collaborator_role(&repo, COLLABORATOR2) == option::some(ROLE_READER), 6);
            
            test_scenario::return_shared(repo);
        };

        // State 3: Update commit (by writer)
        next_tx(&mut scenario, COLLABORATOR1);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let write_cap = test_scenario::take_from_sender<WriteCap>(&scenario);
            
            repository::update_commit(
                &mut repo, 
                &write_cap, 
                string::utf8(b"updated_commit_cid"), 
                string::utf8(b"updated_dek_cid"), 
                ctx(&mut scenario)
            );
            
            assert!(repository::latest_commit_manifest_cid(&repo) == string::utf8(b"updated_commit_cid"), 7);
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, write_cap);
        };

        // State 4: Modify collaborator permissions
        next_tx(&mut scenario, OWNER);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(&scenario);
            
            // Promote reader to writer
            repository::update_collaborator_role(&mut repo, &owner_cap, COLLABORATOR2, ROLE_WRITER, ctx(&mut scenario));
            
            assert!(repository::get_collaborator_role(&repo, COLLABORATOR2) == option::some(ROLE_WRITER), 8);
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, owner_cap);
        };

        // State 5: Remove collaborator
        next_tx(&mut scenario, OWNER);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(&scenario);
            
            repository::remove_collaborator(&mut repo, &owner_cap, COLLABORATOR1, ctx(&mut scenario));
            
            assert!(repository::get_collaborator_role(&repo, COLLABORATOR1) == option::none(), 9);
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, owner_cap);
        };

        clock::destroy_for_testing(clock);
        test_scenario::end(scenario);
    }

    /// Test concurrent state modifications
    #[test]
    fun test_concurrent_state_modifications() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository with multiple writers
        setup_repository_with_collaborators(&mut scenario, OWNER);
        
        // Writer 1 updates commit
        next_tx(&mut scenario, COLLABORATOR1);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let write_cap = test_scenario::take_from_sender<WriteCap>(&scenario);
            
            repository::update_commit(
                &mut repo, 
                &write_cap, 
                string::utf8(b"commit_by_writer1"), 
                string::utf8(b"dek_by_writer1"), 
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, write_cap);
        };

        // Verify Writer 1's changes
        next_tx(&mut scenario, OWNER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            assert!(repository::latest_commit_manifest_cid(&repo) == string::utf8(b"commit_by_writer1"), 10);
            test_scenario::return_shared(repo);
        };

        // Writer 2 updates commit (simulating sequential commits)
        next_tx(&mut scenario, COLLABORATOR2);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let write_cap = test_scenario::take_from_sender<WriteCap>(&scenario);
            
            repository::update_commit(
                &mut repo, 
                &write_cap, 
                string::utf8(b"commit_by_writer2"), 
                string::utf8(b"dek_by_writer2"), 
                ctx(&mut scenario)
            );
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, write_cap);
        };

        // Verify Writer 2's changes overwrote Writer 1's (last write wins)
        next_tx(&mut scenario, OWNER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            assert!(repository::latest_commit_manifest_cid(&repo) == string::utf8(b"commit_by_writer2"), 11);
            test_scenario::return_shared(repo);
        };

        test_scenario::end(scenario);
    }

    /// Test storage quota state changes during repository operations
    #[test]
    fun test_storage_quota_state_changes() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Initial storage state
        next_tx(&mut scenario, OWNER);
        {
            storage::create_storage_quota(ctx(&mut scenario));
        };
        
        next_tx(&mut scenario, OWNER);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(10_000_000, ctx(&mut scenario));
            
            // Purchase initial storage
            storage::purchase_storage(&mut quota, &mut payment, 5 * 1024 * 1024, ctx(&mut scenario));
            
            // Verify initial quota state
            assert!(storage::bytes_available(&quota) == 5 * 1024 * 1024, 12);
            assert!(storage::bytes_used(&quota) == 0, 13);
            
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment);
        };

        // Create repository (consumes storage)
        next_tx(&mut scenario, OWNER);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let initial_available = storage::bytes_available(&quota);
            
            repository::create_repository(
                string::utf8(b"storage-test-repo"),
                string::utf8(b"Testing storage consumption"),
                string::utf8(b"commit_cid"),
                string::utf8(b"dek_cid"),
                string::utf8(b"seal_policy"),
                string::utf8(b"main"),
                &mut quota,
                ctx(&mut scenario)
            );
            
            // Verify storage was consumed
            assert!(storage::bytes_available(&quota) < initial_available, 14);
            assert!(storage::bytes_used(&quota) > 0, 15);
            
            test_scenario::return_to_sender(&scenario, quota);
        };

        // Purchase additional storage
        next_tx(&mut scenario, OWNER);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            let mut payment = mint_coin<SUI>(5_000_000, ctx(&mut scenario));
            let before_available = storage::bytes_available(&quota);
            
            storage::purchase_storage(&mut quota, &mut payment, 3 * 1024 * 1024, ctx(&mut scenario));
            
            // Verify storage increased
            assert!(storage::bytes_available(&quota) == before_available + 3 * 1024 * 1024, 16);
            
            test_scenario::return_to_sender(&scenario, quota);
            burn_coin(payment);
        };

        test_scenario::end(scenario);
    }

    /// Test table state consistency for collaborators
    #[test]
    fun test_collaborator_table_state_consistency() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository
        setup_repository(&mut scenario, OWNER);
        
        // Add multiple collaborators in sequence
        let collaborators = vector[
            (@0x111111111111111, ROLE_READER),
            (@0x222222222222222, ROLE_WRITER),
            (@0x333333333333333, ROLE_ADMIN),
            (@0x444444444444444, ROLE_READER),
            (@0x555555555555555, ROLE_WRITER)
        ];

        let mut i = 0;
        while (i < vector::length(&collaborators)) {
            let (addr, role) = *vector::borrow(&collaborators, i);
            add_collaborator(&mut scenario, OWNER, addr, role);
            i = i + 1;
        };

        // Verify all collaborators are stored correctly
        next_tx(&mut scenario, OWNER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            
            let mut j = 0;
            while (j < vector::length(&collaborators)) {
                let (addr, expected_role) = *vector::borrow(&collaborators, j);
                assert!(repository::get_collaborator_role(&repo, addr) == option::some(expected_role), 17 + j);
                j = j + 1;
            };
            
            test_scenario::return_shared(repo);
        };

        // Remove every other collaborator
        next_tx(&mut scenario, OWNER);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(&scenario);
            
            repository::remove_collaborator(&mut repo, &owner_cap, @0x222222222222222, ctx(&mut scenario));
            repository::remove_collaborator(&mut repo, &owner_cap, @0x444444444444444, ctx(&mut scenario));
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, owner_cap);
        };

        // Verify state consistency after removals
        next_tx(&mut scenario, OWNER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            
            assert!(repository::get_collaborator_role(&repo, @0x111111111111111) == option::some(ROLE_READER), 22);
            assert!(repository::get_collaborator_role(&repo, @0x222222222222222) == option::none(), 23);
            assert!(repository::get_collaborator_role(&repo, @0x333333333333333) == option::some(ROLE_ADMIN), 24);
            assert!(repository::get_collaborator_role(&repo, @0x444444444444444) == option::none(), 25);
            assert!(repository::get_collaborator_role(&repo, @0x555555555555555) == option::some(ROLE_WRITER), 26);
            
            test_scenario::return_shared(repo);
        };

        test_scenario::end(scenario);
    }

    /// Test atomic state transitions
    #[test]
    fun test_atomic_state_transitions() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository
        setup_repository(&mut scenario, OWNER);
        
        // Atomic operation: Update commit and SEAL policy together
        next_tx(&mut scenario, OWNER);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(&scenario);
            
            let initial_commit = repository::latest_commit_manifest_cid(&repo);
            let initial_policy = repository::seal_policy_id(&repo);
            
            // Update both commit and SEAL policy atomically
            repository::update_commit(
                &mut repo, 
                &owner_cap, 
                string::utf8(b"atomic_commit_cid"), 
                string::utf8(b"atomic_dek_cid"), 
                ctx(&mut scenario)
            );
            
            repository::update_seal_policy(
                &mut repo, 
                &owner_cap, 
                string::utf8(b"atomic_seal_policy"), 
                string::utf8(b"atomic_new_dek"), 
                ctx(&mut scenario)
            );
            
            // Verify both changes took effect
            assert!(repository::latest_commit_manifest_cid(&repo) != initial_commit, 27);
            assert!(repository::seal_policy_id(&repo) != initial_policy, 28);
            assert!(repository::seal_policy_id(&repo) == string::utf8(b"atomic_seal_policy"), 29);
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, owner_cap);
        };

        test_scenario::end(scenario);
    }

    /// Helper function to setup storage quota for a user
    fun setup_storage_quota(scenario: &mut test_scenario::Scenario, user: address) {
        next_tx(scenario, user);
        {
            storage::create_storage_quota(ctx(scenario));
        };
        
        next_tx(scenario, user);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(scenario);
            let mut payment = mint_coin<SUI>(10_000_000, ctx(scenario));
            storage::purchase_storage(&mut quota, &mut payment, 10 * 1024 * 1024, ctx(scenario));
            test_scenario::return_to_sender(scenario, quota);
            burn_coin(payment);
        };
    }

    /// Helper function to setup a basic repository
    fun setup_repository(scenario: &mut test_scenario::Scenario, owner: address) {
        setup_storage_quota(scenario, owner);
        
        next_tx(scenario, owner);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(scenario);
            repository::create_repository(
                string::utf8(b"test-repo"),
                string::utf8(b"Test repository"),
                string::utf8(b"initial_commit_cid"),
                string::utf8(b"initial_dek_cid"),
                string::utf8(b"initial_seal_policy"),
                string::utf8(b"main"),
                &mut quota,
                ctx(scenario)
            );
            test_scenario::return_to_sender(scenario, quota);
        };
    }

    /// Helper function to setup repository with collaborators
    fun setup_repository_with_collaborators(scenario: &mut test_scenario::Scenario, owner: address) {
        setup_repository(scenario, owner);
        add_collaborator(scenario, owner, COLLABORATOR1, ROLE_WRITER);
        add_collaborator(scenario, owner, COLLABORATOR2, ROLE_WRITER);
    }

    /// Helper function to add a collaborator
    fun add_collaborator(scenario: &mut test_scenario::Scenario, owner: address, collaborator: address, role: u8) {
        next_tx(scenario, owner);
        {
            let mut repo = test_scenario::take_shared<Repo>(scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(scenario);
            
            repository::add_collaborator(&mut repo, &owner_cap, collaborator, role, ctx(scenario));
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(scenario, owner_cap);
        };
    }
}