# WalGit Enhanced Integrations

This document describes the new integrations added to the WalGit CLI for enhanced functionality, security, and storage options.

## Overview

WalGit has been enhanced with the following integrations:
1. **Sui Blockchain Integration** - Enhanced blob ID registry and content-addressable storage
2. **Walrus Storage** - Improved RedStuff erasure coding and parallel operations
3. **Seal Encryption** - Threshold encryption for private repositories
4. **Tusky Storage** - Free storage tier with automatic fallback

## 1. Sui Blockchain Integration

### Features
- **Blob ID Registry**: Content-addressable storage for efficient deduplication
- **Enhanced Gas Optimization**: Dynamic gas estimation and batch operations
- **Improved Access Control**: Repository-level permissions using Sui object ownership
- **Transaction Reliability**: Retry mechanisms with exponential backoff

### Usage
```bash
# The enhanced Sui integration is automatic - no additional configuration needed
walgit push
```

### Implementation Details
- Located in: `walgit-backend/cli/src/utils/sui-integration.js`
- Uses SHA-256 content hashing for blob IDs
- Implements batch transaction processing for multiple commits
- Provides automatic gas estimation based on transaction complexity

## 2. Walrus Storage Integration

### Features
- **RedStuff Erasure Coding**: 3/7 configuration for redundancy
- **Large File Support**: Handles files up to 14GB with chunk-based uploads
- **Parallel Operations**: Concurrent uploads/downloads for performance
- **Node Selection**: Automatically chooses optimal storage nodes
- **Retry Logic**: Automatic retries with exponential backoff

### Configuration
```bash
# Configure Walrus settings
walgit config walrus.nodeUrl "https://walrus.devnet.sui.io"
walgit config walrus.maxParallelism 5
walgit config walrus.chunkSize 1048576
```

### Implementation Details
- Located in: `walgit-backend/cli/src/utils/walrus-integration.js`
- Implements chunked upload/download for large files
- Uses storage node health monitoring for optimal performance
- Provides progress tracking for long operations

## 3. Seal Encryption Integration

### Features
- **Threshold Encryption**: Private repositories with key sharing
- **Access Control**: Share repository access with specific users
- **Key Rotation**: Rotate encryption keys without re-encrypting data
- **Time-based Access**: Grant temporary access to repositories

### Commands
```bash
# Initialize encrypted repository
walgit init --encryption seal --encryption-threshold 3 --encryption-shares 5

# Enable encryption on existing repository
walgit encryption enable --threshold 3 --shares 5

# Share access with another user
walgit encryption share @user --duration 7d --permissions read

# Revoke access
walgit encryption revoke @user

# List access permissions
walgit encryption list-access

# Rotate encryption keys
walgit encryption rotate-keys
```

### Configuration
```bash
# Configure Seal API key
walgit config seal.apiKey "your-seal-api-key"
```

### Implementation Details
- Located in: `walgit-backend/cli/src/utils/seal-encryption.js`
- Uses threshold cryptography for secure key sharing
- Integrates with Sui blockchain for access control
- Provides client-side encryption/decryption

## 4. Tusky Storage Integration

### Features
- **Free Storage Tier**: 5GB personal / 50GB WalGit shared accounts
- **Automatic Fallback**: Switch between Tusky and Walrus
- **Migration Tools**: Move data between storage providers
- **Quota Management**: Track usage and available space

### Commands
```bash
# Configure Tusky
walgit tusky config --api-key "your-tusky-key" --account-type personal

# Switch default storage provider
walgit tusky use tusky  # or walrus

# Check storage status
walgit tusky status

# Migrate blobs between providers
walgit tusky migrate --from walrus --to tusky

# Configure fallback behavior
walgit tusky fallback --enable --order tusky,walrus
```

### Configuration
```bash
# Configure Tusky API key
walgit config tusky.apiKey "your-tusky-api-key"
walgit config tusky.accountType "personal"  # or "walgit"

# Set default storage provider
walgit config settings.defaultStorageProvider "tusky"  # or "walrus"
```

### Implementation Details
- Located in: `walgit-backend/cli/src/utils/tusky-integration.js`
- Implements free storage tier with quota tracking
- Provides automatic fallback between storage providers
- Includes migration tools for moving between providers

## Storage Provider Selection Logic

WalGit automatically selects storage providers based on:

1. **Default Provider**: Uses `settings.defaultStorageProvider` from config
2. **Encryption Status**: Encrypted blobs always use the provider specified during encryption
3. **Quota Limits**: Automatically falls back when quota is exceeded
4. **Provider Health**: Falls back if primary provider is unavailable
5. **Cost Optimization**: Uses Tusky for free tier when possible

### Fallback Order
By default, the fallback order is:
1. Tusky (free tier)
2. Walrus (pay-per-use)

This can be configured with:
```bash
walgit tusky fallback --order walrus,tusky
```

## Integration Examples

### Example 1: Create Private Repository with Free Storage
```bash
# Initialize encrypted repository with Tusky storage
walgit init myrepo --private --encryption seal
walgit tusky use tusky
walgit add .
walgit commit -m "Initial commit"
walgit push
```

### Example 2: Share Repository Access
```bash
# Share read access for 7 days
walgit encryption share @alice --duration 7d --permissions read

# Share write access for 1 month
walgit encryption share @bob --duration 1m --permissions write
```

### Example 3: Migrate to Free Storage
```bash
# Check current storage usage
walgit tusky status

# Migrate from Walrus to Tusky
walgit tusky migrate --from walrus --to tusky --dry-run
walgit tusky migrate --from walrus --to tusky
```

## Error Handling

All integrations include comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Quota Exceeded**: Automatic fallback to alternative provider
- **Permission Denied**: Clear error messages with suggested actions
- **Invalid Configuration**: Validation and helpful error messages

## Security Considerations

1. **API Keys**: Store securely using WalGit's credential manager
2. **Encryption Keys**: Never stored in plain text
3. **Access Control**: Managed through Sui blockchain ownership
4. **Network Security**: All API calls use HTTPS

## Performance Optimization

- **Parallel Operations**: Multi-threaded uploads/downloads
- **Chunk-based Transfer**: Efficient handling of large files
- **Content Deduplication**: SHA-256 based blob ID registry
- **Smart Caching**: In-memory caches for frequently accessed data

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   ```bash
   walgit config seal.apiKey "your-api-key"
   walgit config tusky.apiKey "your-api-key"
   ```

2. **"Quota exceeded"**
   ```bash
   walgit tusky status  # Check usage
   walgit tusky use walrus  # Switch provider
   ```

3. **"Network timeout"**
   ```bash
   walgit config walrus.maxRetries 5
   walgit config walrus.timeout 60000
   ```

## Future Enhancements

- Integration with additional storage providers
- Enhanced encryption algorithms
- Cross-repository blob sharing
- Advanced quota management
- Performance analytics dashboard