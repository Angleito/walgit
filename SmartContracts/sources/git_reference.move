#[allow(duplicate_alias, unused_use, unused_const, unused_variable, unused_let_mut)]
module walgit::git_reference {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::transfer;
    
    /// Error codes
    const EInvalidReference: u64 = 1;
    const EPermissionDenied: u64 = 2;
    const EReferenceExists: u64 = 3;
    
    /// Reference types
    const REF_TYPE_BRANCH: u8 = 0;
    const REF_TYPE_TAG: u8 = 1;
    const REF_TYPE_REMOTE: u8 = 2;
    
    /// Represents a Git reference (branch, tag)
    public struct GitReference has key, store {
        id: UID,
        name: String,          // Name of the reference (e.g., "main", "v1.0.0")
        ref_type: u8,          // Type of reference (branch, tag)
        target_id: ID,         // ID of the commit this reference points to
        repository_id: ID,     // Repository this reference belongs to
        is_head: bool,         // Whether this is the HEAD reference
        metadata: Table<String, String> // Additional metadata for the reference
    }
    
    // Collection of references for a repository
    public struct GitReferenceCollection has key, store {
        id: UID,
        repository_id: ID,
        branches: Table<String, ID>, // Map of branch name to GitReference ID
        tags: Table<String, ID>,     // Map of tag name to GitReference ID
        head_ref: String,            // Name of the current HEAD reference
    }
    
    // Events
    public struct ReferenceCreated has copy, drop {
        reference_id: address,
        name: String,
        ref_type: u8,
        target_id: ID,
        repository_id: ID
    }
    
    public struct ReferenceUpdated has copy, drop {
        reference_id: address,
        name: String,
        previous_target_id: ID,
        new_target_id: ID
    }
    
    public struct HeadChanged has copy, drop {
        repository_id: ID,
        previous_head: String,
        new_head: String
    }
    
    /// Initialize a reference collection for a repository
    public fun init_references(
        repository_id: ID,
        default_branch: String,
        ctx: &mut TxContext
    ): GitReferenceCollection {
        GitReferenceCollection {
            id: object::new(ctx),
            repository_id,
            branches: table::new(ctx),
            tags: table::new(ctx),
            head_ref: default_branch
        }
    }
    
    /// Create a new branch reference
    public fun create_branch(
        refs: &mut GitReferenceCollection,
        name: String,
        target_id: ID,
        repository_id: ID,
        ctx: &mut TxContext
    ) {
        // Ensure branch doesn't already exist
        assert!(!table::contains(&refs.branches, name), EReferenceExists);
        
        let is_head = name == refs.head_ref;
        
        let ref_id = object::new(ctx);
        let ref_addr = object::uid_to_address(&ref_id);
        
        let mut git_ref = GitReference {
            id: ref_id,
            name,
            ref_type: REF_TYPE_BRANCH,
            target_id,
            repository_id,
            is_head,
            metadata: table::new(ctx)
        };
        
        // Store reference ID in the collection
        table::add(&mut refs.branches, git_ref.name, object::id(&git_ref));
        
        event::emit(ReferenceCreated {
            reference_id: ref_addr,
            name: git_ref.name,
            ref_type: git_ref.ref_type,
            target_id: git_ref.target_id,
            repository_id
        });
        
        // Share the reference object
        transfer::public_share_object(git_ref);
    }
    
