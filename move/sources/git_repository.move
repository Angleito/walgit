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
    
    // Event emitted when collaborator is removed
    public struct CollaboratorRemoved has copy, drop {
        repo_id: ID,
        collaborator: address,
        removed_by: address
    }

    /// Creates a new repository object (not entry function)
    /// Following Sui best practices for object creation
    public fun create_repository_object(
        name: String,
        description: String,
        default_branch: String,
        storage: &mut StorageQuota,
        ctx: &mut TxContext
    ): Repo {
        // Validate inputs
        assert!(std::string::length(&name) > 0, EInvalidName);
        assert!(std::string::length(&name) <= 100, EInvalidName);
        
        let id = object::new(ctx);
        let owner = tx_context::sender(ctx);
        let created_at = tx_context::epoch_timestamp_ms(ctx);
        
        // Consume storage for repository metadata
        let metadata_size = std::string::length(&name) + std::string::length(&description) + 100;
        walgit::storage::consume_storage(storage, metadata_size);
        
        let repo = Repo {
            id,
            name,
            description,
            owner,
            collaborators: table::new(ctx),
            latest_commit_manifest_cid: std::string::utf8(b""),
            encrypted_dek_cid: std::string::utf8(b""),
            seal_policy_id: std::string::utf8(b""),
            default_branch,
            created_at,
            updated_at: created_at
        };
        
        event::emit(RepositoryCreated {
            repo_id: object::id(&repo),
            object_id: object::uid_to_address(&repo.id),
            name: repo.name,
            description: repo.description,
            owner,
            seal_policy_id: repo.seal_policy_id,
            default_branch: repo.default_branch,
            created_at
        });
        
        repo
    }
    
    /// Creates a new repository with SEAL integration (entry function)
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
        // The actual content will be stored separately with each object
        let metadata_size = std::string::length(&name) + std::string::length(&description) + 100;
        walgit::storage::consume_storage(storage, metadata_size);
        
        let mut repo = create_repository_object(
            name,
            description, 
            default_branch,
            storage,
            ctx
        );
        
        // Set SEAL-specific fields
        repo.latest_commit_manifest_cid = initial_commit_manifest_cid;
        repo.encrypted_dek_cid = encrypted_dek_cid;
        repo.seal_policy_id = seal_policy_id;
        
        // Share the repository object so it's accessible
        transfer::share_object(repo);
    }
    
    /// Add a collaborator to the repository
    public entry fun add_collaborator(
        repo: &mut GitRepository,
        collaborator: address,
        permission: u8,
        ctx: &mut TxContext
    ) {
        // Only owner or admin can add collaborators
        let sender = tx_context::sender(ctx);
        assert!(is_admin(repo, sender), EPermissionDenied);
        
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
    
    /// Update the HEAD commit of the repository
    public fun update_head(
        repo: &mut GitRepository,
        commit_id: ID,
        ctx: &mut TxContext
    ) {
        // Only owner or collaborators with write access can update head
        let sender = tx_context::sender(ctx);
        assert!(can_write(repo, sender), EPermissionDenied);
        
        repo.head_commit_id = option::some(commit_id);
        
        event::emit(HeadUpdated {
            repo_id: object::uid_to_address(&repo.id),
            head_commit_id: commit_id
        });
    }
    
    /// Set the Walrus config blob ID for additional repository settings
    public fun set_config_blob_id(
        repo: &mut GitRepository,
        blob_id: u256,
        ctx: &mut TxContext
    ) {
        // Only owner or admin can set config
        let sender = tx_context::sender(ctx);
        assert!(is_admin(repo, sender), EPermissionDenied);
        
        repo.walrus_config_blob_id = option::some(blob_id);
    }
    
    // Permission check helpers
    public fun can_read(repo: &GitRepository, addr: address): bool {
        if (repo.owner == addr) return true;
        if (table::contains(&repo.collaborators, addr)) {
            let permission = *table::borrow(&repo.collaborators, addr);
            return permission >= PERMISSION_READ
        };
        false
    }
    
    public fun can_write(repo: &GitRepository, addr: address): bool {
        if (repo.owner == addr) return true;
        if (table::contains(&repo.collaborators, addr)) {
            let permission = *table::borrow(&repo.collaborators, addr);
            return permission >= PERMISSION_WRITE
        };
        false
    }
    
    public fun is_admin(repo: &GitRepository, addr: address): bool {
        if (repo.owner == addr) return true;
        if (table::contains(&repo.collaborators, addr)) {
            let permission = *table::borrow(&repo.collaborators, addr);
            return permission >= PERMISSION_ADMIN
        };
        false
    }
    
    // Getter functions
    public fun name(self: &Repo): String { self.name }
    public fun description(self: &Repo): String { self.description }
    public fun owner(self: &Repo): address { self.owner }
    public fun latest_commit_manifest_cid(self: &Repo): String { self.latest_commit_manifest_cid }
    public fun encrypted_dek_cid(self: &Repo): String { self.encrypted_dek_cid }
    public fun seal_policy_id(self: &Repo): String { self.seal_policy_id }
    public fun default_branch(self: &Repo): String { self.default_branch }
    public fun created_at(self: &Repo): u64 { self.created_at }
    public fun updated_at(self: &Repo): u64 { self.updated_at }
    public fun repo_id(self: &Repo): ID { object::uid_to_inner(&self.id) }
    
    // Check if user has specific role
    public fun get_collaborator_role(self: &Repo, addr: address): Option<u8> {
        if (table::contains(&self.collaborators, addr)) {
            option::some(*table::borrow(&self.collaborators, addr))
        } else {
            option::none()
        }
    }
    
    /// Initialize Display object for better metadata presentation
    /// Following latest Sui Display patterns
    fun init(otw: REPO, ctx: &mut TxContext) {
        let keys = vector[
            b"name".to_string(),
            b"description".to_string(),
            b"owner".to_string(),
            b"created_at".to_string(),
            b"default_branch".to_string(),
            b"seal_policy_id".to_string()
        ];
        
        let values = vector[
            b"{name}".to_string(),
            b"{description}".to_string(),
            b"{owner}".to_string(),
            b"{created_at}".to_string(),
            b"{default_branch}".to_string(),
            b"{seal_policy_id}".to_string()
        ];
        
        let publisher = package::claim(otw, ctx);
        let display = display::new_with_fields<Repo>(
            &publisher, keys, values, ctx
        );
        display::update_version(&mut display);
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::public_transfer(publisher, tx_context::sender(ctx));
    }
    
    // Constants for roles (public access)
    public fun role_reader(): u8 { ROLE_READER }
    public fun role_writer(): u8 { ROLE_WRITER }
    public fun role_admin(): u8 { ROLE_ADMIN }
}
