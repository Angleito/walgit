# Walrus Storage Integration Guide

This document explains how WalGit integrates with Walrus, a decentralized storage solution built on Sui blockchain, to efficiently store Git blob content.

## Overview

WalGit uses a hybrid storage approach:
- **Sui blockchain**: Stores the repository structure, commit history, and metadata (small data)
- **Walrus storage**: Stores the actual file contents (potentially large data)

This separation allows WalGit to maintain an immutable, decentralized version history without incurring high costs for storing large file contents on-chain.

## Walrus Storage System

Walrus is a decentralized, erasure-coded storage system built on Sui. It offers:

- **Decentralized storage**: Content is distributed across multiple storage providers
- **Erasure coding**: Data is encoded for redundancy and resilience
- **Persistence**: Long-term storage with upfront payment
- **Blockchain guarantees**: Storage transactions are verified on-chain

## Integration Architecture

```
┌──────────────┐                  ┌──────────────┐                  ┌──────────────┐
│              │                  │              │                  │              │
│ WalGit       │  1. Upload blob  │ Walrus       │  2. Store data   │ Storage      │
│ Client       │─────────────────▶│ Protocol     │─────────────────▶│ Providers    │
│              │                  │              │                  │              │
└──────────────┘                  └──────────────┘                  └──────────────┘
       │                                  │                                 │
       │                                  │                                 │
       │                                  │                                 │
       │ 3. Get blobId                    │                                 │
       │◀─────────────────────────────────┘                                 │
       │                                                                    │
       │                                                                    │
       │                        ┌──────────────┐                            │
       │  4. Store blobId in    │              │                            │
       └───────────────────────▶│ Sui          │                            │
                                │ Blockchain   │                            │
                                │              │                            │
                                └──────────────┘                            │
                                       │                                    │
                                       │                                    │
                                       │ 5. Retrieve blobId                 │
                                       │                                    │
       ┌──────────────┐                │                                    │
       │              │◀───────────────┘                                    │
       │ WalGit       │                                                     │
       │ Client       │                                                     │
       │              │  6. Download blob                                   │
       └──────────────┘─────────────────────────────────────────────────────┘
```

## Working with Walrus

### Uploading Content to Walrus

When a file is added to the repository, WalGit:

1. Uses the Walrus SDK/API to upload the file content
2. Receives a unique `blobId` from Walrus
3. Creates a `GitBlobObject` on Sui that stores this `blobId`

```javascript
// Example client-side code for uploading to Walrus
async function uploadToWalrus(fileContent) {
  // Create Walrus client
  const walrusClient = new WalrusClient({
    endpoint: WALRUS_ENDPOINT,
    wallet: wallet
  });

  // Upload content to Walrus
  const uploadResult = await walrusClient.upload({
    content: fileContent,
    duration: 1000000 // storage duration in epochs
  });

  // Return the Walrus blob ID
  return uploadResult.blobId;
}
```

### Creating Sui Objects with Walrus References

After uploading to Walrus, the client creates a GitBlobObject via a Move call:

```javascript
// Example client-side code for creating a GitBlobObject
async function createGitBlobObject(walrusBlobId, fileName, fileSize) {
  const tx = new TransactionBlock();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::blob::create_blob_from_walrus`,
    arguments: [
      tx.pure(walrusBlobId),
      tx.pure(fileSize),
      tx.pure(fileName),
      tx.pure(0o100644) // Regular file mode
    ]
  });
  
  const result = await suiClient.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: wallet
  });
  
  return result.objectChanges.created[0].objectId;
}
```

### Downloading Content from Walrus

When checking out a repository, WalGit:

1. Retrieves the repository structure from Sui
2. For each blob object, extracts the Walrus `blobId`
3. Uses the Walrus SDK/API to download the content using this `blobId`

```javascript
// Example client-side code for downloading from Walrus
async function downloadFromWalrus(blobId) {
  // Create Walrus client
  const walrusClient = new WalrusClient({
    endpoint: WALRUS_ENDPOINT,
    wallet: wallet
  });

  // Download content from Walrus
  const content = await walrusClient.download({
    blobId: blobId
  });

  return content;
}
```

## Storage Lifecycle Management

### Storage Duration

Walrus storage has a defined duration in epochs. When uploading to Walrus, you must specify and pay for a storage duration upfront.

### Payment for Storage

Storage in Walrus is paid using SUI tokens. This payment happens when the data is initially uploaded.

### Considerations for Repository Lifecycle

When designing WalGit, consider:

1. **Storage Duration**: How long should repository content be stored? Options include:
   - Fixed duration for all repositories
   - User-configurable duration per repository
   - Extendable duration through additional payments

2. **Repository Deletion**: What happens when a repository is "deleted"?
   - On-chain structure can be deleted or marked as deleted
   - Walrus content will remain until the storage duration expires

3. **Access Control**: Who can download content from Walrus?
   - Public repositories: Anyone can download
   - Private repositories: Access control must be implemented at the client level

## Optimizations

### Content Deduplication

Git naturally deduplicates content by hashing file contents. WalGit can leverage this by:

1. Computing the hash of file content on the client side
2. Checking if this hash already exists in the repository
3. Reusing existing Walrus blobIds for identical content

### Chunking Large Files

For very large files, consider:

1. Splitting them into chunks
2. Storing each chunk as a separate Walrus blob
3. Creating a special GitBlobObject that references multiple chunks 