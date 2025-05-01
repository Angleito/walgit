#[allow(duplicate_alias, unused_use)]
module walgit::tree {
    use sui::object::{UID, ID};
    use sui::table::{Self, Table};
    use sui::tx_context::TxContext;
    use sui::transfer::share_object;
    use std::string::{Self, String};
    use sui::event;
    use walgit::repository::{Repository, assert_can_write};
    use walgit::storage::{StorageQuota, consume_storage};

    // Error codes
    const EInvalidEntryType: u64 = 1;
    const EEntryNotFound: u64 = 2;

    // Entry type enum (represented as u8)
    const ENTRY_TYPE_BLOB: u8 = 0;
    const ENTRY_TYPE_TREE: u8 = 1;

    // TreeEntry represents a file or directory in a tree
    public struct TreeEntry has store, copy, drop {
        name: String,          // Name of the file or directory
        entry_type: u8,        // Type of entry (BLOB or TREE)
        object_id: ID,         // ID of the referenced GitBlobObject or GitTreeObject
        mode: u64              // File mode (permissions)
    }

    // GitTreeObject represents a directory structure
    public struct GitTreeObject has key, store {
        id: UID,
        repo_id: ID,           // Repository this tree belongs to
        entries: Table<String, TreeEntry> // Map of file/directory name to entry
    }

    // GitBlobObject represents a file's content
    public struct GitBlobObject has key, store {
        id: UID,
        repo_id: ID,           // Repository this blob belongs to
        walrus_blob_id: String, // Walrus blob identifier for the file content
        size_bytes: u64        // Size of the blob in bytes
    }

    // Events
    public struct TreeCreated has copy, drop {
        tree_id: ID,
        repo_id: ID
    }

    public struct BlobCreated has copy, drop {
        blob_id: ID,
        repo_id: ID,
        size_bytes: u64
    }

    // --- Event Getters ---
    public fun event_tree_id(event: &TreeCreated): ID {
        event.tree_id
    }

    public fun event_blob_id(event: &BlobCreated): ID {
        event.blob_id
    }

    // --- Create Functions ---

    // Create a new blob object
    public entry fun create_blob(
        repo: &Repository,
        walrus_blob_id: String,
        size_bytes: u64,
        storage: &mut StorageQuota,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let repo_id = object::id(repo);

        // Check if sender has write access
        assert_can_write(repo, sender);

        // Consume storage quota
        consume_storage(storage, size_bytes);

        let blob = GitBlobObject {
            id: object::new(ctx),
            repo_id,
            walrus_blob_id,
            size_bytes
        };

        event::emit(BlobCreated {
            blob_id: object::id(&blob),
            repo_id,
            size_bytes
        });

        share_object(blob);
    }

    // Create a new tree object and share it
    public entry fun create_tree(
        repo: &Repository,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let repo_id = object::id(repo);

        // Check if sender has write access
        assert_can_write(repo, sender);

        let tree = GitTreeObject {
            id: object::new(ctx),
            repo_id,
            entries: table::new(ctx)
        };

        event::emit(TreeCreated {
            tree_id: object::id(&tree),
            repo_id
        });

        share_object(tree);
    }
    
    // Create a new tree object and return it for testing
    public fun create_tree_for_testing(
        repo: &Repository,
        ctx: &mut TxContext
    ): GitTreeObject {
        let repo_id = object::id(repo);

        GitTreeObject {
            id: object::new(ctx),
            repo_id,
            entries: table::new(ctx)
        }
    }
    
    // Helper for tests to create a tree with prefilled entries
    #[test_only]
    public fun create_test_tree_with_entries(
        repo: &Repository,
        ctx: &mut TxContext
    ): GitTreeObject {
        // Create an empty tree
        let repo_id = object::id(repo);
        let mut tree = GitTreeObject {
            id: object::new(ctx),
            repo_id,
            entries: table::new(ctx)
        };
        
        // Add README.md entry
        let readme_id = object::new(ctx);
        let readme_entry = TreeEntry {
            name: string::utf8(b"README.md"),
            entry_type: ENTRY_TYPE_BLOB,
            object_id: object::uid_to_inner(&readme_id),
            mode: 644
        };
        table::add(&mut tree.entries, string::utf8(b"README.md"), readme_entry);
        object::delete(readme_id);
        
        // Add src entry
        let src_id = object::new(ctx);
        let src_entry = TreeEntry {
            name: string::utf8(b"src"),
            entry_type: ENTRY_TYPE_TREE,
            object_id: object::uid_to_inner(&src_id),
            mode: 755
        };
        table::add(&mut tree.entries, string::utf8(b"src"), src_entry);
        object::delete(src_id);
        
        tree
    }
    
    // Helper for tests to create a src tree with a main.move file
    #[test_only]
    public fun create_test_src_tree(
        repo: &Repository,
        ctx: &mut TxContext
    ): GitTreeObject {
        // Create an empty tree
        let repo_id = object::id(repo);
        let mut tree = GitTreeObject {
            id: object::new(ctx),
            repo_id,
            entries: table::new(ctx)
        };
        
        // Add main.move entry
        let main_id = object::new(ctx);
        let main_entry = TreeEntry {
            name: string::utf8(b"main.move"),
            entry_type: ENTRY_TYPE_BLOB,
            object_id: object::uid_to_inner(&main_id),
            mode: 644
        };
        table::add(&mut tree.entries, string::utf8(b"main.move"), main_entry);
        object::delete(main_id);
        
        tree
    }

