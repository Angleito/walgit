'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineComment } from './InlineComment';
import { CommentForm } from './CommentForm';
import { CheckCircle, MessageCircle, XCircle } from 'lucide-react';
import type { PullRequestComment } from '@/types/pull-request';
import type { CommentFormValues } from '@/lib/form-schemas';

interface ReviewThreadProps {
  id: string;
  filePath: string;
  lineNumber: number;
  status: 'open' | 'resolved' | 'outdated';
  comments: PullRequestComment[];
  onReply: (content: string) => Promise<void>;
  onResolve: () => Promise<void>;
  onReopen: () => Promise<void>;
}

/**
 * ReviewThread component displays a thread of comments for code review
 * Updated to use the reusable CommentForm component
 */
export function ReviewThread({
  id,
  filePath,
  lineNumber,
  status,
  comments,
  onReply,
  onResolve,
  onReopen
}: ReviewThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isResolved = status === 'resolved';
  const isOutdated = status === 'outdated';
  
  const handleReply = async (values: CommentFormValues) => {
    if (!values.content.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await onReply(values.content);
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
      console.error('Error resolving thread:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReopen = async () => {
    setIsSubmitting(true);
    
    try {
      await onReopen();
    } catch (error) {
      console.error('Error reopening thread:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className={`border shadow-sm ${
      isResolved ? 'bg-gray-50 border-gray-200' : 
      isOutdated ? 'bg-amber-50 border-amber-200' : 
      'bg-white'
    }`}>
      <CardHeader className="py-2 px-3">
        <div className="text-xs text-gray-500 flex items-center">
          <span className="font-medium">{filePath}</span>
          <span className="mx-1">:</span>
          <span>Line {lineNumber}</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {comments.map((comment, index) => (
            <InlineComment
              key={comment.id}
              id={comment.id}
              author={comment.author}
              content={comment.content}
              timestamp={comment.timestamp}
              isLast={index === comments.length - 1}
              showActions={false}
              isResolved={isResolved}
              isOutdated={isOutdated}
            />
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="p-3 flex justify-between">
        {!showReplyForm && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowReplyForm(true)}
              disabled={isSubmitting}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Reply
            </Button>
            
            {!isResolved ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResolve}
                disabled={isSubmitting}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolve
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReopen}
                disabled={isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reopen
              </Button>
            )}
          </div>
        )}
        
        {showReplyForm && (
          <div className="w-full">
            <CommentForm
              onSubmit={handleReply}
              placeholder="Write a reply..."
              buttonText="Reply"
              filePath={filePath}
              lineNumber={lineNumber}
              autoFocus
              className="p-0 border-0"
            />
            
            <div className="flex justify-end mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowReplyForm(false)}
                disabled={isSubmitting}
                className="mr-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}