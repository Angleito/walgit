'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BranchSelector } from "@/components/repository/BranchSelector";
import { CloneUrlDisplay } from "@/components/git/CloneUrlDisplay";
import { FileBrowser } from "@/components/git/FileBrowser";
import { RepositoryStats } from "@/components/git/RepositoryStats";
import { ReadmeViewer } from "@/components/repository/ReadmeViewer";
import { LanguageStats } from "@/components/repository/LanguageStats";
import { ContributorAvatars } from "@/components/repository/ContributorAvatars";
import { RepositoryActions } from "@/components/repository/RepositoryActions";
import {
  Code,
  GitPullRequest,
  GitBranch,
  Settings,
  Shield,
  FileText,
  Link as LinkIcon,
  Calendar,
  Tag,
  Users,
  Activity
} from "lucide-react";
import { cn } from '@/lib/utils';

interface RepositoryOverviewProps {
  owner: string;
  repo: string;
  data: any;
  currentBranch: string;
  onBranchChange: (branch: string) => void;
}

export default function RepositoryOverview({
  owner,
  repo,
  data,
  currentBranch,
  onBranchChange
}: RepositoryOverviewProps) {
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [isLoadingReadme, setIsLoadingReadme] = useState(true);

  // Ensure data is defined
  if (!data) {
    return (
      <div className="p-4 text-center">
        <p>Loading repository data...</p>
      </div>
    );
  }

  useEffect(() => {
    // Simulate fetching README content
    const mockReadme = `# ${repo}

${data.description || 'A decentralized git repository on Sui blockchain.'}

## Features

- 🔒 Decentralized storage with Walrus
- 🌐 On-chain access control
- ⚡ Fast and secure operations
- 🔗 Sui blockchain integration

## Getting Started

To use this repository, you'll need:

1. Install the WalGit CLI
2. Connect your Sui wallet
3. Clone this repository

\`\`\`bash
walgit clone sui://${owner}/${repo}
\`\`\`

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for more details.

## License

This project is licensed under the ${data.license || 'MIT'} License.`;

    setReadmeContent(mockReadme);
    setIsLoadingReadme(false);
  }, [repo, owner, data]);

  // Mock data for demonstration
  const languages = [
    { name: 'TypeScript', percentage: 45, color: '#2b7489', size: 450000 },
    { name: 'Move', percentage: 30, color: '#4a90e2', size: 300000 },
    { name: 'JavaScript', percentage: 15, color: '#f1e05a', size: 150000 },
    { name: 'CSS', percentage: 8, color: '#563d7c', size: 80000 },
    { name: 'HTML', percentage: 2, color: '#e34c26', size: 20000 },
  ];

  const contributors = Array.from({ length: 12 }, (_, i) => ({
    id: `contributor-${i}`,
    name: ['Alice Chen', 'Bob Johnson', 'Carol Williams', 'David Kim', 'Eve Martinez'][i % 5],
    avatar: `/api/placeholder/32/32`,
    contributions: Math.floor(Math.random() * 100) + 1,
  }));

  return (
    <div className="w-full">
      {/* Repository Header */}
      <div className="border-b border-[#30363d] pb-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
              <Users size={16} />
              <Link href={`/users/${owner}`} className="hover:text-[#58a6ff] hover:underline">
                {owner}
              </Link>
              <span>/</span>
              <span className="text-[#f0f6fc] font-semibold text-xl">{repo}</span>
              <span className="px-1.5 py-0.5 text-xs bg-[#21262d] border border-[#30363d] rounded-full">
                {data.visibility || 'Public'}
              </span>
            </div>
            <p className="text-[#8b949e] mt-1">{data.description}</p>
            
            {/* Repository metadata */}
            <div className="flex items-center gap-4 mt-3 text-sm text-[#8b949e]">
              {data.website && (
                <a 
                  href={data.website} 
                  className="flex items-center gap-1 hover:text-[#58a6ff]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkIcon size={14} />
                  {data.website}
                </a>
              )}
              <div className="flex items-center gap-1">
                <Shield size={14} />
                {data.license || 'MIT'} License
              </div>
              <div className="flex items-center gap-1">
                <Tag size={14} />
                {data.topics?.length || 0} topics
              </div>
            </div>
          </div>
          
          <RepositoryActions
            stars={data.stars || 42}
            watches={data.watches || 12}
            forks={data.forks || 5}
            onStar={() => console.log('Star toggled')}
            onWatch={(mode) => console.log('Watch mode:', mode)}
            onFork={() => console.log('Fork repository')}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex gap-6">
        {/* Left Column - Files and README */}
        <div className="flex-1">
          {/* Branch selector and actions bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BranchSelector
                branches={data.branches || []}
                tags={data.tags || []}
                currentBranch={currentBranch}
                onChangeBranch={onBranchChange}
                onCreateBranch={async (name, fromBranch) => {
                  console.log(`Creating branch ${name} from ${fromBranch}`);
                  return Promise.resolve();
                }}
                onCreateTag={async (name, commitHash) => {
                  console.log(`Creating tag ${name} at ${commitHash}`);
                  return Promise.resolve();
                }}
              />
              
              <Button
                variant="outline"
                size="sm"
                className="text-[#58a6ff]"
              >
                <GitBranch size={16} className="mr-1" />
                {data.branches?.length || 1} branches
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-[#58a6ff]"
              >
                <Tag size={16} className="mr-1" />
                {data.tags?.length || 0} tags
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/repositories/${owner}/${repo}/tree/${currentBranch}`}>
                <Button variant="outline" size="sm">
                  Go to file
                </Button>
              </Link>
              
              <Button variant="outline" size="sm">
                Add file
              </Button>
              
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCloneDialog(!showCloneDialog)}
                className="bg-[#238636] hover:bg-[#2ea043]"
              >
                <Code size={16} className="mr-1" />
                Code
              </Button>
            </div>
          </div>

          {/* Clone dialog */}
          {showCloneDialog && (
            <div className="mb-4">
              <CloneUrlDisplay
                httpsUrl={`https://walgit.io/${owner}/${repo}.git`}
                sshUrl={`sui://walgit@${owner}/${repo}.git`}
                cliCommand={`walgit clone sui://${owner}/${repo}`}
                className="bg-[#0d1117] border border-[#30363d] rounded-md"
              />
            </div>
          )}

          {/* Latest commit info */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image 
                  src="/api/placeholder/24/24" 
                  alt={data.lastCommit?.author || 'Author'}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <div>
                  <span className="font-medium text-[#f0f6fc]">{data.lastCommit?.author || 'Unknown'}</span>
                  <span className="text-[#8b949e] mx-2">{data.lastCommit?.message || 'Initial commit'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#8b949e]">
                <span>{data.lastCommit?.hash?.slice(0, 7) || 'abc1234'}</span>
                <span>{data.lastCommit?.date || '2 hours ago'}</span>
                <Button variant="outline" size="sm">
                  <Activity size={14} className="mr-1" />
                  {data.commits || 142} commits
                </Button>
              </div>
            </div>
          </div>

          {/* File browser */}
          <div className="mb-6">
            <FileBrowser
              nodes={data.files || []}
              repositoryPath={`/repositories/${owner}/${repo}`}
              currentPath=""
              branch={currentBranch}
            />
          </div>

          {/* README */}
          {!isLoadingReadme && readmeContent && (
            <ReadmeViewer content={readmeContent} />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-80 space-y-4">
          {/* About */}
          <div className="rounded-md border border-[#30363d] overflow-hidden">
            <div className="bg-[#161b22] p-3 border-b border-[#30363d]">
              <h3 className="font-semibold text-[#f0f6fc]">About</h3>
            </div>
            <div className="p-3">
              <p className="text-[#f0f6fc] mb-3">{data.description}</p>
              
              <div className="space-y-2 text-sm">
                {data.website && (
                  <div className="flex items-center gap-2">
                    <LinkIcon size={14} className="text-[#8b949e]" />
                    <a href={data.website} className="text-[#58a6ff] hover:underline">
                      {data.website}
                    </a>
                  </div>
                )}
                
                {data.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {data.topics.map((topic: string) => (
                      <span 
                        key={topic}
                        className="px-2 py-1 text-xs bg-[#1f6feb]/10 text-[#58a6ff] rounded-full hover:bg-[#1f6feb]/20 cursor-pointer"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Repository stats */}
          <div className="rounded-md border border-[#30363d] overflow-hidden">
            <div className="bg-[#161b22] p-3 border-b border-[#30363d]">
              <h3 className="font-semibold text-[#f0f6fc]">Repository Stats</h3>
            </div>
            <div className="p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#8b949e]">Commits</span>
                <span className="font-mono">{data.commits || 142}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8b949e]">Branches</span>
                <span className="font-mono">{data.branches?.length || 3}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8b949e]">Tags</span>
                <span className="font-mono">{data.tags?.length || 5}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8b949e]">Contributors</span>
                <span className="font-mono">{contributors.length}</span>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="rounded-md border border-[#30363d] overflow-hidden">
            <div className="bg-[#161b22] p-3 border-b border-[#30363d]">
              <h3 className="font-semibold text-[#f0f6fc]">Languages</h3>
            </div>
            <div className="p-3">
              <LanguageStats languages={languages} />
            </div>
          </div>

          {/* Contributors */}
          <div className="rounded-md border border-[#30363d] overflow-hidden">
            <div className="bg-[#161b22] p-3 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="font-semibold text-[#f0f6fc]">Contributors</h3>
              <span className="text-sm text-[#8b949e]">{contributors.length}</span>
            </div>
            <div className="p-3">
              <ContributorAvatars contributors={contributors} maxDisplay={8} />
              <Link 
                href={`/repositories/${owner}/${repo}/graphs/contributors`}
                className="text-sm text-[#58a6ff] hover:underline mt-2 inline-block"
              >
                View all contributors
              </Link>
            </div>
          </div>

          {/* Activity */}
          <div className="rounded-md border border-[#30363d] overflow-hidden">
            <div className="bg-[#161b22] p-3 border-b border-[#30363d]">
              <h3 className="font-semibold text-[#f0f6fc]">Activity</h3>
            </div>
            <div className="p-3 space-y-2">
              <Link 
                href={`/repositories/${owner}/${repo}/commits`}
                className="flex items-center justify-between text-sm hover:text-[#58a6ff]"
              >
                <span>Commits</span>
                <span className="text-[#8b949e]">{data.commits || 142}</span>
              </Link>
              <Link 
                href={`/repositories/${owner}/${repo}/pulls`}
                className="flex items-center justify-between text-sm hover:text-[#58a6ff]"
              >
                <span>Pull requests</span>
                <span className="text-[#8b949e]">{data.pullRequests || 12}</span>
              </Link>
              <Link 
                href={`/repositories/${owner}/${repo}/issues`}
                className="flex items-center justify-between text-sm hover:text-[#58a6ff]"
              >
                <span>Issues</span>
                <span className="text-[#8b949e]">{data.issues || 5}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}