# WalGit Storage Optimization

This directory contains the storage optimization modules for WalGit, implementing Git-like compression and packing features on the Sui blockchain.

## Modules

### Core Modules

1. **delta_compression.move**
   - Delta encoding between similar objects
   - Reduces storage for file modifications
   - Maximum delta chain depth protection

2. **pack_files.move**
   - Packs multiple objects into single files
   - Fast object lookup with indices
   - Reduces transaction overhead

3. **compression.move**
   - Multiple compression algorithms (ZLIB, GZIP, ZSTD, LZ4)
   - Automatic algorithm selection
   - Checksum verification

### Integration Modules

4. **enhanced_blob_object.move**
   - Integrates all optimization features
   - Automatic optimization on creation
   - Multiple storage strategies

5. **storage_optimization.move**
   - Repository-level optimization management
   - Similarity detection for delta compression
   - Performance tracking and recommendations

## Usage

```move
use walgit::enhanced_blob_object;
use walgit::storage_optimization;

// Create optimized blob
let blob = enhanced_blob_object::create_enhanced_blob(
    content,
    hash,
    similar_blob_id,
    ctx
);

// Optimize repository
let optimizer = storage_optimization::create_optimizer(repo_id, ctx);
let stats = storage_optimization::optimize_repository(
    &mut optimizer,
    &mut repository,
    ctx
);
```

## Features

- **Delta Compression**: 60-90% space savings for similar files
- **Pack Files**: Efficient batch storage
- **Multiple Compression**: Algorithm selection based on content
- **Automatic Optimization**: Smart storage decisions
- **Performance Tracking**: Detailed statistics

## Testing

Run tests with:
```bash
cd move
sui move test
```

## Performance

Typical space savings:
- Text files: 40-70% with compression
- Similar files: 60-90% with delta compression
- Overall: 50-80% reduction in storage costs

## Future Enhancements

- Object caching (Phase 2)
- Garbage collection (Phase 3)
- Signed commits (Phase 4)

## License

Apache-2.0