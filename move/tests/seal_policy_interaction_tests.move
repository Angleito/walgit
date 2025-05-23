#[test_only]
#[allow(unused_use, duplicate_alias)]
module walgit::seal_policy_interaction_tests {
    use sui::test_scenario::{Self, next_tx, ctx};
    use std::string;
    use sui::coin::{Self, mint_for_testing as mint_coin, burn_for_testing as burn_coin};
    use sui::sui::SUI;
    use walgit::storage::{Self as storage, StorageQuota};
    use walgit::git_repository::{Self as repository, Repo, OwnerCap, WriteCap};

    // Test addresses
    const OWNER: address = @0x495ca410a2e2e83fe2e390ec0b8e0a25392a07b5c53e916c210ab050b5d49253;
    const AUTHORIZED_USER: address = @0x123456789abcdef;
    const UNAUTHORIZED_USER: address = @0x987654321fedcba;

    // Mock SEAL policy IDs for testing
    const VALID_SEAL_POLICY: vector<u8> = b"seal_policy_valid_123";
    const INVALID_SEAL_POLICY: vector<u8> = b"seal_policy_invalid_456";
    const THRESHOLD_POLICY: vector<u8> = b"seal_policy_threshold_789";

    // Role constants
    const ROLE_WRITER: u8 = 2;

    /// Test repository creation with valid SEAL policy
    #[test]
    fun test_create_repository_with_seal_policy() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup storage quota
        setup_storage_quota(&mut scenario, OWNER);
        
