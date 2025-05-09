#[allow(duplicate_alias, unused_use, unused_const, unused_variable)]
module walgit::git_tree_object {
    use sui::object::{Self, UID, ID};
    use std::vector;
    use std::string::String;
    use sui::tx_context::TxContext;
    use sui::event;

    /// Error codes
    const EEntryAlreadyExists: u64 = 1;
    const EEntryNotFound: u64 = 2;
    
    /// Entry types
    const ENTRY_TYPE_BLOB: u8 = 0;
    const ENTRY_TYPE_TREE: u8 = 1;

    /// Represents an entry in a tree (file or directory)
    public struct TreeEntry has store, copy, drop {
        name: String, // Name of the entry
        entry_type: u8, // Type of entry (0 for blob, 1 for tree)
        object_id: ID, // ID of the object
        hash: String // Git hash of the entry
    }

    /// Represents a directory in a git repository
    public struct GitTreeObject has key, store {
        id: UID,
        entries: vector<TreeEntry>, // List of tree entries
        hash: String // Git hash of the tree (based on entries)
    }
    
    // Event emitted when a git tree is created
    public struct GitTreeCreated has copy, drop {
        object_id: address,
        entries_count: u64,
        hash: String
    }
    
    // Event emitted when a tree entry is added
    public struct TreeEntryAdded has copy, drop {
        tree_id: address,
        entry_name: String,
        entry_type: u8,
        entry_object_id: ID
    }

    /// Creates a new empty tree object
    public fun create(hash: String, ctx: &mut TxContext): GitTreeObject {
        let id = object::new(ctx);
        let object_id = object::uid_to_address(&id);
        
        let tree = GitTreeObject {
            id,
            entries: vector::empty<TreeEntry>(),
            hash
        };
        
        event::emit(GitTreeCreated {
            object_id,
            entries_count: 0,
            hash
        });
        
        tree
    }
    
    /// Add an entry to a tree
    public fun add_entry(
        tree: &mut GitTreeObject, 
        name: String, 
        entry_type: u8, 
        object_id: ID,
        hash: String,
        ctx: &mut TxContext
    ) {
        // Check if entry with same name already exists
        let mut i = 0;
        let len = vector::length(&tree.entries);
        while (i < len) {
            let entry = vector::borrow(&tree.entries, i);
            // Entry name must be unique in a tree
            assert!(entry.name != name, EEntryAlreadyExists);
            i = i + 1;
        };
        
        let entry = TreeEntry {
            name,
            entry_type,
            object_id,
            hash
        };
        
        vector::push_back(&mut tree.entries, entry);
        
        event::emit(TreeEntryAdded {
            tree_id: object::uid_to_address(&tree.id),
            entry_name: entry.name,
            entry_type: entry.entry_type,
            entry_object_id: entry.object_id
        });
    }
    
    // Getter functions
    public fun entries(self: &GitTreeObject): &vector<TreeEntry> { &self.entries }
    public fun hash(self: &GitTreeObject): String { self.hash }
    public fun entry_count(self: &GitTreeObject): u64 { vector::length(&self.entries) }
    
    // TreeEntry getters
    public fun entry_name(entry: &TreeEntry): String { entry.name }
    public fun entry_type(entry: &TreeEntry): u8 { entry.entry_type }
    public fun entry_object_id(entry: &TreeEntry): ID { entry.object_id }
    public fun entry_hash(entry: &TreeEntry): String { entry.hash }
}
