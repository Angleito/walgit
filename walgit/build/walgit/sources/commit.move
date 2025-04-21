module walgit::commit {
    // Removed unnecessary ID, UID aliases
    use sui::object::{new, id};
    // Removed unnecessary TxContext alias
    use sui::tx_context::{sender};
    use std::string::{String};
    use sui::transfer::{share_object};
    use sui::event;
    use walgit::repository::{Repository, assert_can_write};
    // Removed unnecessary Option alias and the unused std::option import
    use sui::clock::{timestamp_ms, Clock};

    public struct Commit has key, store {
        id: UID, // UID is implicitly available
        repo_id: ID, // ID is implicitly available
        message: String,
        author: address,
        walrus_blob_id: String, // Points to content in Walrus
        timestamp: u64,
        parent_commit_id: Option<ID> // Option and ID are implicitly available
    }

    // Events
    public struct CommitCreated has copy, drop {
        commit_id: ID, // ID is implicitly available
        repo_id: ID, // ID is implicitly available
        author: address,
        message: String
    }

    // --- Event Getters ---

    public fun event_commit_id(event: &CommitCreated): ID {
        event.commit_id
    }

    public fun event_repo_id(event: &CommitCreated): ID {
        event.repo_id
    }

    public fun event_author(event: &CommitCreated): address {
        event.author
    }

    public fun event_message(event: &CommitCreated): String {
        event.message // Assumes String has copy
    }

    // Create a new commit
    public entry fun create_commit(
        repo: &Repository,
        message: String,
        walrus_blob_id: String,
        parent_commit_id: Option<ID>, // Option and ID are implicitly available
        clock: &Clock,
        ctx: &mut TxContext // TxContext is implicitly available
    ) {
        let author = sender(ctx);
        let repo_id = id(repo); // Use imported id function

        // Check if sender is owner or has write access
        assert_can_write(repo, author); // Use specific import

        let id_uid = new(ctx); // Renamed variable for clarity
        let timestamp = timestamp_ms(clock); // Use specific import

        let commit = Commit {
            id: id_uid, // Use the UID directly
            repo_id,
            message,
            author,
            walrus_blob_id,
            timestamp,
            parent_commit_id
        };

        event::emit(CommitCreated {
            commit_id: id(&commit), // Use imported id function
            repo_id,
            author,
            message
        });

        share_object(commit); // Use specific import
    }

    // --- Getter Functions ---

    public fun author(commit: &Commit): address {
        commit.author
    }

    public fun walrus_blob_id(commit: &Commit): String {
        commit.walrus_blob_id // Assumes String has copy
    }
}
