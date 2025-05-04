# WalGit Architecture Overview - Implementation Guide

## TASK 1: Understand System Architecture

WalGit is a decentralized version control system with three main components:

1. **WalGit Client**: Command-line interface that users interact with
2. **Sui Blockchain**: Stores the repository structure (commits, trees, references)
3. **Walrus Storage**: Stores the actual file content (blobs)

Diagram of data flow:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  WalGit Client  │────▶│  Sui Blockchain │     │  Walrus Storage │
│  (CLI/Frontend) │◀────│  (Git Structure) │────▶│  (Blob Content) │
│                 │     │                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

YOUR GOAL: Build each component according to this architecture.

---

## TASK 2: Implement Core Data Objects

You need to create the following four Sui objects. Each should be implemented as a separate Move module:

1. **GitRepository Object**
   - Purpose: Represents the entire repository
   - Fields:
     - `id`: Unique identifier
     - `name`: Repository name
     - `owner`: Address of the repository owner
     - `head`: Reference to current branch or commit

2. **GitCommitObject**
   - Purpose: Represents a single commit (snapshot of repository)
   - Fields:
     - `id`: Unique identifier
     - `tree`: ID of the root tree object
     - `parent`: ID of parent commit (null for initial commit)
     - `author`: Address of commit author
     - `message`: Commit message
     - `timestamp`: When commit was created

3. **GitTreeObject**
   - Purpose: Represents a directory
   - Fields:
     - `id`: Unique identifier
     - `entries`: List of tree entries (files and directories)
       - Each entry: {name, type (blob or tree), object_id}

4. **GitBlobObject**
   - Purpose: Represents file content
   - Fields:
     - `id`: Unique identifier
     - `content_id`: Reference to content in Walrus storage
     - `size`: File size in bytes

YOUR GOAL: Create these four object types as Move modules.

---

## TASK 3: Implement Repository Operations

Implement these core Git-like operations:

1. **Initialize Repository**
   - Function: `init_repository(name: String)`
   - Steps:
     - Create new GitRepository object
     - Create empty root tree
     - Set owner to transaction sender

2. **Add File**
   - Function: `add_file(repo: &mut GitRepository, path: String, content: Vec<u8>)`
   - Steps:
     - Upload content to Walrus storage
     - Create GitBlobObject with reference to Walrus content
     - Update appropriate GitTreeObject

3. **Commit Changes**
   - Function: `commit(repo: &mut GitRepository, message: String)`
   - Steps:
     - Create new GitCommitObject referencing current state
     - Set parent to current HEAD
     - Update HEAD to point to new commit

4. **Checkout**
   - Function: `checkout(repo: &GitRepository, commit_id: ID)`
   - Steps:
     - Retrieve GitCommitObject with given ID
     - Retrieve tree structure recursively
     - Download blob content from Walrus
     - Construct local file structure

YOUR GOAL: Implement these four operations as Move functions.

---

## TASK 4: Connect to Walrus Storage

Implement the storage integration:

1. **Store Content**
   - Function: `store_content(content: Vec<u8>) -> ContentID`
   - Steps:
     - Connect to Walrus API
     - Upload content
     - Return content identifier

2. **Retrieve Content**
   - Function: `retrieve_content(content_id: ContentID) -> Vec<u8>`
   - Steps:
     - Connect to Walrus API
     - Request content by ID
     - Return downloaded content

YOUR GOAL: Create a Walrus client module that implements these functions.

---

## TASK 5: Build Command-Line Interface

Create a CLI with these commands:

1. **walgit init [name]**
   - Creates new repository

2. **walgit add [file]**
   - Stages file(s) for commit

3. **walgit commit -m [message]**
   - Creates commit with staged changes

4. **walgit checkout [commit-id]**
   - Switches to specified commit

YOUR GOAL: Implement a CLI application that calls the appropriate Sui functions.

---

## TASK 6: Implement Security Features

Apply these security measures:

1. **Access Control**
   - Only repository owner can modify repository
   - Anyone can read from public repositories
   - Implement capability objects for authorized contributors

2. **Data Validation**
   - Validate all inputs before creating blockchain objects
   - Verify file content integrity using hashes

3. **Error Handling**
   - Implement comprehensive error types
   - Add descriptive error messages
   - Create recovery mechanisms for failed operations

YOUR GOAL: Add these security features to all components.

---

## References

- Sui Move documentation: [https://docs.sui.io/build/move](https://docs.sui.io/build/move)
- Walrus Storage API: [Documentation link to be added]
- Git Internals: [https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain) 