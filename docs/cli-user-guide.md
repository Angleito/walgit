# WalGit CLI User Guide

## Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Configuration](#configuration)
4. [Core Commands](#core-commands)
5. [Repository Management](#repository-management)
6. [Collaboration](#collaboration)
7. [Encryption & Security](#encryption--security)
8. [Storage Management](#storage-management)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)
11. [Command Reference](#command-reference)

## Installation

### Prerequisites

- **Node.js**: Version 18 or higher
- **Sui Wallet**: A compatible Sui wallet (Sui Wallet, Ethos Wallet, etc.)
- **Operating System**: macOS, Linux, or Windows

### Install WalGit CLI

#### Using npm (Recommended)
```bash
npm install -g @walgit/cli
```

#### Using yarn
```bash
yarn global add @walgit/cli
```

#### From Source
```bash
git clone https://github.com/your-org/walgit.git
cd walgit/walgit-backend
npm install
npm link
```

### Verify Installation
```bash
walgit --version
walgit --help
```

## Getting Started

### 1. Initial Setup

First, configure your Sui network connection:

```bash
# Set up for testnet (recommended for new users)
walgit config sui-network testnet
walgit config sui-rpc https://fullnode.testnet.sui.io:443

# Or for mainnet (production use)
walgit config sui-network mainnet
walgit config sui-rpc https://fullnode.mainnet.sui.io:443
```

### 2. Connect Your Wallet

```bash
# Interactive wallet connection
walgit wallet connect

# Or specify wallet type
walgit wallet connect --type sui-wallet
```

### 3. Your First Repository

```bash
# Create a new directory for your project
mkdir my-first-repo
cd my-first-repo

# Initialize a WalGit repository
walgit init my-first-repo --description "My first decentralized repository"

# Add some files
echo "# My First Repo" > README.md
echo "console.log('Hello, WalGit!');" > index.js

# Stage and commit files
walgit add .
walgit commit -m "Initial commit"

# Push to the decentralized network
walgit push
```

## Configuration

### Configuration Files

WalGit stores configuration in `~/.walgit/config.json`:

```json
{
  "sui": {
    "network": "testnet",
    "rpc": "https://fullnode.testnet.sui.io:443",
    "wallet": {
      "type": "sui-wallet",
      "address": "0x..."
    }
  },
  "storage": {
    "provider": "walrus",
    "endpoint": "https://api.walrus.storage",
    "quota": "5GB"
  },
  "user": {
    "name": "Alice Developer",
    "email": "alice@example.com"
  }
}
```

### Configuration Commands

```bash
# View current configuration
walgit config --list

# Set configuration values
walgit config user.name "Alice Developer"
walgit config user.email "alice@example.com"

# Get specific configuration
walgit config user.name

# Reset configuration
walgit config --reset
```

### Environment Variables

```bash
# Override network settings
export WALGIT_NETWORK=testnet
export WALGIT_RPC=https://fullnode.testnet.sui.io:443

# Storage configuration
export WALRUS_API_KEY=your_api_key
export SEAL_API_KEY=your_seal_key

# Debug mode
export WALGIT_DEBUG=true
export WALGIT_LOG_LEVEL=debug
```

## Core Commands

### Repository Initialization

#### `walgit init`
Create a new WalGit repository.

```bash
# Basic initialization
walgit init my-repo

# With options
walgit init my-repo \
  --description "My awesome project" \
  --encryption \
  --default-branch main \
  --template node
```

**Options:**
- `--description, -d`: Repository description
- `--encryption, -e`: Enable SEAL encryption
- `--default-branch, -b`: Default branch name (default: main)
- `--template, -t`: Use a template (node, python, rust, etc.)
- `--private`: Create as private repository
- `--no-readme`: Skip README.md creation

### File Operations

#### `walgit add`
Stage files for commit.

```bash
# Add specific files
walgit add file1.js file2.js

# Add all files
walgit add .

# Add files matching pattern
walgit add "*.js"

# Interactive staging
walgit add --interactive
```

**Options:**
- `--all, -A`: Add all tracked and untracked files
- `--update, -u`: Add only tracked files
- `--interactive, -i`: Interactive file selection
- `--dry-run`: Show what would be added

#### `walgit status`
Show repository status.

```bash
# Basic status
walgit status

# Short format
walgit status --short

# Include ignored files
walgit status --ignored
```

#### `walgit commit`
Create a new commit.

```bash
# Commit with message
walgit commit -m "Add new feature"

# Commit all tracked changes
walgit commit -am "Update existing files"

# Interactive commit
walgit commit --interactive

# Amend last commit
walgit commit --amend
```

**Options:**
- `--message, -m`: Commit message
- `--all, -a`: Commit all tracked files
- `--amend`: Amend the last commit
- `--interactive, -i`: Interactive commit
- `--author`: Override commit author
- `--date`: Override commit date

### Remote Operations

#### `walgit push`
Upload commits to the decentralized network.

```bash
# Push current branch
walgit push

# Push specific branch
walgit push origin main

# Force push (use carefully)
walgit push --force

# Push with storage optimization
walgit push --optimize
```

**Options:**
- `--force, -f`: Force push (overwrites remote)
- `--optimize`: Optimize storage during push
- `--dry-run`: Show what would be pushed
- `--verbose, -v`: Detailed output

#### `walgit pull`
Download changes from remote.

```bash
# Pull latest changes
walgit pull

# Pull specific branch
walgit pull origin feature-branch

# Pull with rebase
walgit pull --rebase
```

#### `walgit clone`
Download a repository.

```bash
# Clone repository
walgit clone 0xrepository_object_id

# Clone to specific directory
walgit clone 0xrepository_object_id my-local-repo

# Clone specific branch
walgit clone 0xrepository_object_id --branch develop
```

### Branch Management

#### `walgit branch`
Manage branches.

```bash
# List branches
walgit branch

# Create new branch
walgit branch feature-auth

# Delete branch
walgit branch -d feature-auth

# Rename branch
walgit branch -m old-name new-name
```

#### `walgit checkout`
Switch branches or restore files.

```bash
# Switch to branch
walgit checkout main

# Create and switch to new branch
walgit checkout -b feature-payments

# Checkout specific commit
walgit checkout a1b2c3d

# Restore file from last commit
walgit checkout -- file.js
```

#### `walgit merge`
Merge branches.

```bash
# Merge branch into current
walgit merge feature-branch

# No-fast-forward merge
walgit merge --no-ff feature-branch

# Squash merge
walgit merge --squash feature-branch
```

## Repository Management

### Repository Information

#### `walgit log`
View commit history.

```bash
# Basic log
walgit log

# One line per commit
walgit log --oneline

# Graph view
walgit log --graph

# Limit number of commits
walgit log -10

# Filter by author
walgit log --author "alice@example.com"
```

#### `walgit show`
Display commit details.

```bash
# Show latest commit
walgit show

# Show specific commit
walgit show a1b2c3d

# Show only stats
walgit show --stat
```

#### `walgit diff`
Compare changes.

```bash
# Show unstaged changes
walgit diff

# Show staged changes
walgit diff --cached

# Compare branches
walgit diff main..feature-branch

# Compare specific files
walgit diff file1.js file2.js
```

### Repository Settings

#### `walgit repo`
Manage repository settings.

```bash
# Show repository info
walgit repo info

# Update description
walgit repo set-description "New description"

# Add collaborator
walgit repo add-collaborator 0xuser_address writer

# List collaborators
walgit repo list-collaborators

# Remove collaborator
walgit repo remove-collaborator 0xuser_address

# Change visibility
walgit repo set-visibility private
```

## Collaboration

### Managing Collaborators

#### Adding Collaborators

```bash
# Add with specific role
walgit repo add-collaborator 0xuser_address writer

# Add multiple collaborators
walgit repo add-collaborators \
  0xuser1_address:admin \
  0xuser2_address:writer \
  0xuser3_address:reader
```

**Roles:**
- `reader`: Can view and clone repository
- `writer`: Can read and push changes
- `admin`: Can manage collaborators and settings
- `owner`: Full control (only one per repository)

#### Managing Access

```bash
# List all collaborators
walgit repo list-collaborators

# Update collaborator role
walgit repo update-collaborator 0xuser_address admin

# Remove collaborator
walgit repo remove-collaborator 0xuser_address

# Bulk operations from file
walgit repo import-collaborators collaborators.json
```

### Pull Requests

#### Creating Pull Requests

```bash
# Create pull request
walgit pr create \
  --title "Add authentication system" \
  --description "Implements JWT-based auth with role management" \
  --source feature-auth \
  --target main

# Create from current branch
walgit pr create --title "Bug fix" --target main
```

#### Managing Pull Requests

```bash
# List pull requests
walgit pr list

# Show specific PR
walgit pr show 42

# Review pull request
walgit pr review 42 --approve --message "Looks good!"

# Merge pull request
walgit pr merge 42 --squash

# Close pull request
walgit pr close 42
```

## Encryption & Security

### SEAL Encryption

#### Enabling Encryption

```bash
# Enable encryption for repository
walgit encryption enable

# Enable with custom threshold
walgit encryption enable --threshold 2 --total-shares 3

# Enable with policy template
walgit encryption enable --template enterprise
```

#### Managing Encryption Keys

```bash
# Show encryption status
walgit encryption status

# Rotate encryption keys
walgit encryption rotate-keys

# Schedule automatic rotation
walgit encryption schedule-rotation --interval 90d

# Export encryption policy
walgit encryption export-policy policy.json
```

#### Access Management

```bash
# Share encryption access
walgit encryption share 0xuser_address

# Revoke access
walgit encryption revoke 0xuser_address

# List users with access
walgit encryption list-access

# Bulk access management
walgit encryption import-access access-list.json
```

### Key Management

```bash
# Generate new key pair
walgit keys generate

# List keys
walgit keys list

# Export public key
walgit keys export-public > my-public-key.pem

# Import key shares
walgit keys import-shares shares.json

# Backup keys
walgit keys backup encrypted-backup.json
```

## Storage Management

### Storage Quotas

#### Managing Storage

```bash
# Check storage usage
walgit storage status

# Purchase additional storage
walgit storage purchase 1GB

# Optimize storage usage
walgit storage optimize

# Clean up old data
walgit storage cleanup --older-than 30d
```

#### Tusky Integration

```bash
# Configure Tusky storage
walgit tusky config

# Enable Tusky as primary storage
walgit tusky use

# Check Tusky status
walgit tusky status

# Migrate existing data to Tusky
walgit tusky migrate

# Set fallback storage
walgit tusky fallback walrus
```

### Storage Providers

```bash
# List available providers
walgit storage providers

# Switch storage provider
walgit storage use-provider tusky

# Configure provider settings
walgit storage config-provider walrus \
  --endpoint https://api.walrus.storage \
  --api-key your_key

# Test provider connectivity
walgit storage test-provider walrus
```

## Advanced Features

### Templates

#### Using Templates

```bash
# List available templates
walgit template list

# Create repository from template
walgit init my-app --template react-typescript

# Download template
walgit template download javascript-starter
```

#### Creating Templates

```bash
# Create template from current repository
walgit template create my-template \
  --description "My custom template"

# Upload template
walgit template upload my-template

# Share template
walgit template share my-template 0xuser_address
```

### Automation & Scripting

#### Hooks

```bash
# List available hooks
walgit hooks list

# Install pre-commit hook
walgit hooks install pre-commit ./scripts/lint.sh

# Remove hook
walgit hooks remove pre-commit
```

#### Batch Operations

```bash
# Batch add repositories
walgit batch add-repos repos.json

# Bulk update descriptions
walgit batch update-descriptions updates.json

# Mass migration
walgit batch migrate-from-git github_repos.json
```

### Integration

#### CI/CD Integration

```bash
# Generate CI configuration
walgit ci generate-config github-actions

# Deploy keys for CI
walgit ci setup-keys --provider github

# Test CI integration
walgit ci test-config
```

#### IDE Integration

```bash
# Generate VS Code settings
walgit ide generate-config vscode

# Setup Git integration
walgit ide setup-git-integration

# Install WalGit extension
walgit ide install-extension
```

## Troubleshooting

### Common Issues

#### Connection Problems

```bash
# Test network connectivity
walgit health check

# Reset wallet connection
walgit wallet reset

# Clear cache
walgit cache clear

# Verbose error output
walgit --debug push
```

#### Storage Issues

```bash
# Check storage quota
walgit storage status

# Force storage sync
walgit storage sync --force

# Repair corrupted data
walgit storage repair

# Verify data integrity
walgit storage verify
```

#### Permission Errors

```bash
# Check repository permissions
walgit repo check-permissions

# Refresh access tokens
walgit auth refresh

# Re-authenticate
walgit wallet reconnect
```

### Diagnostic Commands

```bash
# System information
walgit system info

# Configuration diagnosis
walgit config diagnose

# Network connectivity test
walgit network test

# Storage health check
walgit storage health

# Generate support bundle
walgit support bundle
```

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `WALLET_NOT_CONNECTED` | No wallet connection | Run `walgit wallet connect` |
| `INSUFFICIENT_STORAGE` | Out of storage quota | Purchase more storage or clean up |
| `PERMISSION_DENIED` | No access to repository | Check collaborator status |
| `NETWORK_ERROR` | Network connectivity issue | Check internet and RPC endpoint |
| `ENCRYPTION_FAILED` | Encryption operation failed | Check SEAL configuration |
| `SYNC_CONFLICT` | Merge conflict detected | Resolve conflicts manually |

## Command Reference

### Quick Reference

| Command | Description |
|---------|-------------|
| `walgit init` | Initialize new repository |
| `walgit add` | Stage files for commit |
| `walgit commit` | Create commit |
| `walgit push` | Upload to network |
| `walgit pull` | Download changes |
| `walgit clone` | Download repository |
| `walgit status` | Show repository status |
| `walgit log` | View commit history |
| `walgit branch` | Manage branches |
| `walgit merge` | Merge branches |

### Global Options

| Option | Description |
|--------|-------------|
| `--help, -h` | Show help |
| `--version, -V` | Show version |
| `--debug` | Enable debug output |
| `--verbose, -v` | Verbose output |
| `--quiet, -q` | Suppress output |
| `--config` | Custom config file |
| `--no-color` | Disable colored output |

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `user.name` | Your name | - |
| `user.email` | Your email | - |
| `sui.network` | Sui network | testnet |
| `sui.rpc` | RPC endpoint | - |
| `storage.provider` | Storage provider | walrus |
| `encryption.enabled` | Auto-enable encryption | false |

## Getting Help

### Documentation
- **Online Docs**: https://docs.walgit.dev
- **API Reference**: https://api.walgit.dev
- **Tutorials**: https://learn.walgit.dev

### Community
- **Discord**: https://discord.gg/walgit
- **Forum**: https://forum.walgit.dev
- **GitHub**: https://github.com/walgit/walgit

### Support
- **Help Command**: `walgit help [command]`
- **Support Email**: support@walgit.dev
- **Bug Reports**: https://github.com/walgit/walgit/issues

### Examples Repository
- **Sample Projects**: https://github.com/walgit/examples
- **Templates**: https://github.com/walgit/templates
- **Integrations**: https://github.com/walgit/integrations

---

This guide covers the essential functionality of the WalGit CLI. For the most up-to-date information and advanced usage patterns, visit our online documentation at https://docs.walgit.dev.