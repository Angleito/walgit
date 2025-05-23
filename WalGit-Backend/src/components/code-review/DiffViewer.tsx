'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EnhancedFileDiff } from '@/components/code-review/EnhancedFileDiff';
import { ReviewThread } from '@/components/code-review/ReviewThread';
import { 
  File, 
  FileText, 
  GitBranch, 
  ChevronRight, 
  ArrowUpDown,
  Filter,
  EyeOff,
  Code,
  Settings
} from 'lucide-react';
import type { PullRequestComment } from '@/types/pull-request';

interface FileDiffFileInfo {
  oldPath: string;
  newPath: string;
  type: 'modified' | 'added' | 'deleted' | 'renamed' | 'binary';
  oldMode?: string;
  newMode?: string;
  language?: string;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'info';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface FileDiff {
  fileInfo: FileDiffFileInfo;
  hunks: DiffHunk[];
}

interface FileThread {
  id: string;
  lineNumber: number;
  status: 'open' | 'resolved' | 'outdated';
  comments: PullRequestComment[];
}

interface DiffViewerProps {
  sourceBranch: string;
  targetBranch: string;
  fileDiffs: FileDiff[];
  threads: {
    [filePath: string]: FileThread[];
  };
  onAddComment: (filePath: string, lineNumber: number, content: string) => Promise<void>;
  onReplyToThread: (threadId: string, content: string) => Promise<void>;
  onResolveThread: (threadId: string) => Promise<void>;
  onReopenThread: (threadId: string) => Promise<void>;
}

/**
 * Comprehensive diff viewer component that allows reviewing code changes
 */
export function DiffViewer({
  sourceBranch,
  targetBranch,
  fileDiffs,
  threads,
  onAddComment,
  onReplyToThread,
  onResolveThread,
  onReopenThread
}: DiffViewerProps) {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileFilter, setFileFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [showFileTree, setShowFileTree] = useState(true);
  const [hideWhitespace, setHideWhitespace] = useState(false);
  const [hideComments, setHideComments] = useState(false);

  // Set the first file as active by default
  useEffect(() => {
    if (fileDiffs.length > 0 && !activeFile) {
      setActiveFile(fileDiffs[0].fileInfo.newPath || fileDiffs[0].fileInfo.oldPath);
    }
  }, [fileDiffs, activeFile]);

  // Filter files based on selection
  const filteredFiles = useMemo(() => {
    if (fileFilter === 'all') return fileDiffs;
    if (fileFilter === 'modified') return fileDiffs.filter(f => f.fileInfo.type === 'modified');
    if (fileFilter === 'added') return fileDiffs.filter(f => f.fileInfo.type === 'added');
    if (fileFilter === 'deleted') return fileDiffs.filter(f => f.fileInfo.type === 'deleted');
    if (fileFilter === 'renamed') return fileDiffs.filter(f => f.fileInfo.type === 'renamed');
    if (fileFilter === 'with_comments') {
      return fileDiffs.filter(f => {
        const filePath = f.fileInfo.newPath || f.fileInfo.oldPath;
        return threads[filePath] && threads[filePath].length > 0;
      });
    }
    return fileDiffs;
  }, [fileDiffs, fileFilter, threads]);

  // Group files by directory for file tree view
  const fileTree = useMemo(() => {
    const tree: any = {};
    
    filteredFiles.forEach(file => {
      const filePath = file.fileInfo.newPath || file.fileInfo.oldPath;
      const parts = filePath.split('/');
      const fileName = parts.pop() || '';
      
      let currentLevel = tree;
      
      parts.forEach(part => {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      });
      
      currentLevel[fileName] = {
        isFile: true,
        path: filePath,
        type: file.fileInfo.type
      };
    });
    
    return tree;
  }, [filteredFiles]);

  // Count total changes
  const totalChanges = useMemo(() => {
    let added = 0;
    let removed = 0;
    
    fileDiffs.forEach(diff => {
      diff.hunks.forEach(hunk => {
        hunk.lines.forEach(line => {
          if (line.type === 'added') added++;
          if (line.type === 'removed') removed++;
        });
      });
    });
    
    return { added, removed };
  }, [fileDiffs]);

  // Get the active file diff
  const activeDiff = useMemo(() => {
    if (!activeFile) return null;
    return fileDiffs.find(diff => 
      (diff.fileInfo.newPath || diff.fileInfo.oldPath) === activeFile
    ) || null;
  }, [activeFile, fileDiffs]);

  // Get the threads for the active file
  const activeThreads = useMemo(() => {
    if (!activeFile) return [];
    return threads[activeFile] || [];
  }, [activeFile, threads]);

  // Handle adding a comment to the active file
  const handleAddComment = async (lineNumber: number, content: string) => {
    if (!activeFile) return;
    await onAddComment(activeFile, lineNumber, content);
  };

  // Render a tree node
  const renderTreeNode = (node: any, path: string[] = [], level = 0) => {
    return (
      <div className="ml-4" style={{ marginLeft: level * 16 }}>
        {Object.entries(node).map(([key, value]: [string, any]) => {
          const currentPath = [...path, key];
          const isFile = value.isFile;
          const fullPath = isFile ? value.path : currentPath.join('/');
          
          if (isFile) {
            const isActive = fullPath === activeFile;
            const hasComments = threads[fullPath] && threads[fullPath].length > 0;
            const commentCount = hasComments ? threads[fullPath].length : 0;
            
            return (
              <div 
                key={fullPath}
                className={`flex items-center py-1 pl-2 rounded text-sm hover:bg-gray-100 cursor-pointer ${
                  isActive ? 'bg-blue-50 text-blue-700' : ''
                }`}
                onClick={() => setActiveFile(fullPath)}
              >
                <div className="mr-2">
                  {value.type === 'added' ? (
                    <File className="h-4 w-4 text-green-500" />
                  ) : value.type === 'deleted' ? (
                    <File className="h-4 w-4 text-red-500" />
                  ) : value.type === 'modified' ? (
                    <File className="h-4 w-4 text-yellow-500" />
                  ) : value.type === 'renamed' ? (
                    <File className="h-4 w-4 text-blue-500" />
                  ) : (
                    <File className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <span className="truncate max-w-[160px]">{key}</span>
                {hasComments && (
                  <div className="ml-auto px-1.5 rounded-full bg-blue-100 text-blue-800 text-xs">
                    {commentCount}
                  </div>
                )}
              </div>
            );
          } else {
            return (
              <div key={fullPath}>
                <div className="flex items-center py-1 text-sm font-medium">
                  <div className="mr-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                  </div>
                  <span>{key}/</span>
                </div>
                {renderTreeNode(value, currentPath, level + 1)}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-gray-500" />
          <span className="text-gray-600 font-medium">{sourceBranch}</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600 font-medium">{targetBranch}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <span className="text-green-600 font-medium">+{totalChanges.added}</span>
            <span className="text-gray-600">/</span>
            <span className="text-red-600 font-medium">-{totalChanges.removed}</span>
          </div>
          
          <div className="border-l pl-4 flex items-center gap-2">
            <Select defaultValue={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unified">Unified view</SelectItem>
                <SelectItem value="split">Split view</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowFileTree(!showFileTree)}
            >
              {showFileTree ? 'Hide files' : 'Show files'}
            </Button>
            
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex gap-6 h-full">
        {showFileTree && (
          <div className="w-72 shrink-0">
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium text-sm">Files Changed</h3>
                
                <Select defaultValue={fileFilter} onValueChange={setFileFilter}>
                  <SelectTrigger className="w-28 h-7 text-xs">
                    <SelectValue placeholder="Filter files" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All files</SelectItem>
                    <SelectItem value="modified">Modified</SelectItem>
                    <SelectItem value="added">Added</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                    <SelectItem value="renamed">Renamed</SelectItem>
                    <SelectItem value="with_comments">With Comments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                {Object.keys(fileTree).length > 0 ? (
                  renderTreeNode(fileTree)
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No files match the current filter
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t bg-gray-50 flex gap-2 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hideWhitespace"
                    checked={hideWhitespace}
                    onCheckedChange={(checked) => setHideWhitespace(checked as boolean)}
                  />
                  <Label htmlFor="hideWhitespace" className="text-xs">
                    Hide whitespace
                  </Label>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hideComments"
                    checked={hideComments}
                    onCheckedChange={(checked) => setHideComments(checked as boolean)}
                  />
                  <Label htmlFor="hideComments" className="text-xs">
                    Hide comments
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-hidden">
          {activeDiff ? (
            <EnhancedFileDiff
              fileInfo={activeDiff.fileInfo}
              hunks={activeDiff.hunks}
              threads={!hideComments ? activeThreads : []}
              onAddComment={handleAddComment}
              onReplyToThread={onReplyToThread}
              onResolveThread={onResolveThread}
              onReopenThread={onReopenThread}
            />
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <File className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-500">No file selected</h3>
              <p className="text-sm text-gray-400 mt-1">
                Select a file from the sidebar to view changes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}