/*
/// Module: walgit
*/
#[allow(duplicate_alias, unused_use)]
module walgit::walgit {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use std::string::String;
    use sui::event;
    use sui::transfer::share_object;
    use walgit::storage;
    use walgit::git_repository;
    use walgit::git_blob_object;
    use walgit::git_tree_object;
    use walgit::git_commit_object;
    use walgit::git_reference;
    use walgit::git_index;
    use walgit::git_merge;

    /// Represents the main WalGit entry point for interacting with Git repositories
    public struct WalGit has key {
        id: UID,
        version: String,
        admin: address
    }

    /// Event emitted when WalGit is initialized
    public struct WalGitInitialized has copy, drop {
        id: ID,
        version: String,
        admin: address
    }

    /// Initialize the WalGit system
    fun init(ctx: &mut TxContext) {
        let walgit = WalGit {
            id: object::new(ctx),
            version: std::string::utf8(b"1.0.0"),
            admin: tx_context::sender(ctx)
        };

        event::emit(WalGitInitialized {
            id: object::id(&walgit),
            version: walgit.version,
            admin: walgit.admin
        });

        share_object(walgit);
    }

    /// Create a new Git repository with all necessary components
    /// Following latest Sui object model best practices
    public entry fun create_repository(
        name: String,
        description: String,
        default_branch: String,
        storage_quota: &mut storage::StorageQuota,
        ctx: &mut TxContext
    ) {
        // Create the repository with proper object sharing
        let repo = git_repository::create_repository_object(
            name, 
            description, 
            default_branch, 
            storage_quota, 
            ctx
        );
        
        // Share the repository object to make it accessible
        sui::transfer::share_object(repo);
    }

    /// Helper function to get the version
    public fun version(_walgit: &WalGit): String {
        _walgit.version
    }

    /// Helper function to get the admin
    public fun admin(_walgit: &WalGit): address {
        _walgit.admin
    }
}

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions
