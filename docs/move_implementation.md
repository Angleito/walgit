# Sui Move Implementation Guide

This document explains the core Move modules that implement the Git tree structure on Sui blockchain with Walrus storage integration.

## Module Structure

Our implementation consists of several Move modules that together create a Git-like version control system:

```
walgit.move        # Entry module and package definition
repository.move    # Repository management operations
blob.move          # File content representation (links to Walrus)
tree.move          # Directory structure representation
commit.move        # Commit history and version snapshots
storage.move       # Walrus storage integration
```

## Data Structures

### GitBlobObject (blob.move)

```move
struct GitBlobObject has key, store {
    id: UID,
    walrus_blob_id: vector<u8>,    // Walrus content identifier
    size: u64,                     // Size of the content in bytes
    file_name: String,             // Original file name
    file_mode: u8                  // File mode (permissions)
}
```

The `GitBlobObject` represents a file's content, storing a reference to the actual content in Walrus storage. This structure allows us to keep large file contents off-chain while maintaining references on-chain.

### TreeEntry (tree.move)

```move
struct TreeEntry has store, copy, drop {
    mode: u8,                      // Entry mode (file, directory, etc.)
    name: String,                  // Entry name
    object_id: ID                  // ID of the referenced object (blob or tree)
}
```

### GitTreeObject (tree.move)

```move
struct GitTreeObject has key, store {
    id: UID,
    entries: vector<TreeEntry>,    // Directory contents
    parent_id: Option<ID>          // Parent directory (optional)
}
```

The `GitTreeObject` represents a directory structure, containing references to files (blobs) and other directories (trees). This structure mimics Git's tree objects which represent the state of a directory.

### GitCommitObject (commit.move)

```move
struct GitCommitObject has key, store {
    id: UID,
    root_tree_id: ID,              // Root tree of this commit
    parent_commit_ids: vector<ID>, // Parent commit(s)
    message: String,               // Commit message
    author: String,                // Author information
    timestamp: u64,                // Commit timestamp
    signature: Option<vector<u8>>  // Optional signature
}
```

The `GitCommitObject` represents a snapshot of the repository at a point in time, referencing the root tree of that snapshot and linking to parent commits to form the commit history.

### GitRepository (repository.move)

```move
struct GitRepository has key {
    id: UID,
    name: String,
    head_commit_id: Option<ID>,    // HEAD reference
    branches: Table<String, ID>,   // Branch references
    tags: Table<String, ID>,       // Tag references
    owner: address,                // Repository owner
    collaborators: vector<address> // Authorized collaborators
}
```

The `GitRepository` is the top-level object representing a version-controlled project, tracking the current state (HEAD) and references to important commits (branches, tags).

## Core Operations

### Repository Initialization

```move
public entry fun init_repo(
    ctx: &mut TxContext,
    name: String
) {
    // Create an empty root tree
    let root_tree = create_empty_tree(ctx);
    let root_tree_id = object::id(&root_tree);
    
    // Create initial commit with no parents
    let initial_commit = create_commit(
        ctx,
        root_tree_id,
        vector[],
        string::utf8(b"Initial commit"),
        // ... other commit details
    );
    
    // Create repository object
    let repo = GitRepository {
        id: object::new(ctx),
        name,
        head_commit_id: option::some(object::id(&initial_commit)),
        branches: table::new(ctx),
        tags: table::new(ctx),
        owner: tx_context::sender(ctx),
        collaborators: vector[]
    };
    
    // Add master branch reference
    table::add(&mut repo.branches, string::utf8(b"master"), object::id(&initial_commit));
    
    // Transfer objects
    transfer::public_share_object(repo);
    transfer::public_share_object(root_tree);
    transfer::public_share_object(initial_commit);
}
```

### Creating a Commit

```move
public entry fun create_commit(
    repo: &mut GitRepository,
    new_tree_entries: vector<EntryUpdate>,
    parent_commit_id: ID,
    message: String,
    author: String,
    ctx: &mut TxContext
) {
    // Verify transaction sender is authorized
    verify_access(repo, ctx);
    
    // Build new tree structure from parent commit's tree
    let parent_commit = object::borrow<GitCommitObject>(parent_commit_id);
    let new_root_tree_id = build_tree_from_updates(
        parent_commit.root_tree_id,
        new_tree_entries,
        ctx
    );
    
    // Create new commit object
    let new_commit = GitCommitObject {
        id: object::new(ctx),
        root_tree_id: new_root_tree_id,
        parent_commit_ids: vector[parent_commit_id],
        message,
        author,
        timestamp: timestamp_now(),
        signature: option::none()
    };
    
    // Update repository HEAD
    repo.head_commit_id = option::some(object::id(&new_commit));
    
    // Transfer commit object
    transfer::public_share_object(new_commit);
}
```

## Walrus Integration

The `storage.move` module handles interaction with Walrus decentralized storage:

```move
public fun create_blob_from_walrus(
    walrus_blob_id: vector<u8>,
    size: u64,
    file_name: String,
    file_mode: u8,
    ctx: &mut TxContext
): GitBlobObject {
    GitBlobObject {
        id: object::new(ctx),
        walrus_blob_id,
        size,
        file_name,
        file_mode
    }
}
```

This function creates a new `GitBlobObject` that references content stored in Walrus, identified by the `walrus_blob_id`.

## Access Control

Repositories implement access control to ensure only authorized users can modify the repository:

```move
fun verify_access(repo: &GitRepository, ctx: &TxContext) {
    let sender = tx_context::sender(ctx);
    assert!(
        sender == repo.owner || vector::contains(&repo.collaborators, &sender),
        ENotAuthorized
    );
}
```

## Security Considerations

1. **Object Ownership**: Objects are shared to ensure they can be accessed by authorized users.
2. **Access Control**: Only repository owners and collaborators can modify the repository.
3. **Data Integrity**: Commit history forms a cryptographically linked chain, ensuring immutability.
4. **Storage Efficiency**: Large file contents are stored off-chain in Walrus, keeping on-chain costs manageable. 