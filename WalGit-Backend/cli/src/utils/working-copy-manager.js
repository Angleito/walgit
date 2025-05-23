import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';
import { glob } from 'glob';
import ignore from 'ignore';

/**
 * WorkingCopyManager - Manages the working copy with Jujutsu-style "always-staged" paradigm
 * All tracked files are automatically considered staged unless explicitly ignored
 */
export class WorkingCopyManager {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.gitignorePath = path.join(repoPath, '.walgitignore');
    this.walgitPath = path.join(repoPath, '.walgit');
    this.ignoreInstance = ignore();
    this.loadIgnorePatterns();
  }

  /**
   * Load ignore patterns from .walgitignore file
   */
  loadIgnorePatterns() {
    try {
      if (fs.existsSync(this.gitignorePath)) {
        const patterns = fs.readFileSync(this.gitignorePath, 'utf-8')
          .split('\n')
          .filter(line => line.trim() && !line.startsWith('#'));
        this.ignoreInstance.add(patterns);
      }
    } catch (error) {
      console.warn('Warning: Could not load .walgitignore patterns:', error.message);
    }
  }

  /**
   * Create a snapshot of the current working copy
   * @returns {Object} Snapshot containing file hashes and metadata
   */
  async snapshot() {
    const snapshot = {
      timestamp: Date.now(),
      files: {},
      ignoredPatterns: this.ignoreInstance.patterns || []
    };

    try {
      const allFiles = await this.getAllFiles();
      
      for (const filePath of allFiles) {
        const absolutePath = path.join(this.repoPath, filePath);
        const stats = await fs.stat(absolutePath);
        
        if (stats.isFile()) {
          const content = await fs.readFile(absolutePath);
          const hash = createHash('sha256').update(content).digest('hex');
          
          snapshot.files[filePath] = {
            hash,
            size: stats.size,
            mode: stats.mode,
            mtime: stats.mtime.toISOString()
          };
        }
      }
    } catch (error) {
      throw new Error(`Failed to create snapshot: ${error.message}`);
    }

    return snapshot;
  }

  /**
   * Get all tracked files, respecting .walgitignore patterns
   * @returns {Promise<string[]>} List of relative file paths
   */
  async getAllFiles() {
    try {
      // Get all files in the repository
      const pattern = '**/*';
      const options = {
        cwd: this.repoPath,
        dot: true, // Include dotfiles
        nodir: true, // Files only
        ignore: [
          '.walgit/**',
          'node_modules/**',
          '.git/**'
        ]
      };

      const files = await glob(pattern, options);
      
      // Filter out ignored files
      const trackedFiles = files.filter(file => {
        const relativePath = path.relative(this.repoPath, path.join(this.repoPath, file));
        return !this.ignoreInstance.ignores(relativePath);
      });

      return trackedFiles;
    } catch (error) {
      throw new Error(`Failed to get all files: ${error.message}`);
    }
  }

  /**
   * Detect changes in the working copy compared to the last snapshot
   * @param {Object} previousSnapshot - Previous snapshot to compare against
   * @returns {Object} Object containing added, modified, and deleted files
   */
  async detectChanges(previousSnapshot = null) {
    const currentSnapshot = await this.snapshot();
    const changes = {
      added: [],
      modified: [],
      deleted: []
    };

    if (!previousSnapshot) {
      // If no previous snapshot, all files are considered new
      changes.added = Object.keys(currentSnapshot.files);
      return changes;
    }

    // Compare current files with previous snapshot
    for (const [filePath, fileInfo] of Object.entries(currentSnapshot.files)) {
      if (!previousSnapshot.files[filePath]) {
        changes.added.push(filePath);
      } else if (previousSnapshot.files[filePath].hash !== fileInfo.hash) {
        changes.modified.push(filePath);
      }
    }

    // Find deleted files
    for (const filePath of Object.keys(previousSnapshot.files)) {
      if (!currentSnapshot.files[filePath]) {
        changes.deleted.push(filePath);
      }
    }

    return changes;
  }

  /**
   * Get the last snapshot from the repository metadata
   * @returns {Promise<Object|null>} Last snapshot or null if none exists
   */
  async getLastSnapshot() {
    try {
      const snapshotPath = path.join(this.walgitPath, 'last-snapshot.json');
      if (await fs.exists(snapshotPath)) {
        return await fs.readJson(snapshotPath);
      }
    } catch (error) {
      console.warn('Warning: Could not load last snapshot:', error.message);
    }
    return null;
  }

  /**
   * Save the current snapshot as the last snapshot
   * @param {Object} snapshot - Snapshot to save
   */
  async saveSnapshot(snapshot) {
    try {
      const snapshotPath = path.join(this.walgitPath, 'last-snapshot.json');
      await fs.ensureDir(path.dirname(snapshotPath));
      await fs.writeJson(snapshotPath, snapshot, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save snapshot: ${error.message}`);
    }
  }

  /**
   * Check if a file is ignored
   * @param {string} filePath - Relative file path to check
   * @returns {boolean} True if the file is ignored
   */
  isIgnored(filePath) {
    return this.ignoreInstance.ignores(filePath);
  }

  /**
   * Add patterns to the ignore list
   * @param {string[]} patterns - Patterns to add
   */
  addIgnorePatterns(patterns) {
    this.ignoreInstance.add(patterns);
  }

  /**
   * Create default .walgitignore file with crypto-specific patterns
   */
  static createDefaultIgnoreFile(repoPath) {
    const defaultPatterns = [
      '# WalGit ignore patterns',
      '',
      '# Private keys and sensitive data',
      '*.key',
      '*.pem',
      '.env',
      '.env.local',
      'private-key.txt',
      'keystore/*',
      '',
      '# Temporary and log files',
      '*.log',
      '*.tmp',
      '*.temp',
      '.DS_Store',
      'thumbs.db',
      '',
      '# Build artifacts',
      'build/',
      'dist/',
      '*.o',
      '*.so',
      '*.dylib',
      '',
      '# Dependencies',
      'node_modules/',
      'vendor/',
      '',
      '# IDE and editor files',
      '.idea/',
      '.vscode/',
      '*.swp',
      '*.swo',
      '',
      '# WalGit internal files',
      '.walgit/internal/',
      '.walgit/tmp/',
      '',
      '# Blockchain specific',
      'wallet.json',
      'sui.keystore',
      '.sui/',
      ''
    ];

    const ignorePath = path.join(repoPath, '.walgitignore');
    fs.writeFileSync(ignorePath, defaultPatterns.join('\n'), 'utf-8');
    return ignorePath;
  }
}

export default WorkingCopyManager;