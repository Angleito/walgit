import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitPullRequest, Plus, ArrowRight } from "lucide-react";
import { PullRequest, PullRequestStatus } from "@/types/pull-request";

interface PullRequestsListProps {
  repositoryOwner: string;
  repositoryName: string;
  pullRequests: PullRequest[];
  isLoading?: boolean;
}

/**
 * Component to display a list of pull requests on the repository detail page
 */
export function PullRequestsList({ 
  repositoryOwner, 
  repositoryName, 
  pullRequests, 
  isLoading = false 
}: PullRequestsListProps) {
  // Filter only open PRs for the preview
  const openPullRequests = pullRequests.filter(pr => pr.status === 'open');
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Pull Requests
          </CardTitle>
          <CardDescription>
            Recent pull requests for this repository
          </CardDescription>
        </div>
        <Link href={`/repositories/${repositoryOwner}/${repositoryName}/pulls/new`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ) : openPullRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GitPullRequest className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm mb-4">No open pull requests</p>
            <Link href={`/repositories/${repositoryOwner}/${repositoryName}/pulls/new`}>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Create pull request
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {openPullRequests.slice(0, 5).map((pr) => (
              <Link 
                key={pr.id} 
                href={`/repositories/${repositoryOwner}/${repositoryName}/pull/${pr.id}`}
                className="block"
              >
                <div className="flex items-start justify-between border p-3 rounded-md hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex gap-2">
                    <GitPullRequest className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium line-clamp-1">{pr.title}</div>
                      <div className="text-sm text-gray-500">
                        #{pr.id.substring(0, 8)} opened by {pr.author}
                      </div>
                    </div>
                  </div>
                  <PullRequestStatusBadge status={pr.status} />
                </div>
              </Link>
            ))}
            
            {openPullRequests.length > 5 && (
              <Link 
                href={`/repositories/${repositoryOwner}/${repositoryName}/pulls`}
                className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-2"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>View all {openPullRequests.length} pull requests</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            )}
          </div>
        )}
        
        <div className="mt-4">
          <Link href={`/repositories/${repositoryOwner}/${repositoryName}/pulls`}>
            <Button variant="outline" className="w-full">
              View all pull requests
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
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