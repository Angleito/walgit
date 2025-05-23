# WalGit Architecture Documentation

## Overview

WalGit is a decentralized version control system built on the Sui blockchain with integrated Walrus storage. It combines traditional Git-like functionality with blockchain technology to provide a secure, distributed, and transparent version control solution.

## System Components

WalGit consists of three main components:

1. **WalGit Client** (Backend & Frontend)
2. **Sui Blockchain** (Smart Contracts)
3. **Walrus Storage** (Content Storage)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                         WalGit Client                            │
│                                                                  │
│  ┌─────────────────────┐            ┌─────────────────────────┐  │
│  │                     │            │                         │  │
│  │  CLI (Node.js)      │            │  Frontend (React/Next)  │  │
│  │                     │            │                         │  │
│  └─────────────────────┘            └─────────────────────────┘  │
│              │                                  │                 │
└──────────────┼──────────────────────────────────┼─────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                       Sui Blockchain                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  Smart Contracts (Move)                                     │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │ Repository  │  │  Commit     │  │   Tree      │         │ │
│  │  │  Structure  │◄─┤  History    │◄─┤  Structure  │────────┐│ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘        ││ │
│  │                                                           ││ │
│  │                                     ┌─────────────┐       ││ │
│  │                                     │    Blob     │◄──────┘│ │
│  │                                     │  References │        │ │
│  │                                     └─────────────┘        │ │
│  │                                           │                │ │
│  └───────────────────────────────────────────┼────────────────┘ │
│                                              │                   │
└──────────────────────────────────────────────┼───────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                       Walrus Storage                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │  File       │  │ Content     │  │ Binary      │         │ │
│  │  │  Content    │  │ Addressing  │  │ Assets      │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Repository Initialization
1. User creates a repository through CLI or web interface
2. Client sends transaction to Sui blockchain
3. Smart contract creates a Repository object with empty tree
4. Repository metadata (name, owner) is stored on-chain
5. Initial HEAD reference is created (points to null/empty state)

### Adding Files
1. User adds files to staging area (CLI: `walgit add` or web UI)
2. File content is uploaded to Walrus storage
3. Content identifiers are returned from Walrus
4. Client prepares blob objects with references to Walrus content
5. Repository index is updated locally

### Committing Changes
1. User creates a commit with a message
2. Client builds tree objects from staged files
3. Transaction is sent to Sui blockchain:
   - Creates blob objects referencing Walrus content
   - Creates tree objects for directory structure
   - Creates commit object with reference to root tree
   - Updates HEAD reference to point to new commit
4. Blockchain records the transaction immutably

### Cloning/Fetching Repository
1. User requests repository data
2. Client fetches repository structure from Sui blockchain
3. Client retrieves tree and commit objects
4. For each blob reference, content is retrieved from Walrus
5. Local working directory is populated with files

## Component Architecture

### 1. Smart Contracts (Move)

The Move contracts implement the core Git data model with four primary object types:

#### GitRepository Object
```move
struct GitRepository has key {
    id: UID,
    name: String,
    owner: address,
    head: Option<ID>,
    default_branch: String,
    visibility: u8, // 0: private, 1: public
    contributors: vector<address>,
    storage_quota: u64,
    storage_used: u64,
    created_at: u64,
}
```

#### GitCommitObject
```move
struct GitCommitObject has key {
    id: UID,
    tree: ID,
    parent: Option<ID>,
    author: address,
    message: String,
    timestamp: u64,
    repository: ID,
}
```

#### GitTreeObject
```move
struct GitTreeEntry has store {
    name: String,
    object_type: u8, // 0: blob, 1: tree
    object_id: ID,
    mode: u16, // Unix file mode
}

struct GitTreeObject has key {
    id: UID,
    entries: vector<GitTreeEntry>,
    repository: ID,
}
```

#### GitBlobObject
```move
struct GitBlobObject has key {
    id: UID,
    content_id: String, // Walrus content identifier
    size: u64,
    repository: ID,
    hash: vector<u8>, // SHA-256 hash of content
}
```

#### GitReference
```move
struct GitReference has key {
    id: UID,
    name: String, // branch or tag name
    ref_type: u8, // 0: branch, 1: tag
    target: ID,  // points to commit object
    repository: ID,
}
```

### 2. CLI/Backend (Node.js)

The CLI provides Git-like commands for interacting with WalGit repositories:

