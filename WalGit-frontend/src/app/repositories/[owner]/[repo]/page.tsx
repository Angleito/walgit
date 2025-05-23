'use client';

import Link from 'next/link';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useSuiClient } from "@mysten/dapp-kit";
import { walletService } from "@/services/wallet";
import { RepositoryStats } from "@/components/git/RepositoryStats";
import { BranchSelector } from "@/components/repository/BranchSelector";
import { CloneUrlDisplay } from "@/components/git/CloneUrlDisplay";
// Lazy loaded components
const WaveBackground = lazy(() => import("@/components/layout/WaveBackground"));
const PullRequestsList = lazy(() => import("@/components/dashboard/PullRequestsList"));
const StorageDashboard = lazy(() => import("@/components/dashboard/StorageDashboard"));
const RepositoryOverview = lazy(() => import("./enhanced-overview"));
import {
  Star,
  GitFork,
  Eye,
  AlertCircle,
  Code,
  GitPullRequest,
  GitBranch,
  Play,
  Shield,
  History,
  FileCode,
  Settings,
  Download
} from "lucide-react";

export default function RepositoryDetailPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  
  const client = useSuiClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repository, setRepository] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [showCloneDialog, setShowCloneDialog] = useState(false);

  useEffect(() => {
    async function fetchRepositoryData() {
      try {
        setIsLoading(true);
        // This should be replaced with actual repository fetching from Sui network
        // const data = await walletService.getRepositoryDetails(client, owner, repo);
        
        // For now, use mock data
        setTimeout(() => {
          setRepository(mockRepoData);
          setIsLoading(false);
        }, 500);
      } catch (err: any) {
        console.error('Error fetching repository:', err);
        setError(err.message || 'Failed to load repository details');
        setRepository(mockRepoData);
        setIsLoading(false);
      }
    }

    fetchRepositoryData();
  }, [owner, repo, client]);

  const handleBranchChange = (branch: string) => {
    setCurrentBranch(branch);
    // TODO: Fetch data for the selected branch
  };

  const handleCreateBranch = (branchName: string) => {
    console.log('Creating new branch:', branchName);
    // TODO: Implement branch creation
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
          <p className="font-medium">Error loading repository</p>
          <p className="mt-2">{error}</p>
          <p className="text-sm mt-2">Using sample data instead.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <div className="relative z-10">
        <div className="w-full mx-auto">
          {/* Repository header - GitHub-like layout */}
          <div className="gh-mb-4">
            <div className="rounded-md border gh-border-subtle gh-bg-canvas-subtle gh-p-4 gh-mb-4 w-full">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gh-gap-4">
                <div>
                  <h1 className="text-xl font-semibold flex flex-wrap items-center gh-gap-1 gh-mb-2">
                    <span className="gh-text-secondary">
                      <Link href={`/repositories/${owner}`} className="hover:text-[#58a6ff]">
                        {owner}
                      </Link>
                    </span>
                    <span className="gh-text-secondary">/</span>
                    <Link href={`/repositories/${owner}/${repo}`} className="gh-text-primary hover:underline">
                      {repo}
                    </Link>
                    <span className="gh-ml-2 text-xs px-1.5 py-0.5 rounded-full bg-[#238636]/10 border border-[#238636]/30 gh-text-success">Public</span>
                  </h1>
                  <p className="gh-text-secondary text-sm max-w-2xl">{repository.description}</p>
                </div>

                <RepositoryStats
                  stars={repository.stars}
                  forks={repository.forks}
                  watchers={repository.watchers}
                  issues={repository.issues}
                  pullRequests={repository.pullRequests}
                  onStar={() => console.log('Star clicked')}
                  onWatch={() => console.log('Watch clicked')}
                  onFork={() => console.log('Fork clicked')}
                />
              </div>
            </div>
          
            <div className="border-b gh-border-subtle">
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="gh-mb-0 flex flex-nowrap overflow-x-auto bg-transparent gh-p-0.5 gap-px text-sm">
                  <TabsTrigger value="code" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <Code size={16} />
                    <span className="whitespace-nowrap">Code</span>
                  </TabsTrigger>
                  <TabsTrigger value="issues" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <AlertCircle size={16} />
                    <span className="whitespace-nowrap">Issues</span>
                    <span className="ml-1 text-xs bg-[#30363d] px-2 py-0.5 rounded-full">{repository.issues}</span>
                  </TabsTrigger>
                  <TabsTrigger value="pull-requests" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <GitPullRequest size={16} />
                    <span className="whitespace-nowrap hidden xs:inline">Pull Requests</span>
                    <span className="whitespace-nowrap xs:hidden">PRs</span>
                    <span className="ml-1 text-xs bg-[#30363d] px-2 py-0.5 rounded-full">{repository.pullRequests}</span>
                  </TabsTrigger>
                  <TabsTrigger value="branches" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <GitBranch size={16} />
                    <span className="whitespace-nowrap">Branches</span>
                    <span className="ml-1 text-xs bg-[#30363d] px-2 py-0.5 rounded-full">{repository.branches || 4}</span>
                  </TabsTrigger>
                  <TabsTrigger value="actions" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 hidden sm:flex gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <Play size={16} />
                    <span className="whitespace-nowrap">Actions</span>
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 hidden md:flex gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <Shield size={16} />
                    <span className="whitespace-nowrap">Security</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 hidden lg:flex gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <FileCode size={16} />
                    <span className="whitespace-nowrap">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gh-gap-1 gh-py-2 gh-px-4 gh-text-primary data-[state=active]:bg-transparent data-[state=active]:text-[#f0f6fc] data-[state=active]:border-b-2 data-[state=active]:border-[#f78166]">
                    <Settings size={16} />
                    <span className="whitespace-nowrap">Settings</span>
                  </TabsTrigger>
                </TabsList>
              
                <TabsContent value="code" className="gh-pt-3">
                  {/* Branch selector and code navigation - GitHub-like layout */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gh-gap-3 gh-mb-4 rounded-md border gh-border-subtle gh-bg-canvas-subtle gh-p-3">
                    <div className="flex flex-wrap items-center gap-2" data-tour="branch-selector">
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
                        onCreateBranch={handleCreateBranch}
                      />
                      <Link href={`/repositories/${owner}/${repo}/commits`} className="flex items-center rounded-md border gh-border-subtle gh-bg-canvas gh-text-primary gh-py-1 gh-px-3 text-sm hover:bg-[#30363d]">
                        <History size={16} className="mr-1" />
                        <span>Commits</span>
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
                      >
                        Go to file
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
                      >
                        Add file
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowCloneDialog(!showCloneDialog)}
                        className="bg-[#238636] text-white hover:bg-[#2ea043]"
                      >
                        <Download size={16} className="mr-1" />
                        Clone
                      </Button>
                    </div>
                  </div>

                  {/* Clone URL display - shown when Clone button is clicked */}
                  {showCloneDialog && (
                    <div className="gh-mb-4">
                      <CloneUrlDisplay
                        httpsUrl={`https://walgit.io/${owner}/${repo}.git`}
                        sshUrl={`sui://walgit@${owner}/${repo}.git`}
                        cliCommand={`walgit clone sui://${owner}/${repo}`}
                        className="p-3 rounded-md border gh-border-subtle gh-bg-canvas-subtle"
                      />
                    </div>
                  )}
                
                  {/* Repository content - GitHub-like layout with proper spacing */}
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  }>
                    <RepositoryOverview 
                      owner={owner}
                      repo={repo}
                      data={repository}
                      currentBranch={currentBranch}
                      onBranchChange={handleBranchChange}
                    />
                  </Suspense>
                </TabsContent>
              
                <TabsContent value="issues">
                  <div className="text-center py-8 text-muted-foreground">
                    Issues will be displayed here
                  </div>
                </TabsContent>
              
                <TabsContent value="pull-requests">
                  <div className="py-6">
                    <Suspense fallback={
                      <div className="border border-border rounded-lg p-4 h-96 animate-pulse bg-muted/10">
                        <div className="h-6 w-3/4 bg-muted/20 rounded mb-4"></div>
                        <div className="space-y-4">
                          <div className="h-16 bg-muted/20 rounded"></div>
                          <div className="h-16 bg-muted/20 rounded"></div>
                          <div className="h-16 bg-muted/20 rounded"></div>
                        </div>
                      </div>
                    }>
                      <PullRequestsList
                        repositoryOwner={owner}
                        repositoryName={repo}
                        pullRequests={mockPullRequests}
                        isLoading={false}
                      />
                    </Suspense>
                  </div>
                </TabsContent>
              
                <TabsContent value="branches">
                  <div className="py-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">Branches</h2>
                      <Button asChild>
                        <Link href={`/repositories/${owner}/${repo}/branches`}>
                          <GitBranch className="h-4 w-4 mr-2" />
                          Manage Branches
                        </Link>
                      </Button>
                    </div>
                    <div className="text-center py-8 text-muted-foreground">
                      View and manage all branches from the <Link href={`/repositories/${owner}/${repo}/branches`} className="text-primary hover:underline">branches page</Link>
                    </div>
                  </div>
                </TabsContent>
              
                <TabsContent value="actions">
                  <div className="text-center py-8 text-muted-foreground">
                    Actions will be displayed here
                  </div>
                </TabsContent>
              
                <TabsContent value="security">
                  <div className="text-center py-8 text-muted-foreground">
                    Security information will be displayed here
                  </div>
                </TabsContent>
              
                <TabsContent value="insights">
                  <div className="text-center py-8 text-muted-foreground">
                    Repository insights will be displayed here
                  </div>
                </TabsContent>
              
                <TabsContent value="settings">
                  <div className="text-center py-8 text-muted-foreground">
                    Repository settings will be displayed here
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Mock repository data for demonstration
const mockRepoData = {
  name: "walgit-core",
  description: "Core functionality for the WalGit decentralized version control system",
  language: "Move",
  languageColor: "#6e5494",
  stars: 42,
  forks: 12,
  watchers: 8,
  issues: 5,
  pullRequests: 3,
  owner: "walrus-dev",
  defaultBranch: "main",
  license: "MIT",
  lastCommit: {
    hash: "a1b2c3d4e5f6",
    message: "Update README.md",
    author: "walrus-dev",
    date: "2025-04-05T10:30:00Z"
  },
  files: [
    { name: "sources", type: "directory", lastCommit: "Initial commit", updatedAt: "2025-04-03T14:30:00Z" },
    { name: "tests", type: "directory", lastCommit: "Add unit tests", updatedAt: "2025-04-03T14:30:00Z" },
    { name: "Move.toml", type: "file", lastCommit: "Update dependencies", updatedAt: "2025-04-04T09:15:00Z" },
    { name: "README.md", type: "file", lastCommit: "Update documentation", updatedAt: "2025-04-05T10:30:00Z" },
    { name: "LICENSE", type: "file", lastCommit: "Initial commit", updatedAt: "2025-04-01T09:45:00Z" },
  ],
};

// Mock pull request data
const mockPullRequests = [
  {
    id: "pull_request_1",
    title: "Implement changeset-based storage",
    description: "This PR implements a new changeset-based storage model inspired by JJ (Jujutsu) version control. This approach optimizes for blockchain storage and transaction costs.",
    status: "open",
    author: "0x123456789abcdef",
    sourceBranch: "feature/changeset-storage",
    targetBranch: "main",
    createdAt: "2025-04-03T09:30:00Z",
    lastUpdated: "2025-04-05T11:15:00Z",
    reviews: [
      {
        id: "review_1",
        reviewer: "0xabcdef1234567890",
        verdict: "approve",
        comment: "This looks great! The changeset approach is much more efficient for on-chain storage.",
        timestamp: "2025-04-04T14:22:00Z"
      }
    ],
    comments: [
      {
        id: "comment_1",
        author: "0xfedcba9876543210",
        content: "Have you considered how this affects the gas usage during complex merges?",
        timestamp: "2025-04-04T10:11:00Z"
      },
      {
        id: "comment_2",
        author: "0x123456789abcdef",
        content: "Yes, I added gas optimizations for merge operations. The PR includes benchmarks showing 30% reduction in gas costs.",
        timestamp: "2025-04-04T10:30:00Z"
      }
    ],
    mergeableStatus: {
      canMerge: true
    },
    diffStats: {
      filesChanged: 8,
      insertions: 345,
      deletions: 123
    }
  },
  {
    id: "pull_request_2",
    title: "Add branch protection rules",
    description: "Implements branch protection rules to control who can push to specific branches. This provides security for important branches like main.",
    status: "open",
    author: "0xfedcba9876543210",
    sourceBranch: "feature/branch-protection",
    targetBranch: "main",
    createdAt: "2025-04-02T15:45:00Z",
    mergeableStatus: {
      canMerge: false,
      reason: "Requires approval from at least one reviewer"
    },
    diffStats: {
      filesChanged: 3,
      insertions: 112,
      deletions: 15
    }
  },
  {
    id: "pull_request_3",
    title: "Optimize Walrus storage integration",
    description: "Improves the integration with Walrus storage to reduce transaction costs and improve performance.",
    status: "merged",
    author: "0xabcdef1234567890",
    sourceBranch: "feature/walrus-optimization",
    targetBranch: "main",
    createdAt: "2025-03-28T08:15:00Z",
    mergedAt: "2025-04-01T09:30:00Z",
    mergedBy: "0x123456789abcdef",
    diffStats: {
      filesChanged: 5,
      insertions: 87,
      deletions: 42
    }
  }
];