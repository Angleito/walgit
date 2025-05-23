// Mock data for Phase 1 demo
import type { Commit, BlameLine, Contributor, LanguageStats } from './types';

export const mockReadmeContent = `# WalGit - Decentralized Git on Sui

[![Stars](https://img.shields.io/github/stars/walgit/walgit)](https://github.com/walgit/walgit)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

WalGit is a decentralized version control system built on the Sui blockchain.

## Features

- **Decentralized Storage**: Store your repositories on-chain
- **Immutable History**: Blockchain ensures commit history integrity
- **Web3 Integration**: Native wallet connectivity
- **GitHub-like UI**: Familiar interface for developers

## Getting Started

\`\`\`bash
# Install WalGit CLI
npm install -g @walgit/cli

# Clone a repository
walgit clone sui://0x1234.../repo-name

# Create a new repository
walgit init
walgit create-repo --name my-project
\`\`\`

## Architecture

\`\`\`mermaid
graph TD
    A[Frontend] --> B[Backend CLI]
    B --> C[Sui Network]
    B --> D[Walrus Storage]
    C --> E[Smart Contracts]
\`\`\`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.`;

export const mockCodeContent = `// Repository management smart contract
module walgit::repository {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::{Self, String};
    
    struct Repository has key {
        id: UID,
        name: String,
        owner: address,
        description: String,
        is_public: bool,
        created_at: u64,
        updated_at: u64
    }
    
    public fun create_repository(
        name: String,
        description: String,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let repository = Repository {
            id: object::new(ctx),
            name,
            owner: tx_context::sender(ctx),
            description,
            is_public,
            created_at: tx_context::epoch(ctx),
            updated_at: tx_context::epoch(ctx),
        };
        
        transfer::share_object(repository);
    }
    
    public fun update_repository(
        repo: &mut Repository,
        new_description: String,
        ctx: &TxContext
    ) {
        assert!(repo.owner == tx_context::sender(ctx), E_NOT_OWNER);
        repo.description = new_description;
        repo.updated_at = tx_context::epoch(ctx);
    }
}`;

export const mockCommits: Commit[] = [
  {
    hash: "a1b2c3d4e5f6789012345678901234567890abcd",
    shortHash: "a1b2c3d",
    message: "Add repository update functionality",
    author: "walrus-dev",
    authorEmail: "walrus-dev@example.com",
    date: "2025-05-10T14:30:00Z",
    changes: { additions: 15, deletions: 3 },
    parentHashes: ["b2c3d4e5f6789012345678901234567890abcde"]
  },
  {
    hash: "b2c3d4e5f6789012345678901234567890abcde",
    shortHash: "b2c3d4e",
    message: "Implement basic repository creation",
    author: "blockchain-engineer",
    authorEmail: "engineer@example.com",
    date: "2025-05-08T10:15:00Z",
    changes: { additions: 45, deletions: 0 },
    parentHashes: []
  }
];

export const mockBlameData: BlameLine[] = Array.from({ length: 40 }, (_, i) => {
  const lineNumber = i + 1;
  const commitIndex = i < 25 ? 1 : 0;
  const commit = mockCommits[commitIndex];
  
  return {
    lineNumber,
    content: mockCodeContent.split('\n')[i] || '',
    commit: {
      hash: commit.hash,
      shortHash: commit.shortHash,
      message: commit.message,
      author: commit.author,
      authorEmail: commit.authorEmail,
      date: commit.date
    }
  };
});

export const contributors: Contributor[] = [
  { username: "walrus-dev", avatarUrl: null },
  { username: "blockchain-engineer", avatarUrl: null },
  { username: "frontend-dev", avatarUrl: null },
  { username: "smart-contract-dev", avatarUrl: null },
  { username: "devops-engineer", avatarUrl: null },
  { username: "ux-designer", avatarUrl: null },
  { username: "qa-engineer", avatarUrl: null },
  { username: "tech-lead", avatarUrl: null },
];

// Transform contributors for the ContributorAvatars component
export const contributorsForAvatars = contributors.map((contributor, index) => ({
  id: `contributor-${index}`,
  name: contributor.username.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  avatar: contributor.avatarUrl,
  contributions: Math.floor(Math.random() * 100) + 10,
  url: `/users/${contributor.username}`
}));

// Raw language data
const rawLanguages: LanguageStats = {
  Move: 65,
  TypeScript: 20,
  JavaScript: 10,
  CSS: 5
};

// Language colors
const LANGUAGE_COLORS: Record<string, string> = {
  Move: '#4a90e2',
  TypeScript: '#2b7489',
  JavaScript: '#f1e05a',
  CSS: '#563d7c'
};

// Transform to array format expected by LanguageStats component
export const languages = Object.entries(rawLanguages).map(([name, percentage]) => ({
  name,
  percentage,
  color: LANGUAGE_COLORS[name] || '#' + Math.floor(Math.random()*16777215).toString(16),
  size: percentage // For now, using percentage as size
}));