```
walgit-backend/
├── cli/
│   ├── src/
│   │   ├── commands/           # Command implementations
│   │   │   ├── init.js         # Initialize new repository
│   │   │   ├── add.js          # Stage files for commit
│   │   │   ├── commit.js       # Create new commit
│   │   │   ├── checkout.js     # Switch branches/commits
│   │   │   ├── branch.js       # Manage branches
│   │   │   ├── clone.js        # Clone repositories
│   │   │   ├── push.js         # Push to remote
│   │   │   ├── pull.js         # Pull from remote
│   │   │   ├── log.js          # View commit history
│   │   │   ├── status.js       # Check working tree status
│   │   │   ├── pr.js           # Manage pull requests
│   │   │   └── ...
│   │   ├── utils/              # Utility functions
│   │   │   ├── repository.js   # Repository operations
│   │   │   ├── tree-builder.js # Build tree structures
│   │   │   ├── blob-manager.js # Manage file content
│   │   │   ├── sui-integration.js # Blockchain interactions
│   │   │   ├── walrus-integration.js # Storage interactions
│   │   │   ├── auth.js         # Authentication
│   │   │   ├── config.js       # Configuration
│   │   │   └── ...
│   │   └── index.js            # CLI entry point
│   └── ...
└── ...
```

The CLI component handles:
- Local Git operations (working directory, staging)
- User authentication with Sui wallet
- Blockchain transactions (via Sui SDK)
- Walrus API integration for content storage/retrieval
- Pull request and code review management

### 3. Frontend (React/Next.js)

The frontend provides a web-based interface for WalGit:

```
walgit-frontend/
├── src/
│   ├── app/                    # Next.js pages
│   │   ├── page.tsx            # Home page
│   │   ├── new-repository/     # Repository creation
│   │   ├── repositories/       # Repository browsing
│   │   │   └── [owner]/[repo]/ # Repository view
│   │   │       ├── page.tsx    # Repository overview
│   │   │       ├── pulls/      # Pull requests
│   │   │       └── ...
│   │   └── ...
│   ├── components/             # React components
│   │   ├── layout/             # Layout components
│   │   ├── repository/         # Repository-related components
│   │   ├── code-review/        # Code review components
│   │   ├── wallet/             # Wallet integration
│   │   └── ui/                 # UI primitives
│   ├── hooks/                  # Custom React hooks
│   │   └── ...
│   ├── lib/                    # Utilities and helpers
│   │   └── utils.ts
│   └── ...
└── ...
```

The frontend includes:
- Repository browsing and management
- Code viewing and editing interface
- Pull request and review UI
- Wallet connection for authentication
- Storage management interface

## Authentication & Security

### Authentication Flow

1. **User Authentication**:
   - Users connect their Sui wallet (Frontend)
   - CLI uses local wallet configuration
   - Authentication is verified on-chain

2. **Authorization**:
   - Repository owners have full access
   - Contributors have permission-based access
   - Public repositories allow read-only access to all

### Security Features

1. **Access Control**:
   ```move
   // Example: Owner-only permission check
   public fun verify_owner(repo: &GitRepository, caller: address) {
       assert!(repo.owner == caller, ERROR_NOT_OWNER);
   }
   
   // Example: Contributor check
   public fun verify_contributor(repo: &GitRepository, caller: address) {
       let is_owner = repo.owner == caller;
       let is_contributor = vector::contains(&repo.contributors, &caller);
       assert!(is_owner || is_contributor, ERROR_NOT_CONTRIBUTOR);
   }
   ```

2. **Content Integrity**:
   - File content is hashed before storage
   - Hashes are verified on retrieval
   - Immutable commit history on blockchain

3. **Storage Quotas**:
   ```move
   // Example: Storage quota check
   public fun check_storage_quota(repo: &GitRepository, additional_size: u64) {
       assert!(
           repo.storage_used + additional_size <= repo.storage_quota,
           ERROR_QUOTA_EXCEEDED
       );
   }
   ```

## Storage Integration

### Walrus Storage

Walrus provides decentralized content-addressable storage:

1. **Content Upload**:
   ```javascript
   // Example: Upload file to Walrus
   async function storeContent(content) {
     const walrusClient = new WalrusClient(config.walrusEndpoint);
     const contentId = await walrusClient.upload(content);
     return contentId;
   }
   ```

