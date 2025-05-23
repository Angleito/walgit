'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FileCode,
  File,
  GitCommit,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface DirectoryTreeProps {
  nodes: TreeNode[];
  repositoryPath: string;
  currentPath?: string;
  className?: string;
}

export function DirectoryTree({
  nodes,
  repositoryPath,
  currentPath = '',
  className
}: DirectoryTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
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
    
    return date.toLocaleDateString();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'sql'];
    
    if (codeExtensions.includes(extension || '')) {
      return <FileCode size={16} className="text-[#8b949e]" />;
    }
    return <File size={16} className="text-[#8b949e]" />;
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const fullPath = currentPath ? `${currentPath}/${node.path}` : node.path;
    const isExpanded = expandedPaths.has(fullPath);

    return (
      <div key={fullPath} className="text-sm">
        <div 
          className={cn(
            "flex items-center justify-between py-1.5 px-3 hover:bg-[#161b22] group cursor-pointer",
            depth > 0 && "ml-4"
          )}
        >
          <div className="flex items-center gap-2 flex-1">
            {node.type === 'directory' ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpanded(fullPath);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={12} className="text-[#8b949e]" />
                  ) : (
                    <ChevronRight size={12} className="text-[#8b949e]" />
                  )}
                </Button>
                <Folder size={16} className="text-[#8b949e]" />
                <Link
                  href={`${repositoryPath}/tree/main/${fullPath}`}
                  className="text-[#f0f6fc] hover:text-[#58a6ff] font-medium"
                >
                  {node.name}
                </Link>
              </>
            ) : (
              <>
                <div className="w-4" />
                {getFileIcon(node.name)}
                <Link
                  href={`${repositoryPath}/blob/main/${fullPath}`}
                  className="text-[#f0f6fc] hover:text-[#58a6ff]"
                >
                  {node.name}
                </Link>
                {node.size && (
                  <span className="text-[#8b949e] text-xs ml-2">
                    {formatFileSize(node.size)}
                  </span>
                )}
              </>
            )}
          </div>

          {node.lastCommit && (
            <div className="flex items-center gap-4 text-xs text-[#8b949e] opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 max-w-[300px]">
                <GitCommit size={12} />
                <span className="truncate">{node.lastCommit.message}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{relativeTime(node.lastCommit.date)}</span>
              </div>
            </div>
          )}
        </div>

        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117]", className)}>
      <div className="divide-y divide-[#30363d]">
        {nodes.map(node => renderNode(node))}
      </div>
    </div>
  );
}