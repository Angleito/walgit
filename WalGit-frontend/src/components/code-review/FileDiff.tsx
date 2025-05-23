'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ReviewThread } from './ReviewThread';
import { Plus, MessageCircle, FileCode } from 'lucide-react';
import type { PullRequestComment } from '@/types/pull-request';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
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

interface FileDiffProps {
  filePath: string;
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
 * FileDiff component displays a diff of a file with inline comments
 */
export function FileDiff({
  filePath,
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
  
  // Group threads by line number for faster lookup
  const threadsByLine = threads.reduce((acc, thread) => {
    acc[thread.lineNumber] = [...(acc[thread.lineNumber] || []), thread];
    return acc;
  }, {} as Record<number, typeof threads>);
  
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
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
          <h3 className="font-medium text-sm">{filePath}</h3>
        </div>
      </div>
      
      <div className="bg-gray-50">
        {hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex} className="border-b border-gray-200 last:border-0">
            <div className="bg-gray-100 px-3 py-1 text-xs text-gray-500 font-mono">
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>
            
            <div className="font-mono text-sm">
              {hunk.lines.map((line, lineIndex) => {
                // Use new line number if available, otherwise use old line number
                const lineNumber = line.newLineNumber || line.oldLineNumber;
                const hasThreads = lineNumber && threadsByLine[lineNumber];
                
                return (
                  <div key={lineIndex}>
                    <div 
                      className={`flex hover:bg-gray-100 ${
                        line.type === 'added' ? 'bg-green-50' : 
                        line.type === 'removed' ? 'bg-red-50' : 
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
                        ) : (
                          <span> </span>
                        )}
                      </div>
                      
                      {/* Line content */}
                      <div className="py-1 px-1 whitespace-pre overflow-x-auto flex-grow">
                        {line.content}
                      </div>
                      
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
                            filePath={filePath}
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