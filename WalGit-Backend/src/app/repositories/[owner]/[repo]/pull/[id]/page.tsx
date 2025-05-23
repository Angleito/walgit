'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  PullRequestReviewPanel,
  ReviewDashboard,
  ReviewSummary,
  DiffViewer
} from '@/components/code-review';
import { CommentForm } from '@/components/code-review/CommentForm';
import { ReviewForm } from '@/components/code-review/ReviewForm';
import { 
  AlertCircle, 
  ArrowLeft, 
  GitPullRequest, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Terminal,
  GitCommit,
  FileText,
  FileCode,
  Loader2
} from 'lucide-react';
import type { 
  PullRequest, 
  PullRequestComment, 
  PullRequestReviewVerdict 
} from '@/types/pull-request';
import type { CommentFormValues, ReviewFormValues } from '@/lib/form-schemas';

/**
 * Integrated Pull Request Page
 * This page brings together all the code review components
 */
export default function PullRequestPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pullRequest, setPullRequest] = useState<PullRequest | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch pull request data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, fetch data from API
        // For demo, use mock data
        setTimeout(() => {
          setPullRequest(mockPullRequest);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error fetching pull request:', err);
        setError('Failed to load pull request data. Please try again later.');
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [params.owner, params.repo, params.id]);
  
  // Submit a review for the pull request
  const handleReview = async (values: ReviewFormValues) => {
    if (!pullRequest) return;
    
    // In a real implementation, call API
    console.log(`Submitting review with verdict: ${values.verdict}`);
    console.log(`Comment: ${values.comment}`);
    
    // Mock implementation to update UI
    const newReview = {
      id: `review-${Date.now()}`,
      reviewer: '0x123456789abcdef', // Current user
      verdict: values.verdict as PullRequestReviewVerdict,
      comment: values.comment,
      timestamp: new Date().toISOString()
    };
    
    setPullRequest({
      ...pullRequest,
      reviews: [...(pullRequest.reviews || []), newReview]
    });
    
    return Promise.resolve();
  };
  
  // Add a comment to a pull request
  const handleAddComment = async (values: CommentFormValues) => {
    if (!pullRequest) return;
    
    // In a real implementation, call API
    console.log(`Adding comment: ${values.content}`);
    
    // Mock implementation to update UI
    const newComment: PullRequestComment = {
      id: `comment-${Date.now()}`,
      author: '0x123456789abcdef', // Current user
      content: values.content,
      timestamp: new Date().toISOString(),
      filePath: values.filePath,
      lineNumber: values.lineNumber
    };
    
    setPullRequest({
      ...pullRequest,
      comments: [...(pullRequest.comments || []), newComment]
    });
    
    return Promise.resolve();
  };
  
  // Add a file-specific comment
  const handleAddFileComment = async (filePath: string, lineNumber: number, content: string) => {
    if (!pullRequest) return;
    
    // In a real implementation, call API
    console.log(`Adding comment to ${filePath}:${lineNumber}: ${content}`);
    
    // Mock implementation to update UI
    const newComment: PullRequestComment = {
      id: `comment-${Date.now()}`,
      author: '0x123456789abcdef', // Current user
      content,
      timestamp: new Date().toISOString(),
      filePath,
      lineNumber
    };
    
    setPullRequest({
      ...pullRequest,
      comments: [...(pullRequest.comments || []), newComment]
    });
    
    return Promise.resolve();
  };
  
  // Reply to a comment
  const handleReplyToComment = async (commentId: string, content: string) => {
    if (!pullRequest) return;
    
    // In a real implementation, call API
    console.log(`Replying to comment ${commentId}: ${content}`);
    
    // Mock implementation to update UI
    // In a real app, you'd link replies to parent comments
    const newComment: PullRequestComment = {
      id: `comment-${Date.now()}`,
      author: '0x123456789abcdef', // Current user
      content,
      timestamp: new Date().toISOString()
    };
    
    setPullRequest({
      ...pullRequest,
      comments: [...(pullRequest.comments || []), newComment]
    });
    
    return Promise.resolve();
  };
  
  // Resolve a thread/comment
  const handleResolveThread = async (threadId: string) => {
    // In a real implementation, call API
    console.log(`Resolving thread ${threadId}`);
    
    // Real implementation would update thread status in the backend
    return Promise.resolve();
  };
  
  // Reopen a thread/comment
  const handleReopenThread = async (threadId: string) => {
    // In a real implementation, call API
    console.log(`Reopening thread ${threadId}`);
    
    // Real implementation would update thread status in the backend
    return Promise.resolve();
  };
  
  // Create file diffs for the diff viewer (in a real app, this would come from the API)
  const createFileDiffs = () => {
    return [
      {
        fileInfo: {
          oldPath: 'src/utils/git-operations.js',
          newPath: 'src/utils/git-operations.js',
          type: 'modified'
        },
        hunks: [
          {
            oldStart: 10,
            oldLines: 7,
            newStart: 10,
            newLines: 10,
            lines: [
              { type: 'unchanged', content: 'function commitChanges(repo, message) {', oldLineNumber: 10, newLineNumber: 10 },
              { type: 'unchanged', content: '  if (!repo) {', oldLineNumber: 11, newLineNumber: 11 },
              { type: 'unchanged', content: '    throw new Error("Repository is required");', oldLineNumber: 12, newLineNumber: 12 },
              { type: 'unchanged', content: '  }', oldLineNumber: 13, newLineNumber: 13 },
              { type: 'added', content: '  ', newLineNumber: 14 },
              { type: 'added', content: '  // Add optimization for blockchain transactions', newLineNumber: 15 },
              { type: 'added', content: '  const tx = optimizeTransaction(repo, message);', newLineNumber: 16 },
              { type: 'unchanged', content: '', oldLineNumber: 14, newLineNumber: 17 },
              { type: 'removed', content: '  return repo.commit(message);', oldLineNumber: 15 },
              { type: 'added', content: '  return repo.commitWithTransaction(tx, message);', newLineNumber: 18 },
              { type: 'unchanged', content: '}', oldLineNumber: 16, newLineNumber: 19 }
            ]
          }
        ]
      },
      {
        fileInfo: {
          oldPath: 'src/models/changeset.js',
          newPath: 'src/models/changeset.js',
          type: 'modified'
        },
        hunks: [
          {
            oldStart: 20,
            oldLines: 5,
            newStart: 20,
            newLines: 8,
            lines: [
              { type: 'unchanged', content: 'class Changeset {', oldLineNumber: 20, newLineNumber: 20 },
              { type: 'unchanged', content: '  constructor(id, changes) {', oldLineNumber: 21, newLineNumber: 21 },
              { type: 'unchanged', content: '    this.id = id;', oldLineNumber: 22, newLineNumber: 22 },
              { type: 'unchanged', content: '    this.changes = changes;', oldLineNumber: 23, newLineNumber: 23 },
              { type: 'added', content: '    this.metadata = {};', newLineNumber: 24 },
              { type: 'added', content: '    this.createdAt = Date.now();', newLineNumber: 25 },
              { type: 'added', content: '    this.status = "pending";', newLineNumber: 26 },
              { type: 'unchanged', content: '  }', oldLineNumber: 24, newLineNumber: 27 }
            ]
          }
        ]
      }
    ];
  };
  
  // Create file threads for the diff viewer (in a real app, this would come from the API)
  const createFileThreads = () => {
    return {
      'src/utils/git-operations.js': [
        {
          id: 'thread-1',
          lineNumber: 16,
          status: 'open',
          comments: [
            {
              id: 'comment-1',
              author: '0x123456789abcdef',
              content: 'Should we add more details about what optimizeTransaction does? Maybe add JSDoc comments.',
              timestamp: '2025-04-03T09:30:00Z'
            }
          ]
        },
        {
          id: 'thread-2',
          lineNumber: 18,
          status: 'resolved',
          comments: [
            {
              id: 'comment-2',
              author: '0xabcdef1234567890',
              content: 'Consider adding error handling here in case the transaction fails.',
              timestamp: '2025-04-03T10:15:00Z'
            },
            {
              id: 'comment-3',
              author: '0x123456789abcdef',
              content: 'Good point, I\'ll add that in the next PR. This is just the initial implementation.',
              timestamp: '2025-04-03T10:30:00Z'
            },
            {
              id: 'comment-4',
              author: '0xabcdef1234567890',
              content: 'Sounds good!',
              timestamp: '2025-04-03T10:32:00Z'
            }
          ]
        }
      ],
      'src/models/changeset.js': [
        {
          id: 'thread-3',
          lineNumber: 26,
          status: 'open',
          comments: [
            {
              id: 'comment-5',
              author: '0xfedcba9876543210',
              content: 'Should we use an enum for status instead of a string?',
              timestamp: '2025-04-04T14:22:00Z'
            },
            {
              id: 'comment-6',
              author: '0x123456789abcdef',
              content: 'Yes, that would be better. I\'ll update that.',
              timestamp: '2025-04-04T14:30:00Z'
            }
          ]
        }
      ]
    };
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl font-medium">Loading pull request...</h2>
        </div>
      </div>
    );
  }
  
  if (error || !pullRequest) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Failed to load pull request data'}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/repositories/${params.owner}/${params.repo}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitPullRequest className={`h-6 w-6 ${
                pullRequest.status === 'open' ? 'text-green-500' :
                pullRequest.status === 'merged' ? 'text-purple-500' :
                'text-red-500'
              }`} />
              <span>{pullRequest.title}</span>
              <span className="text-gray-400 text-lg font-normal">#{params.id}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>
              {pullRequest.sourceBranch} → {pullRequest.targetBranch}
            </span>
            <span>•</span>
            <span>
              {pullRequest.diffStats?.filesChanged || 0} files changed
            </span>
            <span>•</span>
            <span>
              Created {new Date(pullRequest.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Terminal className="h-4 w-4 mr-1" />
            CLI Commands
          </Button>
          
          <Link href={`/repositories/${params.owner}/${params.repo}/pull/${params.id}/review`}>
            <Button>
              <FileCode className="h-4 w-4 mr-1" />
              Review Changes
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <GitPullRequest className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>Files Changed</span>
            <span className="ml-1 bg-gray-100 px-1.5 rounded-full text-xs">
              {pullRequest.diffStats?.filesChanged || 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span>Comments</span>
            <span className="ml-1 bg-gray-100 px-1.5 rounded-full text-xs">
              {pullRequest.comments?.length || 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="commits" className="flex items-center gap-1">
            <GitCommit className="h-4 w-4" />
            <span>Commits</span>
            <span className="ml-1 bg-gray-100 px-1.5 rounded-full text-xs">
              {pullRequest.commits?.length || 0}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <div className="py-6">
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <PullRequestReviewPanel
                  pullRequest={pullRequest}
                  onReview={handleReview}
                  onReply={handleReplyToComment}
                />
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Add a Comment</h3>
                  <CommentForm
                    onSubmit={handleAddComment}
                    userAvatar="https://avatars.dicebear.com/api/initials/CU.svg"
                  />
                </div>
              </div>
              
              <div>
                <ReviewDashboard
                  pullRequests={[pullRequest]}
                  onSelectPullRequest={(id) => {}}
                  currentUserWallet="0x123456789abcdef"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <DiffViewer
              sourceBranch={pullRequest.sourceBranch}
              targetBranch={pullRequest.targetBranch}
              fileDiffs={createFileDiffs()}
              threads={createFileThreads()}
              onAddComment={handleAddFileComment}
              onReplyToThread={handleReplyToComment}
              onResolveThread={handleResolveThread}
              onReopenThread={handleReopenThread}
            />
          </TabsContent>
          
          <TabsContent value="comments">
            <ReviewSummary
              pullRequest={pullRequest}
              onReplyToComment={handleReplyToComment}
              onResolveComment={handleResolveThread}
              currentUserWallet="0x123456789abcdef"
            />
          </TabsContent>
          
          <TabsContent value="commits">
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-gray-50">
                <h3 className="font-medium">Commits</h3>
              </div>
              
              <div className="divide-y">
                {pullRequest.commits && pullRequest.commits.length > 0 ? (
                  pullRequest.commits.map((commit) => (
                    <div key={commit.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          <GitCommit className="h-5 w-5 text-gray-400" />
                        </div>
                        
                        <div className="flex-1">
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
                        
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <GitCommit className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-gray-500">No commits found</h3>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Mock data for the pull request
const mockPullRequest: PullRequest = {
  id: '123',
  title: 'Add blockchain transaction optimization',
  description: 'This PR adds optimizations for blockchain transactions to improve gas usage and transaction speed.',
  status: 'open',
  author: '0x123456789abcdef',
  sourceBranch: 'feature/transaction-optimization',
  targetBranch: 'main',
  createdAt: '2025-04-02T12:00:00Z',
  lastUpdated: '2025-04-04T15:30:00Z',
  reviews: [
    {
      id: 'review-1',
      reviewer: '0xabcdef1234567890',
      verdict: 'approve',
      comment: 'This looks good! The optimization should help reduce gas costs.',
      timestamp: '2025-04-03T14:00:00Z'
    },
    {
      id: 'review-2',
      reviewer: '0xfedcba9876543210',
      verdict: 'request_changes',
      comment: 'Please add more error handling for edge cases.',
      timestamp: '2025-04-03T16:30:00Z'
    }
  ],
  comments: [
    {
      id: 'comment-1',
      author: '0x123456789abcdef',
      content: 'This change should reduce gas usage by approximately 15%.',
      timestamp: '2025-04-02T12:30:00Z'
    },
    {
      id: 'comment-2',
      author: '0xabcdef1234567890',
      content: 'Have you tested this with large transactions?',
      timestamp: '2025-04-03T09:45:00Z'
    },
    {
      id: 'comment-3',
      author: '0x123456789abcdef',
      content: 'Yes, I\'ve tested with transactions up to 1MB in size. Performance increases are consistent.',
      timestamp: '2025-04-03T10:15:00Z'
    }
  ],
  commits: [
    {
      id: 'commit-1',
      message: 'Add transaction optimization function',
      author: '0x123456789abcdef',
      date: '2025-04-01T10:00:00Z',
      hash: 'a1b2c3d4e5f6g7h8i9j0'
    },
    {
      id: 'commit-2',
      message: 'Integrate optimization with commit flow',
      author: '0x123456789abcdef',
      date: '2025-04-01T15:30:00Z',
      hash: 'b2c3d4e5f6g7h8i9j0k1'
    },
    {
      id: 'commit-3',
      message: 'Add metadata to changeset model',
      author: '0x123456789abcdef',
      date: '2025-04-02T09:15:00Z',
      hash: 'c3d4e5f6g7h8i9j0k1l2'
    }
  ],
  diffStats: {
    filesChanged: 2,
    insertions: 7,
    deletions: 1
  },
  mergeableStatus: {
    canMerge: true
  }
};