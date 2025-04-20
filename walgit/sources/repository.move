module walgit::repository {
    use sui::object::{new, id}; // Re-add id import
    use sui::tx_context::{sender}; // Removed Self alias and unnecessary TxContext alias
    use sui::transfer::{share_object}; // Use specific import
    use sui::table::{Table, new as table_new, contains as table_contains, borrow as table_borrow}; // Removed unused Self alias, specify function imports
    use std::string::{String};
    use sui::event;
    use walgit::storage::{StorageQuota, consume_storage};

    const ENotOwnerOrCollaborator: u64 = 1;
    const EPermissionDenied: u64 = 2;
    const EInsufficientStorage: u64 = 3;

    // Repository struct to store metadata
    public struct Repository has key, store { // Added public
        id: UID,
        name: String,
        owner: address,
        description: String,
        walrus_blob_id: String, // Walrus blob identifier
        collaborators: Table<address, CollaboratorRole>
    }

    // Collaborator roles enum
    public struct CollaboratorRole has copy, drop, store { // Added public
        // Removed unused can_read field
        can_write: bool,
        is_admin: bool
    }

    // Events
    public struct RepositoryCreated has copy, drop { // Added public
        repo_id: ID,
        name: String,
        owner: address
    }

    // --- Event Getters ---

    public fun event_repo_id(event: &RepositoryCreated): ID {
        event.repo_id
    }

    public fun event_name(event: &RepositoryCreated): String {
        event.name // Assumes String has copy
    }

    public fun event_owner(event: &RepositoryCreated): address {
        event.owner
    }

    // Create a new repository
    public entry fun create_repository(
        name: String,
        description: String,
        walrus_blob_id: String,
        initial_size_bytes: u64, // Add parameter for initial size
        storage: &mut StorageQuota, // Add storage quota parameter
        ctx: &mut TxContext
    ) {
        let owner = sender(ctx);
        
        // Check and consume storage quota
        let has_storage = consume_storage(storage, initial_size_bytes);
        assert!(has_storage, EInsufficientStorage);
        
        let id_uid = new(ctx);

        let repo = Repository {
            id: id_uid,
            name,
            owner,
            description,
            walrus_blob_id,
            collaborators: table_new(ctx)
        };

        event::emit(RepositoryCreated {
            repo_id: id(&repo),
            name: repo.name,
            owner: repo.owner
        });

        share_object(repo);
    }

    // --- Getter Functions ---

    public fun get_id(repo: &Repository): &UID {
        &repo.id
    }

    public fun owner(repo: &Repository): address {
        repo.owner
    }

    public fun walrus_blob_id(repo: &Repository): String {
        repo.walrus_blob_id // Assuming String implements copy
        // If String does not implement copy, you might need:
        // std::string::internal_utf8(std::string::bytes(&repo.walrus_blob_id))
    }

    // --- Permission Checks ---

    public fun assert_can_write(repo: &Repository, user: address) {
        assert!(repo.owner == user || table_contains(&repo.collaborators, user), ENotOwnerOrCollaborator); // Use aliased import
        if (repo.owner != user) {
            let role = table_borrow(&repo.collaborators, user); // Use aliased import
            assert!(role.can_write || role.is_admin, EPermissionDenied);
        }
    }

    // Add other functions for managing collaborators, updating repositories, etc.
    // Example:
    // public entry fun add_collaborator(repo: &mut Repository, collaborator: address, role: CollaboratorRole, ctx: &mut TxContext) {
    //     assert!(sender(ctx) == repo.owner, ENotOwnerOrCollaborator); // Only owner can add collaborators initially
    //     // Add logic to allow admins to add collaborators later if needed
    //     table::add(&mut repo.collaborators, collaborator, role);
    // }
}