2. **Content Retrieval**:
   ```javascript
   // Example: Retrieve file from Walrus
   async function retrieveContent(contentId) {
     const walrusClient = new WalrusClient(config.walrusEndpoint);
     const content = await walrusClient.download(contentId);
     return content;
   }
   ```

3. **Storage Management**:
   - Storage quota enforced on-chain
   - Usage tracking for repositories
   - Optimized storage for repository data

## Code Review & Pull Requests

WalGit includes a code review system:

1. **Pull Request Creation**:
   - Source and target branches specified
   - Changes automatically detected
   - PR metadata stored on-chain

2. **Review Process**:
   - Reviewers can comment on specific lines
   - Approval/rejection workflow
   - Automated checks integration

3. **Merge Process**:
   - Automated on-chain merge transactions
   - Conflict detection and resolution
   - Post-merge cleanup

## Error Handling

The system implements comprehensive error handling:

1. **Smart Contract Errors**:
   ```move
   // Example: Error constants
   const ERROR_NOT_OWNER: u64 = 1;
   const ERROR_NOT_CONTRIBUTOR: u64 = 2;
   const ERROR_QUOTA_EXCEEDED: u64 = 3;
   const ERROR_INVALID_REFERENCE: u64 = 4;
   const ERROR_MERGE_CONFLICT: u64 = 5;
   // ...
   ```

2. **CLI Error Handling**:
   ```javascript
   // Example: Error handling in CLI
   try {
     // Operation code
   } catch (error) {
     if (error instanceof SuiTransactionError) {
       console.error('Blockchain error:', error.message);
     } else if (error instanceof WalrusStorageError) {
       console.error('Storage error:', error.message);
     } else {
       console.error('Unknown error:', error);
     }
     process.exit(1);
   }
   ```

3. **Frontend Error Handling**:
   ```typescript
   // Example: Error handling in React components
   try {
     // Operation code
   } catch (error) {
     toast({
       title: "Operation Failed",
       description: error.message,
       variant: "destructive"
     });
   }
   ```

## Transaction Flow

### Commit Creation Flow

```
┌────────────┐      ┌────────────┐      ┌────────────┐      ┌────────────┐
│            │      │            │      │            │      │            │
│   Client   │──1──▶│   Walrus   │──2──▶│   Client   │──3──▶│    Sui     │
│            │      │            │      │            │      │            │
└────────────┘      └────────────┘      └────────────┘      └────────────┘
       │                                                           │
       │                                                           │
       │                                                           │
       │                       ┌────────────┐                      │
       │                       │            │                      │
       └───────────────4───────▶   Client   ◀─────5────────────────┘
                               │            │
                               └────────────┘

1. Upload file content to Walrus
2. Receive content identifiers from Walrus
3. Send transaction to Sui with tree structure and blob references
4. Update local working directory state
5. Receive transaction confirmation from Sui
```

### Pull Request Flow

```
┌────────────┐      ┌────────────┐      ┌────────────┐      ┌────────────┐
│            │      │            │      │            │      │            │
│  Developer │──1──▶│    Sui     │──2──▶│  Reviewer  │──3──▶│    Sui     │
│            │      │            │      │            │      │            │
└────────────┘      └────────────┘      └────────────┘      └────────────┘
                          │                                       │
                          │                                       │
                          │                                       │
                          │      ┌────────────┐                   │
                          │      │            │                   │
                          └──4───▶  Developer ◀────5─────────────┘
                                 │            │
                                 └────────────┘

1. Create PR transaction on Sui
2. PR notification to reviewers
3. Review submission transaction
4. Merge notification to developer
5. PR status update transaction
```

## Conclusion

WalGit represents a fusion of traditional Git functionality with blockchain technology. The architecture is designed to provide the benefits of distributed version control while adding:

1. **Transparency**: Complete history of changes on-chain
2. **Security**: Cryptographic verification of changes
3. **Collaboration**: Decentralized workflow between contributors
4. **Permanence**: Content stored in decentralized storage
5. **Ownership**: Clear provenance of code and contributions

This architecture supports the vision of a fully decentralized developer workflow, where code, collaboration, and deployment can occur entirely on blockchain infrastructure.

## References

- [Sui Move Documentation](https://docs.sui.io/build/move)
- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Walrus Storage Documentation](https://docs.walrus.storage/)