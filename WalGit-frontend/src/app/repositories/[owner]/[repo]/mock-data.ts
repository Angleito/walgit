// This file contains mock data for the enhanced repository page

// Mock repository data
export const mockRepoData = {
  id: "repo-123456",
  name: "walgit-core",
  description: "Core functionality for the WalGit decentralized version control system",
  language: "Move",
  languageColor: "#6e5494",
  stars: 42,
  forks: 12,
  watchers: 8,
  issues: 5,
  pullRequests: 3,
  owner: "walrus-dev",
  defaultBranch: "main",
  license: "MIT",
  lastCommit: {
    hash: "a1b2c3d4e5f6",
    message: "Update README.md",
    author: "walrus-dev",
    date: "2025-04-05T10:30:00Z"
  },
  files: [
    { name: "sources", type: "directory", lastCommit: "Initial commit", updatedAt: "2025-04-03T14:30:00Z" },
    { name: "tests", type: "directory", lastCommit: "Add unit tests", updatedAt: "2025-04-03T14:30:00Z" },
    { name: "Move.toml", type: "file", lastCommit: "Update dependencies", updatedAt: "2025-04-04T09:15:00Z" },
    { name: "README.md", type: "file", lastCommit: "Update documentation", updatedAt: "2025-04-05T10:30:00Z" },
    { name: "LICENSE", type: "file", lastCommit: "Initial commit", updatedAt: "2025-04-01T09:45:00Z" },
  ],
};

// Mock branch data
export const mockBranches = [
  {
    name: "main",
    lastCommit: {
      hash: "a1b2c3d4e5f6",
      message: "Update README.md",
      date: "2025-04-05T10:30:00Z"
    },
    isDefault: true,
    protection: {
      enabled: true,
      requiresPullRequest: true,
      requiredReviewers: 1
    }
  },
  {
    name: "develop",
    lastCommit: {
      hash: "b2c3d4e5f6a1",
      message: "Implement optimized storage",
      date: "2025-04-02T15:20:00Z"
    },
    protection: {
      enabled: false,
      requiresPullRequest: false,
      requiredReviewers: 0
    }
  },
  {
    name: "feature/ui-updates",
    lastCommit: {
      hash: "c3d4e5f6a1b2",
      message: "Add dark mode support",
      date: "2025-04-04T09:45:00Z"
    }
  },
  {
    name: "feature/storage-optimization",
    lastCommit: {
      hash: "d4e5f6a1b2c3",
      message: "Implement changeset-based storage",
      date: "2025-04-01T11:25:00Z"
    }
  }
];

// Mock tag data
export const mockTags = [
  {
    name: "v1.0.0",
    commit: {
      hash: "e5f6a1b2c3d4",
      message: "Initial release",
      date: "2025-03-15T08:30:00Z"
    }
  },
  {
    name: "v1.1.0",
    commit: {
      hash: "f6a1b2c3d4e5",
      message: "Add storage optimization",
      date: "2025-03-28T14:20:00Z"
    }
  }
];

// Mock commits data
export const mockCommits = [
  {
    id: "commit-1",
    hash: "a1b2c3d4e5f6",
    message: "Update README.md",
    author: "walrus-dev",
    date: "2025-04-05T10:30:00Z",
    parents: ["b2c3d4e5f6a1"],
    branches: ["main"],
    isHead: true
  },
  {
    id: "commit-2",
    hash: "b2c3d4e5f6a1",
    message: "Implement optimized storage",
    author: "developer-1",
    date: "2025-04-02T15:20:00Z",
    parents: ["g7h8i9j0k1l2"],
    branches: ["develop"]
  },
  {
    id: "commit-3",
    hash: "c3d4e5f6a1b2",
    message: "Add dark mode support",
    author: "developer-2",
    date: "2025-04-04T09:45:00Z",
    parents: ["g7h8i9j0k1l2"],
    branches: ["feature/ui-updates"]
  },
  {
    id: "commit-4",
    hash: "d4e5f6a1b2c3",
    message: "Implement changeset-based storage",
    author: "developer-3",
    date: "2025-04-01T11:25:00Z",
    parents: ["g7h8i9j0k1l2"],
    branches: ["feature/storage-optimization"]
  },
  {
    id: "commit-5",
    hash: "g7h8i9j0k1l2",
    message: "Merge pull request #2",
    author: "walrus-dev",
    date: "2025-03-29T16:45:00Z",
    parents: ["e5f6a1b2c3d4", "h8i9j0k1l2m3"],
  },
  {
    id: "commit-6",
    hash: "e5f6a1b2c3d4",
    message: "Initial release",
    author: "walrus-dev",
    date: "2025-03-15T08:30:00Z",
    parents: [],
    tags: ["v1.0.0"]
  },
  {
    id: "commit-7",
    hash: "f6a1b2c3d4e5",
    message: "Add storage optimization",
    author: "developer-1",
    date: "2025-03-28T14:20:00Z",
    parents: ["e5f6a1b2c3d4"],
    tags: ["v1.1.0"]
  },
  {
    id: "commit-8",
    hash: "h8i9j0k1l2m3",
    message: "Fix critical bug in storage module",
    author: "developer-3",
    date: "2025-03-25T09:10:00Z",
    parents: ["f6a1b2c3d4e5"]
  }
];

