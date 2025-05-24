'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CloneUrlDisplay } from "@/components/git/CloneUrlDisplay";
import { ReadmeViewer } from "@/components/repository/ReadmeViewer";
import { 
  ArrowLeft, 
  GitBranch, 
  Star, 
  GitFork, 
  Eye, 
  Code, 
  GitCommit,
  GitPullRequest,
  Settings,
  FileText,
  History,
  ChevronDown
} from "lucide-react";

// Mock data for demonstration
const mockRepository = {
  name: "walgit-core",
  description: "Core functionality for the WalGit decentralized version control system built on Sui",
  stars: 42,
  forks: 12,
  watchers: 8,
  language: "Move",
  license: "MIT",
  defaultBranch: "main",
  lastActivity: "2025-04-05T10:30:00Z",
  cloneUrl: "walgit://0x1234...abcd/walgit-core",
  webUrl: "https://walgit.app/walrus-dev/walgit-core"
};

const mockBranches = [
  { name: "main", isDefault: true },
  { name: "develop", isDefault: false },
  { name: "feature/ui-updates", isDefault: false }
];

const mockFiles = [
  { name: "sources", type: "directory", lastCommit: "Initial commit", lastActivity: "2025-04-03" },
  { name: "tests", type: "directory", lastCommit: "Add unit tests", lastActivity: "2025-04-03" },
  { name: "Move.toml", type: "file", size: "1.2 KB", lastCommit: "Update dependencies", lastActivity: "2025-04-04" },
  { name: "README.md", type: "file", size: "3.5 KB", lastCommit: "Update documentation", lastActivity: "2025-04-05" },
  { name: "LICENSE", type: "file", size: "1.1 KB", lastCommit: "Initial commit", lastActivity: "2025-04-01" }
];

const mockCommits = [
  {
    hash: "a1b2c3d4e5f6",
    message: "Update README.md",
    author: "walrus-dev",
    date: "2025-04-05T10:30:00Z",
    verified: true
  },
  {
    hash: "b2c3d4e5f6a1",
    message: "Implement optimized storage",
    author: "developer-1",
    date: "2025-04-04T15:20:00Z",
    verified: true
  },
  {
    hash: "c3d4e5f6a1b2",
    message: "Add dark mode support",
    author: "developer-2",
    date: "2025-04-03T09:45:00Z",
    verified: false
  }
];

const mockReadmeContent = `# WalGit Core

Core functionality for the WalGit decentralized version control system built on Sui.

## Features

- Decentralized storage of git repositories
- On-chain access control
- Integration with Sui blockchain
- Optimized storage with Walrus

## Getting Started

To use WalGit, you'll need:
- A Sui wallet
- The WalGit CLI

## Installation

\`\`\`bash
npm install -g @walgit/cli
\`\`\`

## License

This project is licensed under the MIT License.`;

export default function RepositoryDetailPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const [currentBranch, setCurrentBranch] = useState('main');
  const [activeTab, setActiveTab] = useState('code');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading repository data
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [owner, repo]);

  const handleBranchChange = (branch: string) => {
    setCurrentBranch(branch);
    // In a real app, this would fetch data for the selected branch
  };

  const handleFileClick = (file: any) => {
    if (file.type === 'file') {
      // Navigate to file view
      console.log('Opening file:', file.name);
    } else {
      // Navigate to directory
      console.log('Opening directory:', file.name);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumb */}
      <Link 
        href="/repositories" 
        className="mb-6 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Repositories
      </Link>

      {/* Repository Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-muted-foreground">{owner}</span>
              <span>/</span>
              <span>{repo}</span>
              <span className="ml-3 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-normal">
                Public
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {mockRepository.description}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Watch
              <span className="ml-2 text-muted-foreground">{mockRepository.watchers}</span>
            </Button>
            <Button variant="outline" size="sm">
              <Star className="h-4 w-4 mr-1" />
              Star
              <span className="ml-2 text-muted-foreground">{mockRepository.stars}</span>
            </Button>
            <Button variant="outline" size="sm">
              <GitFork className="h-4 w-4 mr-1" />
              Fork
              <span className="ml-2 text-muted-foreground">{mockRepository.forks}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Repository Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="commits" className="flex items-center gap-2">
            <GitCommit className="h-4 w-4" />
            Commits
          </TabsTrigger>
          <TabsTrigger value="pulls" className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4" />
            Pull Requests
          </TabsTrigger>
          <TabsTrigger value="wiki" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Wiki
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {/* Branch selector and clone button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        {currentBranch}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {mockBranches.map((branch) => (
                        <DropdownMenuItem
                          key={branch.name}
                          onClick={() => handleBranchChange(branch.name)}
                          className="flex items-center justify-between"
                        >
                          <span>{branch.name}</span>
                          {branch.isDefault && <Badge variant="secondary" className="ml-2 text-xs">default</Badge>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm">
                    <GitBranch className="h-4 w-4 mr-1" />
                    {mockBranches.length} branches
                  </Button>
                </div>
                <CloneUrlDisplay 
                  httpsUrl={mockRepository.webUrl}
                  cliCommand={`walgit clone ${mockRepository.cloneUrl}`}
                />
              </div>

              {/* File Browser */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Files</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      Last commit on {new Date(mockRepository.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {mockFiles.map((file) => (
                      <div 
                        key={file.name} 
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="flex items-center gap-3">
                          {file.type === 'directory' ? (
                            <GitBranch className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{file.lastCommit}</span>
                          <span>{file.lastActivity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* README */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    README.md
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReadmeViewer content={mockReadmeContent} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80 space-y-4">
              {/* Repository Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {mockRepository.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">License:</span>
                    <span>{mockRepository.license}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Language:</span>
                    <span>{mockRepository.language}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Last updated {new Date(mockRepository.lastActivity).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Commits Tab */}
        <TabsContent value="commits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commit History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCommits.map((commit) => (
                  <div key={commit.hash} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <GitCommit className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{commit.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {commit.author} committed on {new Date(commit.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {commit.verified && (
                        <Badge variant="outline" className="text-xs">Verified</Badge>
                      )}
                      <code className="text-xs text-muted-foreground font-mono">
                        {commit.hash.substring(0, 7)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pull Requests Tab */}
        <TabsContent value="pulls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pull Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <GitPullRequest className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No open pull requests</p>
                <Button className="mt-4" variant="outline">
                  Create Pull Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wiki Tab */}
        <TabsContent value="wiki" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Wiki</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No wiki pages yet</p>
                <Button className="mt-4" variant="outline">
                  Create Wiki Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Repository Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Repository settings are available to maintainers</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}