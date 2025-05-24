'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { File, FileCode, Plus, Minus, GitBranch } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface FileDiff {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  lines: DiffLine[];
  oldPath?: string;
  newPath?: string;
}

interface DiffViewerProps {
  diffs: FileDiff[];
  viewMode?: 'split' | 'unified';
  onViewModeChange?: (mode: 'split' | 'unified') => void;
  className?: string;
}

export function DiffViewer({
  diffs,
  viewMode = 'unified',
  onViewModeChange,
  className
}: DiffViewerProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(diffs.map(d => d.filename))
  );
  const [focusedFileIndex, setFocusedFileIndex] = useState(0);
  const [focusedLineIndex, setFocusedLineIndex] = useState(0);
  const [isKeyboardNavigationActive, setIsKeyboardNavigationActive] = useState(false);
  const diffContainerRef = useRef<HTMLDivElement>(null);

  const toggleFileExpansion = useCallback((filename: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedFiles(newExpanded);
  }, [expandedFiles]);

  // Keyboard navigation handler
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Activate keyboard navigation on first key press
    if (!isKeyboardNavigationActive && (e.key === 'j' || e.key === 'k' || e.key === 'n' || e.key === 'p')) {
      setIsKeyboardNavigationActive(true);
    }

    if (!isKeyboardNavigationActive) return;

    switch (e.key) {
      case 'j': // Next line
      case 'ArrowDown':
        e.preventDefault();
        setFocusedLineIndex(prev => {
          const currentFile = diffs[focusedFileIndex];
          if (currentFile && prev < currentFile.lines.length - 1) {
            return prev + 1;
          }
          return prev;
        });
        break;

      case 'k': // Previous line
      case 'ArrowUp':
        e.preventDefault();
        setFocusedLineIndex(prev => Math.max(0, prev - 1));
        break;

      case 'n': // Next file
        e.preventDefault();
        if (focusedFileIndex < diffs.length - 1) {
          setFocusedFileIndex(prev => prev + 1);
          setFocusedLineIndex(0);
        }
        break;

      case 'p': // Previous file
        e.preventDefault();
        if (focusedFileIndex > 0) {
          setFocusedFileIndex(prev => prev - 1);
          setFocusedLineIndex(0);
        }
        break;

      case 'x': // Toggle file expansion
        e.preventDefault();
        toggleFileExpansion(diffs[focusedFileIndex].filename);
        break;

      case 'Escape': // Exit keyboard navigation
        setIsKeyboardNavigationActive(false);
        break;

      case '?': // Show keyboard shortcuts
        e.preventDefault();
        alert(
          'Keyboard Navigation:\n' +
          'j/↓ - Next line\n' +
          'k/↑ - Previous line\n' +
          'n - Next file\n' +
          'p - Previous file\n' +
          'x - Toggle file expansion\n' +
          'Esc - Exit keyboard navigation\n' +
          '? - Show this help'
        );
        break;
    }
  }, [diffs, focusedFileIndex, isKeyboardNavigationActive, toggleFileExpansion]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const getFileIcon = (status: FileDiff['status']) => {
    switch (status) {
      case 'added':
        return <Plus size={16} className="text-[#3fb950]" />;
      case 'deleted':
        return <Minus size={16} className="text-[#f85149]" />;
      case 'renamed':
        return <GitBranch size={16} className="text-[#a371f7]" />;
      default:
        return <FileCode size={16} className="text-[#8b949e]" />;
    }
  };

  const renderUnifiedDiff = (lines: DiffLine[], fileIndex: number) => {
    return (
      <div className="font-mono text-sm">
        {lines.map((line, index) => {
          const isFocused = isKeyboardNavigationActive && 
            focusedFileIndex === fileIndex && 
            focusedLineIndex === index;

          if (line.type === 'header') {
            return (
              <div 
                key={index} 
                className={cn(
                  "bg-[#1c2128] text-[#8b949e] px-4 py-1",
                  isFocused && "ring-2 ring-[#58a6ff] outline-none"
                )}
              >
                {line.content}
              </div>
            );
          }

          const lineClass = cn(
            "px-4 py-0.5",
            {
              "bg-[#0d1117] text-[#8b949e]": line.type === 'context',
              "bg-[#1f362d] text-[#3fb950]": line.type === 'add',
              "bg-[#3f1f23] text-[#f85149]": line.type === 'remove',
            },
            isFocused && "ring-2 ring-[#58a6ff] outline-none"
          );

          const lineNumber = line.type === 'remove' 
            ? line.oldLineNumber 
            : line.newLineNumber;

          return (
            <div key={index} className={lineClass}>
              <span className="select-none text-[#8b949e] mr-4 inline-block w-12 text-right">
                {lineNumber || ''}
              </span>
              <span className="select-none mr-2">
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              <span>{line.content}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSplitDiff = (lines: DiffLine[]) => {
    const leftLines: (DiffLine | null)[] = [];
    const rightLines: (DiffLine | null)[] = [];

    lines.forEach(line => {
      if (line.type === 'header') {
        leftLines.push(line);
        rightLines.push(line);
      } else if (line.type === 'context') {
        leftLines.push(line);
        rightLines.push(line);
      } else if (line.type === 'remove') {
        leftLines.push(line);
        rightLines.push(null);
      } else if (line.type === 'add') {
        leftLines.push(null);
        rightLines.push(line);
      }
    });

    // Align additions and deletions where possible
    for (let i = 0; i < leftLines.length; i++) {
      if (leftLines[i]?.type === 'remove' && rightLines[i] === null) {
        for (let j = i + 1; j < rightLines.length; j++) {
          if (rightLines[j]?.type === 'add' && leftLines[j] === null) {
            // Swap to align
            [rightLines[i], rightLines[j]] = [rightLines[j], rightLines[i]];
            break;
          }
        }
      }
    }

    return (
      <div className="flex font-mono text-sm">
        {/* Left side (old) */}
        <div className="flex-1 border-r border-[#30363d]">
          {leftLines.map((line, index) => {
            if (!line) {
              return <div key={index} className="bg-[#161b22] px-4 py-0.5 h-6" />;
            }

            if (line.type === 'header') {
              return (
                <div key={index} className="bg-[#1c2128] text-[#8b949e] px-4 py-1">
                  {line.content}
                </div>
              );
            }

            const lineClass = cn(
              "px-4 py-0.5",
              {
                "bg-[#0d1117] text-[#8b949e]": line.type === 'context',
                "bg-[#3f1f23] text-[#f85149]": line.type === 'remove',
              }
            );

            return (
              <div key={index} className={lineClass}>
                <span className="select-none text-[#8b949e] mr-4 inline-block w-12 text-right">
                  {line.oldLineNumber || ''}
                </span>
                <span className="select-none mr-2">
                  {line.type === 'remove' ? '-' : ' '}
                </span>
                <span>{line.content}</span>
              </div>
            );
          })}
        </div>

        {/* Right side (new) */}
        <div className="flex-1">
          {rightLines.map((line, index) => {
            if (!line) {
              return <div key={index} className="bg-[#161b22] px-4 py-0.5 h-6" />;
            }

            if (line.type === 'header') {
              return (
                <div key={index} className="bg-[#1c2128] text-[#8b949e] px-4 py-1">
                  {line.content}
                </div>
              );
            }

            const lineClass = cn(
              "px-4 py-0.5",
              {
                "bg-[#0d1117] text-[#8b949e]": line.type === 'context',
                "bg-[#1f362d] text-[#3fb950]": line.type === 'add',
              }
            );

            return (
              <div key={index} className={lineClass}>
                <span className="select-none text-[#8b949e] mr-4 inline-block w-12 text-right">
                  {line.newLineNumber || ''}
                </span>
                <span className="select-none mr-2">
                  {line.type === 'add' ? '+' : ' '}
                </span>
                <span>{line.content}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const stats = useMemo(() => {
    return diffs.reduce(
      (acc, diff) => ({
        files: acc.files + 1,
        additions: acc.additions + diff.additions,
        deletions: acc.deletions + diff.deletions,
      }),
      { files: 0, additions: 0, deletions: 0 }
    );
  }, [diffs]);

  return (
    <div className={cn("space-y-4", className)} ref={diffContainerRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-[#8b949e]">
            <span className="font-medium text-[#f0f6fc]">{stats.files}</span> files changed,{' '}
            <span className="text-[#3fb950]">+{stats.additions}</span> additions,{' '}
            <span className="text-[#f85149]">-{stats.deletions}</span> deletions
          </div>
          {!isKeyboardNavigationActive && (
            <div className="text-xs text-[#8b949e]">
              Press j, k, n, or p to start keyboard navigation
            </div>
          )}
        </div>

        {onViewModeChange && (
          <Select value={viewMode} onValueChange={(value) => onViewModeChange(value as 'split' | 'unified')}>
            <SelectTrigger className="w-[120px] bg-[#0d1117] border-[#30363d] text-[#f0f6fc]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1117] border-[#30363d]">
              <SelectItem value="unified" className="text-[#f0f6fc]">Unified</SelectItem>
              <SelectItem value="split" className="text-[#f0f6fc]">Split</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* File diffs */}
      {diffs.map((diff, fileIndex) => (
        <Card 
          key={diff.filename} 
          className={cn(
            "bg-[#0d1117] border-[#30363d] overflow-hidden",
            isKeyboardNavigationActive && focusedFileIndex === fileIndex && "ring-2 ring-[#58a6ff] outline-none"
          )}
          role="region"
          aria-label={`Diff for ${diff.filename}`}
        >
          <div 
            className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#1c2128]"
            onClick={() => toggleFileExpansion(diff.filename)}
            role="button"
            aria-expanded={expandedFiles.has(diff.filename)}
            aria-label={`Toggle diff for ${diff.filename}`}
          >
            <div className="flex items-center gap-2">
              {getFileIcon(diff.status)}
              <span className="text-[#f0f6fc] font-medium">
                {diff.status === 'renamed' 
                  ? `${diff.oldPath} → ${diff.newPath}`
                  : diff.filename
                }
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm" aria-label={`${diff.additions} additions, ${diff.deletions} deletions`}>
              <span className="text-[#3fb950]" aria-hidden="true">+{diff.additions}</span>
              <span className="text-[#f85149]" aria-hidden="true">-{diff.deletions}</span>
            </div>
          </div>

          {expandedFiles.has(diff.filename) && (
            <div className="overflow-x-auto">
              {viewMode === 'unified' 
                ? renderUnifiedDiff(diff.lines, fileIndex)
                : renderSplitDiff(diff.lines)
              }
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}