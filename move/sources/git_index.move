#[allow(duplicate_alias, unused_use, unused_const)]
module walgit::git_index {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::transfer;
    use std::vector;
    
    /// Error codes
    const EFileNotFound: u64 = 1;
    const EFileAlreadyExists: u64 = 2;
    const EPermissionDenied: u64 = 3;
    
    /// File status constants
    const FILE_STATUS_ADDED: u8 = 1;
    const FILE_STATUS_MODIFIED: u8 = 2;
    const FILE_STATUS_DELETED: u8 = 3;
    
    /// Represents an entry in the Git index (staging area)
    public struct IndexEntry has store, copy, drop {
        path: String,              // Path of the file within repository
        walrus_blob_id: u256,      // Walrus blob ID for the file content
        size: u64,                 // Size in bytes
        hash: String,              // Git hash of the file content
        mode: u64,                 // File mode/permissions
        status: u8,                // Added, modified, deleted
        timestamp: u64             // When the entry was added to the index
    }
    
    /// Represents the Git index (staging area)
    public struct GitIndex has key, store {
        id: UID,
        repository_id: ID,          // Repository this index belongs to
        entries: Table<String, IndexEntry>, // Map of path to index entry
        parent_commit_id: Option<ID>, // The commit this index is based on
        is_dirty: bool,             // Whether the index has uncommitted changes
        paths: vector<String>       // Tracks all paths in the index for iteration
    }
    
    // Events
    public struct FileStaged has copy, drop {
        repository_id: ID,
        path: String,
        status: u8,
        walrus_blob_id: u256,
        hash: String
    }
    
    public struct IndexReset has copy, drop {
        repository_id: ID,
        commit_id: ID
    }
    
    /// Initialize a new index for a repository
    public fun init_index(
        repository_id: ID,
        parent_commit_id: Option<ID>,
        ctx: &mut TxContext
    ): GitIndex {
        GitIndex {
            id: object::new(ctx),
            repository_id,
            entries: table::new(ctx),
            parent_commit_id,
            is_dirty: false,
            paths: vector::empty<String>()
        }
    }
    
    /// Stage a file (add to the index)
    public fun stage_file(
        index: &mut GitIndex,
        path: String,
        walrus_blob_id: u256,
        size: u64,
        hash: String,
        mode: u64,
        status: u8,
        ctx: &mut TxContext
    ) {
        let timestamp = tx_context::epoch(ctx);

        let entry = IndexEntry {
            path,
            walrus_blob_id,
            size,
            hash,
            mode,
            status,
            timestamp
        };

        // Check if the path already exists in our paths vector
        let path_exists = false;
        let i = 0;
        let paths_len = vector::length(&index.paths);

        while (i < paths_len && !path_exists) {
            if (*vector::borrow(&index.paths, i) == path) {
                path_exists = true;
            };
            i = i + 1;
        };

        // If the path doesn't exist in our tracking vector, add it
        if (!path_exists) {
            vector::push_back(&mut index.paths, path);
        };

        // If entry already exists in the table, update it
        if (table::contains(&index.entries, path)) {
            table::remove(&mut index.entries, path);
        };

        table::add(&mut index.entries, path, entry);
        index.is_dirty = true;

        event::emit(FileStaged {
            repository_id: index.repository_id,
            path: entry.path,
            status: entry.status,
            walrus_blob_id: entry.walrus_blob_id,
            hash: entry.hash
        });
    }
    
    /// Stage a file deletion
    public fun stage_deletion(
        index: &mut GitIndex,
        path: String,
        ctx: &mut TxContext
    ) {
        // Ensure the file exists in the index
        assert!(table::contains(&index.entries, path), EFileNotFound);

        let entry = table::borrow(&index.entries, path);

        // Create a modified entry with deleted status
        let timestamp = tx_context::epoch(ctx);

        let deleted_entry = IndexEntry {
            path: entry.path,
            walrus_blob_id: entry.walrus_blob_id,
            size: entry.size,
            hash: entry.hash,
            mode: entry.mode,
            status: FILE_STATUS_DELETED,
            timestamp
        };

        // Check if the path already exists in our paths vector
        let path_exists = false;
        let i = 0;
        let paths_len = vector::length(&index.paths);

        while (i < paths_len && !path_exists) {
            if (*vector::borrow(&index.paths, i) == path) {
                path_exists = true;
            };
            i = i + 1;
        };

        // If the path doesn't exist in our tracking vector, add it
        if (!path_exists) {
            vector::push_back(&mut index.paths, path);
        };

        table::remove(&mut index.entries, path);
        table::add(&mut index.entries, path, deleted_entry);
        index.is_dirty = true;

        event::emit(FileStaged {
            repository_id: index.repository_id,
            path,
            status: FILE_STATUS_DELETED,
            walrus_blob_id: deleted_entry.walrus_blob_id,
            hash: deleted_entry.hash
        });
    }
    
    /// Get all staged entries (for commit preparation)
    public fun get_staged_entries(index: &GitIndex): vector<IndexEntry> {
        // Create a storage vector for the result
        let result = vector::empty<IndexEntry>();

        // Get the number of entries in the table
        let entry_count = table::length(&index.entries);

        // If there are no entries, return empty vector
        if (entry_count == 0) {
            return result
        };

        // Iterate through all paths in the index.paths vector
        let i = 0;
        let paths_len = vector::length(&index.paths);

        while (i < paths_len) {
            let path = *vector::borrow(&index.paths, i);
            
            // Only add entries that exist in the table
            if (table::contains(&index.entries, path)) {
                let entry = table::borrow(&index.entries, path);
                
                // Only include entries that are not marked as deleted
                if (entry.status != FILE_STATUS_DELETED) {
                    vector::push_back(&mut result, *entry);
                };
            };
            i = i + 1;
        };

        result
    }
    
    /// Reset the index to match a commit
    public fun reset_index(
        index: &mut GitIndex,
        commit_id: ID
    ) {
        // Clear all entries by iterating through the paths vector
        let i = 0;
        let paths_len = vector::length(&index.paths);

        // First copy all paths to a separate vector to avoid modification during iteration
        let paths_to_clear = vector::empty<String>();
        while (i < paths_len) {
            vector::push_back(&mut paths_to_clear, *vector::borrow(&index.paths, i));
            i = i + 1;
        };

        // Now clear each entry in the table
        i = 0;
        paths_len = vector::length(&paths_to_clear);
        while (i < paths_len) {
            let path = *vector::borrow(&paths_to_clear, i);
            if (table::contains(&index.entries, path)) {
                table::remove(&mut index.entries, path);
            };
            i = i + 1;
        };

        // Clear the paths vector as well
        vector::clear(&mut index.paths);

        index.parent_commit_id = option::some(commit_id);
        index.is_dirty = false;

        event::emit(IndexReset {
            repository_id: index.repository_id,
            commit_id
        });
    }
    
    // === Getter functions ===
    
    public fun is_dirty(index: &GitIndex): bool {
        index.is_dirty
    }
    
    public fun parent_commit_id(index: &GitIndex): &Option<ID> {
        &index.parent_commit_id
    }
    
    public fun file_exists(index: &GitIndex, path: String): bool {
        table::contains(&index.entries, path)
    }
    
    public fun get_entry(index: &GitIndex, path: String): &IndexEntry {
        table::borrow(&index.entries, path)
    }
    
    public fun entry_count(index: &GitIndex): u64 {
        table::length(&index.entries)
    }
}