// Mock pull request data 
export const mockPullRequests = [
  {
    id: "pull_request_1",
    title: "Implement changeset-based storage",
    description: "This PR implements a new changeset-based storage model inspired by JJ (Jujutsu) version control. This approach optimizes for blockchain storage and transaction costs.",
    status: "open",
    author: "0x123456789abcdef",
    sourceBranch: "feature/changeset-storage",
    targetBranch: "main",
    createdAt: "2025-04-03T09:30:00Z",
    lastUpdated: "2025-04-05T11:15:00Z",
    reviews: [
      {
        id: "review_1",
        reviewer: "0xabcdef1234567890",
        verdict: "approve",
        comment: "This looks great! The changeset approach is much more efficient for on-chain storage.",
        timestamp: "2025-04-04T14:22:00Z"
      }
    ],
    comments: [
      {
        id: "comment_1",
        author: "0xfedcba9876543210",
        content: "Have you considered how this affects the gas usage during complex merges?",
        timestamp: "2025-04-04T10:11:00Z"
      },
      {
        id: "comment_2",
        author: "0x123456789abcdef",
        content: "Yes, I added gas optimizations for merge operations. The PR includes benchmarks showing 30% reduction in gas costs.",
        timestamp: "2025-04-04T10:30:00Z"
      }
    ],
    mergeableStatus: {
      canMerge: true
    },
    diffStats: {
      filesChanged: 8,
      insertions: 345,
      deletions: 123
    }
  },
  {
    id: "pull_request_2",
    title: "Add branch protection rules",
    description: "Implements branch protection rules to control who can push to specific branches. This provides security for important branches like main.",
    status: "open",
    author: "0xfedcba9876543210",
    sourceBranch: "feature/branch-protection",
    targetBranch: "main",
    createdAt: "2025-04-02T15:45:00Z",
    mergeableStatus: {
      canMerge: false,
      reason: "Requires approval from at least one reviewer"
    },
    diffStats: {
      filesChanged: 3,
      insertions: 112,
      deletions: 15
    }
  },
  {
    id: "pull_request_3",
    title: "Optimize Walrus storage integration",
    description: "Improves the integration with Walrus storage to reduce transaction costs and improve performance.",
    status: "merged",
    author: "0xabcdef1234567890",
    sourceBranch: "feature/walrus-optimization",
    targetBranch: "main",
    createdAt: "2025-03-28T08:15:00Z",
    mergedAt: "2025-04-01T09:30:00Z",
    mergedBy: "0x123456789abcdef",
    diffStats: {
      filesChanged: 5,
      insertions: 87,
      deletions: 42
    }
  }
];