    /// Create a new tag reference (immutable pointer to a commit)
    public fun create_tag(
        refs: &mut GitReferenceCollection,
        name: String,
        target_id: ID,
        repository_id: ID,
        message: String,
        ctx: &mut TxContext
    ) {
        // Ensure tag doesn't already exist
        assert!(!table::contains(&refs.tags, name), EReferenceExists);
        
        let ref_id = object::new(ctx);
        let ref_addr = object::uid_to_address(&ref_id);
        
        let mut git_ref = GitReference {
            id: ref_id,
            name,
            ref_type: REF_TYPE_TAG,
            target_id,
            repository_id,
            is_head: false, // Tags can't be HEAD
            metadata: table::new(ctx)
        };
        
        // Add tag message to metadata
        let metadata = &mut git_ref.metadata;
        table::add(metadata, std::string::utf8(b"message"), message);
        
        // Store reference ID in the collection
        table::add(&mut refs.tags, git_ref.name, object::id(&git_ref));
        
        event::emit(ReferenceCreated {
            reference_id: ref_addr,
            name: git_ref.name,
            ref_type: git_ref.ref_type,
            target_id: git_ref.target_id,
            repository_id
        });
        
        // Share the reference object
        transfer::public_share_object(git_ref);
    }
    
    /// Update a branch to point to a new commit
    public fun update_branch(
        _refs: &mut GitReferenceCollection,
        _branch_name: String,
        branch_ref: &mut GitReference,
        new_target_id: ID
    ) {
        // Ensure this is actually a branch
        assert!(branch_ref.ref_type == REF_TYPE_BRANCH, EInvalidReference);
        
        // Tags are immutable, so we can only update branches
        let previous_target_id = branch_ref.target_id;
        branch_ref.target_id = new_target_id;
        
        event::emit(ReferenceUpdated {
            reference_id: object::uid_to_address(&branch_ref.id),
            name: branch_ref.name,
            previous_target_id,
            new_target_id
        });
    }
    
    /// Force update a branch to point to a new commit (for force push operations)
    /// This bypasses any checks that would normally prevent a non-fast-forward update
    public fun force_update_branch(
        _refs: &mut GitReferenceCollection,
        _branch_name: String,
        branch_ref: &mut GitReference,
        new_target_id: ID,
        ctx: &TxContext
    ) {
        // Ensure this is actually a branch
        assert!(branch_ref.ref_type == REF_TYPE_BRANCH, EInvalidReference);
        
        // Ensure the caller is authorized to force update this branch
        // This would normally check repository ownership or permissions
        let caller = tx_context::sender(ctx);
        
        // In a full implementation, we would check if the caller has permission to force update
        // For simplicity, we'll just emit an event indicating this was a force update
        
        // Update the branch reference
        let previous_target_id = branch_ref.target_id;
        branch_ref.target_id = new_target_id;
        
        // Emit an event for this force update operation
        event::emit(ReferenceUpdated {
            reference_id: object::uid_to_address(&branch_ref.id),
            name: branch_ref.name,
            previous_target_id,
            new_target_id
        });
        
        // Consider adding a special event for force updates
        // This could be used for auditing or notifications
    }
    
    /// Change the HEAD reference to point to a different branch
    public fun change_head(
        refs: &mut GitReferenceCollection,
        new_head: String
    ) {
        // Ensure the branch exists
        assert!(table::contains(&refs.branches, new_head), EInvalidReference);
        
        let previous_head = refs.head_ref;
        refs.head_ref = new_head;
        
        event::emit(HeadChanged {
            repository_id: refs.repository_id,
            previous_head,
            new_head
        });
    }
    
    // === Getter functions ===
    
    public fun is_branch(git_ref: &GitReference): bool {
        git_ref.ref_type == REF_TYPE_BRANCH
    }
    
    public fun is_tag(git_ref: &GitReference): bool {
        git_ref.ref_type == REF_TYPE_TAG
    }
    
    public fun is_head(git_ref: &GitReference): bool {
        git_ref.is_head
    }
    
    public fun reference_name(git_ref: &GitReference): String {
        git_ref.name
    }
    
    public fun target_id(git_ref: &GitReference): ID {
        git_ref.target_id
    }
    
    public fun get_head_name(refs: &GitReferenceCollection): String {
        refs.head_ref
    }
    
    public fun branch_exists(refs: &GitReferenceCollection, name: String): bool {
        table::contains(&refs.branches, name)
    }
    
    public fun tag_exists(refs: &GitReferenceCollection, name: String): bool {
        table::contains(&refs.tags, name)
    }
}
