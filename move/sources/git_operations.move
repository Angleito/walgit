#[allow(duplicate_alias, unused_use, unused_const, unused_variable)]
module walgit::git_operations {
    use sui::transfer;
    use sui::tx_context::{TxContext, sender};
    use sui::object::{Self, ID, UID};
    use std::vector;
    use std::string::String;
    use std::option::{Self, Option, none, some};
    use walgit::git_repository::{Self, GitRepository};
    use walgit::git_tree_object::{Self, GitTreeObject, TreeEntry};
    use walgit::git_blob_object::{Self, GitBlobObject};
    use walgit::git_commit_object::{Self, GitCommitObject};
    use walgit::storage;

    // Initialize repository with all necessary Git objects
    public entry fun init_repository(name: String, description: String, ctx: &mut TxContext) {
        // Create a storage quota for the repository
        let mut storage = walgit::storage::create_test_quota(100000, sender(ctx), ctx);
        
        // Create empty root tree
        let root_tree = git_tree_object::create(
            std::string::utf8(b"empty_tree_hash"), 
            ctx
        );
        
        // Create initial commit with empty tree
        let initial_commit = git_commit_object::create(
            object::id(&root_tree),
            none<ID>(),
            std::string::utf8(b"Initial commit"),
            std::string::utf8(b"initial_commit_hash"),
            none<u256>(),
            ctx
        );
        
        // Create the repository (this function handles sharing the repo object)
        git_repository::create_repository(
            name,
            description,
            std::string::utf8(b"main"),
            &mut storage,
            ctx
        );
        
        // Share the core Git objects with the network
        transfer::public_share_object(root_tree);
        transfer::public_share_object(initial_commit);
        
        // Share the storage quota object too
        transfer::public_share_object(storage);
    }

    // Add file - Simplified; assumes updating root tree for now
    public entry fun add_file(tree: &mut GitTreeObject, path: String, content_hash: String, blob_id: u256, size: u64, ctx: &mut TxContext) {
        // Create blob object referencing Walrus content
        let blob = git_blob_object::create(
            blob_id,
            size,
            content_hash,
            0, // plaintext encoding
            ctx
        );
        
        // Add an entry to the tree
        git_tree_object::add_entry(
            tree,
            path,
            0, // blob type
            object::id(&blob),
            content_hash,
            ctx
        );
        
        // Share the blob object
        transfer::public_share_object(blob);
    }

    // Create a new commit and set it as the HEAD of the repository
    public entry fun commit(
        repo: &mut GitRepository, 
        current_commit: &GitCommitObject, 
        message: String, 
        commit_hash: String, 
        ctx: &mut TxContext
    ) {
        // Extract the tree ID from the current commit
        let tree_id = git_commit_object::tree_id(current_commit);
        let current_commit_id = object::id(current_commit);
        
        // Create a new commit object
        let new_commit = git_commit_object::create(
            tree_id,
            some(current_commit_id),
            message,
            commit_hash,
            none<u256>(),
            ctx
        );
        
        // Get the ID of the new commit
        let new_commit_id = object::id(&new_commit);
        
        // Update the repository's HEAD reference to point to the new commit
        git_repository::update_head(repo, new_commit_id, ctx);
        
        // Share the new commit object with the network
        transfer::public_share_object(new_commit);
    }

    // Checkout - Note: This may not be fully implementable on-chain; consider off-chain logic for downloading content
    // Changed to a public view function since checkout is read-only and doesn't modify state
    public fun checkout(commit: &GitCommitObject) : ID {
        // Return the tree ID of the commit; off-chain logic can handle retrieving the tree and downloading content from Walrus
        git_commit_object::tree_id(commit)
    }
}
