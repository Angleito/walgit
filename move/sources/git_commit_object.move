#[allow(duplicate_alias, unused_use)]
module walgit::git_commit_object {
    use sui::object::{Self, UID, ID};
    use std::option::{Self, Option};
    use std::string::String;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    /// Represents a single commit (snapshot of repository)
    public struct GitCommitObject has key, store {
        id: UID,
        tree_id: ID, // ID of the root tree object
        parent_commit_id: Option<ID>, // ID of parent commit (none for initial commit)
        author: address, // Address of commit author
        committer: address, // Address of committer (may be different from author)
        message: String, // Commit message
        timestamp: u64, // When commit was created (unix timestamp)
        hash: String, // Git hash of the commit
        walrus_metadata_blob_id: Option<u256> // Optional reference to additional metadata stored in Walrus
    }

    // Event emitted when a git commit is created
    public struct GitCommitCreated has copy, drop {
        object_id: address,
        tree_id: ID,
        parent_commit_id: Option<ID>,
        author: address,
        committer: address,
        timestamp: u64,
        hash: String
    }

    /// Creates a new git commit object
    public fun create(
        tree_id: ID,
        parent_commit_id: Option<ID>,
        message: String,
        hash: String,
        walrus_metadata_blob_id: Option<u256>,
        ctx: &mut TxContext
    ): GitCommitObject {
        let id = object::new(ctx);
        let author = tx_context::sender(ctx);
        let committer = author; // Same as author by default
        let timestamp = tx_context::epoch(ctx); // Using epoch as timestamp
        let object_id = object::uid_to_address(&id);
        
        let commit = GitCommitObject {
            id,
            tree_id,
            parent_commit_id,
            author,
            committer,
            message,
            timestamp,
            hash,
            walrus_metadata_blob_id
        };
        
        event::emit(GitCommitCreated {
            object_id,
            tree_id,
            parent_commit_id,
            author,
            committer,
            timestamp,
            hash
        });
        
        commit
    }
    
    // Getter functions
    public fun tree_id(self: &GitCommitObject): ID { self.tree_id }
    public fun parent_commit_id(self: &GitCommitObject): &Option<ID> { &self.parent_commit_id }
    public fun has_parent(self: &GitCommitObject): bool { option::is_some(&self.parent_commit_id) }
    public fun author(self: &GitCommitObject): address { self.author }
    public fun committer(self: &GitCommitObject): address { self.committer }
    public fun message(self: &GitCommitObject): String { self.message }
    public fun timestamp(self: &GitCommitObject): u64 { self.timestamp }
    public fun hash(self: &GitCommitObject): String { self.hash }
    public fun walrus_metadata_blob_id(self: &GitCommitObject): &Option<u256> { &self.walrus_metadata_blob_id }
}
