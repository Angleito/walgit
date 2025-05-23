'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileViewer } from '@/components/git/FileViewer';
import { useSuiClient } from "@mysten/dapp-kit";

export default function BlobPage() {
  const params = useParams();
  const client = useSuiClient();
  const [isLoading, setIsLoading] = useState(true);
  const [fileContent, setFileContent] = useState('');
  const [fileInfo, setFileInfo] = useState<any>(null);
  
  // Calculate path values that useEffect depends on
  const owner = params?.owner as string;
  const repo = params?.repo as string;
  const pathSegments = params?.path as string[];
  const filePath = pathSegments?.join('/') || '';
  
  useEffect(() => {
    if (!params || !owner || !repo || !filePath) return;
    async function fetchFileContent() {
      try {
        setIsLoading(true);
        // TODO: Fetch actual file content from Sui network/Walrus
        // const data = await walletService.getFileContent(client, owner, repo, filePath);
        
        // For now, use mock data
        setTimeout(() => {
          const mockContent = getMockFileContent(filePath);
          setFileContent(mockContent.content);
          setFileInfo(mockContent.info);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching file:', err);
        setIsLoading(false);
      }
    }

    fetchFileContent();
  }, [owner, repo, filePath, client, params]);

  if (!params) return null;

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fileName = pathSegments[pathSegments.length - 1];
  const language = getLanguageFromFileName(fileName);

  return (
    <div className="container mx-auto px-4 py-8">
      <FileViewer
        filePath={filePath}
        fileName={fileName}
        fileContent={fileContent}
        language={language}
        repositoryPath={`/repositories/${owner}/${repo}`}
        branch="main"
        fileSize={fileInfo?.size}
        lastCommit={fileInfo?.lastCommit}
        canEdit={false}
        canDelete={false}
      />
    </div>
  );
}

// Helper function to determine language from file extension
function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'sh': 'bash',
    'sql': 'sql',
    'md': 'markdown',
    'json': 'json',
    'xml': 'xml',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  
  return languageMap[extension || ''] || 'text';
}

// Mock file content for demonstration
function getMockFileContent(filePath: string) {
  const mockFiles: Record<string, { content: string; info: any }> = {
    'src/main.move': {
      content: `module walgit::main {
    use std::string::String;
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Repository has key {
        id: UID,
        name: String,
        owner: address,
        description: String,
        created_at: u64,
    }

    public fun create_repository(
        name: String,
        description: String,
        ctx: &mut TxContext
    ) {
        let repository = Repository {
            id: object::new(ctx),
            name,
            owner: tx_context::sender(ctx),
            description,
            created_at: tx_context::epoch(ctx),
        };

        transfer::transfer(repository, tx_context::sender(ctx));
    }
}`,
      info: {
        size: 789,
        lastCommit: {
          message: 'Add repository creation function',
          author: 'Alice Chen',
          date: '2025-04-05T10:30:00Z',
          hash: 'a1b2c3d',
        },
      },
    },
    'README.md': {
      content: `# WalGit Core

Core functionality for the WalGit decentralized version control system built on Sui.

## Features

- Decentralized storage of git repositories
- On-chain access control
- Integration with Sui blockchain
- Walrus storage for large files

## Getting Started

1. Install the Sui CLI
2. Clone this repository
3. Deploy the smart contracts

\`\`\`bash
sui move build
sui client publish --gas-budget 100000000
\`\`\`

## License

MIT License`,
      info: {
        size: 512,
        lastCommit: {
          message: 'Update README',
          author: 'Bob Johnson',
          date: '2025-04-06T14:30:00Z',
          hash: 'b2c3d4e',
        },
      },
    },
  };

  // Default mock content
  const defaultContent = {
    content: '// File content not available in demo',
    info: {
      size: 0,
      lastCommit: {
        message: 'Initial commit',
        author: 'System',
        date: '2025-04-01T00:00:00Z',
        hash: '0000000',
      },
    },
  };

  return mockFiles[filePath] || defaultContent;
}