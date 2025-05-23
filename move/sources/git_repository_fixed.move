#[allow(duplicate_alias, unused_use, unused_const, unused_trailing_semi)]
module walgit::git_repository {
    use sui::object::{Self, UID, ID};
    use std::option::{Self, Option};
    use std::string::String;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::display;
    use sui::package;
    use walgit::storage::StorageQuota;

    /// Error codes
    const ENotOwner: u64 = 1;
    const EInvalidName: u64 = 2;
    const EPermissionDenied: u64 = 3;
    const EInvalidRole: u64 = 4;
    const ECollaboratorNotFound: u64 = 5;

    /// Role types for collaborators
    const ROLE_READER: u8 = 1;
    const ROLE_WRITER: u8 = 2;
    const ROLE_ADMIN: u8 = 3;

    /// Repository Capability objects
    public struct OwnerCap has key, store {
        id: UID,
        repo_id: ID
    }
    
    public struct WriteCap has key, store {
        id: UID,
        repo_id: ID
    }

    /// Enhanced repository structure with SEAL integration
    public struct Repo has key, store {
        id: UID,
        name: String,
        description: String,
        owner: address,
        collaborators: Table<address, u8>, // Role-based access control
        latest_commit_manifest_cid: String, // Walrus CID for latest commit manifest
        encrypted_dek_cid: String, // Walrus CID for SEAL-encrypted Data Encryption Key
        seal_policy_id: String, // SEAL policy identifier for access control
        default_branch: String,
        created_at: u64,
        updated_at: u64
    }

    // Event emitted when a repository is created
    public struct RepositoryCreated has copy, drop {
        repo_id: ID,
        object_id: address,
        name: String,
        description: String,
        owner: address,
        seal_policy_id: String,
        default_branch: String,
        created_at: u64
    }

    // Event emitted when a collaborator is added
    public struct CollaboratorAdded has copy, drop {
        repo_id: address,
        collaborator: address,
        permission: u8
    }

    // Event emitted when commit is updated
    public struct CommitUpdated has copy, drop {
        repo_id: ID,
        commit_manifest_cid: String,
        encrypted_dek_cid: String,
        updated_by: address,
        updated_at: u64
    }
    
    // Event emitted when collaborator is removed
    public struct CollaboratorRemoved has copy, drop {
        repo_id: ID,
        collaborator: address,
        removed_by: address
    }
    
    // Event emitted when repository metadata is updated
    public struct RepositoryUpdated has copy, drop {
        repo_id: ID,
        name: String,
        description: String,
        updated_by: address,
        updated_at: u64
    }
    
    // Event emitted when SEAL policy is rotated
    public struct SealPolicyRotated has copy, drop {
        repo_id: ID,
        old_policy_id: String,
        new_policy_id: String,
        rotated_by: address,
        rotated_at: u64
    }
    
    // Event emitted when branch is created/updated
    public struct BranchUpdated has copy, drop {
        repo_id: ID,
        branch_name: String,
        commit_id: String,
        updated_by: address,
        updated_at: u64
    }

    /// Creates a new repository with SEAL integration
    public entry fun create_repository(
        name: String,
        description: String,
        initial_commit_manifest_cid: String,
        encrypted_dek_cid: String,
        seal_policy_id: String,
        default_branch: String,
        storage: &mut StorageQuota,
        ctx: &mut TxContext
    ) {
        // Validate name (should be non-empty and reasonable length)
        assert!(std::string::length(&name) > 0, EInvalidName);
        assert!(std::string::length(&name) <= 100, EInvalidName);
        
        // Validate SEAL policy ID is provided
        assert!(std::string::length(&seal_policy_id) > 0, EInvalidName);
        
        let id = object::new(ctx);
        let owner = tx_context::sender(ctx);
        let created_at = tx_context::epoch(ctx);
        let object_id = object::uid_to_address(&id);
        
        // Consume a small amount of storage for repository metadata
        let metadata_size = std::string::length(&name) + std::string::length(&description) + 100;
        walgit::storage::consume_storage(storage, metadata_size);
        
        let repo = Repo {
            id,
            name,
            description,
            owner,
            collaborators: table::new(ctx),
            latest_commit_manifest_cid: initial_commit_manifest_cid,
            encrypted_dek_cid,
            seal_policy_id,
            default_branch,
            created_at,
            updated_at: created_at
        };
        
        event::emit(RepositoryCreated {
            repo_id: object::uid_to_inner(&repo.id),
            object_id,
            name: repo.name,
            description: repo.description,
            owner,
            seal_policy_id: repo.seal_policy_id,
            default_branch: repo.default_branch,
            created_at
        });
        
        // Share the repository object so it's accessible by everyone
        transfer::public_share_object(repo);
    }
    
    /// Add a collaborator to the repository
    public entry fun add_collaborator(
        repo: &mut Repo,
        collaborator: address,
        permission: u8,
        ctx: &mut TxContext
    ) {
        // Only owner or admin can add collaborators
        let sender = tx_context::sender(ctx);
        assert!(is_admin(repo, sender), EPermissionDenied);
        
        // Validate permission level
        assert!(permission >= ROLE_READER && permission <= ROLE_ADMIN, EInvalidRole);
        
        // Add or update collaborator permissions
        if (table::contains(&repo.collaborators, collaborator)) {
            let collab_permission = table::borrow_mut(&mut repo.collaborators, collaborator);
            *collab_permission = permission;
        } else {
            table::add(&mut repo.collaborators, collaborator, permission);
        };
        
        event::emit(CollaboratorAdded {
            repo_id: object::uid_to_address(&repo.id),
            collaborator,
            permission
        });
    }
    
