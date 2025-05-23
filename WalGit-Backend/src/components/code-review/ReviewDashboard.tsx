'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  GitPullRequest, 
  MessageSquare, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Code, 
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PullRequestReviewVerdict, PullRequest } from '@/types/pull-request';

interface ReviewDashboardProps {
  pullRequests: PullRequest[];
  onSelectPullRequest: (pullRequestId: string) => void;
  onFilterChange?: (filter: 'all' | 'needs_review' | 'reviewed_by_me' | 'changes_requested') => void;
  currentUserWallet?: string;
}

/**
 * Dashboard for viewing and managing code reviews
 */
export function ReviewDashboard({
  pullRequests,
  onSelectPullRequest,
  onFilterChange,
  currentUserWallet = ''
}: ReviewDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'needs_review' | 'reviewed_by_me' | 'changes_requested'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'review_count' | 'oldest'>('recent');

  // Apply filters and sorting
  const filteredPRs = pullRequests.filter(pr => {
    if (filter === 'all') return true;
    
    if (filter === 'needs_review') {
      return pr.status === 'open' && 
        (!pr.reviews || pr.reviews.length === 0 || 
          !pr.reviews.some(r => r.reviewer === currentUserWallet));
    }
    
    if (filter === 'reviewed_by_me') {
      return pr.reviews && pr.reviews.some(r => r.reviewer === currentUserWallet);
    }
    
    if (filter === 'changes_requested') {
      return pr.reviews && pr.reviews.some(r => r.verdict === 'request_changes');
    }
    
    return true;
  });
  
  // Sort the filtered PRs
  const sortedPRs = [...filteredPRs].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    
    if (sortBy === 'review_count') {
      const aCount = a.reviews?.length || 0;
      const bCount = b.reviews?.length || 0;
      return bCount - aCount;
    }
    
    return 0;
  });

  // Calculate PR review stats
  const calculateReviewStats = (pr: PullRequest) => {
    const totalReviews = pr.reviews?.length || 0;
    const approvals = pr.reviews?.filter(r => r.verdict === 'approve').length || 0;
    const changeRequests = pr.reviews?.filter(r => r.verdict === 'request_changes').length || 0;
    const comments = pr.reviews?.filter(r => r.verdict === 'comment').length || 0;
    
    const hasBeenReviewedByCurrentUser = pr.reviews?.some(r => r.reviewer === currentUserWallet) || false;
    const currentUserVerdict = pr.reviews?.find(r => r.reviewer === currentUserWallet)?.verdict || null;
    
    return {
      totalReviews,
      approvals,
      changeRequests,
      comments,
      hasBeenReviewedByCurrentUser,
      currentUserVerdict
    };
  };

  // Format timestamp to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  // Handle filter change
  const handleFilterChange = (newFilter: 'all' | 'needs_review' | 'reviewed_by_me' | 'changes_requested') => {
    setFilter(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Code className="h-5 w-5" />
          <span>Code Reviews</span>
        </h2>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleFilterChange('all')} 
                className={filter === 'all' ? 'bg-blue-50' : ''}
              >
                <GitPullRequest className="h-4 w-4 mr-2" />
                <span>All Pull Requests</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleFilterChange('needs_review')} 
                className={filter === 'needs_review' ? 'bg-blue-50' : ''}
              >
                <Clock className="h-4 w-4 mr-2" />
                <span>Needs My Review</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleFilterChange('reviewed_by_me')} 
                className={filter === 'reviewed_by_me' ? 'bg-blue-50' : ''}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>Reviewed By Me</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleFilterChange('changes_requested')} 
                className={filter === 'changes_requested' ? 'bg-blue-50' : ''}
              >
                <XCircle className="h-4 w-4 mr-2" />
                <span>Changes Requested</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setSortBy('recent')}>
                <span className="mr-2">Sort:</span> Most Recent
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                <span className="mr-2">Sort:</span> Oldest First
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => setSortBy('review_count')}>
                <span className="mr-2">Sort:</span> Most Reviewed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Review metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-blue-600">
              <Clock className="h-4 w-4 mr-2" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pullRequests.filter(pr => 
                pr.status === 'open' && 
                (!pr.reviews || !pr.reviews.some(r => r.reviewer === currentUserWallet))
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pull requests waiting for your review</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pullRequests.filter(pr => 
                pr.reviews && pr.reviews.some(r => 
                  r.reviewer === currentUserWallet && r.verdict === 'approve'
                )
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pull requests you've approved</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center text-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              Changes Requested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pullRequests.filter(pr => 
                pr.reviews && pr.reviews.some(r => 
                  r.reviewer === currentUserWallet && r.verdict === 'request_changes'
                )
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pull requests where you requested changes</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Pull request list */}
      <div className="space-y-4">
        {sortedPRs.length > 0 ? (
          sortedPRs.map(pr => {
            const stats = calculateReviewStats(pr);
            
            return (
              <Card 
                key={pr.id} 
                className="hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => onSelectPullRequest(pr.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <GitPullRequest className="h-5 w-5 text-blue-500 mt-1" />
                      
                      <div>
                        <h3 className="font-medium text-lg">{pr.title}</h3>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span>
                            {pr.sourceBranch} → {pr.targetBranch}
                          </span>
                          <span>•</span>
                          <span>
                            {pr.diffStats?.filesChanged || 0} files changed
                          </span>
                          <span>•</span>
                          <span>
                            {formatRelativeTime(pr.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {stats.hasBeenReviewedByCurrentUser && stats.currentUserVerdict && (
                        <Badge
                          className={`${
                            stats.currentUserVerdict === 'approve' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : stats.currentUserVerdict === 'request_changes'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {stats.currentUserVerdict === 'approve' && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {stats.currentUserVerdict === 'request_changes' && (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {stats.currentUserVerdict === 'comment' && (
                            <MessageSquare className="h-3 w-3 mr-1" />
                          )}
                          {stats.currentUserVerdict === 'approve' 
                            ? 'You approved' 
                            : stats.currentUserVerdict === 'request_changes'
                            ? 'You requested changes'
                            : 'You commented'}
                        </Badge>
                      )}
                      
                      {!stats.hasBeenReviewedByCurrentUser && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Needs your review
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-500">Review progress</span>
                      <span className="text-xs text-gray-500">
                        {stats.approvals} approvals, {stats.changeRequests} change requests
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Progress 
                        value={stats.approvals > 0 ? (stats.approvals / (stats.approvals + stats.changeRequests || 1)) * 100 : 0} 
                        className="h-2"
                      />
                      
                      <div className="flex -space-x-2">
                        {pr.reviews && pr.reviews.slice(0, 3).map(review => (
                          <Avatar key={review.id} className="h-6 w-6 border-2 border-white">
                            <AvatarFallback className="text-xs">
                              {review.reviewer.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        
                        {(pr.reviews?.length || 0) > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                            +{pr.reviews!.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8 border rounded-lg">
            <GitPullRequest className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-500">No pull requests found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' 
                ? 'There are no pull requests to review'
                : `No pull requests matching the "${filter}" filter`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}