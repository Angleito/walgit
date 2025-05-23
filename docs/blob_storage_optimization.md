# WalGit Blob Storage Optimization

This document describes the optimization strategy implemented in `git_blob_object.move` for handling large repositories and files efficiently.

## Design Goals

1. **Efficient Storage**: Handle large files (100MB+) without transaction limits or excessive gas costs
2. **Deduplication**: Store identical blobs only once to save storage space
3. **Reference Counting**: Track blob usage to enable garbage collection and resource optimization
4. **Flexible Storage Strategy**: Multiple storage strategies based on blob size

## Architecture

The optimized blob storage system implements three distinct storage strategies:

### 1. Inline Storage

- For small files (< 2MB)
- Data stored directly in the contract as a dynamic field
- Lowest latency for small files (single transaction)

### 2. Chunked Storage

- For medium-sized files (2MB - 64MB)
- Data split into fixed-size chunks (default 1MB)
- Each chunk stored separately as a shared object
- Supports parallel uploads and resumable transfers
- Handles files larger than transaction size limits

### 3. Walrus Storage

- For large files (> 64MB)
- Metadata stored on-chain, content in Walrus decentralized storage
- Integration with existing Walrus storage architecture
- Lowest on-chain storage costs for large files

## Key Features

### Deduplication System

- Global registry of blobs indexed by content hash
- Prevents storing duplicate content across repositories
- Automatically detects and reuses existing blobs

### Reference Counting

- Tracks number of references to each blob
- Enables safe garbage collection when blob is no longer used
- Supports efficient content-addressed storage

### Chunked Upload System

1. **Initialization**: Creates a blob object and chunk tracking metadata
2. **Chunk Upload**: Each chunk uploaded individually with size/integrity validation
3. **Completion**: Verifies all chunks are uploaded and marks the blob as ready

### Performance Benefits

- **Parallel Processing**: Multiple chunks can be uploaded simultaneously
- **Resume Support**: Interrupted uploads can be resumed from any point
- **Memory Efficiency**: Processes large files without loading entire content in memory
- **Storage Tiering**: Automatically selects optimal storage strategy based on file size

## Implementation Details

### GitBlobObject Structure

```move
public struct GitBlobObject has key, store {
    id: UID,
    walrus_blob_id: u256,  // Reference to blob ID in Walrus storage (0 if using inline/chunked)
    size: u64,             // File size in bytes
    hash: String,          // SHA-1 hash of the content (git standard)
    encoding: u8,          // Content encoding type
    storage_type: u8,      // Storage type (inline, chunked, walrus)
    deduplication_id: String, // Hash used for deduplication
    ref_count: u64,        // Reference count for this blob
}
```

### ChunkMetadata Structure

```move
struct ChunkMetadata has store {
    total_chunks: u64,
    chunk_size: u64,
    complete: bool,
    chunk_hashes: vector<String>,
}
```

### BlobRegistry for Deduplication

```move
struct BlobRegistry has key {
    id: UID,
    blobs: Table<String, ID>, // Deduplication hash -> Blob ID
}
```

## Optimizations

1. **Content-Based Storage**: Files with identical content are stored once
2. **Streaming Upload**: Large files processed in chunks to avoid transaction limits
3. **Progressive Loading**: Client can load specific chunks on demand
4. **Chunk Caching**: Frequently accessed chunks can be cached by clients
5. **Resource Management**: Unused blobs can be reclaimed when reference count reaches zero

## Testing

Comprehensive test suite in `blob_tests.move` covers:
- Creation of inline blobs
- Reference counting mechanism
- Walrus storage integration
- Chunked upload workflow
- Deduplication logic

## Benchmarks

| File Size | Storage Type | Tx Count | Gas Cost | Storage Cost |
|-----------|--------------|----------|----------|--------------|
| 1KB       | Inline       | 1        | Low      | Low          |
| 1MB       | Inline       | 1        | Medium   | Medium       |
| 5MB       | Chunked      | 6        | Medium   | Medium       |
| 50MB      | Chunked      | 51       | High     | High         |
| 100MB     | Walrus       | 2        | Low      | Low On-chain |

## Usage Example

```move
// For small files (<2MB)
let blob = git_blob_object::create_inline(data, hash, encoding, ctx);

// For large files in Walrus
let blob = git_blob_object::create_walrus(walrus_id, size, hash, encoding, ctx);

// For medium files (chunked)
let (blob, upload) = git_blob_object::start_chunked_upload(size, hash, encoding, chunk_size, ctx);

// Upload chunks
git_blob_object::upload_chunk(blob, upload, 0, chunk_data, chunk_hash, ctx);
git_blob_object::upload_chunk(blob, upload, 1, chunk_data, chunk_hash, ctx);

// Complete upload
git_blob_object::complete_chunked_upload(blob, upload);
```

## Future Improvements

1. **Dynamic Chunk Sizing**: Automatically adjust chunk size based on content type
2. **Content-Aware Compression**: Apply optimal compression based on file content
3. **Zero-Knowledge Proofs**: Prove content exists without revealing it
4. **Blob Clustering**: Store related blobs physically close for better access patterns
5. **Predictive Prefetching**: Anticipate which chunks will be needed next