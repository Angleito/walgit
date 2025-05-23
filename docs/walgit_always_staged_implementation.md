# WalGit CLI Enhancement: Always-Staged and Automatic .walgitignore

## Overview

This document outlines the implementation plan for enhancing the WalGit CLI with:
1. Jujutsu-style "always staged" functionality
2. Automatic .walgitignore file generation with crypto-specific patterns

## Current Architecture Analysis

### Current Staging System
- Commands: `add`, `status`, `commit`
- Staging area exists separately from working directory
- Files must be explicitly added before commit
- Status shows staged/unstaged changes separately

### Required Changes
- Remove or repurpose `add` command
- Treat working directory as always-staged commit
- Automatic tracking of all file changes
- Respect .walgitignore patterns

## Implementation Plan

### Phase 1: Always-Staged Feature

#### 1.1 Working Copy as Commit
```javascript
// New utility: working-copy-manager.js
export class WorkingCopyManager {
  constructor(repository) {
    this.repository = repository;
    this.ignoredPatterns = [];
  }

  async snapshot() {
    // Capture all files in working directory
    const files = await this.getAllFiles();
    const changes = await this.detectChanges(files);
    return this.createSnapshot(changes);
  }

  async getAllFiles() {
    // Recursively read directory, respecting .walgitignore
  }

  async detectChanges(files) {
    // Compare with previous snapshot
  }
}
```

#### 1.2 Modified Commands

**Status Command Updates:**
```javascript
// status.js modifications
export const statusCommand = (program) => {
  program
    .command('status')
    .description('Show the working tree status')
    .action(async (options) => {
      // No more staged/unstaged separation
      const workingCopy = await workingCopyManager.snapshot();
      const changes = workingCopy.changes;
      
      // Display all changes as "to be committed"
      if (changes.length === 0) {
        console.log(chalk.green('Nothing to commit, working tree clean'));
      } else {
        console.log(chalk.blue('Changes to be committed:'));
        changes.forEach(change => {
          console.log(`  ${chalk.green(change.status)}: ${change.path}`);
        });
      }
    });
};
```

**Commit Command Updates:**
```javascript
// commit.js modifications
export const commitCommand = (program) => {
  program
    .command('commit')
    .description('Commit current working directory state')
    .action(async (options) => {
      // Automatically capture all changes
      const workingCopy = await workingCopyManager.snapshot();
      
      if (workingCopy.changes.length === 0) {
        console.log(chalk.yellow('Nothing to commit'));
        return;
      }
      
      // Create commit with snapshot
      const commit = await createCommit({
        message: options.message,
        snapshot: workingCopy,
        author: await getAuthor()
      });
      
      console.log(chalk.green(`Committed ${workingCopy.changes.length} changes`));
    });
};
```

#### 1.3 Add Command Transformation
```javascript
// add.js - Repurpose for explicit include/exclude
export const addCommand = (program) => {
  program
    .command('add [files...]')
    .description('Include or exclude files from next commit')
    .option('-e, --exclude', 'Exclude files from next commit')
    .action(async (files, options) => {
      if (options.exclude) {
        await workingCopyManager.excludeFiles(files);
        console.log(chalk.yellow(`Excluded ${files.length} files from next commit`));
      } else {
        await workingCopyManager.includeFiles(files);
        console.log(chalk.green(`Included ${files.length} files in next commit`));
      }
    });
};
```

### Phase 2: Automatic .walgitignore

#### 2.1 Default Ignore Patterns
```javascript
// ignore-patterns.js
export const DEFAULT_WALGIT_IGNORE = `
# WalGit generated ignore file
# Generated automatically on init - feel free to modify

