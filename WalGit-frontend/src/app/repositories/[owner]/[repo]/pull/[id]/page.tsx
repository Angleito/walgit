'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, XCircle, GitPullRequest, MessageSquare, GitCommit, GitMerge } from 'lucide-react';
import { PullRequest, PullRequestStatus, PullRequestReview, PullRequestComment } from '@/types/pull-request';

interface TabsProps {
  pullRequest: PullRequest;
  onSubmitReview: (verdict: string, comment: string) => Promise<void>;
  onSubmitComment: (comment: string, filePath?: string, lineNumber?: number) => Promise<void>;
  onMergePR: (strategy: string) => Promise<void>;
  onClosePR: () => Promise<void>;
}

/**
 * Pull Request detail page
 * Displays details, conversation, changes, and reviews for a pull request
 */
export default function PullRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [pullRequest, setPullRequest] = useState<PullRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [conversationComment, setConversationComment] = useState('');
  const [mergeStrategy, setMergeStrategy] = useState('merge');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch pull request data
  useEffect(() => {
    async function fetchPullRequest() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would call the API
        // For now, we'll use mock data
        const response = await fetch(`/api/repositories/${params.owner}/${params.repo}/pulls/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch pull request');
        }
        
        const data = await response.json();
        setPullRequest(data);
      } catch (err) {
        console.error('Error fetching pull request:', err);
        setError('Failed to load pull request details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPullRequest();
  }, [params.owner, params.repo, params.id]);

  // Submit a review
  const handleSubmitReview = async (verdict: string, comment: string) => {
    if (!pullRequest) return;
    
    setSubmitLoading(true);
    
    try {
      // In a real implementation, this would call the API
      const response = await fetch(`/api/repositories/${params.owner}/${params.repo}/pulls/${params.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verdict,
          comment,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      // Add the review to the PR
      const newReview: PullRequestReview = {
        id: `review-${Date.now()}`,
        reviewer: 'currentUser', // In real app, get from auth context
        verdict,
        comment,
        timestamp: new Date().toISOString(),
      };
      
      setPullRequest({
        ...pullRequest,
        reviews: [...(pullRequest.reviews || []), newReview],
      });
      
      setReviewComment('');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again later.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit a comment
  const handleSubmitComment = async (comment: string, filePath?: string, lineNumber?: number) => {
    if (!pullRequest) return;
    
    setSubmitLoading(true);
    
    try {
      // In a real implementation, this would call the API
      const response = await fetch(`/api/repositories/${params.owner}/${params.repo}/pulls/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          filePath,
          lineNumber,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }
      
      // Add the comment to the PR
      const newComment: PullRequestComment = {
        id: `comment-${Date.now()}`,
        author: 'currentUser', // In real app, get from auth context
        content: comment,
        timestamp: new Date().toISOString(),
        filePath,
        lineNumber,
      };
      
      setPullRequest({
        ...pullRequest,
        comments: [...(pullRequest.comments || []), newComment],
      });
      
      setConversationComment('');
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError('Failed to submit comment. Please try again later.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Merge the pull request
  const handleMergePR = async (strategy: string) => {
    if (!pullRequest) return;
    
    setSubmitLoading(true);
    
    try {
      // In a real implementation, this would call the API
      const response = await fetch(`/api/repositories/${params.owner}/${params.repo}/pulls/${params.id}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to merge pull request');
      }
      
      // Update PR status
      setPullRequest({
        ...pullRequest,
        status: 'merged' as PullRequestStatus,
      });
    } catch (err) {
      console.error('Error merging pull request:', err);
      setError('Failed to merge pull request. Please try again later.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Close the pull request
  const handleClosePR = async () => {
    if (!pullRequest) return;
    
    setSubmitLoading(true);
    
    try {
      // In a real implementation, this would call the API
      const response = await fetch(`/api/repositories/${params.owner}/${params.repo}/pulls/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'closed',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to close pull request');
      }
      
      // Update PR status
      setPullRequest({
        ...pullRequest,
        status: 'closed' as PullRequestStatus,
      });
    } catch (err) {
      console.error('Error closing pull request:', err);
      setError('Failed to close pull request. Please try again later.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!pullRequest) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested pull request could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <GitPullRequest className="h-5 w-5 text-blue-500" />
          <h1 className="text-2xl font-bold">{pullRequest.title}</h1>
          <PullRequestStatusBadge status={pullRequest.status} />
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>#{pullRequest.id.substring(0, 8)}</span>
          <span>•</span>
          <span>{pullRequest.author} opened this pull request</span>
          <span>•</span>
          <span>{new Date(pullRequest.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-3/4">
          <PullRequestTabs 
            pullRequest={pullRequest}
            onSubmitReview={handleSubmitReview}
            onSubmitComment={handleSubmitComment}
            onMergePR={handleMergePR}
            onClosePR={handleClosePR}
          />
        </div>
        
        <div className="w-full lg:w-1/4">
          <div className="border rounded-lg p-4 mb-4">
            <h3 className="font-medium mb-2">Details</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Source:</span> {pullRequest.sourceBranch}
              </div>
              <div>
                <span className="text-gray-500">Target:</span> {pullRequest.targetBranch}
              </div>
              <div>
                <span className="text-gray-500">Created:</span> {new Date(pullRequest.createdAt).toLocaleDateString()}
              </div>
              {pullRequest.lastUpdated && (
                <div>
                  <span className="text-gray-500">Updated:</span> {new Date(pullRequest.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          {pullRequest.status === 'open' && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Merge</h3>
              
              {!pullRequest.mergeableStatus?.canMerge ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Cannot merge</AlertTitle>
                  <AlertDescription>
                    {pullRequest.mergeableStatus?.reason || 'This pull request cannot be merged.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertTitle>Ready to merge</AlertTitle>
                  <AlertDescription>
                    This pull request can be merged.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <select
                  className="w-full p-2 border rounded"
                  value={mergeStrategy}
                  onChange={(e) => setMergeStrategy(e.target.value)}
                  disabled={!pullRequest.mergeableStatus?.canMerge || pullRequest.status !== 'open'}
                >
                  <option value="merge">Create a merge commit</option>
                  <option value="squash">Squash and merge</option>
                  <option value="rebase">Rebase and merge</option>
                </select>
                
                <Button
                  className="w-full"
                  variant="default"
                  disabled={!pullRequest.mergeableStatus?.canMerge || pullRequest.status !== 'open' || submitLoading}
                  onClick={() => handleMergePR(mergeStrategy)}
                >
                  <GitMerge className="mr-2 h-4 w-4" />
                  Merge pull request
                </Button>
                
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={pullRequest.status !== 'open' || submitLoading}
                  onClick={handleClosePR}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Close pull request
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Pull Request Status Badge Component
function PullRequestStatusBadge({ status }: { status: PullRequestStatus }) {
  switch (status) {
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
}

// Pull Request Tabs Component
function PullRequestTabs({ pullRequest, onSubmitReview, onSubmitComment, onMergePR, onClosePR }: TabsProps) {
  return (
    <Tabs defaultValue="conversation" className="w-full">
      <TabsList className="grid grid-cols-4 mb-4">
        <TabsTrigger value="conversation">Conversation</TabsTrigger>
        <TabsTrigger value="commits">Commits</TabsTrigger>
        <TabsTrigger value="changes">Changes</TabsTrigger>
        <TabsTrigger value="files" asChild>
          <Link href={`/repositories/${params.owner}/${params.repo}/pull/${params.id}/review`}>
            Code Review
          </Link>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="conversation" className="space-y-4">
        {/* Description */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={`https://avatars.dicebear.com/api/identicon/${pullRequest.author}.svg`} />
              <AvatarFallback>{pullRequest.author.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{pullRequest.author}</div>
              <div className="text-sm text-gray-500">Author</div>
            </div>
          </div>
          
          <div className="prose max-w-none">
            {pullRequest.description || <em>No description provided.</em>}
          </div>
        </div>
        
        {/* Timeline of reviews and comments */}
        <div className="space-y-4">
          {[...(pullRequest.reviews || []), ...(pullRequest.comments || [])]
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((item) => {
              const isReview = 'verdict' in item;
              return (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage 
                        src={`https://avatars.dicebear.com/api/identicon/${isReview ? item.reviewer : item.author}.svg`}
                      />
                      <AvatarFallback>
                        {(isReview ? item.reviewer : item.author).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">{isReview ? item.reviewer : item.author}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    
                    {isReview && (
                      <Badge className={
                        item.verdict === 'approve' ? 'bg-green-500' : 
                        item.verdict === 'request_changes' ? 'bg-red-500' : 
                        'bg-blue-500'
                      }>
                        {item.verdict === 'approve' ? 'Approved' : 
                         item.verdict === 'request_changes' ? 'Changes requested' : 
                         'Commented'}
                      </Badge>
                    )}
                  </div>
                  
                  {'filePath' in item && item.filePath && (
                    <div className="bg-gray-100 p-2 rounded text-sm mb-2">
                      {item.filePath}{item.lineNumber ? `:${item.lineNumber}` : ''}
                    </div>
                  )}
                  
                  <div className="prose max-w-none text-sm">
                    {isReview ? item.comment : item.content}
                  </div>
                </div>
              );
            })}
        </div>
        
        {/* Add comment form */}
        {pullRequest.status === 'open' && (
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Add a comment</h3>
            <Textarea
              placeholder="Leave a comment..."
              value={conversationComment}
              onChange={(e) => setConversationComment(e.target.value)}
              className="mb-2"
              rows={4}
            />
            <Button 
              onClick={() => onSubmitComment(conversationComment)}
              disabled={!conversationComment.trim()}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Comment
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="commits" className="space-y-4">
        {pullRequest.commits?.length ? (
          <div className="border rounded-lg">
            {pullRequest.commits.map((commit, index) => (
              <div key={commit.id} className="p-4 border-b last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <GitCommit className="h-4 w-4 text-blue-500" />
                  <div className="font-medium">{commit.message}</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div>{commit.id.substring(0, 8)}</div>
                  <div>•</div>
                  <div>{commit.author}</div>
                  <div>•</div>
                  <div>{new Date(commit.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            No commits found for this pull request.
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="changes" className="space-y-4">
        {/* Diff stats */}
        {pullRequest.diffStats && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="font-medium">{pullRequest.diffStats.filesChanged}</span> files changed
              </div>
              <div>
                <span className="text-green-600">+{pullRequest.diffStats.insertions}</span> insertions
              </div>
              <div>
                <span className="text-red-600">-{pullRequest.diffStats.deletions}</span> deletions
              </div>
            </div>
          </div>
        )}
        
        {/* File diffs would go here - simplified for this implementation */}
        <div className="border rounded-lg">
          <div className="bg-gray-100 p-4 font-mono border-b">
            <div className="font-medium">Changes</div>
          </div>
          <div className="p-4">
            <div className="text-center text-gray-500">
              Diff display would be implemented here with file diff visualizations.
            </div>
          </div>
        </div>
        
        {/* Review form */}
        {pullRequest.status === 'open' && (
          <div className="border rounded-lg p-4 mt-6">
            <h3 className="font-medium mb-4">Review changes</h3>
            <Textarea
              placeholder="Leave a review comment..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                variant="default"
                onClick={() => onSubmitReview('approve', reviewComment)}
                disabled={!reviewComment.trim()}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button 
                variant="destructive"
                onClick={() => onSubmitReview('request_changes', reviewComment)}
                disabled={!reviewComment.trim()}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Request changes
              </Button>
              <Button 
                variant="secondary"
                onClick={() => onSubmitReview('comment', reviewComment)}
                disabled={!reviewComment.trim()}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Comment
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}