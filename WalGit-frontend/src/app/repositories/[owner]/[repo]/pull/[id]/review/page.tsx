'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileDiff } from '@/components/code-review/FileDiff';
import { ReviewThread } from '@/components/code-review/ReviewThread';
import { 
  AlertCircle, 
  ArrowLeft, 
  FileCode, 
  GitPullRequest, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Filter
} from 'lucide-react';

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

interface FileDiffData {
  filePath: string;
  hunks: DiffHunk[];
  stats: {
    added: number;
    removed: number;
    modified: number;
  };
}

interface PullRequestThread {
  id: string;
  filePath: string;
  lineNumber: number;
  status: 'open' | 'resolved' | 'outdated';
  comments: {
    id: string;
    author: string;
    content: string;
    timestamp: string;
  }[];
}

/**
 * Code Review page for a pull request
 * Displays file diffs and allows adding comments and review threads
 */
export default function CodeReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileDiffs, setFileDiffs] = useState<FileDiffData[]>([]);
  const [threads, setThreads] = useState<PullRequestThread[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, fetch data from API
        // For now, use mock data with a delay
        setTimeout(() => {
          setFileDiffs(mockFileDiffs);
          setThreads(mockThreads);
          
          // Set the first file as active by default
          if (mockFileDiffs.length > 0) {
            setActiveFile(mockFileDiffs[0].filePath);
          }
          
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching code review data:', err);
        setError('Failed to load code review data. Please try again later.');
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [params.owner, params.repo, params.id]);
  
  // Function to add a new comment
  const handleAddComment = async (lineNumber: number, content: string) => {
    if (!activeFile) return;
    
    // In a real implementation, call API to add comment
    console.log(`Adding comment to ${activeFile}:${lineNumber}: ${content}`);
    
    // Simulate adding comment
    const newComment = {
      id: `comment-${Date.now()}`,
      author: 'currentUser',
      content,
      timestamp: new Date().toISOString()
    };
    
    // Create a new thread if one doesn't exist for this line
    const existingThreadIndex = threads.findIndex(
      t => t.filePath === activeFile && t.lineNumber === lineNumber
    );
    
    if (existingThreadIndex === -1) {
      // Create new thread
      const newThread: PullRequestThread = {
        id: `thread-${Date.now()}`,
        filePath: activeFile,
        lineNumber,
        status: 'open',
        comments: [newComment]
      };
      
      setThreads([...threads, newThread]);
    } else {
      // Add to existing thread
      const updatedThreads = [...threads];
      updatedThreads[existingThreadIndex].comments.push(newComment);
      
      // If thread was resolved, reopen it
      if (updatedThreads[existingThreadIndex].status === 'resolved') {
        updatedThreads[existingThreadIndex].status = 'open';
      }
      
      setThreads(updatedThreads);
    }
    
    return Promise.resolve();
  };
  
  // Function to reply to a thread
  const handleReplyToThread = async (threadId: string, content: string) => {
    // In a real implementation, call API to add reply
    console.log(`Replying to thread ${threadId}: ${content}`);
    
    // Simulate adding reply
    const threadIndex = threads.findIndex(t => t.id === threadId);
    
    if (threadIndex !== -1) {
      const newComment = {
        id: `comment-${Date.now()}`,
        author: 'currentUser',
        content,
        timestamp: new Date().toISOString()
      };
      
      const updatedThreads = [...threads];
      updatedThreads[threadIndex].comments.push(newComment);
      
      // If thread was resolved, reopen it
      if (updatedThreads[threadIndex].status === 'resolved') {
        updatedThreads[threadIndex].status = 'open';
      }
      
      setThreads(updatedThreads);
    }
    
    return Promise.resolve();
  };
  
  // Function to resolve a thread
  const handleResolveThread = async (threadId: string) => {
    // In a real implementation, call API to resolve thread
    console.log(`Resolving thread ${threadId}`);
    
    // Simulate resolving thread
    const threadIndex = threads.findIndex(t => t.id === threadId);
    
    if (threadIndex !== -1) {
      const updatedThreads = [...threads];
      updatedThreads[threadIndex].status = 'resolved';
      setThreads(updatedThreads);
    }
    
    return Promise.resolve();
  };
  
  // Function to reopen a thread
  const handleReopenThread = async (threadId: string) => {
    // In a real implementation, call API to reopen thread
    console.log(`Reopening thread ${threadId}`);
    
    // Simulate reopening thread
    const threadIndex = threads.findIndex(t => t.id === threadId);
    
    if (threadIndex !== -1) {
      const updatedThreads = [...threads];
      updatedThreads[threadIndex].status = 'open';
      setThreads(updatedThreads);
    }
    
    return Promise.resolve();
  };
  
  // Filter threads based on selected filter
  const filteredThreads = threads.filter(thread => {
    if (filter === 'all') return true;
    if (filter === 'open') return thread.status === 'open';
    if (filter === 'resolved') return thread.status === 'resolved';
    return true;
  });
  
  // Group threads by file for display
  const threadsByFile = filteredThreads.reduce((acc, thread) => {
    if (!acc[thread.filePath]) {
      acc[thread.filePath] = [];
    }
    acc[thread.filePath].push(thread);
    return acc;
  }, {} as Record<string, PullRequestThread[]>);
  
  // Get threads for active file
  const activeFileThreads = activeFile ? threads.filter(t => t.filePath === activeFile) : [];
  
  // Calculate total threads and stats
  const totalOpenThreads = threads.filter(t => t.status === 'open').length;
  const totalResolvedThreads = threads.filter(t => t.status === 'resolved').length;
  const totalOutdatedThreads = threads.filter(t => t.status === 'outdated').length;
  
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
  
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/repositories/${params.owner}/${params.repo}/pull/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitPullRequest className="h-6 w-6 text-blue-500" />
            <span>Code Review</span>
          </h1>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Files changed:</span>
            <span>{fileDiffs.length}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Threads:</span>
            <span>{threads.length}</span>
            <span className="text-xs text-gray-500">
              ({totalOpenThreads} open, {totalResolvedThreads} resolved, {totalOutdatedThreads} outdated)
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* File list sidebar */}
        <div className="w-full md:w-1/4 lg:w-1/5">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 py-2 px-3 border-b font-medium text-sm">
              Files
            </div>
            
            <div className="divide-y">
              {fileDiffs.map(file => {
                const fileThreads = threads.filter(t => t.filePath === file.filePath);
                const openThreads = fileThreads.filter(t => t.status === 'open').length;
                
                return (
                  <div 
                    key={file.filePath}
                    className={`py-2 px-3 cursor-pointer hover:bg-gray-50 ${
                      activeFile === file.filePath ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => setActiveFile(file.filePath)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-gray-500" />
                        <span className="text-sm truncate" style={{ maxWidth: '150px' }}>
                          {file.filePath.split('/').pop()}
                        </span>
                      </div>
                      
                      {openThreads > 0 && (
                        <div className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5 rounded-full">
                          {openThreads}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="text-green-600">+{file.stats.added}</span>
                      <span className="mx-1 text-gray-400">|</span>
                      <span className="text-red-600">-{file.stats.removed}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Conversation threads */}
          <div className="border rounded-lg overflow-hidden mt-4">
            <div className="bg-gray-100 py-2 px-3 border-b font-medium text-sm flex justify-between items-center">
              <div>Conversations</div>
              
              <div className="flex items-center gap-1">
                <Filter className="h-3 w-3 text-gray-500" />
                <select 
                  className="text-xs bg-transparent border-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            
            {Object.keys(threadsByFile).length === 0 ? (
              <div className="py-4 px-3 text-center text-sm text-gray-500">
                No conversation threads found
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {Object.entries(threadsByFile).map(([filePath, fileThreads]) => (
                  <div key={filePath} className="py-2 px-3">
                    <div 
                      className="text-xs text-blue-600 hover:underline cursor-pointer mb-2"
                      onClick={() => setActiveFile(filePath)}
                    >
                      {filePath}
                    </div>
                    
                    <div className="space-y-2">
                      {fileThreads.map(thread => (
                        <div 
                          key={thread.id}
                          className={`p-2 rounded text-xs ${
                            thread.status === 'open' ? 'bg-blue-50' : 
                            thread.status === 'resolved' ? 'bg-gray-50' : 
                            'bg-amber-50'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Line {thread.lineNumber}</span>
                              {thread.status === 'open' ? (
                                <span className="text-blue-600 text-xs flex items-center">
                                  <MessageSquare className="h-3 w-3 mr-0.5" /> Open
                                </span>
                              ) : thread.status === 'resolved' ? (
                                <span className="text-green-600 text-xs flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-0.5" /> Resolved
                                </span>
                              ) : (
                                <span className="text-amber-600 text-xs flex items-center">
                                  <XCircle className="h-3 w-3 mr-0.5" /> Outdated
                                </span>
                              )}
                            </div>
                            
                            <span className="text-xs text-gray-500">
                              {thread.comments.length} comments
                            </span>
                          </div>
                          
                          <div className="line-clamp-2">
                            {thread.comments[0].content}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-1 h-6 text-xs"
                            onClick={() => {
                              setActiveFile(filePath);
                              // Ideally would scroll to the thread
                            }}
                          >
                            Go to thread
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="w-full md:w-3/4 lg:w-4/5">
          {activeFile ? (
            <div>
              <FileDiff 
                filePath={activeFile}
                hunks={fileDiffs.find(f => f.filePath === activeFile)?.hunks || []}
                threads={activeFileThreads.map(thread => ({
                  id: thread.id,
                  lineNumber: thread.lineNumber,
                  status: thread.status,
                  comments: thread.comments
                }))}
                onAddComment={handleAddComment}
                onReplyToThread={handleReplyToThread}
                onResolveThread={handleResolveThread}
                onReopenThread={handleReopenThread}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              <FileCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium">Select a file to review</h3>
              <p className="text-sm">
                Choose a file from the sidebar to view changes and add comments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock data for testing
const mockFileDiffs: FileDiffData[] = [
  {
    filePath: 'src/utils/git-operations.js',
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
    ],
    stats: {
      added: 4,
      removed: 1,
      modified: 0
    }
  },
  {
    filePath: 'src/models/changeset.js',
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
    ],
    stats: {
      added: 3,
      removed: 0,
      modified: 0
    }
  }
];

const mockThreads: PullRequestThread[] = [
  {
    id: 'thread-1',
    filePath: 'src/utils/git-operations.js',
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
    filePath: 'src/utils/git-operations.js',
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
  },
  {
    id: 'thread-3',
    filePath: 'src/models/changeset.js',
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
];