'use client';

import { useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { DiffViewer } from './DiffViewer';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileCode, 
  GitBranch, 
  RefreshCw, 
  Trash2, 
  Plus, 
  Minus,
  Search
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface FileChange {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  staged: boolean;
  oldPath?: string;
  newPath?: string;
}

interface StagingAreaProps {
  changes: FileChange[];
  onStageFiles: (files: string[]) => void;
  onUnstageFiles: (files: string[]) => void;
  onDiscardChanges: (files: string[]) => void;
  onRefresh?: () => void;
  getDiffForFile: (filename: string) => any;
  className?: string;
}

export function StagingArea({
  changes,
  onStageFiles,
  onUnstageFiles,
  onDiscardChanges,
  onRefresh,
  getDiffForFile,
  className
}: StagingAreaProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified');
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [filesToDiscard, setFilesToDiscard] = useState<string[]>([]);

  const stagedFiles = changes.filter(f => f.staged);
  const unstagedFiles = changes.filter(f => !f.staged);

  const filteredStagedFiles = stagedFiles.filter(f => 
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredUnstagedFiles = unstagedFiles.filter(f => 
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectFile = useCallback((filename: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedFiles(newSelected);
  }, [selectedFiles]);

  const handleStageSelected = () => {
    const filesToStage = Array.from(selectedFiles).filter(f => 
      unstagedFiles.some(uf => uf.filename === f)
    );
    onStageFiles(filesToStage);
    setSelectedFiles(new Set());
  };

  const handleUnstageSelected = () => {
    const filesToUnstage = Array.from(selectedFiles).filter(f => 
      stagedFiles.some(sf => sf.filename === f)
    );
    onUnstageFiles(filesToUnstage);
    setSelectedFiles(new Set());
  };

  const handleDiscardSelected = () => {
    const filesToDiscardNow = Array.from(selectedFiles).filter(f => 
      unstagedFiles.some(uf => uf.filename === f)
    );
    setFilesToDiscard(filesToDiscardNow);
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    onDiscardChanges(filesToDiscard);
    setSelectedFiles(new Set());
    setShowDiscardDialog(false);
    setFilesToDiscard([]);
  };

  // Create a memoized row renderer for virtualization
  const renderVirtualizedRow = useCallback(({ data, index, style }: { 
    data: { files: FileChange[], staged: boolean }, 
    index: number, 
    style: React.CSSProperties 
  }) => {
    const file = data.files[index];
    const isSelected = selectedFiles.has(file.filename);
    const isCurrentFile = selectedFile === file.filename;

    return (
      <div
        style={style}
        className={cn(
          "flex items-center gap-2 px-3 cursor-pointer hover:bg-[#30363d] group",
          isCurrentFile && "bg-[#30363d]"
        )}
        onClick={() => setSelectedFile(file.filename)}
        role="option"
        aria-selected={isCurrentFile}
        aria-label={`${file.filename} - ${file.status} file with ${file.additions} additions and ${file.deletions} deletions`}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleSelectFile(file.filename)}
          onClick={(e) => e.stopPropagation()}
          className="border-[#30363d] data-[state=checked]:bg-[#1f6feb] data-[state=checked]:border-[#1f6feb]"
          aria-label={`Select ${file.filename}`}
        />
        
        <div className="flex items-center gap-2 flex-1">
          {file.status === 'added' ? (
            <Plus size={16} className="text-[#3fb950]" />
          ) : file.status === 'deleted' ? (
            <Minus size={16} className="text-[#f85149]" />
          ) : file.status === 'renamed' ? (
            <GitBranch size={16} className="text-[#a371f7]" />
          ) : (
            <FileCode size={16} className="text-[#8b949e]" />
          )}
          
          <span className="text-sm text-[#f0f6fc] flex-1">
            {file.status === 'renamed' 
              ? `${file.oldPath} → ${file.newPath}`
              : file.filename
            }
          </span>
          
          <div className="flex items-center gap-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[#3fb950]">+{file.additions}</span>
            <span className="text-[#f85149]">-{file.deletions}</span>
          </div>
        </div>
      </div>
    );
  }, [selectedFiles, selectedFile, handleSelectFile]);

  const selectedDiff = selectedFile ? getDiffForFile(selectedFile) : null;

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="p-4 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#f0f6fc]">Changes</h2>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-[#8b949e] hover:text-[#f0f6fc]"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8b949e]" />
          <Input
            placeholder="Filter files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#0d1117] border-[#30363d] text-[#f0f6fc] placeholder:text-[#8b949e]"
          />
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex">
        {/* File lists */}
        <div className="w-80 border-r border-[#30363d] flex flex-col">
          {/* Unstaged changes */}
          <div className="flex-1 border-b border-[#30363d]">
            <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#f0f6fc]">
                Unstaged Changes ({filteredUnstagedFiles.length})
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleStageSelected}
                  disabled={selectedFiles.size === 0}
                  className="text-[#8b949e] hover:text-[#f0f6fc] h-6 px-2"
                >
                  <Plus size={14} className="mr-1" />
                  Stage
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleDiscardSelected}
                  disabled={selectedFiles.size === 0}
                  className="text-[#8b949e] hover:text-[#f85149] h-6 px-2"
                >
                  <Trash2 size={14} className="mr-1" />
                  Discard
                </Button>
              </div>
            </div>
            {filteredUnstagedFiles.length > 0 ? (
              <div role="listbox" aria-label="Unstaged files">
                <List
                  height={300}
                  itemCount={filteredUnstagedFiles.length}
                  itemSize={40}
                  width="100%"
                  itemData={{ files: filteredUnstagedFiles, staged: false }}
                >
                  {renderVirtualizedRow}
                </List>
              </div>
            ) : (
              <div className="p-4 text-center text-[#8b949e]" role="status" aria-live="polite">
                No unstaged changes
              </div>
            )}
          </div>

          {/* Staged changes */}
          <div className="flex-1">
            <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#f0f6fc]">
                Staged Changes ({filteredStagedFiles.length})
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleUnstageSelected}
                disabled={selectedFiles.size === 0}
                className="text-[#8b949e] hover:text-[#f0f6fc] h-6 px-2"
              >
                <Minus size={14} className="mr-1" />
                Unstage
              </Button>
            </div>
            {filteredStagedFiles.length > 0 ? (
              <div role="listbox" aria-label="Staged files">
                <List
                  height={300}
                  itemCount={filteredStagedFiles.length}
                  itemSize={40}
                  width="100%"
                  itemData={{ files: filteredStagedFiles, staged: true }}
                >
                  {renderVirtualizedRow}
                </List>
              </div>
            ) : (
              <div className="p-4 text-center text-[#8b949e]" role="status" aria-live="polite">
                No staged changes
              </div>
            )}
          </div>
        </div>

        {/* Diff viewer */}
        <div className="flex-1 bg-[#0d1117]">
          {selectedDiff ? (
            <DiffViewer
              diffs={[selectedDiff]}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              className="h-full overflow-auto"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-[#8b949e]">
              <div className="text-center">
                <FileCode size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a file to view changes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discard confirmation dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="bg-[#0d1117] border-[#30363d]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#f0f6fc]">
              Discard changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#8b949e]">
              Are you sure you want to discard changes to {filesToDiscard.length} file(s)?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#21262d] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-[#f85149] text-white hover:bg-[#da3633]"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}