        // Create repository with SEAL policy
        next_tx(&mut scenario, OWNER);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"sealed-repo"),
                string::utf8(b"Repository with SEAL encryption"),
                string::utf8(b"initial_commit_cid"),
                string::utf8(b"encrypted_dek_cid_123"),
                string::utf8(VALID_SEAL_POLICY),
                string::utf8(b"main"),
                &mut quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, quota);
        };

        // Verify SEAL policy is stored correctly
        next_tx(&mut scenario, OWNER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            
            assert!(repository::seal_policy_id(&repo) == string::utf8(VALID_SEAL_POLICY), 1);
            assert!(repository::encrypted_dek_cid(&repo) == string::utf8(b"encrypted_dek_cid_123"), 2);
            
            test_scenario::return_shared(repo);
        };

        test_scenario::end(scenario);
    }

    /// Test SEAL policy validation during commit updates
    #[test]
    fun test_seal_policy_commit_update() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository with SEAL policy
        setup_sealed_repository(&mut scenario, OWNER, VALID_SEAL_POLICY);
        
        // Add authorized collaborator
        add_collaborator(&mut scenario, OWNER, AUTHORIZED_USER, ROLE_WRITER);
        
        // Authorized user updates commit with new encrypted DEK
        next_tx(&mut scenario, AUTHORIZED_USER);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let write_cap = test_scenario::take_from_sender<WriteCap>(&scenario);
            
            repository::update_commit(
                &mut repo, 
                &write_cap, 
                string::utf8(b"new_commit_manifest_cid"), 
                string::utf8(b"new_encrypted_dek_cid_456"), 
                ctx(&mut scenario)
            );
            
            // Verify update succeeded
            assert!(repository::latest_commit_manifest_cid(&repo) == string::utf8(b"new_commit_manifest_cid"), 3);
            assert!(repository::encrypted_dek_cid(&repo) == string::utf8(b"new_encrypted_dek_cid_456"), 4);
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, write_cap);
        };

        test_scenario::end(scenario);
    }

    /// Test SEAL policy rotation/update
    #[test]
    fun test_seal_policy_rotation() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository with initial SEAL policy
        setup_sealed_repository(&mut scenario, OWNER, VALID_SEAL_POLICY);
        
        // Owner rotates SEAL policy
        next_tx(&mut scenario, OWNER);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(&scenario);
            
            repository::update_seal_policy(
                &mut repo, 
                &owner_cap, 
                string::utf8(THRESHOLD_POLICY), 
                string::utf8(b"rotated_encrypted_dek_789"), 
                ctx(&mut scenario)
            );
            
            // Verify policy was rotated
            assert!(repository::seal_policy_id(&repo) == string::utf8(THRESHOLD_POLICY), 5);
            assert!(repository::encrypted_dek_cid(&repo) == string::utf8(b"rotated_encrypted_dek_789"), 6);
            
            test_scenario::return_shared(repo);
            test_scenario::return_to_sender(&scenario, owner_cap);
        };

        test_scenario::end(scenario);
    }

    /// Test threshold encryption scenario simulation
    #[test]
    fun test_threshold_encryption_simulation() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository with threshold SEAL policy
        setup_sealed_repository(&mut scenario, OWNER, THRESHOLD_POLICY);
        
        // Add multiple collaborators for threshold scenario
        add_collaborator(&mut scenario, OWNER, AUTHORIZED_USER, ROLE_WRITER);
        add_collaborator(&mut scenario, OWNER, @0xabc123def456789, ROLE_WRITER);
        
        // Simulate threshold decryption requirement for access
        next_tx(&mut scenario, AUTHORIZED_USER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            
            // In a real scenario, this would involve SEAL client calls
            // For testing, we verify the policy requirements are stored
            assert!(repository::seal_policy_id(&repo) == string::utf8(THRESHOLD_POLICY), 7);
            
            // Verify collaborator access
            assert!(repository::get_collaborator_role(&repo, AUTHORIZED_USER) == option::some(ROLE_WRITER), 8);
            
            test_scenario::return_shared(repo);
        };

        test_scenario::end(scenario);
    }

    /// Test SEAL policy enforcement during unauthorized access
    #[test]
    fun test_seal_policy_unauthorized_access() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository with SEAL policy
        setup_sealed_repository(&mut scenario, OWNER, VALID_SEAL_POLICY);
        
        // Unauthorized user attempts to access repository data
        next_tx(&mut scenario, UNAUTHORIZED_USER);
        {
            let repo = test_scenario::take_shared<Repo>(&scenario);
            
            // Unauthorized user can read public metadata but not encrypted content
            let _public_name = repository::name(&repo);
            let _public_description = repository::description(&repo);
            
            // Verify user is not a collaborator (cannot access encrypted content)
            assert!(repository::get_collaborator_role(&repo, UNAUTHORIZED_USER) == option::none(), 9);
            
            // The encrypted DEK CID is stored but user cannot decrypt without SEAL approval
            let _encrypted_dek = repository::encrypted_dek_cid(&repo);
            let _seal_policy = repository::seal_policy_id(&repo);
            
            test_scenario::return_shared(repo);
        };

        test_scenario::end(scenario);
    }

    /// Test SEAL policy validation with different encryption keys
    #[test]
    fun test_multiple_seal_policies() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Create multiple repositories with different SEAL policies
        setup_storage_quota(&mut scenario, OWNER);
        
        // Repository 1: Standard encryption
        next_tx(&mut scenario, OWNER);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"repo-standard"),
                string::utf8(b"Standard encryption repo"),
                string::utf8(b"commit_cid_1"),
                string::utf8(b"dek_cid_1"),
                string::utf8(VALID_SEAL_POLICY),
                string::utf8(b"main"),
                &mut quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, quota);
        };

        // Repository 2: Threshold encryption
        next_tx(&mut scenario, OWNER);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(&scenario);
            repository::create_repository(
                string::utf8(b"repo-threshold"),
                string::utf8(b"Threshold encryption repo"),
                string::utf8(b"commit_cid_2"),
                string::utf8(b"dek_cid_2"),
                string::utf8(THRESHOLD_POLICY),
                string::utf8(b"main"),
                &mut quota,
                ctx(&mut scenario)
            );
            test_scenario::return_to_sender(&scenario, quota);
        };

        // Verify both repositories have different SEAL policies
        next_tx(&mut scenario, OWNER);
        {
            let repos = test_scenario::take_shared_by_name<Repo>(&scenario, b"repo-standard");
            let repo1 = vector::borrow(&repos, 0);
            assert!(repository::seal_policy_id(repo1) == string::utf8(VALID_SEAL_POLICY), 10);
            
            let repos2 = test_scenario::take_shared_by_name<Repo>(&scenario, b"repo-threshold");
            let repo2 = vector::borrow(&repos2, 0);
            assert!(repository::seal_policy_id(repo2) == string::utf8(THRESHOLD_POLICY), 11);
            
            // Note: This is a simplified test - actual implementation would handle multiple shared objects differently
        };

        test_scenario::end(scenario);
    }

    /// Test SEAL client integration simulation
    #[test]
    fun test_seal_client_integration_simulation() {
        let mut scenario = test_scenario::begin(OWNER);
        
        // Setup repository
        setup_sealed_repository(&mut scenario, OWNER, VALID_SEAL_POLICY);
        
        // Simulate SEAL client encrypt/decrypt workflow
        next_tx(&mut scenario, OWNER);
        {
            let mut repo = test_scenario::take_shared<Repo>(&scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(&scenario);
            
            // Simulate re-encryption with new DEK
            repository::update_commit(
                &mut repo, 
                &owner_cap, 
                string::utf8(b"seal_encrypted_commit_cid"), 
                string::utf8(b"seal_encrypted_dek_new"), 
                ctx(&mut scenario)
            );
            
            // Verify encryption metadata is updated
            assert!(repository::latest_commit_manifest_cid(&repo) == string::utf8(b"seal_encrypted_commit_cid"), 12);
            assert!(repository::encrypted_dek_cid(&repo) == string::utf8(b"seal_encrypted_dek_new"), 13);
            
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

    /// Helper function to setup a repository with SEAL encryption
    fun setup_sealed_repository(scenario: &mut test_scenario::Scenario, owner: address, seal_policy: vector<u8>) {
        setup_storage_quota(scenario, owner);
        
        next_tx(scenario, owner);
        {
            let mut quota = test_scenario::take_from_sender<StorageQuota>(scenario);
            repository::create_repository(
                string::utf8(b"sealed-test-repo"),
                string::utf8(b"Test repository with SEAL"),
                string::utf8(b"initial_commit_cid"),
                string::utf8(b"encrypted_dek_cid"),
                string::utf8(seal_policy),
                string::utf8(b"main"),
                &mut quota,
                ctx(scenario)
            );
            test_scenario::return_to_sender(scenario, quota);
        };
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