# Environment and secrets
.env
.env.*
*.env
.env.local
.env.*.local
config/*.secret.*
secrets/
credentials/

# Private keys and wallets  
*.pem
*.key
*.keystore
*.wallet
id_rsa
id_rsa.*
id_ecdsa
id_ecdsa.*
*.priv
*.private
private_key*
wallet.json
keyfile.json

# Sui/Move specific
.sui/
.move/
build/
Move.lock
.sui/wallet
.sui/keystore

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
*.log
.npm
.yarn-integrity

# Testing
coverage/
*.lcov
.nyc_output/
test-results/

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
*.swp
*.swo
*~

# IDE
.vscode/
.idea/
*.iml
*.ipr
*.iws
.project
.classpath
.c9/
*.launch
.settings/

# Temporary files
*.tmp
*.temp
*.bak
*.backup
*.old
tmp/
temp/
cache/

# Database
*.db
*.sqlite
*.sqlite3
*.db-journal
*.db-wal

# Build artifacts
dist/
out/
build/
target/
*.o
*.so
*.dylib
*.dll
*.exe

# Archives
*.zip
*.tar.gz
*.rar
*.7z

# Logs and dumps
*.log
*.stackdump
*.dump

# Security related
.gnupg/
.ssh/
*.cert
*.crt
*.csr
*.der
*.pk8
*.p12
`;
```

#### 2.2 Init Command Enhancement
```javascript
// init.js modifications
export const initCommand = (program) => {
  program
    .command('init')
    .action(async (options) => {
      try {
        // ... existing repository creation code ...
        
        // Create .walgitignore file
        const ignorePath = path.join(process.cwd(), '.walgitignore');
        
        if (!fs.existsSync(ignorePath)) {
          fs.writeFileSync(ignorePath, DEFAULT_WALGIT_IGNORE.trim());
          console.log(chalk.green('Created .walgitignore with default patterns'));
          console.log(chalk.dim('Edit .walgitignore to customize ignored files'));
        }
        
        // Initialize working copy manager
        await workingCopyManager.initialize(repoData.id);
        
        spinner.succeed(`Repository initialized: ${chalk.green(repoData.name)}`);
      } catch (error) {
        console.error(chalk.red('Failed to initialize repository:'), error.message);
        process.exit(1);
      }
    });
};
```

#### 2.3 Ignore Pattern Matching
```javascript
// ignore-matcher.js
import ignore from 'ignore';
import fs from 'fs';
import path from 'path';

export class IgnoreMatcher {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.ignoreFile = path.join(repoPath, '.walgitignore');
    this.ig = ignore();
    this.loadPatterns();
  }

  loadPatterns() {
    if (fs.existsSync(this.ignoreFile)) {
      const patterns = fs.readFileSync(this.ignoreFile, 'utf8');
      this.ig.add(patterns);
    }
    
    // Always ignore .walgit directory
    this.ig.add('.walgit/');
  }

  isIgnored(filePath) {
    const relativePath = path.relative(this.repoPath, filePath);
    return this.ig.ignores(relativePath);
  }

  filter(files) {
    return files.filter(file => !this.isIgnored(file));
  }
}
```

### Phase 3: Integration and Testing

#### 3.1 Update Repository Utils
```javascript
// repository.js modifications
export const stageFiles = async (options = {}) => {
  // Deprecated - keep for backward compatibility
  console.warn(chalk.yellow('Note: All files are automatically tracked. The add command is no longer required.'));
  return getAllModifiedFiles();
};

export const getAllModifiedFiles = async () => {
  const ignoreMatcher = new IgnoreMatcher(process.cwd());
  const workingCopy = await workingCopyManager.snapshot();
  
  return workingCopy.changes.filter(change => 
    !ignoreMatcher.isIgnored(change.path)
  );
};
```

#### 3.2 Test Suite
```javascript
// __tests__/always-staged.test.js
describe('Always Staged Feature', () => {
  test('status shows all changes without staging', async () => {
    // Create files
    await fs.writeFile('test.txt', 'content');
    
    // Run status
    const output = await runCommand('walgit status');
    
    // Should show as "to be committed" not "unstaged"
    expect(output).toContain('Changes to be committed:');
    expect(output).not.toContain('not staged');
  });

  test('commit captures all changes automatically', async () => {
    // Create multiple files
    await fs.writeFile('file1.txt', 'content1');
    await fs.writeFile('file2.txt', 'content2');
    
    // Commit without add
    await runCommand('walgit commit -m "Test commit"');
    
    // Verify both files committed
    const log = await runCommand('walgit log --stat');
    expect(log).toContain('file1.txt');
    expect(log).toContain('file2.txt');
  });
});

// __tests__/walgitignore.test.js
describe('.walgitignore', () => {
  test('init creates default .walgitignore', async () => {
    await runCommand('walgit init');
    
    const ignoreFile = await fs.readFile('.walgitignore', 'utf8');
    expect(ignoreFile).toContain('*.key');
    expect(ignoreFile).toContain('node_modules/');
  });

  test('ignored files not included in commit', async () => {
    // Create ignored file
    await fs.writeFile('secret.key', 'private_key_content');
    
    // Run commit
    await runCommand('walgit commit -m "Test"');
    
    // Verify secret.key not committed
    const files = await runCommand('walgit ls-tree HEAD');
    expect(files).not.toContain('secret.key');
  });
});
```

## Migration Path

### For Existing Users
1. Backward compatibility mode for first release
2. Warning messages when using `add` command
3. Migration guide documentation
4. Config option to enable legacy behavior

### Breaking Changes
- `add` command behavior changes
- Status output format changes
- Workflow adjustments needed

## Implementation Timeline

1. **Week 1**: Implement working copy manager and snapshot system
2. **Week 2**: Update status and commit commands
3. **Week 3**: Implement .walgitignore system
4. **Week 4**: Testing and documentation
5. **Week 5**: Migration tools and backward compatibility

## Dependencies

- `ignore` npm package for gitignore pattern matching
- File system watcher for detecting changes
- Existing WalGit infrastructure

## Security Considerations

- Ensure private keys never reach blockchain even temporarily
- Validate ignore patterns prevent sensitive file exposure
- Clear error messages for security-related ignores
- Audit trail for ignored sensitive files

## Documentation Updates

1. Update CLI documentation for new workflow
2. Create migration guide from traditional Git
3. Update README with new features
4. Add security best practices guide
5. Create video tutorial for new workflow