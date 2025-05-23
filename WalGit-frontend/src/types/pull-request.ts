/**
 * Types for Pull Request functionality
 */

export type PullRequestStatus = 'open' | 'closed' | 'merged' | 'draft';

export type PullRequestReviewVerdict = 'approve' | 'request_changes' | 'comment';

export interface PullRequestReview {
  id: string;
  reviewer: string;
  verdict: PullRequestReviewVerdict;
  comment: string;
  timestamp: string;
}

export interface PullRequestComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  filePath?: string;
  lineNumber?: number;
}

export interface PullRequestCommit {
  id: string;
  message: string;
  author: string;
  date: string;
  hash: string;
}

export interface PullRequestDiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface PullRequestMergeableStatus {
  canMerge: boolean;
  reason?: string;
}

export interface PullRequest {
  id: string;
  title: string;
  description?: string;
  status: PullRequestStatus;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  createdAt: string;
  lastUpdated?: string;
  mergedAt?: string;
  mergedBy?: string;
  reviews?: PullRequestReview[];
  comments?: PullRequestComment[];
  commits?: PullRequestCommit[];
  diffStats?: PullRequestDiffStats;
  mergeableStatus?: PullRequestMergeableStatus;
}

export interface CreatePullRequestInput {
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  isDraft?: boolean;
}

export interface UpdatePullRequestInput {
  title?: string;
  description?: string;
  status?: PullRequestStatus;
}

export interface PullRequestReviewInput {
  verdict: PullRequestReviewVerdict;
  comment: string;
}

export interface PullRequestCommentInput {
  content: string;
  filePath?: string;
  lineNumber?: number;
}

export interface PullRequestMergeInput {
  strategy: 'merge' | 'squash' | 'rebase';
  commitMessage?: string;
}