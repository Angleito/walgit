module walgit::commit {
 
    use sui::object::{new, id, UID, ID};

    use sui::tx_context::{sender, TxContext};
    use std::string::{String};
    use sui::transfer::{share_object};
    use sui::event;
    use walgit::repository::{Repository, assert_can_write};
    use walgit::tree::{GitTreeObject, id as tree_id}; // Import tree_id function

    use sui::clock::{timestamp_ms, Clock};
    use std::option::{Option};

    public struct Commit has key, store {
        id: UID,
        repo_id: ID,
        message: String,
        author: address,
        root_tree_id: ID, // Reference to the root tree object
        timestamp: u64,
        parent_commit_id: Option<ID>
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
        root_tree: &GitTreeObject,
        parent_commit_id: Option<ID>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let author = sender(ctx);
        let repo_id = id(repo);

        // Check if sender is owner or has write access
        assert_can_write(repo, author);

        let id_uid = new(ctx);
        let timestamp = timestamp_ms(clock);
        let root_tree_id = tree_id(root_tree); // Use the imported tree_id function

        let commit = Commit {
            id: id_uid,
            repo_id,
            message,
            author,
            root_tree_id,
            timestamp,
            parent_commit_id
        };

        event::emit(CommitCreated {
            commit_id: id(&commit),
            repo_id,
            author,
            message
        });

        share_object(commit);
    }

    // --- Getter Functions ---

    public fun author(commit: &Commit): address {
        commit.author
    }

    public fun root_tree_id(commit: &Commit): ID {
        commit.root_tree_id
    }
}
