'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  Tag, 
  Hash, 
  Calendar, 
  User, 
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Save,
  PanelLeft,
  PanelRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BranchSelector } from './BranchSelector';

interface CommitNode {
  id: string;
  hash: string;
  message: string;
  author: string;
  date: string;
  parents: string[];
  branches?: string[];
  tags?: string[];
  isHead?: boolean;
  isRemote?: boolean;
}

interface BranchInfo {
  name: string;
  lastCommit: {
    hash: string;
    message: string;
    date: string;
  };
  isDefault?: boolean;
  protection?: {
    enabled: boolean;
    requiresPullRequest: boolean;
    requiredReviewers: number;
  };
}

interface TagInfo {
  name: string;
  commit: {
    hash: string;
    message: string;
    date: string;
  };
}

interface RepositoryVisualizationProps {
  repositoryOwner: string;
  repositoryName: string;
  commits: CommitNode[];
  branches: BranchInfo[];
  tags: TagInfo[];
  currentBranch: string;
  onChangeBranch: (branch: string) => void;
  onCreateBranch?: (name: string, fromBranch: string) => Promise<void>;
  onCreateTag?: (name: string, commitHash: string) => Promise<void>;
}

export function RepositoryVisualization({
  repositoryOwner,
  repositoryName,
  commits,
  branches,
  tags,
  currentBranch,
  onChangeBranch,
  onCreateBranch,
  onCreateTag
}: RepositoryVisualizationProps) {
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [detailsPanelVisible, setDetailsPanelVisible] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedCommit, setSelectedCommit] = useState<CommitNode | null>(null);
  const [graphWidth, setGraphWidth] = useState(800);
  
  // Find the currently selected commit or the HEAD commit by default
  useEffect(() => {
    if (!selectedCommit && commits.length > 0) {
      const headCommit = commits.find(c => c.isHead) || commits[0];
      setSelectedCommit(headCommit);
    }
  }, [commits, selectedCommit]);
  
  // Format date to readable format
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
  
  // Calculate relative time from date string
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
    
    return date.toLocaleDateString();
  };
  
  // Build the commit graph data structure for visualization
  const graphData = useMemo(() => {
    if (!commits.length) return [];
    
    // Create a mapping of commit hashes to their positions in the graph
    const commitMap = new Map<string, { commit: CommitNode, column: number, row: number }>();
    const columns: string[] = [];
    
    // Assign columns and rows to commits
    commits.forEach((commit, index) => {
      // Find a suitable column
      let column = 0;
      
      if (commit.parents.length > 0) {
        // Try to place in the same column as one of its parents
        for (const parentHash of commit.parents) {
          const parent = commitMap.get(parentHash);
          if (parent) {
            column = parent.column;
            break;
          }
        }
      }
      
      // If the column is already used at this row, find a free column
      while (columns[column] && columns[column] !== commit.hash) {
        column++;
      }
      
      // Update columns array
      columns[column] = commit.hash;
      
      // Add commit to the map
      commitMap.set(commit.hash, { commit, column, row: index });
    });
    
    // Build graph edges between commits and their parents
    const edges: { from: string, to: string, fromColumn: number, toColumn: number, fromRow: number, toRow: number }[] = [];
    
    commits.forEach(commit => {
      const source = commitMap.get(commit.hash);
      if (!source) return;
      
      commit.parents.forEach(parentHash => {
        const target = commitMap.get(parentHash);
        if (!target) return;
        
        edges.push({
          from: commit.hash,
          to: parentHash,
          fromColumn: source.column,
          toColumn: target.column,
          fromRow: source.row,
          toRow: target.row
        });
      });
    });
    
    return { nodes: Array.from(commitMap.values()), edges, maxColumn: Math.max(...Array.from(commitMap.values()).map(n => n.column)) };
  }, [commits]);
  
  // Find latest commit on the current branch
  const currentBranchCommit = useMemo(() => {
    const branchInfo = branches.find(b => b.name === currentBranch);
    if (!branchInfo) return null;
    
    return commits.find(c => c.hash === branchInfo.lastCommit.hash);
  }, [branches, currentBranch, commits]);
  
  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.2, 2));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.2, 0.5));
  };
  
  const handleResetZoom = () => {
    setZoomLevel(1);
  };
  
  const renderGraphNode = (node: { commit: CommitNode, column: number, row: number }) => {
    const { commit, column, row } = node;
    const isMergeCommit = commit.parents.length > 1;
    const isSelected = selectedCommit?.hash === commit.hash;
    
    const nodeSize = 18;
    const horizontalSpacing = 40;
    const verticalSpacing = 40;
    
    const x = column * horizontalSpacing * zoomLevel + horizontalSpacing;
    const y = row * verticalSpacing * zoomLevel + verticalSpacing;
    
    // Determine node color based on its properties
    let nodeColor = '#64748b'; // Default color
    let nodeShape = 'circle';
    
    if (commit.isHead) {
      nodeColor = '#0ea5e9'; // Blue for HEAD
    } else if (commit.branches && commit.branches.length > 0) {
      nodeColor = '#10b981'; // Green for branch pointers
    } else if (commit.tags && commit.tags.length > 0) {
      nodeColor = '#f59e0b'; // Yellow for tags
    } else if (isMergeCommit) {
      nodeColor = '#8b5cf6'; // Purple for merge commits
      nodeShape = 'diamond';
    }
    
    // Additional styling for selected node
    const selectedStyle = isSelected ? { stroke: '#3b82f6', strokeWidth: 2 } : {};
    
    return (
      <g 
        key={commit.hash} 
        transform={`translate(${x}, ${y})`}
        onClick={() => setSelectedCommit(commit)}
        style={{ cursor: 'pointer' }}
      >
        {/* Node */}
        {nodeShape === 'circle' ? (
          <circle
            r={nodeSize / 2}
            fill={nodeColor}
            {...selectedStyle}
          />
        ) : (
          <rect
            x={-nodeSize / 2}
            y={-nodeSize / 2}
            width={nodeSize}
            height={nodeSize}
            transform="rotate(45)"
            fill={nodeColor}
            {...selectedStyle}
          />
        )}
        
        {/* Commit message */}
        <text
          x={nodeSize}
          y={5}
          fontSize={12 * zoomLevel}
          fill="#374151"
          className="select-none"
        >
          {commit.message.length > 50 ? `${commit.message.substring(0, 47)}...` : commit.message}
        </text>
        
        {/* Branch and tag labels */}
        <g transform={`translate(${nodeSize + 8}, -14)`}>
          {commit.branches && commit.branches.map((branch, i) => (
            <g key={branch} transform={`translate(0, ${i * -20})`}>
              <rect
                x={0}
                y={-10}
                width={branch.length * 7 + 20}
                height={18}
                rx={9}
                fill={branch === currentBranch ? '#10b981' : '#d1fae5'}
                stroke={branch === currentBranch ? '#059669' : '#10b981'}
                strokeWidth={1}
              />
              <text
                x={10}
                y={4}
                fontSize={11}
                fill={branch === currentBranch ? 'white' : '#047857'}
                className="select-none"
              >
                {branch}
              </text>
            </g>
          ))}
          
          {commit.tags && commit.tags.map((tag, i) => (
            <g key={tag} transform={`translate(0, ${(commit.branches?.length || 0) * -20 + i * -20})`}>
              <rect
                x={0}
                y={-10}
                width={tag.length * 7 + 20}
                height={18}
                rx={9}
                fill="#fef3c7"
                stroke="#f59e0b"
                strokeWidth={1}
              />
              <text
                x={10}
                y={4}
                fontSize={11}
                fill="#b45309"
                className="select-none"
              >
                {tag}
              </text>
            </g>
          ))}
        </g>
      </g>
    );
  };
  
  const renderGraphEdge = (edge: { fromColumn: number, toColumn: number, fromRow: number, toRow: number }) => {
    const { fromColumn, toColumn, fromRow, toRow } = edge;
    
    const horizontalSpacing = 40;
    const verticalSpacing = 40;
    
    const x1 = fromColumn * horizontalSpacing * zoomLevel + horizontalSpacing;
    const y1 = fromRow * verticalSpacing * zoomLevel + verticalSpacing;
    const x2 = toColumn * horizontalSpacing * zoomLevel + horizontalSpacing;
    const y2 = toRow * verticalSpacing * zoomLevel + verticalSpacing;
    
    // For edges that span across columns, create a curved path
    if (fromColumn !== toColumn) {
      const midY = (y1 + y2) / 2;
      return (
        <path
          d={`M${x1} ${y1} C${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
          stroke="#cbd5e1"
          strokeWidth={1.5}
          fill="none"
        />
      );
    }
    
    // For straight edges, just draw a line
    return (
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#cbd5e1"
        strokeWidth={1.5}
      />
    );
  };
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-3 border-b">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <BranchSelector
              currentBranch={currentBranch}
              branches={branches}
              tags={tags}
              onChangeBranch={onChangeBranch}
              onCreateBranch={onCreateBranch}
              onCreateTag={onCreateTag}
              recentBranches={['main', 'develop', 'feature/new-ui'].filter(
                b => branches.some(branch => branch.name === b)
              )}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Tabs defaultValue={viewMode} onValueChange={(v) => setViewMode(v as 'graph' | 'list')}>
              <TabsList className="h-9">
                <TabsTrigger value="graph" className="px-3 h-7">
                  <GitBranch className="h-4 w-4 mr-1" />
                  Graph
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3 h-7">
                  <GitCommit className="h-4 w-4 mr-1" />
                  Commits
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-1 bg-gray-200 rounded-md p-0.5 h-9">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Zoom out</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleResetZoom}>
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Reset zoom</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Zoom in</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setDetailsPanelVisible(!detailsPanelVisible)}
                    >
                      {detailsPanelVisible ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {detailsPanelVisible ? 'Hide details panel' : 'Show details panel'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`flex ${detailsPanelVisible ? 'flex-col md:flex-row' : 'flex-col'}`}>
        {/* Graph/List View */}
        <div className={`${detailsPanelVisible ? 'md:w-2/3' : 'w-full'} overflow-auto`}>
          {viewMode === 'graph' && graphData.nodes?.length > 0 && (
            <div 
              className="p-4 overflow-auto" 
              style={{ maxHeight: '60vh', minHeight: '400px' }}
            >
              <svg 
                width={Math.max(600, (graphData.maxColumn + 2) * 40 * zoomLevel + 300)} 
                height={Math.max(600, graphData.nodes.length * 40 * zoomLevel + 100)}
              >
                {/* Draw edges first (so they're behind the nodes) */}
                {graphData.edges?.map((edge, i) => (
                  <g key={`edge-${i}`}>{renderGraphEdge(edge)}</g>
                ))}
                
                {/* Then draw nodes */}
                {graphData.nodes?.map(node => renderGraphNode(node))}
              </svg>
            </div>
          )}
          
          {viewMode === 'list' && (
            <div className="divide-y">
              {commits.map(commit => (
                <div 
                  key={commit.hash}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedCommit?.hash === commit.hash ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedCommit(commit)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3 className="font-medium">{commit.message}</h3>
                    <div className="text-sm text-gray-500">
                      {getRelativeTime(commit.date)}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{commit.author}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      <code>{commit.hash.substring(0, 7)}</code>
                    </div>
                    
                    {commit.branches && commit.branches.length > 0 && (
                      <div className="flex items-center gap-1">
                        <GitBranch className="h-4 w-4" />
                        <div className="flex gap-1">
                          {commit.branches.map(branch => (
                            <Badge key={branch} variant="outline" className={branch === currentBranch ? 'bg-green-100' : ''}>
                              {branch}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {commit.tags && commit.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        <div className="flex gap-1">
                          {commit.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="bg-amber-50">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Details Panel */}
        {detailsPanelVisible && selectedCommit && (
          <div className={`${detailsPanelVisible ? 'md:w-1/3' : 'w-full'} border-t md:border-t-0 md:border-l`}>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <h2 className="text-xl font-semibold mb-2">{selectedCommit.message}</h2>
                <div className="flex flex-wrap gap-3">
                  {selectedCommit.branches?.map(branch => (
                    <Badge key={branch} className="bg-green-100 text-green-800 hover:bg-green-200">
                      <GitBranch className="h-3 w-3 mr-1" />
                      {branch}
                    </Badge>
                  ))}
                  
                  {selectedCommit.tags?.map(tag => (
                    <Badge key={tag} className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Author</div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{selectedCommit.author}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(selectedCommit.date)}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Commit</div>
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <code className="text-sm bg-gray-100 px-1 py-0.5 rounded">
                      {selectedCommit.hash}
                    </code>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">Parents</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCommit.parents.map(parent => (
                      <code key={parent} className="text-sm bg-gray-100 px-1 py-0.5 rounded">
                        {parent.substring(0, 7)}
                      </code>
                    ))}
                    {selectedCommit.parents.length > 1 && (
                      <Badge className="bg-purple-100 text-purple-800">
                        <GitMerge className="h-3 w-3 mr-1" />
                        Merge commit
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Commit details</h3>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">View Files</Button>
                    <Button variant="outline" size="sm">View Diff</Button>
                  </div>
                </div>
                
                {/* Placeholder for commit details/file changes */}
                <div className="bg-gray-50 border rounded-lg p-3 text-sm text-gray-500">
                  Commit details and file changes will be displayed here
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" size="sm" disabled={!commits[commits.findIndex(c => c.hash === selectedCommit.hash) + 1]}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Older
                </Button>
                <Button variant="outline" size="sm" disabled={!commits[commits.findIndex(c => c.hash === selectedCommit.hash) - 1]}>
                  Newer
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}