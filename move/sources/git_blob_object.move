#[allow(duplicate_alias, unused_use)]
module walgit::git_blob_object {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use std::string::String;
    use sui::transfer;
    use sui::event;

    /// Error codes
    const EInvalidBlobId: u64 = 1;

    /// Represents file content in a git repository
    /// The content itself is stored in Walrus storage, while this object
    /// stores metadata and reference to that content
    public struct GitBlobObject has key, store {
        id: UID,
        walrus_blob_id: u256, // Reference to blob ID in Walrus storage
        size: u64, // File size in bytes
        hash: String, // SHA-1 hash of the content (git standard)
        encoding: u8 // Content encoding type
    }

    // Event emitted when a git blob is created
    public struct GitBlobCreated has copy, drop {
        object_id: address,
        walrus_blob_id: u256,
        size: u64,
        hash: String
    }

    /// Creates a new GitBlobObject referencing content in Walrus storage
    public fun create(
        walrus_blob_id: u256,
        size: u64,
        hash: String,
        encoding: u8,
        ctx: &mut TxContext
    ): GitBlobObject {
        // Validate inputs (e.g., ensure walrus_blob_id is not zero)
        assert!(walrus_blob_id != 0, EInvalidBlobId);
        
        let id = object::new(ctx);
        let object_id = object::uid_to_address(&id);
        
        // Create the blob object
        let blob = GitBlobObject {
            id,
            walrus_blob_id,
            size,
            hash,
            encoding
        };
        
        // Emit event
        event::emit(GitBlobCreated {
            object_id,
            walrus_blob_id,
            size,
            hash
        });
        
        blob
    }
    
    // Getter functions
    public fun walrus_blob_id(self: &GitBlobObject): u256 { self.walrus_blob_id }
    public fun size(self: &GitBlobObject): u64 { self.size }
    public fun hash(self: &GitBlobObject): String { self.hash }
    public fun encoding(self: &GitBlobObject): u8 { self.encoding }
}
