'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from "@/lib/utils";

interface CommitNode {
  id: string;
  hash: string;
  parents: string[];
  children: string[];
  branch?: string;
  refs?: { name: string; type: 'branch' | 'tag' }[];
}

interface CommitGraphProps {
  commits: CommitNode[];
  branches?: string[];
  width?: number;
  height?: number;
  nodeRadius?: number;
  rowHeight?: number;
  className?: string;
}

export function CommitGraph({
  commits,
  branches = [],
  width = 200,
  height = 400,
  nodeRadius = 4,
  rowHeight = 30,
  className
}: CommitGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate branch lanes
  const branchLanes = useMemo(() => {
    const lanes = new Map<string, number>();
    let laneIndex = 0;

    // Simple lane assignment (can be improved for complex graphs)
    commits.forEach(commit => {
      if (commit.branch && !lanes.has(commit.branch)) {
        lanes.set(commit.branch, laneIndex++);
      }
    });

    return lanes;
  }, [commits]);

  // Get branch colors
  const getBranchColor = useCallback((branchName?: string): string => {
    const colors = [
      '#1f6feb', // Blue
      '#3fb950', // Green
      '#f85149', // Red
      '#a371f7', // Purple
      '#f9826c', // Orange
      '#56d364', // Light green
      '#db6d28', // Dark orange
      '#58a6ff', // Light blue
    ];

    if (!branchName) return colors[0];
    
    const index = Array.from(branchLanes.keys()).indexOf(branchName);
    return colors[index % colors.length];
  }, [branchLanes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = Math.max(height, commits.length * rowHeight + 20);

    // Clear canvas
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create position map
    const positions = new Map<string, { x: number; y: number; color: string }>();
    commits.forEach((commit, index) => {
      const lane = commit.branch ? branchLanes.get(commit.branch) || 0 : 0;
      const x = 20 + lane * 30;
      const y = 20 + index * rowHeight;
      const color = getBranchColor(commit.branch);
      positions.set(commit.id, { x, y, color });
    });

    // Draw connections
    commits.forEach((commit) => {
      const pos = positions.get(commit.id);
      if (!pos) return;

      // Draw lines to children
      commit.children.forEach(childId => {
        const childPos = positions.get(childId);
        if (!childPos) return;

        ctx.beginPath();
        ctx.strokeStyle = pos.color;
        ctx.lineWidth = 2;

        if (pos.x === childPos.x) {
          // Straight line
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(childPos.x, childPos.y);
        } else {
          // Curved line for branch merges
          ctx.moveTo(pos.x, pos.y);
          ctx.bezierCurveTo(
            pos.x, pos.y + rowHeight / 2,
            childPos.x, childPos.y - rowHeight / 2,
            childPos.x, childPos.y
          );
        }
        ctx.stroke();
      });
    });

    // Draw nodes
    commits.forEach((commit) => {
      const pos = positions.get(commit.id);
      if (!pos) return;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = pos.color;
      ctx.fill();
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Highlight if has refs
      if (commit.refs && commit.refs.length > 0) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius + 3, 0, 2 * Math.PI);
        ctx.strokeStyle = pos.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw branch labels
    Array.from(branchLanes.entries()).forEach(([branch, lane]) => {
      const x = 20 + lane * 30;
      const y = 10;

      ctx.fillStyle = getBranchColor(branch);
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(branch, x, y);
    });

  }, [commits, branchLanes, width, height, nodeRadius, rowHeight, getBranchColor]);

  return (
    <div 
      className={cn("overflow-auto", className)}
      role="img"
      aria-label={`Commit graph showing ${commits.length} commits`}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{ imageRendering: 'crisp-edges' }}
        aria-hidden="true"
      />
      {/* Accessibility description for screen readers */}
      <div className="sr-only">
        <h3>Commit Graph</h3>
        <p>Visual representation of {commits.length} commits across {branches.length} branches.</p>
        <ol>
          {commits.map((commit, index) => (
            <li key={commit.id}>
              Commit {index + 1}: {commit.hash.slice(0, 7)} on branch {commit.branch || 'unknown'}
              {commit.parents.length > 0 && (
                <span>, parents: {commit.parents.map(p => p.slice(0, 7)).join(', ')}</span>
              )}
              {commit.refs && commit.refs.length > 0 && (
                <span>, references: {commit.refs.map(r => `${r.type} ${r.name}`).join(', ')}</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}