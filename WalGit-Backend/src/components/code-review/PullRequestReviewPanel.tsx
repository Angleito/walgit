'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  GitPullRequest, 
  GitCommit, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  FileText
} from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import type { 
  PullRequest, 
  PullRequestReview, 
  PullRequestReviewVerdict, 
  PullRequestComment 
} from '@/types/pull-request';
import type { ReviewFormValues } from '@/lib/form-schemas';

interface PullRequestReviewPanelProps {
  pullRequest: PullRequest;
  onReview: (values: ReviewFormValues) => Promise<void>;
  onReply: (commentId: string, content: string) => Promise<void>;
}

/**
 * A comprehensive panel that shows PR details and allows reviewing
 */
export function PullRequestReviewPanel({
  pullRequest,
  onReview,
  onReply
}: PullRequestReviewPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate review statistics
  const approvals = pullRequest.reviews?.filter(r => r.verdict === 'approve') || [];
  const changes = pullRequest.reviews?.filter(r => r.verdict === 'request_changes') || [];
  const comments = pullRequest.reviews?.filter(r => r.verdict === 'comment') || [];
  
  const isMergeable = pullRequest.mergeableStatus?.canMerge || false;
  const mergeBlockReason = pullRequest.mergeableStatus?.reason;

  // Format timestamp to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge color
  const getStatusBadge = () => {
    switch (pullRequest.status) {
      case 'open':
        return <Badge className="bg-green-500">Open</Badge>;
      case 'closed':
        return <Badge className="bg-red-500">Closed</Badge>;
      case 'merged':
        return <Badge className="bg-purple-500">Merged</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500">Draft</Badge>;
      default:
        return null;
    }
  };

  // Get verdict badge for review
  const getVerdictBadge = (verdict: PullRequestReviewVerdict) => {
    switch (verdict) {
      case 'approve':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'request_changes':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Changes Requested
          </Badge>
        );
      case 'comment':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            Commented
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-blue-500" />
              <CardTitle>{pullRequest.title}</CardTitle>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Created by</span>
              <Avatar className="h-6 w-6">
                <AvatarFallback>{pullRequest.author.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {pullRequest.author.substring(0, 8)}...
              </span>
              <span className="text-xs text-gray-500">
                on {formatDate(pullRequest.createdAt)}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reviews">
                Reviews
                {pullRequest.reviews && pullRequest.reviews.length > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 px-2 text-xs text-blue-800">
                    {pullRequest.reviews.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="commits">
                Commits
                {pullRequest.commits && pullRequest.commits.length > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 px-2 text-xs text-blue-800">
                    {pullRequest.commits.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="discussion">
                Discussion
                {pullRequest.comments && pullRequest.comments.length > 0 && (
                  <span className="ml-1 rounded-full bg-blue-100 px-2 text-xs text-blue-800">
                    {pullRequest.comments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    {pullRequest.description ? (
                      <p>{pullRequest.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="font-medium mb-2">Branches</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Source</span>
                        <span className="text-sm font-medium">{pullRequest.sourceBranch}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Target</span>
                        <span className="text-sm font-medium">{pullRequest.targetBranch}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="font-medium mb-2">Diff Stats</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Files Changed</span>
                        <span className="text-sm font-medium">{pullRequest.diffStats?.filesChanged || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Additions</span>
                        <span className="text-sm font-medium text-green-600">+{pullRequest.diffStats?.insertions || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Deletions</span>
                        <span className="text-sm font-medium text-red-600">-{pullRequest.diffStats?.deletions || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-md p-4">
                  <h3 className="font-medium mb-2">Merge Status</h3>
                  <div className="flex items-center gap-2">
                    {isMergeable ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-green-600 font-medium">Ready to merge</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-600 font-medium">Cannot merge</span>
                        {mergeBlockReason && (
                          <span className="text-sm text-gray-600 ml-2">({mergeBlockReason})</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Approvals</h3>
                    </div>
                    <span className="text-2xl font-bold">{approvals.length}</span>
                  </div>

                  <div className="bg-red-50 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium">Change Requests</h3>
                    </div>
                    <span className="text-2xl font-bold">{changes.length}</span>
                  </div>

                  <div className="bg-blue-50 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <h3 className="font-medium">Comments</h3>
                    </div>
                    <span className="text-2xl font-bold">{comments.length}</span>
                  </div>
                </div>

                {/* Review list */}
                <div className="space-y-4">
                  {pullRequest.reviews && pullRequest.reviews.length > 0 ? (
                    pullRequest.reviews.map((review) => (
                      <ReviewItem 
                        key={review.id} 
                        review={review} 
                        onReply={(content) => onReply(review.id, content)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                      <h3 className="mt-2 text-gray-500">No reviews yet</h3>
                      <p className="text-sm text-gray-400">Be the first to review these changes</p>
                    </div>
                  )}
                </div>

                {/* Review form */}
                <div className="mt-6">
                  <h3 className="font-medium mb-4">Submit Your Review</h3>
                  <ReviewForm 
                    pullRequestId={pullRequest.id} 
                    onSubmit={onReview}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Commits Tab */}
            <TabsContent value="commits" className="mt-4">
              <div className="space-y-4">
                {pullRequest.commits && pullRequest.commits.length > 0 ? (
                  <div className="divide-y">
                    {pullRequest.commits.map((commit) => (
                      <div key={commit.id} className="py-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <GitCommit className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{commit.message.split('\n')[0]}</h4>
                              <span className="text-xs font-mono text-gray-500">{commit.hash.substring(0, 7)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <span>{commit.author.substring(0, 8)}...</span>
                              <span className="mx-1">•</span>
                              <span>{new Date(commit.date).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GitCommit className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-gray-500">No commits available</h3>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Discussion Tab */}
            <TabsContent value="discussion" className="mt-4">
              <div className="space-y-4">
                {pullRequest.comments && pullRequest.comments.length > 0 ? (
                  <div className="divide-y">
                    {pullRequest.comments
                      .filter(comment => !comment.filePath) // Only general comments, not file-specific
                      .map((comment) => (
                        <div key={comment.id} className="py-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{comment.author.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {comment.author.substring(0, 8)}...
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 text-sm">{comment.content}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-gray-500">No discussion yet</h3>
                    <p className="text-sm text-gray-400">Start a conversation about this pull request</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface ReviewItemProps {
  review: PullRequestReview;
  onReply: (content: string) => Promise<void>;
}

function ReviewItem({ review, onReply }: ReviewItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <div className="border rounded-md p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{review.reviewer.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {review.reviewer.substring(0, 8)}...
              </span>
              <span className="text-xs text-gray-500">
                {new Date(review.timestamp).toLocaleString()}
              </span>
              {getVerdictBadge(review.verdict)}
            </div>
          </div>
          
          <div className="mt-2">
            {review.comment}
          </div>
        </div>
      </div>
    </div>
  );

  function getVerdictBadge(verdict: PullRequestReviewVerdict) {
    switch (verdict) {
      case 'approve':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'request_changes':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Changes Requested
          </Badge>
        );
      case 'comment':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
            <MessageSquare className="h-3 w-3 mr-1" />
            Commented
          </Badge>
        );
      default:
        return null;
    }
  }
}