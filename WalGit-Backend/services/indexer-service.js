/**
 * @fileoverview Off-chain indexing service for WalGit
 * Indexes Sui blockchain events and provides fast API for frontend data loading
 */

import { SuiClient } from '@mysten/sui.js/client';
import { EventId } from '@mysten/sui.js/client';
import { WebSocketProvider } from '@mysten/sui.js/providers/ws-provider';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { EventEmitter } from 'events';
import cron from 'node-cron';
import pLimit from 'p-limit';

// Database schema for indexed data
const SCHEMA = `
-- Repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  object_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL,
  seal_policy_id TEXT,
  default_branch TEXT,
  latest_commit_cid TEXT,
  encrypted_dek_cid TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  collaborator_count INTEGER DEFAULT 0,
  commit_count INTEGER DEFAULT 0,
  is_private BOOLEAN DEFAULT 0,
  INDEX(owner),
  INDEX(created_at),
  INDEX(name)
);

-- Collaborators table
CREATE TABLE IF NOT EXISTS collaborators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id TEXT NOT NULL,
  collaborator_address TEXT NOT NULL,
  permission INTEGER NOT NULL,
  added_at INTEGER,
  added_by TEXT,
  UNIQUE(repo_id, collaborator_address),
  FOREIGN KEY(repo_id) REFERENCES repositories(id),
  INDEX(repo_id),
  INDEX(collaborator_address)
);

-- Commits table
CREATE TABLE IF NOT EXISTS commits (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL,
  commit_cid TEXT NOT NULL,
  encrypted_dek_cid TEXT,
  updated_by TEXT,
  updated_at INTEGER,
  FOREIGN KEY(repo_id) REFERENCES repositories(id),
  INDEX(repo_id),
  INDEX(updated_at)
);

-- Event processing cursor
CREATE TABLE IF NOT EXISTS indexer_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  processing_time_ms INTEGER,
  timestamp INTEGER,
  INDEX(event_type),
  INDEX(timestamp)
);
`;

/**
 * Off-chain indexer for WalGit Sui events
 */
