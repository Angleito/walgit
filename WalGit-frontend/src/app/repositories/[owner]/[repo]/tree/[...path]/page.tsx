'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileBrowser } from '@/components/git/FileBrowser';
import { useSuiClient } from "@mysten/dapp-kit";

export default function TreePage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const pathSegments = (params.path as string[]) || [];
  const currentPath = pathSegments.join('/');
  
  const client = useSuiClient();
  const [isLoading, setIsLoading] = useState(true);
  const [treeData, setTreeData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchTreeData() {
      try {
        setIsLoading(true);
        // TODO: Fetch actual tree data from Sui network
        // const data = await walletService.getTreeData(client, owner, repo, currentPath);
        
        // For now, use mock data
        setTimeout(() => {
          setTreeData(getMockTreeData(currentPath));
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching tree:', err);
        setIsLoading(false);
      }
    }

    fetchTreeData();
  }, [owner, repo, currentPath, client]);

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#f0f6fc] mb-6">
        {owner} / {repo}
      </h1>
      
      <FileBrowser
        nodes={treeData}
        repositoryPath={`/repositories/${owner}/${repo}`}
        currentPath={currentPath}
        branch="main"
      />
    </div>
  );
}

// Mock tree data for demonstration
function getMockTreeData(currentPath: string) {
  if (!currentPath) {
    // Root directory
    return [
      {
        name: "src",
        type: "directory",
        path: "src",
        lastCommit: {
          message: "Add core modules",
          author: "Alice Chen",
          date: "2025-04-06T10:30:00Z",
          hash: "a1b2c3d"
        },
        children: [
          {
            name: "main.move",
            type: "file",
            path: "src/main.move",
            size: 789,
            lastCommit: {
              message: "Add repository creation function",
              author: "Alice Chen",
              date: "2025-04-05T10:30:00Z",
              hash: "d4e5f6g"
            }
          },
          {
            name: "storage.move",
            type: "file",
            path: "src/storage.move",
            size: 1234,
            lastCommit: {
              message: "Implement Walrus integration",
              author: "Bob Johnson",
              date: "2025-04-04T16:45:00Z",
              hash: "h7i8j9k"
            }
          }
        ]
      },
      {
        name: "tests",
        type: "directory",
        path: "tests",
        lastCommit: {
          message: "Add unit tests",
          author: "Carol Williams",
          date: "2025-04-03T14:30:00Z",
          hash: "l0m1n2o"
        },
        children: [
          {
            name: "main_test.move",
            type: "file",
            path: "tests/main_test.move",
            size: 567,
            lastCommit: {
              message: "Add tests for repository creation",
              author: "Carol Williams",
              date: "2025-04-03T14:30:00Z",
              hash: "p3q4r5s"
            }
          }
        ]
      },
      {
        name: "README.md",
        type: "file",
        path: "README.md",
        size: 512,
        lastCommit: {
          message: "Update README",
          author: "Bob Johnson",
          date: "2025-04-06T14:30:00Z",
          hash: "t6u7v8w"
        }
      },
      {
        name: "Move.toml",
        type: "file",
        path: "Move.toml",
        size: 234,
        lastCommit: {
          message: "Update dependencies",
          author: "David Kim",
          date: "2025-04-02T11:15:00Z",
          hash: "x9y0z1a"
        }
      }
    ];
  }
  
  // Mock subdirectory data
  if (currentPath === 'src') {
    return [
      {
        name: "main.move",
        type: "file",
        path: "src/main.move",
        size: 789,
        lastCommit: {
          message: "Add repository creation function",
          author: "Alice Chen",
          date: "2025-04-05T10:30:00Z",
          hash: "d4e5f6g"
        }
      },
      {
        name: "storage.move",
        type: "file",
        path: "src/storage.move",
        size: 1234,
        lastCommit: {
          message: "Implement Walrus integration",
          author: "Bob Johnson",
          date: "2025-04-04T16:45:00Z",
          hash: "h7i8j9k"
        }
      },
      {
        name: "utils.move",
        type: "file",
        path: "src/utils.move",
        size: 456,
        lastCommit: {
          message: "Add utility functions",
          author: "Eve Martinez",
          date: "2025-04-03T09:20:00Z",
          hash: "b2c3d4e"
        }
      }
    ];
  }
  
  return [];
}