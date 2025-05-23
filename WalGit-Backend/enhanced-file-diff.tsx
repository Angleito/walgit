'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
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
  FileSymlink,
  Maximize,
  Minimize,
  SplitSquareVertical,
  AlignJustify,
  FileDigit,
  MoveRight,
  Columns,
  AlignLeft,
  ArrowUpDown,
  Settings
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
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import Prism and required languages for syntax highlighting
import Prism from 'prismjs';
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
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-diff';
import 'prismjs/themes/prism.css'; // Base theme

// Import additional Prism themes (you'll need to add these to your project)
import 'prismjs/themes/prism-tomorrow.css'; // Dark theme

// Import types
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
  isCollapsed?: boolean; // Whether this hunk is collapsed
}

interface FileDiffFileInfo {
  oldPath: string;
  newPath: string;
  type: 'modified' | 'added' | 'deleted' | 'renamed' | 'binary' | 'moved';
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

type DiffViewMode = 'unified' | 'split';
type DiffTheme = 'light' | 'dark' | 'system';
type DiffContextSize = 'compact' | 'normal' | 'expanded';

/**
 * Enhanced file diff component with advanced features:
 * - Syntax highlighting with multiple themes
 * - Collapsible hunks for easier navigation
 * - Side-by-side and unified diff views
 * - Whitespace visibility toggle
 * - Line wrapping options
 * - Context size control
 * - Word-level diff highlighting
 * - File-level actions (copy path, expand/collapse all)
 * - Responsive design for mobile and desktop
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
  // State for comment functionality
  const [commentingLine, setCommentingLine] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for visualization options
  const [isFileCollapsed, setIsFileCollapsed] = useState(false);
  const [highlightSyntax, setHighlightSyntax] = useState(true);
  const [viewMode, setViewMode] = useState<DiffViewMode>('unified');
  const [showWhitespace, setShowWhitespace] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);
  const [theme, setTheme] = useState<DiffTheme>('light');
  const [wordDiff, setWordDiff] = useState(false);
  const [contextSize, setContextSize] = useState<DiffContextSize>('normal');
  const [highlightActiveLine, setHighlightActiveLine] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // State for hunk collapsing
  const [collapsedHunks, setCollapsedHunks] = useState<Record<number, boolean>>({});
  
  // Track active line for navigation and highlighting
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Group threads by line number for faster lookup
  const threadsByLine = useMemo(() => {
    return threads.reduce((acc, thread) => {
      acc[thread.lineNumber] = [...(acc[thread.lineNumber] || []), thread];
      return acc;
    }, {} as Record<number, typeof threads>);
  }, [threads]);
  
  // Detect file language for syntax highlighting
  const detectLanguage = useCallback((filePath: string): string => {
    if (fileInfo.language) return fileInfo.language;
    
    const extension = filePath.split('.').pop()?.toLowerCase() || '';
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
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
      'swift': 'swift',
      'kt': 'kotlin',
      'rb': 'ruby',
      'php': 'php',
    };
    
    return extensionMap[extension] || 'plaintext';
  }, [fileInfo]);
  
  // Apply syntax highlighting to diff content
  const applySyntaxHighlighting = useCallback((content: string, language: string, lineType: DiffLine['type']): string => {
    try {
      if (!highlightSyntax) return content;
      if (language === 'plaintext') return content;
      
      // Strip initial +/- characters before highlighting
      const processedContent = content.replace(/^[+-]/, '');
      const grammar = Prism.languages[language];
      
      if (!grammar) return content;
      
      // Apply highlighting using Prism
      const highlighted = Prism.highlight(processedContent, grammar, language);
      
      // Apply additional word-level diff highlighting if enabled
      if (wordDiff && (lineType === 'added' || lineType === 'removed')) {
        // This is a simplified example - a real implementation would need more robust word diffing
        return highlighted
          .replace(/(\w+)/g, (match) => {
            return lineType === 'added' 
              ? `<span class="bg-green-100 dark:bg-green-900">${match}</span>` 
              : lineType === 'removed'
                ? `<span class="bg-red-100 dark:bg-red-900">${match}</span>`
                : match;
          });
      }
      
      return highlighted;
    } catch (error) {
      console.error('Error applying syntax highlighting:', error);
      return content;
    }
  }, [highlightSyntax, wordDiff]);
  
  // Process hunks with syntax highlighting
  const processedHunks = useMemo(() => {
    const language = detectLanguage(fileInfo.newPath || fileInfo.oldPath);
    
    return hunks.map(hunk => {
      const processedLines = hunk.lines.map(line => {
        return {
          ...line,
          highlightedContent: applySyntaxHighlighting(line.content, language, line.type)
        };
      });
      
      return {
        ...hunk,
        lines: processedLines,
        isCollapsed: collapsedHunks[hunk.oldStart] || false
      };
    });
  }, [hunks, fileInfo, highlightSyntax, collapsedHunks, detectLanguage, applySyntaxHighlighting]);
  
  // Calculate changes in this file
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
  
  // Handle adding a comment
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
  
  // Copy file path to clipboard
  const copyPathToClipboard = () => {
    const path = fileInfo.newPath || fileInfo.oldPath;
    navigator.clipboard.writeText(path);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };
  
  // Toggle collapse state for a specific hunk
  const toggleHunkCollapse = (hunkIndex: number) => {
    setCollapsedHunks(prev => ({
      ...prev,
      [hunkIndex]: !prev[hunkIndex]
    }));
  };
  
  // Collapse or expand all hunks
  const toggleAllHunks = (collapse: boolean) => {
    const newState: Record<number, boolean> = {};
    hunks.forEach((hunk, index) => {
      newState[index] = collapse;
    });
    setCollapsedHunks(newState);
  };
  
  // Scroll to a specific line
  const scrollToLine = (lineNumber: number) => {
    setActiveLine(lineNumber);
    
    // Wait for the DOM to update before scrolling
    setTimeout(() => {
      activeLineRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };
  
  // Navigate to next/previous comment
  const navigateComments = (direction: 'next' | 'prev') => {
    if (threads.length === 0) return;
    
    const lineNumbers = threads.map(t => t.lineNumber).sort((a, b) => a - b);
    
    if (activeLine === null) {
      // If no active line, go to first or last comment
      scrollToLine(direction === 'next' ? lineNumbers[0] : lineNumbers[lineNumbers.length - 1]);
      return;
    }
    
    if (direction === 'next') {
      const nextLine = lineNumbers.find(ln => ln > activeLine);
      if (nextLine) {
        scrollToLine(nextLine);
      } else if (lineNumbers.length > 0) {
        // Wrap around to the first comment
        scrollToLine(lineNumbers[0]);
      }
    } else {
      const prevLines = lineNumbers.filter(ln => ln < activeLine);
      if (prevLines.length > 0) {
        scrollToLine(prevLines[prevLines.length - 1]);
      } else if (lineNumbers.length > 0) {
        // Wrap around to the last comment
        scrollToLine(lineNumbers[lineNumbers.length - 1]);
      }
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Navigation shortcuts
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigateComments('next');
    }
    if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigateComments('prev');
    }
    
    // View mode shortcuts
    if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setViewMode('unified');
    }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setViewMode('split');
    }
    
    // Toggle syntax highlighting
    if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setHighlightSyntax(!highlightSyntax);
    }
    
    // Toggle file collapse
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      setIsFileCollapsed(!isFileCollapsed);
    }
  }, [highlightSyntax, isFileCollapsed, navigateComments]);
  
  // Add keyboard shortcut listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // If file is binary, show a binary file message
  if (fileInfo.type === 'binary') {
    return (
      <div className="border rounded-lg overflow-hidden mb-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDigit className="h-5 w-5" />
            <h3 className="font-medium">
              {fileInfo.newPath || fileInfo.oldPath}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-purple-500 text-white">
                Binary
              </span>
            </h3>
          </div>
        </div>
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900">
          <FileSymlink className="h-10 w-10 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-700 dark:text-gray-300 mb-2">This is a binary file</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Binary files cannot be displayed inline</p>
        </div>
      </div>
    );
  }
  
  // If file is collapsed, show a collapsed summary
  if (isFileCollapsed) {
    return (
      <div className="border rounded-lg overflow-hidden mb-6 dark:border-gray-700">
        <div className="bg-gray-100 dark:bg-gray-800 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            <h3 className="font-medium text-sm">
              {fileInfo.newPath || fileInfo.oldPath}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getFileBadgeColor(fileInfo.type)}`}>
                {getFileStatusText(fileInfo.type)}
              </span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400">+{changes.added}</span>
              <span className="mx-1">/</span>
              <span className="text-red-600 dark:text-red-400">-{changes.removed}</span>
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsFileCollapsed(false)}
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
    <div className={`border rounded-lg overflow-hidden mb-6 dark:border-gray-700 ${theme === 'dark' ? 'dark' : ''}`}>
      {/* File header with controls */}
      <div className="bg-gray-100 dark:bg-gray-800 p-3 border-b dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-medium text-sm max-w-[300px] truncate">
                  {fileInfo.newPath || fileInfo.oldPath}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getFileBadgeColor(fileInfo.type)}`}>
                    {getFileStatusText(fileInfo.type)}
                  </span>
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                {fileInfo.type === 'renamed' ? (
                  <div className="text-xs">
                    <div>From: {fileInfo.oldPath}</div>
                    <div>To: {fileInfo.newPath}</div>
                  </div>
                ) : fileInfo.type === 'moved' ? (
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
          {/* Stats */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            <span className="text-green-600 dark:text-green-400">+{changes.added}</span>
            <span className="mx-1">/</span>
            <span className="text-red-600 dark:text-red-400">-{changes.removed}</span>
          </span>
          
          {/* View mode toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode(viewMode === 'unified' ? 'split' : 'unified')}
                >
                  {viewMode === 'unified' ? (
                    <AlignJustify className="h-4 w-4" />
                  ) : (
                    <Columns className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle view mode</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {viewMode === 'unified' ? 'Switch to split view' : 'Switch to unified view'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Settings menu */}
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Options</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  Display options
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Display Options</DropdownMenuLabel>
              
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem 
                  checked={highlightSyntax}
                  onCheckedChange={setHighlightSyntax}
                >
                  Syntax highlighting
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem 
                  checked={wrapLines}
                  onCheckedChange={setWrapLines}
                >
                  Wrap lines
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem 
                  checked={showWhitespace}
                  onCheckedChange={setShowWhitespace}
                >
                  Show whitespace
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem 
                  checked={highlightActiveLine}
                  onCheckedChange={setHighlightActiveLine}
                >
                  Highlight active line
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem 
                  checked={wordDiff}
                  onCheckedChange={setWordDiff}
                >
                  Word-level diff
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Context</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setContextSize('compact')}>
                  <AlignLeft className="h-4 w-4 mr-2" />
                  <span>Compact</span>
                  {contextSize === 'compact' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setContextSize('normal')}>
                  <AlignLeft className="h-4 w-4 mr-2" />
                  <span>Normal</span>
                  {contextSize === 'normal' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setContextSize('expanded')}>
                  <AlignLeft className="h-4 w-4 mr-2" />
                  <span>Expanded</span>
                  {contextSize === 'expanded' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <span>Light</span>
                  {theme === 'light' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <span>Dark</span>
                  {theme === 'dark' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <span>System</span>
                  {theme === 'system' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => toggleAllHunks(true)}>
                  <Minimize className="h-4 w-4 mr-2" />
                  <span>Collapse all hunks</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => toggleAllHunks(false)}>
                  <Maximize className="h-4 w-4 mr-2" />
                  <span>Expand all hunks</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              
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
          
          {/* Collapse button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsFileCollapsed(true)}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="sr-only">Collapse</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Collapse file
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Navigation Bar */}
      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 px-4 py-1 border-b dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {processedHunks.length} {processedHunks.length === 1 ? 'chunk' : 'chunks'}
        </div>
        
        <div className="flex gap-2">
          {/* Comment navigation */}
          {threads.length > 0 && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => navigateComments('prev')}
                    >
                      <ArrowUpDown className="h-3 w-3 rotate-90" />
                      <span className="sr-only">Previous comment</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous comment</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <span className="text-xs">
                {threads.length} {threads.length === 1 ? 'comment' : 'comments'}
              </span>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => navigateComments('next')}
                    >
                      <ArrowUpDown className="h-3 w-3 -rotate-90" />
                      <span className="sr-only">Next comment</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next comment</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
      
      {/* Diff Content */}
      <div className={`${highlightSyntax ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'}`}>
        {processedHunks.map((hunk, hunkIndex) => (
          <Collapsible 
            key={hunkIndex} 
            open={!hunk.isCollapsed}
            onOpenChange={(isOpen) => toggleHunkCollapse(hunkIndex)}
            className="border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            <CollapsibleTrigger asChild>
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-1 text-xs text-gray-500 dark:text-gray-400 font-mono flex justify-between items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                <span>
                  @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    {hunk.isCollapsed ? 'Expand' : 'Collapse'} hunk
                  </span>
                  {hunk.isCollapsed ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className={`font-mono text-sm ${wrapLines ? 'whitespace-pre-wrap' : 'whitespace-pre'}`}>
                {hunk.lines.map((line, lineIndex) => {
                  // Use new line number if available, otherwise use old line number
                  const lineNumber = line.newLineNumber || line.oldLineNumber;
                  const hasThreads = lineNumber && threadsByLine[lineNumber];
                  const isActiveLine = activeLine === lineNumber;
                  
                  // Skip info lines in split view
                  if (viewMode === 'split' && line.type === 'info') {
                    return null;
                  }
                  
                  return (
                    <div 
                      key={lineIndex} 
                      ref={isActiveLine ? activeLineRef : null}
                    >
                      {/* Unified View */}
                      {viewMode === 'unified' && (
                        <div 
                          className={`flex group hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            line.type === 'added' ? 'bg-green-50 dark:bg-green-950' : 
                            line.type === 'removed' ? 'bg-red-50 dark:bg-red-950' : 
                            line.type === 'info' ? 'bg-blue-50 dark:bg-blue-950' :
                            isActiveLine && highlightActiveLine ? 'bg-yellow-50 dark:bg-yellow-900' :
                            ''
                          }`}
                        >
                          {/* Old line number */}
                          <div className="w-12 text-right px-2 py-1 select-none text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                            {line.oldLineNumber}
                          </div>
                          
                          {/* New line number */}
                          <div 
                            className="w-12 text-right px-2 py-1 select-none text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                            onClick={() => {
                              if (line.newLineNumber) {
                                setCommentingLine(commentingLine === line.newLineNumber ? null : line.newLineNumber);
                                setActiveLine(line.newLineNumber);
                              }
                            }}
                          >
                            {line.newLineNumber}
                          </div>
                          
                          {/* Line prefix */}
                          <div className="w-4 py-1 select-none">
                            {line.type === 'added' ? (
                              <span className="text-green-600 dark:text-green-400">+</span>
                            ) : line.type === 'removed' ? (
                              <span className="text-red-600 dark:text-red-400">-</span>
                            ) : line.type === 'info' ? (
                              <span className="text-blue-600 dark:text-blue-400">i</span>
                            ) : (
                              <span> </span>
                            )}
                          </div>
                          
                          {/* Line content */}
                          <div 
                            className={`py-1 px-1 overflow-x-auto flex-grow ${showWhitespace ? 'ws-visible' : ''}`}
                            dangerouslySetInnerHTML={{
                              __html: highlightSyntax && line.highlightedContent 
                                ? line.highlightedContent
                                : showWhitespace 
                                  ? line.content
                                    .replace(/ /g, '·')
                                    .replace(/\t/g, '→   ')
                                  : line.content
                            }}
                          />
                          
                          {/* Add comment button */}
                          {line.newLineNumber && (
                            <div className="flex items-center pr-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900"
                                onClick={() => {
                                  setCommentingLine(
                                    commentingLine === line.newLineNumber ? null : line.newLineNumber
                                  );
                                  setActiveLine(line.newLineNumber);
                                }}
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
                            className={`flex-1 flex group hover:bg-gray-100 dark:hover:bg-gray-800 ${
                              line.type === 'removed' ? 'bg-red-50 dark:bg-red-950' : 
                              line.type === 'added' ? 'invisible' :
                              ''
                            }`}
                          >
                            {/* Old line number */}
                            <div className="w-12 text-right px-2 py-1 select-none text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                              {line.oldLineNumber}
                            </div>
                            
                            {/* Line prefix */}
                            <div className="w-4 py-1 select-none">
                              {line.type === 'removed' ? (
                                <span className="text-red-600 dark:text-red-400">-</span>
                              ) : (
                                <span> </span>
                              )}
                            </div>
                            
                            {/* Line content */}
                            {line.type !== 'added' && (
                              <div 
                                className={`py-1 px-1 overflow-x-auto flex-grow ${showWhitespace ? 'ws-visible' : ''}`}
                                dangerouslySetInnerHTML={{
                                  __html: highlightSyntax && line.highlightedContent 
                                    ? line.highlightedContent
                                    : showWhitespace 
                                      ? line.content
                                        .replace(/ /g, '·')
                                        .replace(/\t/g, '→   ')
                                      : line.content
                                }}
                              />
                            )}
                          </div>
                          
                          {/* Right side (new) */}
                          <div 
                            className={`flex-1 flex group hover:bg-gray-100 dark:hover:bg-gray-800 ${
                              line.type === 'added' ? 'bg-green-50 dark:bg-green-950' : 
                              line.type === 'removed' ? 'invisible' :
                              isActiveLine && highlightActiveLine ? 'bg-yellow-50 dark:bg-yellow-900' :
                              ''
                            }`}
                          >
                            {/* New line number */}
                            <div 
                              className="w-12 text-right px-2 py-1 select-none text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                              onClick={() => {
                                if (line.newLineNumber) {
                                  setCommentingLine(commentingLine === line.newLineNumber ? null : line.newLineNumber);
                                  setActiveLine(line.newLineNumber);
                                }
                              }}
                            >
                              {line.newLineNumber}
                            </div>
                            
                            {/* Line prefix */}
                            <div className="w-4 py-1 select-none">
                              {line.type === 'added' ? (
                                <span className="text-green-600 dark:text-green-400">+</span>
                              ) : (
                                <span> </span>
                              )}
                            </div>
                            
                            {/* Line content */}
                            {line.type !== 'removed' && (
                              <div 
                                className={`py-1 px-1 overflow-x-auto flex-grow ${showWhitespace ? 'ws-visible' : ''}`}
                                dangerouslySetInnerHTML={{
                                  __html: highlightSyntax && line.highlightedContent 
                                    ? line.highlightedContent
                                    : showWhitespace 
                                      ? line.content
                                        .replace(/ /g, '·')
                                        .replace(/\t/g, '→   ')
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
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-blue-100 dark:hover:bg-blue-900"
                                  onClick={() => {
                                    setCommentingLine(
                                      commentingLine === line.newLineNumber ? null : line.newLineNumber
                                    );
                                    setActiveLine(line.newLineNumber);
                                  }}
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
                        <div className="pl-28 pr-4 py-2 bg-blue-50 dark:bg-blue-950 border-y border-blue-100 dark:border-blue-900">
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
                        <div className="pl-28 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800 space-y-3">
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
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

// Helper functions for file status
function getFileBadgeColor(fileType: FileDiffFileInfo['type']) {
  switch (fileType) {
    case 'added':
      return 'bg-green-500 text-white dark:bg-green-600';
    case 'deleted':
      return 'bg-red-500 text-white dark:bg-red-600';
    case 'renamed':
      return 'bg-blue-500 text-white dark:bg-blue-600';
    case 'moved':
      return 'bg-indigo-500 text-white dark:bg-indigo-600';
    case 'modified':
      return 'bg-yellow-500 text-white dark:bg-yellow-600';
    case 'binary':
      return 'bg-purple-500 text-white dark:bg-purple-600';
    default:
      return 'bg-gray-500 text-white dark:bg-gray-600';
  }
}

function getFileStatusText(fileType: FileDiffFileInfo['type']) {
  switch (fileType) {
    case 'added':
      return 'Added';
    case 'deleted':
      return 'Deleted';
    case 'renamed':
      return 'Renamed';
    case 'moved':
      return 'Moved';
    case 'modified':
      return 'Modified';
    case 'binary':
      return 'Binary';
    default:
      return '';
  }
}

// Required hooks
import { useEffect } from 'react';

// Custom CSS for whitespace visualization
const customStyles = `
.ws-visible .space {
  position: relative;
}
.ws-visible .space:after {
  content: "·";
  position: absolute;
  color: rgba(127, 127, 127, 0.4);
}
.ws-visible .tab {
  position: relative;
}
.ws-visible .tab:after {
  content: "→";
  position: absolute;
  color: rgba(127, 127, 127, 0.4);
}
`;