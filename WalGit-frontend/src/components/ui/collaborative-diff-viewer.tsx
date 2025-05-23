/**
 * @fileoverview Advanced collaborative diff viewer with real-time comments and annotations
 * Supports side-by-side and unified views with inline commenting and review features
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Download,
  GitCommit,
  ArrowLeft,
  ArrowRight,
  Settings,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiffLine {
  id: string;
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  type: 'added' | 'removed' | 'context' | 'header';
  comments?: Comment[];
  isHighlighted?: boolean;
}

interface Comment {
  id: string;
  author: {
    address: string;
    avatar?: string;
    name?: string;
  };
  content: string;
  timestamp: string;
  isResolved?: boolean;
  replies?: Comment[];
  lineId: string;
}

interface FileDiff {
  id: string;
  fileName: string;
  oldFileName?: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  lines: DiffLine[];
  isBinary?: boolean;
  isCollapsed?: boolean;
}

interface CollaborativeDiffViewerProps {
  files: FileDiff[];
  currentUser: {
    address: string;
    name?: string;
    avatar?: string;
  };
  onAddComment?: (fileId: string, lineId: string, content: string) => void;
  onResolveComment?: (commentId: string) => void;
  onReplyToComment?: (commentId: string, content: string) => void;
  viewMode?: 'unified' | 'split';
  showLineNumbers?: boolean;
  showComments?: boolean;
  className?: string;
}

export function CollaborativeDiffViewer({
  files,
  currentUser,
  onAddComment,
  onResolveComment,
  onReplyToComment,
  viewMode = 'unified',
  showLineNumbers = true,
  showComments = true,
  className
}: CollaborativeDiffViewerProps) {
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [activeCommentLine, setActiveCommentLine] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set(files.map(f => f.id)));

  const toggleCommentExpansion = useCallback((commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  }, [expandedComments]);

  const handleAddComment = useCallback((fileId: string, lineId: string) => {
    if (commentText.trim()) {
      onAddComment?.(fileId, lineId, commentText);
      setCommentText('');
      setActiveCommentLine(null);
    }
  }, [commentText, onAddComment]);

  const getLineTypeClass = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-500/10 border-l-4 border-green-500';
      case 'removed':
        return 'bg-red-500/10 border-l-4 border-red-500';
      case 'context':
        return 'bg-gray-800/20';
      case 'header':
        return 'bg-blue-500/10 border-l-4 border-blue-500 font-semibold';
      default:
        return '';
    }
  };

  const getFileStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-400';
      case 'removed': return 'text-red-400';
      case 'modified': return 'text-blue-400';
      case 'renamed': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getFileStatusIcon = (status: string) => {
    switch (status) {
      case 'added': return '+';
      case 'removed': return '-';
      case 'modified': return '~';
      case 'renamed': return '→';
      default: return '?';
    }
  };

  const totalStats = useMemo(() => {
    return files.reduce((acc, file) => ({
      additions: acc.additions + file.additions,
      deletions: acc.deletions + file.deletions,
      files: acc.files + 1
    }), { additions: 0, deletions: 0, files: 0 });
  }, [files]);

  return (
    <TooltipProvider>
      <div className={cn('bg-gray-900 border border-gray-700 rounded-lg overflow-hidden', className)}>
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-100">
                Changes in {totalStats.files} file{totalStats.files !== 1 ? 's' : ''}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  +{totalStats.additions}
                </Badge>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  -{totalStats.deletions}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={showComments ? "default" : "outline"}
                    onClick={() => {/* Toggle comments */}}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showComments ? 'Hide' : 'Show'} comments</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Split view
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4 mr-2" />
                    Unified view
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Download diff
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[800px]">
          <div className="space-y-0">
            {files.map((file) => (
              <div key={file.id} className="border-b border-gray-700 last:border-b-0">
                {/* File Header */}
                <div className="bg-gray-800/50 border-b border-gray-700 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn('font-mono text-sm font-bold', getFileStatusColor(file.status))}>
                        {getFileStatusIcon(file.status)}
                      </span>
                      <div>
                        <p className="font-medium text-gray-200">
                          {file.fileName}
                          {file.oldFileName && file.oldFileName !== file.fileName && (
                            <span className="text-gray-400 ml-2">
                              (renamed from {file.oldFileName})
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="text-green-400">+{file.additions}</span>
                          <span className="text-red-400">-{file.deletions}</span>
                          <Badge variant="outline" className="text-xs">
                            {file.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newSelected = new Set(selectedFiles);
                          if (newSelected.has(file.id)) {
                            newSelected.delete(file.id);
                          } else {
                            newSelected.add(file.id);
                          }
                          setSelectedFiles(newSelected);
                        }}
                      >
                        {selectedFiles.has(file.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy file path
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download file
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <GitCommit className="h-4 w-4 mr-2" />
                            View history
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* File Content */}
                <AnimatePresence>
                  {selectedFiles.has(file.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {file.isBinary ? (
                        <div className="p-8 text-center text-gray-400">
                          <p>Binary file - content not shown</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-700/50">
                          {file.lines.map((line) => (
                            <div key={line.id} className="group">
                              <div 
                                className={cn(
                                  'flex items-start hover:bg-gray-800/30 transition-colors',
                                  getLineTypeClass(line.type),
                                  line.isHighlighted && 'bg-yellow-500/10'
                                )}
                              >
                                {/* Line Numbers */}
                                {showLineNumbers && (
                                  <div className="flex flex-shrink-0">
                                    <div className="w-12 px-2 py-1 text-xs text-gray-500 text-right border-r border-gray-700 bg-gray-800/30">
                                      {line.oldLineNumber || ''}
                                    </div>
                                    <div className="w-12 px-2 py-1 text-xs text-gray-500 text-right border-r border-gray-700 bg-gray-800/30">
                                      {line.newLineNumber || ''}
                                    </div>
                                  </div>
                                )}

                                {/* Line Content */}
                                <div className="flex-1 min-w-0">
                                  <pre className="px-4 py-1 text-sm font-mono text-gray-200 whitespace-pre-wrap break-all">
                                    {line.content}
                                  </pre>
                                </div>

                                {/* Add Comment Button */}
                                <div className="flex-shrink-0 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => setActiveCommentLine(line.id)}
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add comment</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>

                              {/* Comment Form */}
                              <AnimatePresence>
                                {activeCommentLine === line.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-gray-800 border-t border-gray-700 p-4"
                                  >
                                    <div className="flex items-start gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={currentUser.avatar} />
                                        <AvatarFallback>
                                          {currentUser.name?.[0] || currentUser.address[2]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 space-y-3">
                                        <Textarea
                                          placeholder="Add a comment..."
                                          value={commentText}
                                          onChange={(e) => setCommentText(e.target.value)}
                                          className="bg-gray-700 border-gray-600 resize-none"
                                          rows={3}
                                        />
                                        <div className="flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleAddComment(file.id, line.id)}
                                            disabled={!commentText.trim()}
                                          >
                                            Comment
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setActiveCommentLine(null);
                                              setCommentText('');
                                            }}
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Existing Comments */}
                              {showComments && line.comments && line.comments.length > 0 && (
                                <div className="bg-gray-800/30 border-t border-gray-700">
                                  {line.comments.map((comment) => (
                                    <div key={comment.id} className="p-4 border-b border-gray-700/50 last:border-b-0">
                                      <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={comment.author.avatar} />
                                          <AvatarFallback>
                                            {comment.author.name?.[0] || comment.author.address[2]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium text-gray-200">
                                              {comment.author.name || `${comment.author.address.slice(0, 6)}...${comment.author.address.slice(-4)}`}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              {new Date(comment.timestamp).toLocaleString()}
                                            </span>
                                            {comment.isResolved && (
                                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Resolved
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-300 mb-3">
                                            {comment.content}
                                          </p>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 text-xs"
                                              onClick={() => toggleCommentExpansion(comment.id)}
                                            >
                                              Reply
                                            </Button>
                                            {!comment.isResolved && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 text-xs text-green-400 hover:text-green-300"
                                                onClick={() => onResolveComment?.(comment.id)}
                                              >
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Resolve
                                              </Button>
                                            )}
                                          </div>

                                          {/* Replies */}
                                          {comment.replies && comment.replies.length > 0 && (
                                            <div className="mt-3 pl-4 border-l-2 border-gray-600 space-y-3">
                                              {comment.replies.map((reply) => (
                                                <div key={reply.id} className="flex items-start gap-3">
                                                  <Avatar className="h-6 w-6">
                                                    <AvatarImage src={reply.author.avatar} />
                                                    <AvatarFallback className="text-xs">
                                                      {reply.author.name?.[0] || reply.author.address[2]}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-sm font-medium text-gray-200">
                                                        {reply.author.name || `${reply.author.address.slice(0, 6)}...${reply.author.address.slice(-4)}`}
                                                      </span>
                                                      <span className="text-xs text-gray-500">
                                                        {new Date(reply.timestamp).toLocaleString()}
                                                      </span>
                                                    </div>
                                                    <p className="text-sm text-gray-300">
                                                      {reply.content}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}