export class WalGitIndexer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.suiClient = new SuiClient({ 
      url: options.rpcUrl || process.env.SUI_RPC_URL || 'https://fullnode.devnet.sui.io:443'
    });
    
    this.packageId = options.packageId || process.env.WALGIT_PACKAGE_ID;
    this.dbPath = options.dbPath || './indexer.db';
    this.batchSize = options.batchSize || 100;
    this.indexingInterval = options.indexingInterval || 5000; // 5 seconds
    this.maxRetries = options.maxRetries || 3;
    
    // Concurrency control
    this.processingLimit = pLimit(5);
    
    // In-memory cache for frequently accessed data
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
    
    this.db = null;
    this.isRunning = false;
    this.lastProcessedCursor = null;
    
    if (!this.packageId) {
      throw new Error('WALGIT_PACKAGE_ID environment variable is required');
    }
  }

  /**
   * Initialize the indexer
   */
  async initialize() {
    try {
      // Initialize database
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      
      await this.db.exec(SCHEMA);
      
      // Load last processed cursor
      const state = await this.db.get('SELECT value FROM indexer_state WHERE key = ?', ['last_cursor']);
      this.lastProcessedCursor = state ? JSON.parse(state.value) : null;
      
      console.log('WalGit Indexer initialized successfully');
      this.emit('initialized');
      
    } catch (error) {
      console.error('Failed to initialize indexer:', error);
      throw error;
    }
  }

  /**
   * Start the indexing process
   */
  async start() {
    if (this.isRunning) {
      console.log('Indexer is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting WalGit indexer...');
    
    // Start periodic indexing
    this.indexingTimer = setInterval(() => {
      this.indexEvents().catch(error => {
        console.error('Error during periodic indexing:', error);
        this.emit('error', error);
      });
    }, this.indexingInterval);
    
    // Start maintenance tasks
    this.startMaintenanceTasks();
    
    // Initial indexing
    await this.indexEvents();
    
    console.log('WalGit indexer started successfully');
    this.emit('started');
  }

  /**
   * Stop the indexing process
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.indexingTimer) {
      clearInterval(this.indexingTimer);
    }
    
    if (this.maintenanceCron) {
      this.maintenanceCron.stop();
    }
    
    await this.db?.close();
    
    console.log('WalGit indexer stopped');
    this.emit('stopped');
  }

  /**
   * Index new events from Sui blockchain
   */
  async indexEvents() {
    if (!this.isRunning) return;
    
    try {
      const startTime = Date.now();
      
      // Query events from Sui
      const eventQuery = {
        MoveModule: {
          package: this.packageId,
          module: 'git_repository'
        }
      };
      
      const events = await this.suiClient.queryEvents({
        query: eventQuery,
        cursor: this.lastProcessedCursor,
        limit: this.batchSize,
        order: 'ascending'
      });
      
      if (events.data.length === 0) {
        return;
      }
      
      console.log(`Processing ${events.data.length} new events...`);
      
      // Process events in batches
      const processed = await Promise.all(
        events.data.map(event => 
          this.processingLimit(() => this.processEvent(event))
        )
      );
      
      const successCount = processed.filter(Boolean).length;
      
      // Update cursor
      if (events.hasNextPage && events.nextCursor) {
        this.lastProcessedCursor = events.nextCursor;
        await this.updateCursor(events.nextCursor);
      }
      
      const processingTime = Date.now() - startTime;
      
      // Record metrics
      await this.recordMetric('batch_processing', processingTime);
      
      console.log(`Processed ${successCount}/${events.data.length} events in ${processingTime}ms`);
      
      this.emit('eventsProcessed', {
        total: events.data.length,
        successful: successCount,
        processingTime
      });
      
    } catch (error) {
      console.error('Error indexing events:', error);
      this.emit('error', error);
    }
  }

  /**
   * Process individual event
   */
  async processEvent(event) {
    try {
      const eventType = event.type.split('::').pop();
      const eventData = event.parsedJson;
      const timestamp = parseInt(event.timestampMs);
      
      const startTime = Date.now();
      
      switch (eventType) {
        case 'RepositoryCreated':
          await this.processRepositoryCreated(eventData, timestamp);
          break;
          
        case 'CollaboratorAdded':
          await this.processCollaboratorAdded(eventData, timestamp);
          break;
          
        case 'CollaboratorRemoved':
          await this.processCollaboratorRemoved(eventData, timestamp);
          break;
          
        case 'CommitUpdated':
          await this.processCommitUpdated(eventData, timestamp);
          break;
          
        case 'RepositoryUpdated':
          await this.processRepositoryUpdated(eventData, timestamp);
          break;
          
        case 'SealPolicyRotated':
          await this.processSealPolicyRotated(eventData, timestamp);
          break;
          
        default:
          console.log(`Unknown event type: ${eventType}`);
          return false;
      }
      
      const processingTime = Date.now() - startTime;
      await this.recordMetric(eventType, processingTime);
      
      // Clear relevant cache entries
      this.invalidateCache(eventType, eventData);
      
      return true;
      
    } catch (error) {
      console.error(`Error processing event ${event.id.txDigest}:`, error);
      return false;
    }
  }

  /**
   * Process repository created event
   */
  async processRepositoryCreated(eventData, timestamp) {
    await this.db.run(`
      INSERT OR REPLACE INTO repositories (
        id, object_id, name, description, owner, seal_policy_id, 
        default_branch, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventData.repo_id,
      eventData.object_id,
      eventData.name,
      eventData.description,
      eventData.owner,
      eventData.seal_policy_id,
      eventData.default_branch,
      timestamp,
      timestamp
    ]);
  }

  /**
   * Process collaborator added event
   */
  async processCollaboratorAdded(eventData, timestamp) {
    await this.db.run(`
      INSERT OR REPLACE INTO collaborators (
        repo_id, collaborator_address, permission, added_at, added_by
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      eventData.repo_id,
      eventData.collaborator,
      eventData.permission,
      timestamp,
      eventData.added_by || null
    ]);
    
    // Update repository collaborator count
    await this.db.run(`
      UPDATE repositories 
      SET collaborator_count = (
        SELECT COUNT(*) FROM collaborators WHERE repo_id = ?
      )
      WHERE id = ?
    `, [eventData.repo_id, eventData.repo_id]);
  }

  /**
   * Process collaborator removed event
   */
  async processCollaboratorRemoved(eventData, timestamp) {
    await this.db.run(
      'DELETE FROM collaborators WHERE repo_id = ? AND collaborator_address = ?',
      [eventData.repo_id, eventData.collaborator]
    );
    
    // Update repository collaborator count
    await this.db.run(`
      UPDATE repositories 
      SET collaborator_count = (
        SELECT COUNT(*) FROM collaborators WHERE repo_id = ?
      )
      WHERE id = ?
    `, [eventData.repo_id, eventData.repo_id]);
  }

  /**
   * Process commit updated event
   */
  async processCommitUpdated(eventData, timestamp) {
    // Insert commit record
    await this.db.run(`
      INSERT OR REPLACE INTO commits (
        id, repo_id, commit_cid, encrypted_dek_cid, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      `${eventData.repo_id}-${timestamp}`,
      eventData.repo_id,
      eventData.commit_manifest_cid,
      eventData.encrypted_dek_cid,
      eventData.updated_by,
      timestamp
    ]);
    
    // Update repository latest commit
    await this.db.run(`
      UPDATE repositories 
      SET latest_commit_cid = ?, encrypted_dek_cid = ?, updated_at = ?,
          commit_count = commit_count + 1
      WHERE id = ?
    `, [
      eventData.commit_manifest_cid,
      eventData.encrypted_dek_cid,
      timestamp,
      eventData.repo_id
    ]);
  }

  /**
   * Process repository updated event
   */
  async processRepositoryUpdated(eventData, timestamp) {
    await this.db.run(`
      UPDATE repositories 
      SET name = ?, description = ?, updated_at = ?
      WHERE id = ?
    `, [
      eventData.name,
      eventData.description,
      timestamp,
      eventData.repo_id
    ]);
  }

  /**
   * Process SEAL policy rotated event
   */
  async processSealPolicyRotated(eventData, timestamp) {
    await this.db.run(`
      UPDATE repositories 
      SET seal_policy_id = ?, updated_at = ?
      WHERE id = ?
    `, [
      eventData.new_policy_id,
      timestamp,
      eventData.repo_id
    ]);
  }

  /**
   * Update processing cursor
   */
  async updateCursor(cursor) {
    await this.db.run(
      'INSERT OR REPLACE INTO indexer_state (key, value) VALUES (?, ?)',
      ['last_cursor', JSON.stringify(cursor)]
    );
  }

  /**
   * Record performance metric
   */
  async recordMetric(eventType, processingTime) {
    await this.db.run(
      'INSERT INTO metrics (event_type, processing_time_ms, timestamp) VALUES (?, ?, ?)',
      [eventType, processingTime, Date.now()]
    );
  }

  /**
   * Invalidate relevant cache entries
   */
  invalidateCache(eventType, eventData) {
    const repoId = eventData.repo_id;
    const owner = eventData.owner || eventData.updated_by;
    
    // Clear repository-specific cache
    this.cache.delete(`repo:${repoId}`);
    this.cache.delete(`repo:collaborators:${repoId}`);
    
    // Clear owner-specific cache
    if (owner) {
      this.cache.delete(`repos:owner:${owner}`);
    }
    
    // Clear general listings
    this.cache.delete('repos:recent');
    this.cache.delete('repos:popular');
  }

  /**
   * Start maintenance tasks
   */
  startMaintenanceTasks() {
    // Clean old metrics every hour
    this.maintenanceCron = cron.schedule('0 * * * *', async () => {
      try {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
        await this.db.run('DELETE FROM metrics WHERE timestamp < ?', [cutoff]);
        console.log('Cleaned old metrics');
      } catch (error) {
        console.error('Error cleaning metrics:', error);
      }
    });
  }

  /**
   * Get repository by ID with caching
   */
  async getRepository(repoId) {
    const cacheKey = `repo:${repoId}`;
    let repo = this.cache.get(cacheKey);
    
    if (!repo) {
      repo = await this.db.get(`
        SELECT r.*, 
               COUNT(DISTINCT c.collaborator_address) as collaborator_count,
               COUNT(DISTINCT cm.id) as commit_count
        FROM repositories r
        LEFT JOIN collaborators c ON r.id = c.repo_id
        LEFT JOIN commits cm ON r.id = cm.repo_id
        WHERE r.id = ?
        GROUP BY r.id
      `, [repoId]);
      
      if (repo) {
        this.cache.set(cacheKey, repo);
      }
    }
    
    return repo;
  }

  /**
   * Get repositories by owner
   */
  async getRepositoriesByOwner(owner, limit = 50, offset = 0) {
    const cacheKey = `repos:owner:${owner}:${limit}:${offset}`;
    let repos = this.cache.get(cacheKey);
    
    if (!repos) {
      repos = await this.db.all(`
        SELECT r.*, 
               COUNT(DISTINCT c.collaborator_address) as collaborator_count,
               COUNT(DISTINCT cm.id) as commit_count
        FROM repositories r
        LEFT JOIN collaborators c ON r.id = c.repo_id
        LEFT JOIN commits cm ON r.id = cm.repo_id
        WHERE r.owner = ?
        GROUP BY r.id
        ORDER BY r.updated_at DESC
        LIMIT ? OFFSET ?
      `, [owner, limit, offset]);
      
      this.cache.set(cacheKey, repos);
    }
    
    return repos;
  }

  /**
   * Search repositories
   */
  async searchRepositories(query, limit = 50, offset = 0) {
    return await this.db.all(`
      SELECT r.*, 
             COUNT(DISTINCT c.collaborator_address) as collaborator_count,
             COUNT(DISTINCT cm.id) as commit_count
      FROM repositories r
      LEFT JOIN collaborators c ON r.id = c.repo_id
      LEFT JOIN commits cm ON r.id = cm.repo_id
      WHERE r.name LIKE ? OR r.description LIKE ?
      GROUP BY r.id
      ORDER BY r.updated_at DESC
      LIMIT ? OFFSET ?
    `, [`%${query}%`, `%${query}%`, limit, offset]);
  }

  /**
   * Get recent repositories
   */
  async getRecentRepositories(limit = 20) {
    const cacheKey = `repos:recent:${limit}`;
    let repos = this.cache.get(cacheKey);
    
    if (!repos) {
      repos = await this.db.all(`
        SELECT r.*, 
               COUNT(DISTINCT c.collaborator_address) as collaborator_count,
               COUNT(DISTINCT cm.id) as commit_count
        FROM repositories r
        LEFT JOIN collaborators c ON r.id = c.repo_id
        LEFT JOIN commits cm ON r.id = cm.repo_id
        GROUP BY r.id
        ORDER BY r.created_at DESC
        LIMIT ?
      `, [limit]);
      
      this.cache.set(cacheKey, repos);
    }
    
    return repos;
  }

  /**
   * Get collaborators for repository
   */
  async getRepositoryCollaborators(repoId) {
    const cacheKey = `repo:collaborators:${repoId}`;
    let collaborators = this.cache.get(cacheKey);
    
    if (!collaborators) {
      collaborators = await this.db.all(`
        SELECT * FROM collaborators 
        WHERE repo_id = ?
        ORDER BY added_at DESC
      `, [repoId]);
      
      this.cache.set(cacheKey, collaborators);
    }
    
    return collaborators;
  }

  /**
   * Get repository commits
   */
  async getRepositoryCommits(repoId, limit = 50, offset = 0) {
    return await this.db.all(`
      SELECT * FROM commits 
      WHERE repo_id = ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `, [repoId, limit, offset]);
  }

  /**
   * Get indexer statistics
   */
  async getStats() {
    const [repoCount, collaboratorCount, commitCount, eventMetrics] = await Promise.all([
      this.db.get('SELECT COUNT(*) as count FROM repositories'),
      this.db.get('SELECT COUNT(*) as count FROM collaborators'),
      this.db.get('SELECT COUNT(*) as count FROM commits'),
      this.db.all(`
        SELECT event_type, 
               COUNT(*) as count,
               AVG(processing_time_ms) as avg_time,
               MAX(processing_time_ms) as max_time
        FROM metrics 
        WHERE timestamp > ?
        GROUP BY event_type
      `, [Date.now() - 24 * 60 * 60 * 1000]) // Last 24 hours
    ]);

    return {
      repositories: repoCount.count,
      collaborators: collaboratorCount.count,
      commits: commitCount.count,
      lastProcessedCursor: this.lastProcessedCursor,
      eventMetrics,
      cacheStats: {
        size: this.cache.size,
        max: this.cache.max
      }
    };
  }
}

/**
 * REST API server for indexed data
 */
export class IndexerAPIServer {
  constructor(indexer, options = {}) {
    this.indexer = indexer;
    this.port = options.port || 3001;
    this.app = express();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use(limiter);
    
    // JSON parsing
    this.app.use(express.json());
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Indexer stats
    this.app.get('/api/stats', async (req, res) => {
      try {
        const stats = await this.indexer.getStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get repository by ID
    this.app.get('/api/repositories/:id', async (req, res) => {
      try {
        const repo = await this.indexer.getRepository(req.params.id);
        if (!repo) {
          return res.status(404).json({ error: 'Repository not found' });
        }
        res.json(repo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get repositories by owner
    this.app.get('/api/repositories/owner/:owner', async (req, res) => {
      try {
        const { limit = 50, offset = 0 } = req.query;
        const repos = await this.indexer.getRepositoriesByOwner(
          req.params.owner, 
          parseInt(limit), 
          parseInt(offset)
        );
        res.json(repos);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Search repositories
    this.app.get('/api/repositories/search', async (req, res) => {
      try {
        const { q, limit = 50, offset = 0 } = req.query;
        if (!q) {
          return res.status(400).json({ error: 'Query parameter "q" is required' });
        }
        const repos = await this.indexer.searchRepositories(q, parseInt(limit), parseInt(offset));
        res.json(repos);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get recent repositories
    this.app.get('/api/repositories/recent', async (req, res) => {
      try {
        const { limit = 20 } = req.query;
        const repos = await this.indexer.getRecentRepositories(parseInt(limit));
        res.json(repos);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get repository collaborators
    this.app.get('/api/repositories/:id/collaborators', async (req, res) => {
      try {
        const collaborators = await this.indexer.getRepositoryCollaborators(req.params.id);
        res.json(collaborators);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get repository commits
    this.app.get('/api/repositories/:id/commits', async (req, res) => {
      try {
        const { limit = 50, offset = 0 } = req.query;
        const commits = await this.indexer.getRepositoryCommits(
          req.params.id,
          parseInt(limit),
          parseInt(offset)
        );
        res.json(commits);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Indexer API server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          console.log('Indexer API server stopped');
          resolve();
        });
      });
    }
  }
}

// Export main classes
export { WalGitIndexer, IndexerAPIServer };