    // Add a blob entry to a tree
    public entry fun add_blob_to_tree(
        tree: &mut GitTreeObject,
        blob: &GitBlobObject,
        name: String,
        mode: u64,
        _ctx: &mut TxContext
    ) {
        let repo_id = tree.repo_id;
        let blob_id = object::id(blob);

        // Verify blob belongs to the same repository as the tree
        assert!(blob.repo_id == repo_id, EInvalidEntryType);

        let entry = TreeEntry {
            name,
            entry_type: ENTRY_TYPE_BLOB,
            object_id: blob_id,
            mode
        };

        table::add(&mut tree.entries, name, entry);
    }

    // Add a subtree entry to a tree
    public entry fun add_tree_to_tree(
        parent_tree: &mut GitTreeObject,
        child_tree: &GitTreeObject,
        name: String,
        mode: u64,
        _ctx: &mut TxContext
    ) {
        let repo_id = parent_tree.repo_id;

        // Verify child tree belongs to the same repository as the parent tree
        assert!(child_tree.repo_id == repo_id, EInvalidEntryType);

        let child_id = object::id(child_tree);

        let entry = TreeEntry {
            name,
            entry_type: ENTRY_TYPE_TREE,
            object_id: child_id,
            mode
        };

        table::add(&mut parent_tree.entries, name, entry);
    }

    // Remove an entry from a tree
    public entry fun remove_entry_from_tree(
        tree: &mut GitTreeObject,
        name: String,
        _ctx: &mut TxContext
    ) {
        assert!(table::contains(&tree.entries, name), EEntryNotFound);
        
        let _entry = table::remove(&mut tree.entries, name);
        // Entry will be dropped since TreeEntry has drop ability
    }

    // --- Getter Functions ---

    public fun entry_name(entry: &TreeEntry): String {
        entry.name
    }

    public fun entry_type(entry: &TreeEntry): u8 {
        entry.entry_type
    }

    public fun entry_object_id(entry: &TreeEntry): ID {
        entry.object_id
    }

    public fun entry_mode(entry: &TreeEntry): u64 {
        entry.mode
    }

    public fun blob_walrus_id(blob: &GitBlobObject): String {
        blob.walrus_blob_id
    }

    public fun blob_size(blob: &GitBlobObject): u64 {
        blob.size_bytes
    }

    public fun has_entry(tree: &GitTreeObject, name: String): bool {
        table::contains(&tree.entries, name)
    }

    public fun get_entry(tree: &GitTreeObject, name: String): &TreeEntry {
        table::borrow(&tree.entries, name)
    }
}#[allow(duplicate_alias, unused_use)]
module walgit::tree {
    use sui::object::{new, id, UID, ID};
    use sui::tx_context::{TxContext};
    use std::string::String;
    use sui::transfer::share_object;
    use std::vector::Vector;
    use walgit::blob::{GitBlobObject}; // Assuming blob module is created

    /// Represents an entry within a Git tree (a file or a subdirectory).
    public struct TreeEntry has store, drop {
        /// Mode of the entry (e.g., file, directory).
        mode: u8, // Use constants for modes (e.g., 0x8 for file, 0x4 for directory)
        /// The ID of the referenced GitBlobObject or GitTreeObject.
        object_id: ID,
        /// The name of the file or directory.
        name: String,
    }

    /// Represents a Git tree (a directory).
    public struct GitTreeObject has key, store {
        id: UID,
        /// Entries within this tree.
        entries: Vector<TreeEntry>,
    }

    /// Create a new empty GitTreeObject.
    public fun new(ctx: &mut TxContext): GitTreeObject {
        GitTreeObject {
            id: new(ctx),
            entries: vector::empty(),
        }
    }

    /// Add an entry to the GitTreeObject.
    /// This function is intended to be called internally during the tree building process.
    public fun add_entry(
        tree: &mut GitTreeObject,
        mode: u8,
        object_id: ID,
        name: String,
    ) {
        let entry = TreeEntry {
            mode,
            object_id,
            name,
        };
        vector::push_back(&mut tree.entries, entry);
    }

    /// Get the entries of the GitTreeObject.
    public fun entries(tree: &GitTreeObject): &Vector<TreeEntry> {
        &tree.entries
    }

    /// Share the GitTreeObject (if needed, though typically owned by a Commit).
    public fun share(tree: GitTreeObject) {
        share_object(tree);
    }

    /// Get the ID of the GitTreeObject.
    public fun id(tree: &GitTreeObject): ID {
        id(tree)
    }

    // --- Constants for Entry Modes ---
    // These should ideally be defined in a separate constants module or within this module.
    // For simplicity, defining them here for now.
    public fun mode_file(): u8 { 0x8 } // Example mode for a regular file
    public fun mode_directory(): u8 { 0x4 } // Example mode for a directory
    // Add other modes as needed (e.g., executable, symlink)
}
