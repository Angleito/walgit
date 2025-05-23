'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CommitHistory } from '@/components/git/CommitHistory';
import { BranchSelector } from '@/components/git/BranchSelector';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, GitBranch } from "lucide-react";
import { useSuiClient } from "@mysten/dapp-kit";

export default function CommitsPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const client = useSuiClient();

  const [isLoading, setIsLoading] = useState(true);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [commits, setCommits] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCommits() {
      try {
        setIsLoading(true);
        // TODO: Fetch actual commits from Sui network
        // const data = await walletService.getCommits(client, owner, repo, currentBranch);
        
        // For now, use mock data
        setTimeout(() => {
          setCommits(mockCommits);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching commits:', err);
        setCommits(mockCommits);
        setIsLoading(false);
      }
    }

    fetchCommits();
  }, [owner, repo, currentBranch, client]);

  const handleBranchChange = (branch: string) => {
    setCurrentBranch(branch);
  };

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href={`/repositories/${owner}/${repo}`}
            className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">
            Commit History
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <BranchSelector
              branches={[
                { name: 'main', isDefault: true, type: 'branch' },
                { name: 'develop', type: 'branch' },
                { name: 'feature/new-ui', type: 'branch' },
              ]}
              tags={[
                { name: 'v1.0.0', type: 'tag' },
                { name: 'v0.9.0', type: 'tag' },
              ]}
              currentBranch={currentBranch}
              onBranchChange={handleBranchChange}
            />
            <div className="text-sm text-[#8b949e]">
              {commits.length} commits
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
            >
              <Calendar size={16} className="mr-2" />
              Date range
            </Button>
          </div>
        </div>
      </div>

      {/* Commit history */}
      <CommitHistory
        commits={commits}
        repositoryPath={`/repositories/${owner}/${repo}`}
        branches={['main', 'develop', 'feature/new-ui']}
        defaultView="list"
      />
    </div>
  );
}

// Mock commit data
const mockCommits = [
  {
    id: 'commit_1',
    hash: 'a1b2c3d4e5f6789012345678901234567890abcd',
    message: 'Add support for multi-tier storage optimization',
    description: 'Implemented a three-tier storage system that automatically moves data between hot, warm, and cold storage based on access patterns. This reduces storage costs by up to 40% for repositories with large historical data.',
    author: {
      name: 'Alice Chen',
      email: 'alice@walgit.io',
    },
    date: '2025-04-06T14:30:00Z',
    diffStats: {
      filesChanged: 12,
      insertions: 456,
      deletions: 89,
    },
    refs: [
      { name: 'main', type: 'branch' },
      { name: 'HEAD', type: 'branch' },
    ],
    parent: 'commit_2',
    branch: 'main',
  },
  {
    id: 'commit_2',
    hash: 'b2c3d4e5f678901234567890123456789abcdef0',
    message: 'Implement changeset-based storage model',
    description: 'Replaced traditional object-based storage with a changeset model inspired by Jujutsu VCS. This approach significantly reduces on-chain storage requirements.',
    author: {
      name: 'Bob Johnson',
      email: 'bob@walgit.io',
    },
    date: '2025-04-05T11:15:00Z',
    diffStats: {
      filesChanged: 8,
      insertions: 345,
      deletions: 123,
    },
    parent: 'commit_3',
    branch: 'main',
  },
  {
    id: 'commit_3',
    hash: 'c3d4e5f6789012345678901234567890abcdef01',
    message: 'Add branch protection rules',
    description: 'Implemented configurable branch protection rules including required reviews, status checks, and admin override capabilities.',
    author: {
      name: 'Carol Williams',
      email: 'carol@walgit.io',
    },
    date: '2025-04-04T16:45:00Z',
    diffStats: {
      filesChanged: 6,
      insertions: 234,
      deletions: 45,
    },
    refs: [
      { name: 'feature/branch-protection', type: 'branch' },
    ],
    parent: 'commit_4',
    branch: 'feature/branch-protection',
  },
  {
    id: 'commit_4',
    hash: 'd4e5f6789012345678901234567890abcdef012',
    message: 'Optimize Walrus storage integration',
    description: 'Improved blob chunking algorithm and added parallel upload support for large files.',
    author: {
      name: 'David Kim',
      email: 'david@walgit.io',
    },
    date: '2025-04-03T09:30:00Z',
    diffStats: {
      filesChanged: 5,
      insertions: 187,
      deletions: 62,
    },
    parent: 'commit_5',
    branch: 'main',
  },
  {
    id: 'commit_5',
    hash: 'e5f6789012345678901234567890abcdef0123',
    message: 'Initial commit',
    description: 'Set up basic repository structure and configuration.',
    author: {
      name: 'Eve Martinez',
      email: 'eve@walgit.io',
    },
    date: '2025-04-01T10:00:00Z',
    diffStats: {
      filesChanged: 15,
      insertions: 678,
      deletions: 0,
    },
    refs: [
      { name: 'v0.1.0', type: 'tag' },
    ],
    parent: null,
    branch: 'main',
  },
];