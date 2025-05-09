#[allow(duplicate_alias, unused_use, unused_const, unused_trailing_semi)]
module walgit::git_repository {
    use sui::object::{Self, UID, ID};
    use std::option::{Self, Option};
    use std::string::String;
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use walgit::storage::StorageQuota;

    /// Error codes
    const ENotOwner: u64 = 1;
    const EInvalidName: u64 = 2;
    const EPermissionDenied: u64 = 3;

    /// Permission types
    const PERMISSION_NONE: u8 = 0;
    const PERMISSION_READ: u8 = 1;
    const PERMISSION_WRITE: u8 = 2;
    const PERMISSION_ADMIN: u8 = 3;

    /// Represents the entire repository
    public struct GitRepository has key, store {
        id: UID,
        name: String,
        description: String,
        owner: address,
        head_commit_id: Option<ID>, // ID of the current HEAD commit
        default_branch: String,
        collaborators: Table<address, u8>, // Table mapping collaborator addresses to permission levels
        created_at: u64,
        walrus_config_blob_id: Option<u256> // Optional reference to additional config in Walrus storage
    }

    // Event emitted when a repository is created
    public struct GitRepositoryCreated has copy, drop {
        object_id: address,
        name: String,
        description: String,
        owner: address,
        default_branch: String,
        created_at: u64
    }

    // Event emitted when a collaborator is added
    public struct CollaboratorAdded has copy, drop {
        repo_id: address,
        collaborator: address,
        permission: u8
    }

    // Event emitted when head commit is updated
    public struct HeadUpdated has copy, drop {
        repo_id: address,
        head_commit_id: ID
    }

    /// Creates a new git repository
    public entry fun create_repository(
        name: String,
        description: String,
        default_branch: String,
        storage: &mut StorageQuota,
        ctx: &mut TxContext
    ) {
        // Validate name (should be non-empty)
        assert!(std::string::length(&name) > 0, EInvalidName);
        
        let id = object::new(ctx);
        let owner = tx_context::sender(ctx);
        let created_at = tx_context::epoch(ctx);
        let object_id = object::uid_to_address(&id);
        
        // Consume a small amount of storage for repository metadata
        // The actual content will be stored separately with each object
        let metadata_size = std::string::length(&name) + std::string::length(&description) + 100;
        walgit::storage::consume_storage(storage, metadata_size);
        
        let repo = GitRepository {
            id,
            name,
            description,
            owner,
            head_commit_id: option::none(),
            default_branch,
            collaborators: table::new(ctx),
            created_at,
            walrus_config_blob_id: option::none()
        };
        
        event::emit(GitRepositoryCreated {
            object_id,
            name: repo.name,
            description: repo.description,
            owner,
            default_branch: repo.default_branch,
            created_at
        });
        
        // Share the repository object so it's accessible by everyone
        transfer::public_share_object(repo);
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
    public fun name(self: &GitRepository): String { self.name }
    public fun description(self: &GitRepository): String { self.description }
    public fun owner(self: &GitRepository): address { self.owner }
    public fun head_commit_id(self: &GitRepository): &Option<ID> { &self.head_commit_id }
    public fun default_branch(self: &GitRepository): String { self.default_branch }
    public fun created_at(self: &GitRepository): u64 { self.created_at }
    public fun walrus_config_blob_id(self: &GitRepository): &Option<u256> { &self.walrus_config_blob_id }
}
