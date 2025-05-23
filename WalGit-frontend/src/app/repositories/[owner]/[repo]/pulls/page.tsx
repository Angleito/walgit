'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { GitPullRequest, AlertCircle, Plus } from 'lucide-react';
import { PullRequest, PullRequestStatus } from '@/types/pull-request';

/**
 * Pull Requests list page for a repository
 */
export default function PullRequestsPage() {
  const router = useRouter();
  const params = useParams();
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PullRequestStatus | 'all'>('open');

  // Fetch pull requests
  useEffect(() => {
    async function fetchPullRequests() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, this would call the API
        // For now, we'll simulate a fetch with a delay
        const response = await fetch(
          `/api/repositories/${params.owner}/${params.repo}/pulls${activeTab !== 'all' ? `?status=${activeTab}` : ''}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch pull requests');
        }
        
        const data = await response.json();
        setPullRequests(data);
      } catch (err) {
        console.error('Error fetching pull requests:', err);
        setError('Failed to load pull requests. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPullRequests();
  }, [params.owner, params.repo, activeTab]);

  // Navigate to create PR page
  const handleCreatePR = () => {
    router.push(`/repositories/${params.owner}/${params.repo}/pulls/new`);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as PullRequestStatus | 'all');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pull Requests</h1>
          <Button onClick={handleCreatePR}>
            <Plus className="mr-2 h-4 w-4" />
            New pull request
          </Button>
        </div>
        
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Pull Requests</h1>
          <Button onClick={handleCreatePR}>
            <Plus className="mr-2 h-4 w-4" />
            New pull request
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pull Requests</h1>
        <Button onClick={handleCreatePR}>
          <Plus className="mr-2 h-4 w-4" />
          New pull request
        </Button>
      </div>
      
      <Tabs defaultValue="open" onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="merged">Merged</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        {['open', 'closed', 'merged', 'all'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {pullRequests.length === 0 ? (
              <div className="text-center p-8 border rounded-lg">
                <GitPullRequest className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">No pull requests found</h3>
                <p className="text-gray-500">
                  {status === 'open' 
                    ? "There are no open pull requests." 
                    : status === 'closed'
                    ? "There are no closed pull requests."
                    : status === 'merged'
                    ? "There are no merged pull requests."
                    : "There are no pull requests."}
                </p>
                <Button onClick={handleCreatePR} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  New pull request
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg divide-y">
                {pullRequests.map(pr => (
                  <Link 
                    key={pr.id}
                    href={`/repositories/${params.owner}/${params.repo}/pull/${pr.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <GitPullRequest className={`h-4 w-4 ${
                          pr.status === 'open' ? 'text-green-500' :
                          pr.status === 'merged' ? 'text-purple-500' :
                          'text-red-500'
                        }`} />
                        <h3 className="font-medium">{pr.title}</h3>
                        <PullRequestStatusBadge status={pr.status} />
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-2">
                        #{pr.id.substring(0, 8)} opened by {pr.author} on {new Date(pr.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Source:</span>
                          <span>{pr.sourceBranch}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Target:</span>
                          <span>{pr.targetBranch}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
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