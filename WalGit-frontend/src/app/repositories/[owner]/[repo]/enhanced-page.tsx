'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import WaveBackground from "@/components/layout/WaveBackground";
import { useSuiClient } from "@mysten/dapp-kit";
import { walletService } from "@/services/wallet";
import { PullRequestsList } from "@/components/dashboard/PullRequestsList";
import { StorageDashboard } from "@/components/dashboard/StorageDashboard";
import { BranchSelector } from "@/components/repository/BranchSelector";
import { RepositoryVisualization } from "@/components/repository/RepositoryVisualization";
import { EnhancedFileDiff } from "@/components/code-review/EnhancedFileDiff";
import {
  Star,
  GitFork,
  Eye,
  AlertCircle,
  Code,
  BookOpen,
  GitPullRequest,
  Play,
  Shield,
  History,
  FileCode,
  Settings,
  Search,
  Plus,
  Download,
  Upload
} from "lucide-react";

// Import the mockup data (would be replaced with real data from API)
import { 
  mockRepoData, 
  mockPullRequests, 
  mockCommits, 
  mockBranches, 
  mockTags,
  mockDiffHunks,
  mockThreads
} from './mock-data';

export default function EnhancedRepositoryDetailPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  
  const client = useSuiClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repository, setRepository] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState('main');
  
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

  const handleChangeBranch = (branch: string) => {
    // In a real implementation, this would fetch data for the selected branch
    console.log(`Changing to branch: ${branch}`);
    setCurrentBranch(branch);
  };
  
  const handleCreateBranch = async (name: string, fromBranch: string) => {
    // In a real implementation, this would create a new branch
    console.log(`Creating branch ${name} from ${fromBranch}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };
  
  const handleCreateTag = async (name: string, commitHash: string) => {
    // In a real implementation, this would create a new tag
    console.log(`Creating tag ${name} at commit ${commitHash}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };
  
  const handleAddComment = async (lineNumber: number, content: string) => {
    // In a real implementation, this would add a comment to a line
    console.log(`Adding comment to line ${lineNumber}: ${content}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };
  
  const handleReplyToThread = async (threadId: string, content: string) => {
    // In a real implementation, this would reply to a thread
    console.log(`Replying to thread ${threadId}: ${content}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };
  
  const handleResolveThread = async (threadId: string) => {
    // In a real implementation, this would resolve a thread
    console.log(`Resolving thread ${threadId}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };
  
  const handleReopenThread = async (threadId: string) => {
    // In a real implementation, this would reopen a thread
    console.log(`Reopening thread ${threadId}`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
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
    <div className="min-h-screen relative">
      <WaveBackground />
      
      <div className="container mx-auto px-4 py-6">
        {/* Repository header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <span className="text-muted-foreground">
                  <Link href={`/repositories/${owner}`} className="hover:underline">
                    {owner}
                  </Link>
                </span>
                <span>/</span>
                <Link href={`/repositories/${owner}/${repo}`} className="hover:underline">
                  {repo}
                </Link>
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Public</span>
              </h1>
              <p className="text-muted-foreground mt-1">{repository.description}</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Eye size={16} />
                <span>Watch</span>
                <span className="ml-1">{repository.watchers}</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Star size={16} />
                <span>Star</span>
                <span className="ml-1">{repository.stars}</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <GitFork size={16} />
                <span>Fork</span>
                <span className="ml-1">{repository.forks}</span>
              </Button>
            </div>
          </div>
          
          <div className="border-b border-border">
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="mb-0">
                <TabsTrigger value="code" className="flex items-center gap-1">
                  <Code size={16} />
                  <span>Code</span>
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-1">
                  <AlertCircle size={16} />
                  <span>Issues</span>
                  <span className="ml-1 text-xs">{repository.issues}</span>
                </TabsTrigger>
                <TabsTrigger value="pull-requests" className="flex items-center gap-1">
                  <GitPullRequest size={16} />
                  <span>Pull Requests</span>
                  <span className="ml-1 text-xs">{repository.pullRequests}</span>
                </TabsTrigger>
                <TabsTrigger value="actions" className="flex items-center gap-1">
                  <Play size={16} />
                  <span>Actions</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-1">
                  <Shield size={16} />
                  <span>Security</span>
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-1">
                  <FileCode size={16} />
                  <span>Insights</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-1">
                  <Settings size={16} />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="code" className="pt-6">
                {/* Branch selector and code navigation */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <BranchSelector
                      currentBranch={currentBranch}
                      branches={mockBranches}
                      tags={mockTags}
                      onChangeBranch={handleChangeBranch}
                      onCreateBranch={handleCreateBranch}
                      onCreateTag={handleCreateTag}
                      recentBranches={['main', 'develop', 'feature/ui-updates']}
                    />
                    
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <History size={16} className="mr-1" />
                      <Link href={`/repositories/${owner}/${repo}/commits`}>
                        <span>Commits</span>
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Search className="h-4 w-4 mr-1" />
                      Go to file
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Plus className="h-4 w-4 mr-1" />
                      Add file
                    </Button>
                    <Button size="sm" className="flex items-center gap-1">
                      <Download className="h-4 w-4 mr-1" />
                      Clone
                    </Button>
                  </div>
                </div>
                
                {/* Repository content */}
                <Tabs defaultValue="files" className="mb-6">
                  <TabsList>
                    <TabsTrigger value="files">
                      <FileCode className="h-4 w-4 mr-1" />
                      Files
                    </TabsTrigger>
                    <TabsTrigger value="history">
                      <History className="h-4 w-4 mr-1" />
                      Commit History
                    </TabsTrigger>
                    <TabsTrigger value="diff">
                      <Code className="h-4 w-4 mr-1" />
                      Diff Example
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="files" className="pt-4">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="w-full lg:w-8/12">
                        <div className="border border-border rounded-lg overflow-hidden mb-6">
                          <div className="bg-muted/30 p-3 border-b border-border flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              Last commit: <span className="font-mono">{repository.lastCommit.hash.substring(0, 7)}</span> · Updated {formatRelativeTime(repository.lastCommit.date)}
                            </div>
                          </div>

                          <div className="divide-y divide-border">
                            {repository.files.map((file: any) => (
                              <div key={file.name} className="flex justify-between items-center p-3 hover:bg-muted/30">
                                <div className="flex items-center gap-2">
                                  {file.type === "directory" ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                                      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                      <polyline points="14 2 14 8 20 8"></polyline>
                                    </svg>
                                  )}
                                  <Link
                                    href={`/repositories/${owner}/${repo}/${file.type === 'directory' ? 'tree' : 'blob'}/main/${file.name}`}
                                    className="font-medium hover:text-primary hover:underline"
                                  >
                                    {file.name}
                                  </Link>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <span>{file.lastCommit}</span>
                                  <span className="mx-2">•</span>
                                  <span>{formatRelativeTime(file.updatedAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* README section */}
                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="bg-muted/30 p-3 border-b border-border flex items-center gap-2">
                            <BookOpen size={16} />
                            <h2 className="font-semibold">README.md</h2>
                          </div>

                          <div className="p-6 prose max-w-none">
                            <h1>WalGit Core</h1>
                            <p>Core functionality for the WalGit decentralized version control system built on Sui.</p>

                            <h2>Features</h2>
                            <ul>
                              <li>Decentralized storage of git repositories</li>
                              <li>On-chain access control</li>
                              <li>Integration with Sui blockchain</li>
                            </ul>

                            <h2>Getting Started</h2>
                            <p>To use WalGit, you&apos;ll need:</p>
                            <ul>
                              <li>A Sui wallet</li>
                              <li>The WalGit CLI</li>
                            </ul>

                            <h2>License</h2>
                            <p>This project is licensed under the {repository.license} License.</p>
                          </div>
                        </div>
                      </div>

                      {/* Sidebar with Statistics and Storage */}
                      <div className="w-full lg:w-4/12 space-y-6">
                        {/* Pull Requests */}
                        <PullRequestsList
                          repositoryOwner={owner}
                          repositoryName={repo}
                          pullRequests={mockPullRequests}
                          isLoading={false}
                        />

                        {/* Storage Dashboard */}
                        <StorageDashboard
                          repositoryOwner={owner}
                          repositoryName={repo}
                          repositoryId={repository.id}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="pt-4">
                    <RepositoryVisualization
                      repositoryOwner={owner}
                      repositoryName={repo}
                      commits={mockCommits}
                      branches={mockBranches}
                      tags={mockTags}
                      currentBranch={currentBranch}
                      onChangeBranch={handleChangeBranch}
                      onCreateBranch={handleCreateBranch}
                      onCreateTag={handleCreateTag}
                    />
                  </TabsContent>
                  
                  <TabsContent value="diff" className="pt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Example Diff (Enhanced View)</h3>
                      <p className="text-muted-foreground">
                        This is an example of the enhanced diff view with syntax highlighting and improved comment functionality.
                      </p>
                      
                      <EnhancedFileDiff
                        fileInfo={{
                          oldPath: 'src/components/ui/button.tsx',
                          newPath: 'src/components/ui/button.tsx',
                          type: 'modified',
                          language: 'tsx'
                        }}
                        hunks={mockDiffHunks}
                        threads={mockThreads}
                        onAddComment={handleAddComment}
                        onReplyToThread={handleReplyToThread}
                        onResolveThread={handleResolveThread}
                        onReopenThread={handleReopenThread}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="issues">
                <div className="text-center py-8 text-muted-foreground">
                  Issues will be displayed here
                </div>
              </TabsContent>
              
              <TabsContent value="pull-requests">
                <div className="py-6">
                  <PullRequestsList
                    repositoryOwner={owner}
                    repositoryName={repo}
                    pullRequests={mockPullRequests}
                    isLoading={false}
                  />
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
  );
}

// Helper function to format dates in a relative format
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  
  return date.toLocaleDateString();
}