'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GitCommit, Copy, Check, GitBranch, Tag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Author {
  name: string;
  email: string;
  avatar?: string;
}

interface CommitRef {
  name: string;
  type: 'branch' | 'tag';
}

interface Commit {
  id: string;
  hash: string;
  message: string;
  description?: string;
  author: Author;
  committer?: Author;
  date: string;
  diffStats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  refs?: CommitRef[];
  parent?: string | string[];
}

interface CommitListProps {
  commits: Commit[];
  repositoryPath: string;
  showBranchLines?: boolean;
  className?: string;
}

export function CommitList({
  commits,
  repositoryPath,
  showBranchLines = false,
  className
}: CommitListProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const relativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn("rounded-md border border-[#30363d] overflow-hidden bg-[#0d1117]", className)}>
      <TooltipProvider>
        <div className="divide-y divide-[#30363d]">
          {commits.map((commit, index) => (
            <div key={commit.id} className="relative hover:bg-[#161b22] transition-colors">
              {showBranchLines && index < commits.length - 1 && (
                <div className="absolute left-[40px] top-12 bottom-0 w-0.5 bg-[#30363d]" />
              )}
              
              <div className="flex items-start gap-4 p-4">
                {/* Commit graph dot */}
                {showBranchLines && (
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-3 h-3 rounded-full bg-[#1f6feb] border-2 border-[#0d1117]" />
                  </div>
                )}

                {/* Author avatar */}
                <Avatar className="flex-shrink-0 w-10 h-10">
                  <AvatarFallback className="bg-[#1c2128] text-[#f0f6fc] text-xs">
                    {getInitials(commit.author.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Commit details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Commit message */}
                      <h3 className="text-[#f0f6fc] font-medium mb-1">
                        <Link
                          href={`${repositoryPath}/commit/${commit.hash}`}
                          className="hover:text-[#58a6ff] transition-colors"
                        >
                          {commit.message}
                        </Link>
                      </h3>

                      {/* Commit description */}
                      {commit.description && (
                        <p className="text-[#8b949e] text-sm mb-2">
                          {commit.description}
                        </p>
                      )}

                      {/* Commit metadata */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-[#8b949e]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5">
                              <GitCommit size={14} />
                              <button
                                onClick={() => copyToClipboard(commit.hash)}
                                className="font-mono hover:text-[#58a6ff] transition-colors flex items-center gap-1"
                              >
                                {commit.hash.substring(0, 7)}
                                {copiedHash === commit.hash ? (
                                  <Check size={12} />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                            <p>Copy full SHA</p>
                          </TooltipContent>
                        </Tooltip>

                        <div>
                          {commit.author.name}
                        </div>

                        <div>
                          {relativeTime(commit.date)}
                        </div>

                        {commit.diffStats && (
                          <div className="flex items-center gap-2">
                            <span className="text-[#3fb950]">
                              +{commit.diffStats.insertions}
                            </span>
                            <span className="text-[#f85149]">
                              -{commit.diffStats.deletions}
                            </span>
                            <span className="text-[#8b949e]">
                              ({commit.diffStats.filesChanged} files)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Refs (branches and tags) */}
                      {commit.refs && commit.refs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {commit.refs.map((ref) => (
                            <Badge
                              key={ref.name}
                              variant="outline"
                              className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] text-xs"
                            >
                              {ref.type === 'branch' ? (
                                <GitBranch size={12} className="mr-1" />
                              ) : (
                                <Tag size={12} className="mr-1" />
                              )}
                              {ref.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#30363d]"
                      >
                        <Link href={`${repositoryPath}/commit/${commit.hash}`}>
                          <ChevronRight size={16} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}