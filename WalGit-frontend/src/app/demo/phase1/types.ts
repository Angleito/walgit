// TypeScript interfaces for Phase 1 demo

export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
  changes: {
    additions: number;
    deletions: number;
  };
  parentHashes: string[];
}

export interface BlameLine {
  lineNumber: number;
  content: string;
  commit: {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    authorEmail: string;
    date: string;
  };
}

export interface Contributor {
  username: string;
  avatarUrl: string | null;
}

export interface LanguageStats {
  [language: string]: number;
}

export interface RepositoryActionsState {
  stars: number;
  watches: number;
  forks: number;
}

export interface RepositoryActionsHandlers {
  onStar: () => void;
  onUnstar: () => void;
  onWatch: () => void;
  onUnwatch: () => void;
  onFork: () => void;
}