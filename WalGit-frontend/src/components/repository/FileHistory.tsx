'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { 
  GitCommit, 
  Clock, 
  User,
  FileText,
  ChevronRight,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Commit {
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

interface FileHistoryProps {
  filePath: string;
  commits: Commit[];
  currentCommit?: string;
  repositoryPath: string;
  onCommitSelect?: (hash: string) => void;
  className?: string;
}

export function FileHistory({
  filePath,
  commits,
  currentCommit,
  repositoryPath,
  onCommitSelect,
  className
}: FileHistoryProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getCommitUrl = (hash: string) => {
    return `${repositoryPath}/commits/${hash}`;
  };

  const getFileVersionUrl = (hash: string) => {
    return `${repositoryPath}/blob/${hash}/${filePath}`;
  };

  return (
    <TooltipProvider>
      <div className={cn("gh-bg-canvas rounded-md border gh-border-subtle", className)}>
        <div className="gh-bg-canvas-subtle border-b gh-border-subtle px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 gh-text-secondary" />
              <h3 className="font-semibold gh-text-primary">History</h3>
              <span className="text-sm gh-text-secondary">
                {commits.length} commits
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm gh-text-secondary">
              <FileText className="w-4 h-4" />
              <span className="font-mono">{filePath}</span>
            </div>
          </div>
        </div>

        <div className="divide-y gh-divide-subtle">
          {commits.map((commit, index) => {
            const isCurrentCommit = commit.hash === currentCommit;
            
            return (
              <div
                key={commit.hash}
                className={cn(
                  "px-4 py-3 hover:bg-[#0d1117] transition-colors",
                  isCurrentCommit && "bg-[#388bfd0a] border-l-2 border-[#388bfd]"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Commit message */}
                    <div className="flex items-start gap-2">
                      <GitCommit className="w-4 h-4 gh-text-secondary mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <Link
                          href={getCommitUrl(commit.hash)}
                          className="gh-text-primary hover:text-[#58a6ff] hover:underline font-medium line-clamp-2"
                        >
                          {commit.message}
                        </Link>
                      </div>
                    </div>

                    {/* Author and date */}
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 gh-text-secondary" />
                        <span className="gh-text-secondary">
                          {commit.author}
                        </span>
                      </div>
                      <span className="gh-text-secondary">
                        committed {formatDate(commit.date)}
                      </span>
                    </div>

                    {/* Changes stats */}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs font-mono gh-text-secondary">
                        {commit.shortHash}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#238636]">
                          +{commit.changes.additions}
                        </span>
                        <span className="text-[#da3633]">
                          -{commit.changes.deletions}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(commit.hash)}
                          className="p-1 h-7 w-7"
                        >
                          {copiedHash === commit.hash ? (
                            <Check className="w-4 h-4 text-[#238636]" />
                          ) : (
                            <Copy className="w-4 h-4 gh-text-secondary" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy commit hash</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="p-1 h-7 w-7"
                        >
                          <Link href={getFileVersionUrl(commit.hash)}>
                            <ChevronRight className="w-4 h-4 gh-text-secondary" />
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View file at this commit</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Current commit indicator */}
                {isCurrentCommit && (
                  <div className="mt-2 text-xs text-[#388bfd] font-medium">
                    Current version
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Load more button */}
        <div className="p-4 text-center border-t gh-border-subtle">
          <Button
            variant="outline"
            size="sm"
            className="gh-bg-canvas gh-border-subtle gh-text-primary hover:bg-[#30363d]"
          >
            Load more commits
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}