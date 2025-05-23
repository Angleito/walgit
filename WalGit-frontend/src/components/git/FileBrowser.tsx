'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DirectoryTree } from './DirectoryTree';
import { FileBreadcrumb } from './FileBreadcrumb';
import { FileActions } from './FileActions';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  FileCode, 
  Download, 
  Eye, 
  History,
  GitBranch,
  Code
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: TreeNode[];
  size?: number;
  lastCommit?: {
    message: string;
    author: string;
    date: string;
    hash: string;
  };
}

interface FileBrowserProps {
  nodes: TreeNode[];
  repositoryPath: string;
  currentPath?: string;
  branch?: string;
  onPathChange?: (path: string) => void;
  className?: string;
}

export function FileBrowser({
  nodes,
  repositoryPath,
  currentPath = '',
  branch = 'main',
  onPathChange,
  className
}: FileBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  // Filter nodes based on search query
  const filterNodes = (nodes: TreeNode[], query: string): TreeNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce((acc: TreeNode[], node) => {
      const matches = node.name.toLowerCase().includes(query.toLowerCase());
      const childMatches = node.children 
        ? filterNodes(node.children, query)
        : [];

      if (matches || childMatches.length > 0) {
        acc.push({
          ...node,
          children: childMatches.length > 0 ? childMatches : node.children
        });
      }

      return acc;
    }, []);
  };

  const filteredNodes = filterNodes(nodes, searchQuery);

  // Get current directory info
  const getCurrentDirectory = () => {
    if (!currentPath) return null;
    
    const parts = currentPath.split('/');
    let current: TreeNode | undefined;
    let remaining = [...nodes];

    for (const part of parts) {
      current = remaining.find(n => n.name === part);
      if (!current) break;
      remaining = current.children || [];
    }

    return current;
  };

  const currentDir = getCurrentDirectory();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumb navigation */}
      <FileBreadcrumb
        repositoryPath={repositoryPath}
        currentPath={currentPath}
        branch={branch}
        onNavigate={onPathChange}
      />

      {/* File browser controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8b949e]" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0d1117] border-[#30363d] text-[#f0f6fc] placeholder:text-[#8b949e]"
            />
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'tree' ? 'list' : 'tree')}
            className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
          >
            {viewMode === 'tree' ? 'List view' : 'Tree view'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0d1117] border-[#30363d]">
              <DropdownMenuItem className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]">
                Download as ZIP
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[#f0f6fc] focus:bg-[#30363d] focus:text-[#f0f6fc]">
                Download as TAR
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]"
          >
            <Code size={16} className="mr-2" />
            Clone
          </Button>
        </div>
      </div>

      {/* Current directory info */}
      {currentDir && currentDir.lastCommit && (
        <div className="rounded-md border border-[#30363d] bg-[#0d1117] p-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8b949e]">
              <GitBranch size={14} />
              <span>{branch}</span>
              <span>•</span>
              <span>{currentDir.lastCommit.hash.substring(0, 7)}</span>
              <span>•</span>
              <span>{currentDir.lastCommit.message}</span>
            </div>
            <Link
              href={`${repositoryPath}/commits/${branch}/${currentPath}`}
              className="text-[#58a6ff] hover:underline flex items-center gap-1"
            >
              <History size={14} />
              History
            </Link>
          </div>
        </div>
      )}

      {/* File tree/list */}
      <DirectoryTree
        nodes={filteredNodes}
        repositoryPath={repositoryPath}
        currentPath={currentPath}
      />

      {searchQuery && filteredNodes.length === 0 && (
        <div className="text-center py-8 text-[#8b949e]">
          <p>No files found matching &quot;{searchQuery}&quot;</p>
        </div>
      )}
    </div>
  );
}