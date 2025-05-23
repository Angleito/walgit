"use client";

import { useState } from 'react';
import { FileView } from '@/components/repository/FileView';

// Mock data for demonstration
const mockFileContent = `// Main application entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletKitProvider } from '@/providers/WalletKitProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import App from './App';
import './styles/globals.css';

// Initialize the application
function initializeApp() {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );
  
  root.render(
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="walgit-theme">
        <WalletKitProvider>
          <App />
        </WalletKitProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}`;

const mockCommits = [
  {
    hash: "a1b2c3d4e5f6789012345678901234567890abcd",
    shortHash: "a1b2c3d",
    message: "Add theme provider to main entry point",
    author: "walrus-dev",
    authorEmail: "walrus-dev@example.com",
    date: "2025-05-10T14:30:00Z",
    changes: { additions: 5, deletions: 2 },
    parentHashes: ["b2c3d4e5f6789012345678901234567890abcde"]
  },
  {
    hash: "b2c3d4e5f6789012345678901234567890abcde",
    shortHash: "b2c3d4e",
    message: "Update wallet provider configuration",
    author: "blockchain-engineer",
    authorEmail: "engineer@example.com",
    date: "2025-05-08T10:15:00Z",
    changes: { additions: 12, deletions: 8 },
    parentHashes: ["c3d4e5f6789012345678901234567890abcdef"]
  },
  {
    hash: "c3d4e5f6789012345678901234567890abcdef",
    shortHash: "c3d4e5f",
    message: "Initial application setup",
    author: "walrus-dev",
    authorEmail: "walrus-dev@example.com",
    date: "2025-05-01T09:00:00Z",
    changes: { additions: 30, deletions: 0 },
    parentHashes: []
  }
];

const mockBlameData = Array.from({ length: 30 }, (_, i) => {
  const lineNumber = i + 1;
  const commitIndex = i < 10 ? 2 : i < 20 ? 1 : 0;
  const commit = mockCommits[commitIndex];
  
  return {
    lineNumber,
    content: mockFileContent.split('\n')[i] || '',
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

interface FilePageProps {
  params: {
    owner: string;
    repo: string;
    path: string[];
  };
}

export default function EnhancedFilePage({ params }: FilePageProps) {
  const { owner, repo, path } = params;
  const filePath = path.join('/');
  
  const handleEdit = () => {
    console.log('Edit file:', filePath);
    // TODO: Implement edit functionality
  };

  const handleDownload = () => {
    console.log('Download file:', filePath);
    // TODO: Implement download functionality
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <FileView
        repositoryPath={`/repositories/${owner}/${repo}`}
        branch="main"
        filePath={filePath}
        fileContent={mockFileContent}
        language="typescript"
        fileSize={mockFileContent.length}
        commits={mockCommits}
        blameData={mockBlameData}
        onEdit={handleEdit}
        onDownload={handleDownload}
      />
    </div>
  );
}