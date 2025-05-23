'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, MessageCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InlineCommentProps {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isLast?: boolean;
  onReply?: (content: string) => Promise<void>;
  onResolve?: () => Promise<void>;
  onReopen?: () => Promise<void>;
  isResolved?: boolean;
  isOutdated?: boolean;
  showActions?: boolean;
}

/**
 * InlineComment component displays a single comment in a review thread 
 */
export function InlineComment({
  id,
  author,
  content,
  timestamp,
  isLast = false,
  onReply,
  onResolve,
  onReopen,
  isResolved = false,
  isOutdated = false,
  showActions = true
}: InlineCommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleReply = async () => {
    if (!replyContent.trim() || !onReply) return;
    
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
    if (!onResolve) return;
    
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
    if (!onReopen) return;
    
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
    <div className={`px-3 py-2 ${isResolved ? 'bg-gray-50' : isOutdated ? 'bg-amber-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={`https://avatars.dicebear.com/api/initials/${author.substring(0, 2)}.svg`} />
            <AvatarFallback>{author.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-sm font-medium">{author.substring(0, 8)}...</div>
          <div className="text-xs text-gray-500">
            {new Date(timestamp).toLocaleString()}
          </div>
          
          {isResolved && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolved
            </Badge>
          )}
          
          {isOutdated && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Outdated
            </Badge>
          )}
        </div>
        
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowReplyForm(true)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Reply
              </DropdownMenuItem>
              
              {!isResolved && (
                <DropdownMenuItem onClick={handleResolve}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve
                </DropdownMenuItem>
              )}
              
              {isResolved && (
                <DropdownMenuItem onClick={handleReopen}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reopen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="mt-2 text-sm whitespace-pre-wrap">{content}</div>
      
      {showReplyForm && (
        <div className="mt-3 space-y-2">
          <Textarea 
            placeholder="Write a reply..." 
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={3}
            className="text-sm"
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
      
      {!isLast && <Separator className="mt-3" />}
    </div>
  );
}