'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitBranch, Tag, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Branch {
  name: string;
  isDefault?: boolean;
  lastCommit?: string;
  type: 'branch' | 'tag';
}

interface BranchSelectorProps {
  branches: Branch[];
  tags: Branch[];
  currentBranch: string;
  onBranchChange: (branch: string) => void;
  onCreateBranch?: (branchName: string) => void;
}

export function BranchSelector({
  branches,
  tags,
  currentBranch,
  onBranchChange,
  onCreateBranch
}: BranchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

  // Filter branches and tags based on search query
  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateBranch = () => {
    if (onCreateBranch && newBranchName) {
      onCreateBranch(newBranchName);
      setIsCreateDialogOpen(false);
      setNewBranchName('');
    }
  };

  return (
    <>
      <Select value={currentBranch} onValueChange={onBranchChange}>
        <SelectTrigger className="w-[200px] bg-[#21262d] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d] focus:ring-[#58a6ff] focus:border-[#58a6ff]">
          <SelectValue placeholder="Select branch">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-[#8b949e]" />
              <span>{currentBranch}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#0d1117] border-[#30363d] max-h-[400px]">
          <div className="p-2 pb-1">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-md">
              <Search size={16} className="text-[#8b949e]" />
              <Input
                placeholder="Filter branches/tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent p-0 h-auto text-sm placeholder:text-[#8b949e] focus-visible:ring-0"
              />
            </div>
          </div>
          
          {onCreateBranch && (
            <div className="p-2 border-b border-[#30363d]">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full justify-start text-[#58a6ff] hover:bg-[#30363d] hover:text-[#58a6ff]"
              >
                <Plus size={16} className="mr-2" />
                Create new branch
              </Button>
            </div>
          )}

          {filteredBranches.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs text-[#8b949e] px-2 py-1.5">Branches</SelectLabel>
              {filteredBranches.map((branch) => (
                <SelectItem
                  key={branch.name}
                  value={branch.name}
                  className="text-[#f0f6fc] hover:bg-[#30363d] focus:bg-[#30363d] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <GitBranch size={16} className="text-[#8b949e]" />
                    <span>{branch.name}</span>
                    {branch.isDefault && (
                      <span className="text-xs bg-[#1c2128] border border-[#238636] text-[#3fb950] px-1.5 py-0.5 rounded-full">
                        default
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {filteredTags.length > 0 && (
            <SelectGroup>
              <SelectLabel className="text-xs text-[#8b949e] px-2 py-1.5">Tags</SelectLabel>
              {filteredTags.map((tag) => (
                <SelectItem
                  key={tag.name}
                  value={tag.name}
                  className="text-[#f0f6fc] hover:bg-[#30363d] focus:bg-[#30363d] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-[#8b949e]" />
                    <span>{tag.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {filteredBranches.length === 0 && filteredTags.length === 0 && (
            <div className="p-4 text-center text-[#8b949e] text-sm">
              No branches or tags found
            </div>
          )}
        </SelectContent>
      </Select>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc]">
          <DialogHeader>
            <DialogTitle>Create new branch</DialogTitle>
            <DialogDescription className="text-[#8b949e]">
              Create a new branch from the current branch ({currentBranch})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="branch-name" className="text-[#f0f6fc]">
                Branch name
              </Label>
              <Input
                id="branch-name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="feature/my-new-feature"
                className="bg-[#0d1117] border-[#30363d] text-[#f0f6fc] placeholder:text-[#8b949e]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-[#f0f6fc] hover:bg-[#30363d]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateBranch}
              disabled={!newBranchName}
              className="bg-[#238636] text-white hover:bg-[#2ea043]"
            >
              Create branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}