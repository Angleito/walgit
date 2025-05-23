'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  GitPullRequest, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Clock,
  Filter,
  FileText,
  Trash2
} from 'lucide-react';
import type { PullRequestComment, PullRequest } from '@/types/pull-request';

interface CommentWithContext extends PullRequestComment {
  filePath: string;
  lineNumber: number;
  resolved?: boolean;
}

interface ReviewSummaryProps {
  pullRequest: PullRequest;
  onReplyToComment: (commentId: string, content: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  currentUserWallet?: string;
}

/**
 * Displays a summary of all review comments in a pull request
 */
export function ReviewSummary({
  pullRequest,
  onReplyToComment,
  onResolveComment,
  onDeleteComment,
  currentUserWallet = ''
}: ReviewSummaryProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [groupBy, setGroupBy] = useState<'file' | 'user' | 'time'>('file');
  
  // Get all comments from threads
  const getAllComments = (): CommentWithContext[] => {
    // This would normally come from the API
    // For this example, we're simulating comment data
    return [
      {
        id: 'comment-1',
        author: '0x123456789abcdef',
        content: 'Should we add more details about what optimizeTransaction does? Maybe add JSDoc comments.',
        timestamp: '2025-04-03T09:30:00Z',
        filePath: 'src/utils/git-operations.js',
        lineNumber: 16
      },
      {
        id: 'comment-2',
        author: '0xabcdef1234567890',
        content: 'Consider adding error handling here in case the transaction fails.',
        timestamp: '2025-04-03T10:15:00Z',
        filePath: 'src/utils/git-operations.js',
        lineNumber: 18,
        resolved: true
      },
      {
        id: 'comment-3',
        author: '0x123456789abcdef',
        content: 'Good point, I\'ll add that in the next PR. This is just the initial implementation.',
        timestamp: '2025-04-03T10:30:00Z',
        filePath: 'src/utils/git-operations.js',
        lineNumber: 18,
        resolved: true
      },
      {
        id: 'comment-4',
        author: '0xabcdef1234567890',
        content: 'Sounds good!',
        timestamp: '2025-04-03T10:32:00Z',
        filePath: 'src/utils/git-operations.js',
        lineNumber: 18,
        resolved: true
      },
      {
        id: 'comment-5',
        author: '0xfedcba9876543210',
        content: 'Should we use an enum for status instead of a string?',
        timestamp: '2025-04-04T14:22:00Z',
        filePath: 'src/models/changeset.js',
        lineNumber: 26
      },
      {
        id: 'comment-6',
        author: '0x123456789abcdef',
        content: 'Yes, that would be better. I\'ll update that.',
        timestamp: '2025-04-04T14:30:00Z',
        filePath: 'src/models/changeset.js',
        lineNumber: 26
      }
    ];
  };

  const comments = getAllComments();
  
  // Apply filter
  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    if (filter === 'open') return !comment.resolved;
    if (filter === 'resolved') return comment.resolved;
    return true;
  });
  
  // Group comments
  const groupedComments = filteredComments.reduce((acc, comment) => {
    let key = '';
    
    if (groupBy === 'file') {
      key = comment.filePath;
    } else if (groupBy === 'user') {
      key = comment.author;
    } else if (groupBy === 'time') {
      // Group by day
      const date = new Date(comment.timestamp);
      key = date.toLocaleDateString();
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    
    acc[key].push(comment);
    return acc;
  }, {} as Record<string, CommentWithContext[]>);
  
  // Format group headers
  const formatGroupHeader = (key: string) => {
    if (groupBy === 'file') {
      return (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span>{key}</span>
        </div>
      );
    } else if (groupBy === 'user') {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-xs">
              {key.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span>{key.substring(0, 8)}...</span>
        </div>
      );
    } else if (groupBy === 'time') {
      return (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{key}</span>
        </div>
      );
    }
    
    return key;
  };

  // Calculate stats
  const totalComments = comments.length;
  const openComments = comments.filter(c => !c.resolved).length;
  const resolvedComments = comments.filter(c => c.resolved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span>Review Comments</span>
        </h2>
        
        <div className="flex gap-2">
          <Tabs defaultValue="all" className="w-[300px]" onValueChange={value => setFilter(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All ({totalComments})
              </TabsTrigger>
              <TabsTrigger value="open">
                Open ({openComments})
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resolved ({resolvedComments})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <select 
            className="px-2 py-1 border rounded text-sm"
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as any)}
          >
            <option value="file">Group by File</option>
            <option value="user">Group by User</option>
            <option value="time">Group by Time</option>
          </select>
        </div>
      </div>
      
      {Object.keys(groupedComments).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedComments).map(([groupKey, commentsInGroup]) => (
            <Card key={groupKey}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">
                  {formatGroupHeader(groupKey)}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                <div className="divide-y">
                  {commentsInGroup.map(comment => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={content => onReplyToComment(comment.id, content)}
                      onResolve={() => onResolveComment(comment.id)}
                      onDelete={onDeleteComment ? () => onDeleteComment(comment.id) : undefined}
                      currentUserWallet={currentUserWallet}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-500">No comments found</h3>
          <p className="text-sm text-gray-400 mt-1">
            {filter === 'all' 
              ? 'There are no review comments on this pull request'
              : `No ${filter} comments found`}
          </p>
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: CommentWithContext;
  onReply: (content: string) => Promise<void>;
  onResolve: () => Promise<void>;
  onDelete?: () => Promise<void>;
  currentUserWallet?: string;
}

function CommentItem({
  comment,
  onReply,
  onResolve,
  onDelete,
  currentUserWallet = ''
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAuthor = comment.author === currentUserWallet;
  
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await onReply(replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResolve = async () => {
    setIsSubmitting(true);
    
    try {
      await onResolve();
    } catch (error) {
      console.error('Error resolving comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsSubmitting(true);
    
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{comment.author.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {comment.author.substring(0, 8)}...
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.timestamp).toLocaleString()}
                </span>
                
                {comment.resolved && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">{comment.filePath}</span>
                <span className="mx-1">:</span>
                <span>Line {comment.lineNumber}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              {!comment.resolved && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-green-600"
                  onClick={handleResolve}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              )}
              
              {isAuthor && onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 text-red-600"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          
          <div className="mt-2 text-sm">
            {comment.content}
          </div>
          
          <div className="mt-2">
            {!showReplyForm ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7"
                onClick={() => setShowReplyForm(true)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Reply
              </Button>
            ) : (
              <div className="space-y-2">
                <textarea
                  className="w-full p-2 border rounded-md text-sm"
                  placeholder="Write a reply..."
                  rows={3}
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowReplyForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleReply}
                    disabled={!replyContent.trim() || isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Reply'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}