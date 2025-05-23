'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ReviewThread } from './ReviewThread';
import { 
  MessageCircle, 
  FileCode, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  Eye,
  EyeOff,
  Code,
  Trash2,
  FileSymlink,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Prism from 'prismjs';
// Import necessary language support for syntax highlighting
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-toml';
import 'prismjs/themes/prism.css'; // Base theme
import type { PullRequestComment } from '@/types/pull-request';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'info';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
  highlightedContent?: string; // Content with syntax highlighting
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface FileDiffFileInfo {
  oldPath: string;
  newPath: string;
  type: 'modified' | 'added' | 'deleted' | 'renamed' | 'binary';
  oldMode?: string;
  newMode?: string;
  language?: string;
}

interface FileDiffProps {
  fileInfo: FileDiffFileInfo;
  hunks: DiffHunk[];
  threads: {
    id: string;
    lineNumber: number;
    status: 'open' | 'resolved' | 'outdated';
    comments: PullRequestComment[];
  }[];
  onAddComment: (lineNumber: number, content: string) => Promise<void>;
  onReplyToThread: (threadId: string, content: string) => Promise<void>;
  onResolveThread: (threadId: string) => Promise<void>;
  onReopenThread: (threadId: string) => Promise<void>;
}

/**
 * EnhancedFileDiff component displays a diff of a file with syntax highlighting and inline comments
 */
export function EnhancedFileDiff({
  fileInfo,
  hunks,
  threads,
  onAddComment,
  onReplyToThread,
  onResolveThread,
  onReopenThread
}: FileDiffProps) {
  const [commentingLine, setCommentingLine] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [highlightSyntax, setHighlightSyntax] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified');
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Group threads by line number for faster lookup
  const threadsByLine = threads.reduce((acc, thread) => {
    acc[thread.lineNumber] = [...(acc[thread.lineNumber] || []), thread];
    return acc;
  }, {} as Record<number, typeof threads>);
  
  // Detect file language for syntax highlighting
  const detectLanguage = (filePath: string): string => {
    if (fileInfo.language) return fileInfo.language;
    
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'css': 'css',
      'html': 'html',
      'rs': 'rust',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'c': 'c',
      'cpp': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'md': 'markdown',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'sh': 'bash',
      'bash': 'bash',
      'sql': 'sql',
      'toml': 'toml',
      'move': 'rust', // Use Rust highlighting for Move files
    };
    
    return extensionMap[extension] || 'plaintext';
  };
  
  // Apply syntax highlighting to diff content
  const applySyntaxHighlighting = (content: string, language: string): string => {
    try {
      if (!highlightSyntax) return content;
      if (language === 'plaintext') return content;
      
      // Strip initial +/- characters before highlighting
      const processedContent = content.replace(/^[+-]/, '');
      const grammar = Prism.languages[language];
      
      if (!grammar) return content;
      
      return Prism.highlight(processedContent, grammar, language);
    } catch (error) {
      console.error('Error applying syntax highlighting:', error);
      return content;
    }
  };
  
  // Process hunks with syntax highlighting
  const processedHunks = useMemo(() => {
    const language = detectLanguage(fileInfo.newPath || fileInfo.oldPath);
    
    return hunks.map(hunk => {
      const processedLines = hunk.lines.map(line => {
        return {
          ...line,
          highlightedContent: applySyntaxHighlighting(line.content, language)
        };
      });
      
      return {
        ...hunk,
        lines: processedLines
      };
    });
  }, [hunks, fileInfo, highlightSyntax, applySyntaxHighlighting, detectLanguage]);
  
  const handleAddComment = async () => {
    if (!commentingLine || !commentContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await onAddComment(commentingLine, commentContent);
      setCommentContent('');
      setCommentingLine(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const copyPathToClipboard = () => {
    const path = fileInfo.newPath || fileInfo.oldPath;
    navigator.clipboard.writeText(path);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };
  
  // Get number of changes in this file
  const changes = useMemo(() => {
    let added = 0;
    let removed = 0;
    
    hunks.forEach(hunk => {
      hunk.lines.forEach(line => {
        if (line.type === 'added') added++;
        if (line.type === 'removed') removed++;
      });
    });
    
    return { added, removed };
  }, [hunks]);
  
  // Get file icon based on file extension
  const getFileIcon = () => {
    // Default to generic file icon
    return <FileCode className="h-5 w-5" />;
  };
  
  // Get badge color based on file status
  const getFileBadgeColor = () => {
    switch (fileInfo.type) {
      case 'added':
        return 'bg-green-500 text-white';
      case 'deleted':
        return 'bg-red-500 text-white';
      case 'renamed':
        return 'bg-blue-500 text-white';
      case 'modified':
        return 'bg-yellow-500 text-white';
      case 'binary':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Get file status text
  const getFileStatusText = () => {
    switch (fileInfo.type) {
      case 'added':
        return 'Added';
      case 'deleted':
        return 'Deleted';
      case 'renamed':
        return 'Renamed';
      case 'modified':
        return 'Modified';
      case 'binary':
        return 'Binary';
      default:
        return '';
    }
  };
  
  if (fileInfo.type === 'binary') {
    return (
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-100 p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon()}
            <h3 className="font-medium">
              {fileInfo.newPath || fileInfo.oldPath}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getFileBadgeColor()}`}>
                {getFileStatusText()}
              </span>
            </h3>
          </div>
        </div>
        <div className="p-8 text-center bg-gray-50">
          <FileSymlink className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-700 mb-2">This is a binary file</p>
          <p className="text-gray-500 text-sm">Binary files cannot be displayed inline</p>
        </div>
      </div>
    );
  }
  
  if (isCollapsed) {
    return (
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-100 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getFileIcon()}
            <h3 className="font-medium text-sm">
              {fileInfo.newPath || fileInfo.oldPath}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getFileBadgeColor()}`}>
                {getFileStatusText()}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              <span className="text-green-600">+{changes.added}</span>
              <span className="mx-1">/</span>
              <span className="text-red-600">-{changes.removed}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Expand</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden mb-6">
      <div className="bg-gray-100 p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getFileIcon()}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-medium text-sm max-w-[300px] truncate">
                  {fileInfo.newPath || fileInfo.oldPath}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getFileBadgeColor()}`}>
                    {getFileStatusText()}
                  </span>
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                {fileInfo.type === 'renamed' ? (
                  <div className="text-xs">
                    <div>From: {fileInfo.oldPath}</div>
                    <div>To: {fileInfo.newPath}</div>
                  </div>
                ) : (
                  <div className="text-xs">{fileInfo.newPath || fileInfo.oldPath}</div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            <span className="text-green-600">+{changes.added}</span>
            <span className="mx-1">/</span>
            <span className="text-red-600">-{changes.removed}</span>
          </span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Code className="h-4 w-4" />
                <span className="sr-only">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setHighlightSyntax(!highlightSyntax)}>
                {highlightSyntax ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    <span>Disable syntax highlighting</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    <span>Enable syntax highlighting</span>
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setViewMode(viewMode === 'unified' ? 'split' : 'unified')}>
                <Code className="h-4 w-4 mr-2" />
                <span>View: {viewMode === 'unified' ? 'Split' : 'Unified'}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setShowWhitespace(!showWhitespace)}>
                {showWhitespace ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    <span>Hide whitespace changes</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    <span>Show whitespace changes</span>
                  </>
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={copyPathToClipboard}>
                {copiedToClipboard ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    <span>Copy file path</span>
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsCollapsed(true)}
          >
            <ChevronUp className="h-4 w-4" />
            <span className="sr-only">Collapse</span>
          </Button>
        </div>
      </div>
      
      <div className={`${highlightSyntax ? 'bg-white' : 'bg-gray-50'}`}>
        {processedHunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex} className="border-b border-gray-200 last:border-0">
            <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-mono">
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>
            
            <div className="font-mono text-sm">
              {hunk.lines.map((line, lineIndex) => {
                // Use new line number if available, otherwise use old line number
                const lineNumber = line.newLineNumber || line.oldLineNumber;
                const hasThreads = lineNumber && threadsByLine[lineNumber];
                
                // Skip info lines in split view
                if (viewMode === 'split' && line.type === 'info') {
                  return null;
                }
                
                return (
                  <div key={lineIndex}>
                    {/* Unified View */}
                    {viewMode === 'unified' && (
                      <div 
                        className={`flex group hover:bg-gray-100 ${
                          line.type === 'added' ? 'bg-green-50' : 
                          line.type === 'removed' ? 'bg-red-50' : 
                          line.type === 'info' ? 'bg-blue-50' :
                          ''
                        }`}
                      >
                        {/* Old line number */}
                        <div className="w-12 text-right px-2 py-1 select-none text-gray-500 border-r border-gray-200">
                          {line.oldLineNumber}
                        </div>
                        
                        {/* New line number */}
                        <div 
                          className="w-12 text-right px-2 py-1 select-none text-gray-500 border-r border-gray-200 cursor-pointer hover:bg-blue-100"
                          onClick={() => {
                            if (line.newLineNumber) {
                              setCommentingLine(commentingLine === line.newLineNumber ? null : line.newLineNumber);
                            }
                          }}
                        >
                          {line.newLineNumber}
                        </div>
                        
                        {/* Line prefix */}
                        <div className="w-4 py-1 select-none">
                          {line.type === 'added' ? (
                            <span className="text-green-600">+</span>
                          ) : line.type === 'removed' ? (
                            <span className="text-red-600">-</span>
                          ) : line.type === 'info' ? (
                            <span className="text-blue-600">i</span>
                          ) : (
                            <span> </span>
                          )}
                        </div>
                        
                        {/* Line content */}
                        <div 
                          className="py-1 px-1 whitespace-pre overflow-x-auto flex-grow"
                          dangerouslySetInnerHTML={{
                            __html: highlightSyntax && line.highlightedContent 
                              ? line.highlightedContent
                              : line.content
                          }}
                        />
                        
                        {/* Add comment button */}
                        {line.newLineNumber && (
                          <div className="flex items-center pr-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-blue-100"
                              onClick={() => setCommentingLine(
                                commentingLine === line.newLineNumber ? null : line.newLineNumber
                              )}
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="sr-only">Add comment</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Split View */}
                    {viewMode === 'split' && (
                      <div className="flex">
                        {/* Left side (old) */}
                        <div 
                          className={`flex-1 flex ${
                            line.type === 'removed' ? 'bg-red-50' : 
                            line.type === 'added' ? 'opacity-0' :
                            ''
                          }`}
                        >
                          {/* Old line number */}
                          <div className="w-12 text-right px-2 py-1 select-none text-gray-500 border-r border-gray-200">
                            {line.oldLineNumber}
                          </div>
                          
                          {/* Line prefix */}
                          <div className="w-4 py-1 select-none">
                            {line.type === 'removed' ? (
                              <span className="text-red-600">-</span>
                            ) : (
                              <span> </span>
                            )}
                          </div>
                          
                          {/* Line content */}
                          {line.type !== 'added' && (
                            <div 
                              className="py-1 px-1 whitespace-pre overflow-x-auto flex-grow"
                              dangerouslySetInnerHTML={{
                                __html: highlightSyntax && line.highlightedContent 
                                  ? line.highlightedContent
                                  : line.content
                              }}
                            />
                          )}
                        </div>
                        
                        {/* Right side (new) */}
                        <div 
                          className={`flex-1 flex ${
                            line.type === 'added' ? 'bg-green-50' : 
                            line.type === 'removed' ? 'opacity-0' :
                            ''
                          }`}
                        >
                          {/* New line number */}
                          <div 
                            className="w-12 text-right px-2 py-1 select-none text-gray-500 border-r border-gray-200 cursor-pointer hover:bg-blue-100"
                            onClick={() => {
                              if (line.newLineNumber) {
                                setCommentingLine(commentingLine === line.newLineNumber ? null : line.newLineNumber);
                              }
                            }}
                          >
                            {line.newLineNumber}
                          </div>
                          
                          {/* Line prefix */}
                          <div className="w-4 py-1 select-none">
                            {line.type === 'added' ? (
                              <span className="text-green-600">+</span>
                            ) : (
                              <span> </span>
                            )}
                          </div>
                          
                          {/* Line content */}
                          {line.type !== 'removed' && (
                            <div 
                              className="py-1 px-1 whitespace-pre overflow-x-auto flex-grow"
                              dangerouslySetInnerHTML={{
                                __html: highlightSyntax && line.highlightedContent 
                                  ? line.highlightedContent
                                  : line.content
                              }}
                            />
                          )}
                          
                          {/* Add comment button */}
                          {line.newLineNumber && (
                            <div className="flex items-center pr-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 hover:opacity-100 hover:bg-blue-100"
                                onClick={() => setCommentingLine(
                                  commentingLine === line.newLineNumber ? null : line.newLineNumber
                                )}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span className="sr-only">Add comment</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Comment form */}
                    {commentingLine === line.newLineNumber && (
                      <div className="pl-28 pr-4 py-2 bg-blue-50 border-y border-blue-100">
                        <div className="space-y-2">
                          <Textarea 
                            placeholder="Write a comment..." 
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            rows={3}
                            className="text-sm"
                          />
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setCommentingLine(null);
                                setCommentContent('');
                              }}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={handleAddComment}
                              disabled={!commentContent.trim() || isSubmitting}
                            >
                              {isSubmitting ? 'Submitting...' : 'Comment'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Comment threads */}
                    {hasThreads && (
                      <div className="pl-28 pr-4 py-2 bg-gray-50 border-y border-gray-100 space-y-3">
                        {threadsByLine[lineNumber].map(thread => (
                          <ReviewThread 
                            key={thread.id}
                            id={thread.id}
                            filePath={fileInfo.newPath || fileInfo.oldPath}
                            lineNumber={lineNumber}
                            status={thread.status}
                            comments={thread.comments}
                            onReply={(content) => onReplyToThread(thread.id, content)}
                            onResolve={() => onResolveThread(thread.id)}
                            onReopen={() => onReopenThread(thread.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}