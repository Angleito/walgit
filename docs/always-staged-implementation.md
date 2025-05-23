# Always-Staged Paradigm Implementation in WalGit CLI

This document describes the implementation of the Jujutsu-style "always-staged" paradigm in WalGit CLI.

## Overview

WalGit now implements an always-staged paradigm where all tracked files are automatically considered staged for commit. This removes the traditional Git-style staging area, simplifying the workflow and making all changes immediately ready for commit.

## Key Components

### 1. WorkingCopyManager (working-copy-manager.js)

Central component that manages the working copy with the always-staged paradigm:

- **getAllFiles()**: Retrieves all tracked files, automatically excluding files matching patterns in `.walgitignore`
- **snapshot()**: Creates a complete snapshot of the current working copy state
- **detectChanges()**: Compares the current state with a previous snapshot to identify added, modified, and deleted files
- **isIgnored()**: Checks if a file matches ignore patterns
- **createDefaultIgnoreFile()**: Creates a default `.walgitignore` with crypto-specific patterns

### 2. Updated Commands

#### Status Command
- Shows all changes as "staged for commit"
- No distinction between staged and unstaged changes
- Displays ignored files separately

#### Add Command
- Repurposed to handle inclusion/exclusion of files
- Shows deprecation warning for traditional staging behavior
- Supports `--force` flag to include previously ignored files

#### Commit Command
- Automatically commits all detected changes
- Uses WorkingCopyManager to detect changes since last snapshot
- Saves new snapshot after successful commit

#### Init Command
- Creates default `.walgitignore` file automatically
- Displays information about the always-staged paradigm

### 3. .walgitignore System

Default patterns include:
- Private keys and sensitive data (`*.key`, `*.pem`, `.env`)
- Temporary and log files (`*.log`, `*.tmp`)
- Build artifacts (`build/`, `dist/`)
- Dependencies (`node_modules/`, `vendor/`)
- IDE files (`.idea/`, `.vscode/`)
- Blockchain-specific files (`wallet.json`, `sui.keystore`)

## User Experience Changes

### Before (Traditional Staging)
```bash
walgit add file1.js file2.js
walgit status  # Shows staged and unstaged changes
walgit commit -m "Update files"
```

### After (Always-Staged)
```bash
walgit status  # Shows all changes as "to be committed"
walgit commit -m "Update files"  # Commits all changes
```

## Technical Benefits

1. **Simplified Mental Model**: Users don't need to think about staging
2. **Reduced Commands**: Fewer commands needed for common workflows
3. **Consistent State**: All tracked files are always in a consistent state
4. **Better Performance**: Snapshot-based change detection is efficient

## Implementation Details

### Change Detection
Changes are detected by comparing SHA-256 hashes of file contents between snapshots. The system maintains:
- Current snapshot with file hashes, sizes, and timestamps
- Previous snapshot for comparison
- Efficient diff calculation between snapshots

### Ignore System
The `.walgitignore` file uses the same syntax as `.gitignore`:
- Pattern matching with wildcards
- Directory exclusions
- Negation patterns (with `!`)

### Data Storage
- Snapshots are stored in `.walgit/last-snapshot.json`
- Working copy state is tracked independently from blockchain operations
- Compatible with existing blockchain integration

## Testing

Comprehensive tests verify:
- Ignore pattern functionality
- Change detection accuracy
- Snapshot persistence
- Integration with existing commands

## Migration Notes

For users migrating from traditional Git-style workflows:
1. The `add` command is now primarily for managing ignore patterns
2. All tracked files are automatically included in commits
3. Use `.walgitignore` to exclude files from tracking
4. Status command shows a simplified view of changes

## Future Enhancements

- Interactive mode for selective commits
- Advanced ignore pattern management
- Snapshot history and rollback capabilities
- Integration with merge conflict resolution