'use client';

import { useState } from 'react';
import { CommitGraph } from './CommitGraph';
import { CommitList } from './CommitList';
import { Button } from "@/components/ui/button";
import { GitGraph, List, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  date: string;
  diffStats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  refs?: CommitRef[];
  parent?: string | string[];
  branch?: string;
}

interface CommitNode {
  id: string;
  hash: string;
  parents: string[];
  children: string[];
  branch?: string;
  refs?: CommitRef[];
}

interface CommitHistoryProps {
  commits: Commit[];
  repositoryPath: string;
  branches?: string[];
  defaultView?: 'list' | 'graph';
  className?: string;
}

export function CommitHistory({
  commits,
  repositoryPath,
  branches = [],
  defaultView = 'list',
  className
}: CommitHistoryProps) {
  const [view, setView] = useState<'list' | 'graph'>(defaultView);
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [filterAuthor, setFilterAuthor] = useState<string>('all');

  // Filter commits based on selected filters
  const filteredCommits = commits.filter(commit => {
    if (filterBranch !== 'all' && commit.branch !== filterBranch) {
      return false;
    }
    if (filterAuthor !== 'all' && commit.author.email !== filterAuthor) {
      return false;
    }
    return true;
  });

  // Convert commits to graph nodes
  const graphNodes: CommitNode[] = filteredCommits.map(commit => {
    const parents = Array.isArray(commit.parent) 
      ? commit.parent 
      : commit.parent 
        ? [commit.parent]
        : [];

    return {
      id: commit.id,
      hash: commit.hash,
      parents,
      children: filteredCommits
        .filter(c => {
          const cParents = Array.isArray(c.parent) ? c.parent : c.parent ? [c.parent] : [];
          return cParents.includes(commit.id);
        })
        .map(c => c.id),
      branch: commit.branch,
      refs: commit.refs,
    };
  });

  // Get unique authors
  const authors = Array.from(
    new Set(commits.map(c => c.author.email))
  ).map(email => {
    const author = commits.find(c => c.author.email === email)?.author;
    return { email, name: author?.name || email };
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
            className="bg-[#21262d] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
          >
            <List size={16} className="mr-1" />
            List
          </Button>
          <Button
            variant={view === 'graph' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('graph')}
            className="bg-[#21262d] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
          >
            <GitGraph size={16} className="mr-1" />
            Graph
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#8b949e]" />
          
          <Select value={filterBranch} onValueChange={setFilterBranch}>
            <SelectTrigger className="w-[150px] bg-[#0d1117] border-[#30363d] text-[#f0f6fc]">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1117] border-[#30363d]">
              <SelectItem value="all" className="text-[#f0f6fc]">All branches</SelectItem>
              {branches.map(branch => (
                <SelectItem key={branch} value={branch} className="text-[#f0f6fc]">
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAuthor} onValueChange={setFilterAuthor}>
            <SelectTrigger className="w-[150px] bg-[#0d1117] border-[#30363d] text-[#f0f6fc]">
              <SelectValue placeholder="All authors" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1117] border-[#30363d]">
              <SelectItem value="all" className="text-[#f0f6fc]">All authors</SelectItem>
              {authors.map(author => (
                <SelectItem key={author.email} value={author.email} className="text-[#f0f6fc]">
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Commit display */}
      {view === 'list' ? (
        <CommitList
          commits={filteredCommits}
          repositoryPath={repositoryPath}
          showBranchLines={false}
        />
      ) : (
        <div className="flex gap-4">
          <CommitGraph
            commits={graphNodes}
            branches={branches}
            width={200}
            height={600}
            className="border border-[#30363d] rounded-md bg-[#0d1117] p-2"
          />
          <div className="flex-1">
            <CommitList
              commits={filteredCommits}
              repositoryPath={repositoryPath}
              showBranchLines={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}