// Mock diff hunks for the example diff view
export const mockDiffHunks = [
  {
    oldStart: 15,
    oldLines: 7,
    newStart: 15,
    newLines: 10,
    lines: [
      { type: 'unchanged', content: 'import { cn } from "@/lib/utils";', oldLineNumber: 15, newLineNumber: 15 },
      { type: 'unchanged', content: '', oldLineNumber: 16, newLineNumber: 16 },
      { type: 'unchanged', content: 'export interface ButtonProps', oldLineNumber: 17, newLineNumber: 17 },
      { type: 'removed', content: '  extends React.ButtonHTMLAttributes<HTMLButtonElement> {', oldLineNumber: 18 },
      { type: 'added', content: '  extends React.ButtonHTMLAttributes<HTMLButtonElement>,', newLineNumber: 18 },
      { type: 'added', content: '    VariantProps<typeof buttonVariants> {', newLineNumber: 19 },
      { type: 'added', content: '    isLoading?: boolean;', newLineNumber: 20 },
      { type: 'added', content: '    leftIcon?: React.ReactNode;', newLineNumber: 21 },
      { type: 'added', content: '    rightIcon?: React.ReactNode;', newLineNumber: 22 },
      { type: 'unchanged', content: '  className?: string;', oldLineNumber: 19, newLineNumber: 23 },
      { type: 'unchanged', content: '}', oldLineNumber: 20, newLineNumber: 24 },
      { type: 'unchanged', content: '', oldLineNumber: 21, newLineNumber: 25 }
    ]
  },
  {
    oldStart: 35,
    oldLines: 4,
    newStart: 40,
    newLines: 11,
    lines: [
      { type: 'unchanged', content: 'export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(', oldLineNumber: 35, newLineNumber: 40 },
      { type: 'unchanged', content: '  ({ className, ...props }, ref) => {', oldLineNumber: 36, newLineNumber: 41 },
      { type: 'removed', content: '    return (', oldLineNumber: 37 },
      { type: 'removed', content: '      <button className={cn(buttonVariants(), className)} ref={ref} {...props} />', oldLineNumber: 38 },
      { type: 'added', content: '    const { variant, size, isLoading, leftIcon, rightIcon, ...rest } = props;', newLineNumber: 42 },
      { type: 'added', content: '    return (', newLineNumber: 43 },
      { type: 'added', content: '      <button', newLineNumber: 44 },
      { type: 'added', content: '        className={cn(buttonVariants({ variant, size }), className)}', newLineNumber: 45 },
      { type: 'added', content: '        ref={ref}', newLineNumber: 46 },
      { type: 'added', content: '        disabled={props.disabled || isLoading}', newLineNumber: 47 },
      { type: 'added', content: '        {...rest}', newLineNumber: 48 },
      { type: 'added', content: '      >', newLineNumber: 49 },
      { type: 'added', content: '        {isLoading && <Spinner className="mr-2 h-4 w-4" />}', newLineNumber: 50 },
      { type: 'added', content: '        {!isLoading && leftIcon && <div className="mr-2">{leftIcon}</div>}', newLineNumber: 51 },
      { type: 'added', content: '        {props.children}', newLineNumber: 52 },
      { type: 'added', content: '        {!isLoading && rightIcon && <div className="ml-2">{rightIcon}</div>}', newLineNumber: 53 },
      { type: 'added', content: '      </button>', newLineNumber: 54 },
      { type: 'unchanged', content: '    );', oldLineNumber: 39, newLineNumber: 55 },
    ]
  }
];

// Mock comment threads for the example diff view
export const mockThreads = [
  {
    id: "thread_1",
    lineNumber: 20,
    status: 'open',
    comments: [
      {
        id: "comment_1",
        author: "dev-1",
        content: "Adding loading state is a great improvement, this will make it easier to show feedback during async operations.",
        timestamp: "2025-04-02T09:15:00Z",
        filePath: "src/components/ui/button.tsx",
        lineNumber: 20
      },
      {
        id: "comment_2",
        author: "dev-2",
        content: "Agreed! We should also consider adding transition animations when the loading state changes.",
        timestamp: "2025-04-02T09:30:00Z",
        filePath: "src/components/ui/button.tsx",
        lineNumber: 20
      }
    ]
  },
  {
    id: "thread_2",
    lineNumber: 50,
    status: 'open',
    comments: [
      {
        id: "comment_3",
        author: "dev-3",
        content: "Where is the Spinner component imported from? We should make sure it's consistent with our other loading indicators.",
        timestamp: "2025-04-02T10:15:00Z",
        filePath: "src/components/ui/button.tsx",
        lineNumber: 50
      }
    ]
  }
];