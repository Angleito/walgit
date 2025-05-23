'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StagingArea } from '@/components/git/StagingArea';
import { Button } from "@/components/ui/button";
import { ArrowLeft, GitBranch } from "lucide-react";
import { useSuiClient } from "@mysten/dapp-kit";

export default function StagingPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;
  const client = useSuiClient();

  const [isLoading, setIsLoading] = useState(true);
  const [changes, setChanges] = useState<any[]>([]);

  useEffect(() => {
    async function fetchChanges() {
      try {
        setIsLoading(true);
        // TODO: Fetch actual changes from local Git working directory
        // const data = await walletService.getWorkingDirectoryChanges(client, owner, repo);
        
        // For now, use mock data
        setTimeout(() => {
          setChanges(mockChanges);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching changes:', err);
        setChanges(mockChanges);
        setIsLoading(false);
      }
    }

    fetchChanges();
  }, [owner, repo, client]);

  const handleStageFiles = (files: string[]) => {
    setChanges(current => 
      current.map(change => 
        files.includes(change.filename) 
          ? { ...change, staged: true }
          : change
      )
    );
  };

  const handleUnstageFiles = (files: string[]) => {
    setChanges(current => 
      current.map(change => 
        files.includes(change.filename) 
          ? { ...change, staged: false }
          : change
      )
    );
  };

  const handleDiscardChanges = (files: string[]) => {
    setChanges(current => 
      current.filter(change => !files.includes(change.filename))
    );
  };

  const getDiffForFile = (filename: string) => {
    const file = changes.find(f => f.filename === filename);
    if (!file) return null;
    
    return {
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      lines: file.diff || []
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-[#30363d] p-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/repositories/${owner}/${repo}`}
                className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[#f0f6fc]">
                  Changes
                </h1>
                <p className="text-sm text-[#8b949e]">
                  {owner} / {repo}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                <GitBranch size={16} />
                <span>main</span>
              </div>
              <Link href={`/repositories/${owner}/${repo}/commits/new`}>
                <Button
                  variant="default"
                  className="bg-[#238636] text-white hover:bg-[#2ea043]"
                >
                  Create commit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Staging area */}
      <div className="flex-1 overflow-hidden">
        <StagingArea
          changes={changes}
          onStageFiles={handleStageFiles}
          onUnstageFiles={handleUnstageFiles}
          onDiscardChanges={handleDiscardChanges}
          getDiffForFile={getDiffForFile}
          className="h-full"
        />
      </div>
    </div>
  );
}

// Mock change data
const mockChanges = [
  {
    filename: 'src/components/ui/button.tsx',
    status: 'modified' as const,
    additions: 15,
    deletions: 8,
    staged: false,
    diff: [
      { type: 'header' as const, content: '@@ -24,10 +24,12 @@' },
      { type: 'context' as const, content: '  const buttonVariants = cva(', oldLineNumber: 24, newLineNumber: 24 },
      { type: 'context' as const, content: '    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",', oldLineNumber: 25, newLineNumber: 25 },
      { type: 'context' as const, content: '    {', oldLineNumber: 26, newLineNumber: 26 },
      { type: 'remove' as const, content: '      variants: {', oldLineNumber: 27 },
      { type: 'add' as const, content: '      variants: {', newLineNumber: 27 },
      { type: 'add' as const, content: '        // Enhanced variants for cyberpunk theme', newLineNumber: 28 },
      { type: 'context' as const, content: '        variant: {', oldLineNumber: 28, newLineNumber: 29 },
      { type: 'remove' as const, content: '          default: "bg-primary text-primary-foreground hover:bg-primary/90",', oldLineNumber: 29 },
      { type: 'add' as const, content: '          default: "bg-[#1f6feb] text-white hover:bg-[#388bfd] shadow-[0_0_10px_rgba(31,111,235,0.5)]",', newLineNumber: 30 },
      { type: 'add' as const, content: '          cyberpunk: "bg-[#00ffff] text-black hover:bg-[#00ffff]/80 shadow-[0_0_20px_rgba(0,255,255,0.7)] border border-[#00ffff]",', newLineNumber: 31 },
    ]
  },
  {
    filename: 'src/styles/globals.css',
    status: 'modified' as const,
    additions: 30,
    deletions: 5,
    staged: true,
    diff: [
      { type: 'header' as const, content: '@@ -1,5 +1,30 @@' },
      { type: 'remove' as const, content: '@tailwind base;', oldLineNumber: 1 },
      { type: 'remove' as const, content: '@tailwind components;', oldLineNumber: 2 },
      { type: 'remove' as const, content: '@tailwind utilities;', oldLineNumber: 3 },
      { type: 'add' as const, content: '@import "tailwindcss/base";', newLineNumber: 1 },
      { type: 'add' as const, content: '@import "tailwindcss/components";', newLineNumber: 2 },
      { type: 'add' as const, content: '@import "tailwindcss/utilities";', newLineNumber: 3 },
      { type: 'add' as const, content: '', newLineNumber: 4 },
      { type: 'add' as const, content: '/* Cyberpunk theme variables */', newLineNumber: 5 },
      { type: 'add' as const, content: ':root {', newLineNumber: 6 },
      { type: 'add' as const, content: '  --neon-blue: #00ffff;', newLineNumber: 7 },
      { type: 'add' as const, content: '  --neon-pink: #ff00ff;', newLineNumber: 8 },
      { type: 'add' as const, content: '  --neon-green: #00ff00;', newLineNumber: 9 },
      { type: 'add' as const, content: '}', newLineNumber: 10 },
    ]
  },
  {
    filename: 'src/components/new-feature.tsx',
    status: 'added' as const,
    additions: 45,
    deletions: 0,
    staged: false,
    diff: [
      { type: 'header' as const, content: '@@ -0,0 +1,45 @@' },
      { type: 'add' as const, content: 'import React from "react";', newLineNumber: 1 },
      { type: 'add' as const, content: 'import { Button } from "@/components/ui/button";', newLineNumber: 2 },
      { type: 'add' as const, content: '', newLineNumber: 3 },
      { type: 'add' as const, content: 'export function NewFeature() {', newLineNumber: 4 },
      { type: 'add' as const, content: '  return (', newLineNumber: 5 },
      { type: 'add' as const, content: '    <div className="p-4">', newLineNumber: 6 },
      { type: 'add' as const, content: '      <h2>New Feature</h2>', newLineNumber: 7 },
      { type: 'add' as const, content: '      <Button variant="cyberpunk">Click me</Button>', newLineNumber: 8 },
      { type: 'add' as const, content: '    </div>', newLineNumber: 9 },
      { type: 'add' as const, content: '  );', newLineNumber: 10 },
      { type: 'add' as const, content: '}', newLineNumber: 11 },
    ]
  },
  {
    filename: 'src/old-component.tsx',
    status: 'deleted' as const,
    additions: 0,
    deletions: 35,
    staged: true,
    diff: [
      { type: 'header' as const, content: '@@ -1,35 +0,0 @@' },
      { type: 'remove' as const, content: 'import React from "react";', oldLineNumber: 1 },
      { type: 'remove' as const, content: '', oldLineNumber: 2 },
      { type: 'remove' as const, content: '// This component is no longer needed', oldLineNumber: 3 },
      { type: 'remove' as const, content: 'export function OldComponent() {', oldLineNumber: 4 },
      { type: 'remove' as const, content: '  return null;', oldLineNumber: 5 },
      { type: 'remove' as const, content: '}', oldLineNumber: 6 },
    ]
  },
  {
    filename: 'src/utils/helpers.ts',
    status: 'renamed' as const,
    oldPath: 'src/utils/utils.ts',
    newPath: 'src/utils/helpers.ts',
    additions: 5,
    deletions: 2,
    staged: false,
    diff: [
      { type: 'header' as const, content: '@@ -1,8 +1,11 @@' },
      { type: 'context' as const, content: '// Utility functions', oldLineNumber: 1, newLineNumber: 1 },
      { type: 'context' as const, content: '', oldLineNumber: 2, newLineNumber: 2 },
      { type: 'remove' as const, content: 'export function formatDate(date: Date): string {', oldLineNumber: 3 },
      { type: 'add' as const, content: '// Enhanced date formatting', newLineNumber: 3 },
      { type: 'add' as const, content: 'export function formatDate(date: Date, format?: string): string {', newLineNumber: 4 },
      { type: 'context' as const, content: '  return date.toLocaleDateString();', oldLineNumber: 4, newLineNumber: 5 },
      { type: 'context' as const, content: '}', oldLineNumber: 5, newLineNumber: 6 },
    ]
  }
];