    /// Remove a collaborator from the repository
    public entry fun remove_collaborator(
        repo: &mut Repo,
        collaborator: address,
        ctx: &mut TxContext
    ) {
        // Only owner or admin can remove collaborators
        let sender = tx_context::sender(ctx);
        assert!(is_admin(repo, sender), EPermissionDenied);
        
        // Cannot remove the owner
        assert!(collaborator != repo.owner, EPermissionDenied);
        
        // Check if collaborator exists
        assert!(table::contains(&repo.collaborators, collaborator), ECollaboratorNotFound);
        
        table::remove(&mut repo.collaborators, collaborator);
        
        event::emit(CollaboratorRemoved {
            repo_id: object::uid_to_inner(&repo.id),
            collaborator,
            removed_by: sender
        });
    }
    
    /// Update the commit for the repository
    public entry fun update_commit(
        repo: &mut Repo,
        commit_manifest_cid: String,
        encrypted_dek_cid: String,
        ctx: &mut TxContext
    ) {
        // Only owner or collaborators with write access can update commits
        let sender = tx_context::sender(ctx);
        assert!(can_write(repo, sender), EPermissionDenied);
        
        repo.latest_commit_manifest_cid = commit_manifest_cid;
        repo.encrypted_dek_cid = encrypted_dek_cid;
        repo.updated_at = tx_context::epoch(ctx);
        
        event::emit(CommitUpdated {
            repo_id: object::uid_to_inner(&repo.id),
            commit_manifest_cid: repo.latest_commit_manifest_cid,
            encrypted_dek_cid: repo.encrypted_dek_cid,
            updated_by: sender,
            updated_at: repo.updated_at
        });
    }
    
    /// Update repository metadata
    public entry fun update_repository(
        repo: &mut Repo,
        new_name: String,
        new_description: String,
        ctx: &mut TxContext
    ) {
        // Only owner can update repository metadata
        let sender = tx_context::sender(ctx);
        assert!(sender == repo.owner, EPermissionDenied);
        
        // Validate new name
        assert!(std::string::length(&new_name) > 0, EInvalidName);
        assert!(std::string::length(&new_name) <= 100, EInvalidName);
        
        repo.name = new_name;
        repo.description = new_description;
        repo.updated_at = tx_context::epoch(ctx);
        
        event::emit(RepositoryUpdated {
            repo_id: object::uid_to_inner(&repo.id),
            name: repo.name,
            description: repo.description,
            updated_by: sender,
            updated_at: repo.updated_at
        });
    }
    
    /// Rotate SEAL policy for the repository
    public entry fun rotate_seal_policy(
        repo: &mut Repo,
        new_policy_id: String,
        ctx: &mut TxContext
    ) {
        // Only owner can rotate SEAL policy
        let sender = tx_context::sender(ctx);
        assert!(sender == repo.owner, EPermissionDenied);
        
        // Validate new policy ID
        assert!(std::string::length(&new_policy_id) > 0, EInvalidName);
        
        let old_policy_id = repo.seal_policy_id;
        repo.seal_policy_id = new_policy_id;
        repo.updated_at = tx_context::epoch(ctx);
        
        event::emit(SealPolicyRotated {
            repo_id: object::uid_to_inner(&repo.id),
            old_policy_id,
            new_policy_id: repo.seal_policy_id,
            rotated_by: sender,
            rotated_at: repo.updated_at
        });
    }
    
    // Permission check helpers
    public fun can_read(repo: &Repo, addr: address): bool {
        if (repo.owner == addr) return true;
        if (table::contains(&repo.collaborators, addr)) {
            let permission = *table::borrow(&repo.collaborators, addr);
            return permission >= ROLE_READER
        };
        false
    }
    
    public fun can_write(repo: &Repo, addr: address): bool {
        if (repo.owner == addr) return true;
        if (table::contains(&repo.collaborators, addr)) {
            let permission = *table::borrow(&repo.collaborators, addr);
            return permission >= ROLE_WRITER
        };
        false
    }
    
    public fun is_admin(repo: &Repo, addr: address): bool {
        if (repo.owner == addr) return true;
        if (table::contains(&repo.collaborators, addr)) {
            let permission = *table::borrow(&repo.collaborators, addr);
            return permission >= ROLE_ADMIN
        };
        false
    }
    
    // Getter functions
    public fun name(repo: &Repo): String {
        repo.name
    }
    
    public fun description(repo: &Repo): String {
        repo.description
    }
    
    public fun owner(repo: &Repo): address {
        repo.owner
    }
    
    public fun latest_commit_cid(repo: &Repo): String {
        repo.latest_commit_manifest_cid
    }
    
    public fun encrypted_dek_cid(repo: &Repo): String {
        repo.encrypted_dek_cid
    }
    
    public fun seal_policy_id(repo: &Repo): String {
        repo.seal_policy_id
    }
    
    public fun default_branch(repo: &Repo): String {
        repo.default_branch
    }
    
    public fun created_at(repo: &Repo): u64 {
        repo.created_at
    }
    
    public fun updated_at(repo: &Repo): u64 {
        repo.updated_at
    }
}