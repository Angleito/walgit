'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronDown,
  GitBranch,
  Search,
  Plus,
  Check,
  X,
  GitMerge,
  Tag,
  History,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Branch {
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

interface Tag {
  name: string;
  commit: {
    hash: string;
    message: string;
    date: string;
  };
}

interface BranchSelectorProps {
  currentBranch: string;
  branches: Branch[];
  tags: Tag[];
  onChangeBranch: (branch: string) => void;
  onCreateBranch?: (name: string, fromBranch: string) => Promise<void>;
  onCreateTag?: (name: string, commitHash: string) => Promise<void>;
  recentBranches?: string[]; // Recently viewed branches
}

export function BranchSelector({
  currentBranch,
  branches,
  tags,
  onChangeBranch,
  onCreateBranch,
  onCreateTag,
  recentBranches = [],
}: BranchSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateBranchDialogOpen, setIsCreateBranchDialogOpen] = useState(false);
  const [isCreateTagDialogOpen, setIsCreateTagDialogOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [baseBranch, setBaseBranch] = useState(currentBranch);
  const [tagCommit, setTagCommit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('branches');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isDropdownOpen]);
  
  // Filter branches/tags based on search term
  const filteredBranches = branches.filter(
    (branch) => branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredTags = tags.filter(
    (tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const currentBranchData = branches.find(branch => branch.name === currentBranch);
  
  // Get recent branches that exist in the branches array
  const validRecentBranches = recentBranches
    .filter(name => branches.some(branch => branch.name === name))
    .filter(name => name !== currentBranch)
    .slice(0, 3);
  
  const handleCreateBranch = async () => {
    if (!newBranchName || !onCreateBranch) return;
    
    setIsLoading(true);
    
    try {
      await onCreateBranch(newBranchName, baseBranch);
      setIsCreateBranchDialogOpen(false);
      setNewBranchName('');
      onChangeBranch(newBranchName);
    } catch (error) {
      console.error('Failed to create branch:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateTag = async () => {
    if (!newTagName || !onCreateTag) return;
    
    setIsLoading(true);
    
    try {
      await onCreateTag(newTagName, tagCommit || currentBranchData?.lastCommit.hash || '');
      setIsCreateTagDialogOpen(false);
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format relative time from date string
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 h-9">
            <GitBranch className="h-4 w-4" />
            <span className="max-w-[120px] truncate">{currentBranch}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[350px]">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                ref={searchInputRef}
                placeholder="Find branch or tag..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs defaultValue="branches" value={activeTab} onValueChange={setActiveTab}>
            <div className="px-2">
              <TabsList className="w-full">
                <TabsTrigger value="branches" className="flex-1">
                  <GitBranch className="h-4 w-4 mr-1" /> Branches ({branches.length})
                </TabsTrigger>
                <TabsTrigger value="tags" className="flex-1">
                  <Tag className="h-4 w-4 mr-1" /> Tags ({tags.length})
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="branches" className="max-h-[300px] overflow-y-auto">
              {validRecentBranches.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs text-gray-500 font-medium flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Recent Branches
                  </div>
                  {validRecentBranches.map((branch) => {
                    const branchData = branches.find(b => b.name === branch);
                    return (
                      <DropdownMenuItem
                        key={`recent-${branch}`}
                        className="px-2 py-1.5 cursor-pointer flex justify-between"
                        onClick={() => {
                          onChangeBranch(branch);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{branch}</span>
                        </div>
                        {branchData?.isDefault && (
                          <Badge variant="outline" className="text-xs font-normal">default</Badge>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                </>
              )}
              
              {filteredBranches.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No matching branches found
                </div>
              ) : (
                filteredBranches.map((branch) => (
                  <DropdownMenuItem
                    key={branch.name}
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      onChangeBranch(branch.name);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center">
                        {branch.name === currentBranch ? (
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                        ) : (
                          <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
                        )}
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">{branch.name}</span>
                            {branch.isDefault && (
                              <Badge variant="outline" className="ml-2 text-xs font-normal">default</Badge>
                            )}
                            {branch.protection?.enabled && (
                              <Badge variant="secondary" className="ml-2 text-xs font-normal">protected</Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="font-mono">{branch.lastCommit?.hash?.substring(0, 7) || 'unknown'}</span>
                            <span className="mx-1">·</span>
                            <span>{branch.lastCommit?.date ? formatRelativeTime(branch.lastCommit.date) : 'unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              
              {onCreateBranch && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="px-2 py-1.5 cursor-pointer text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setIsCreateBranchDialogOpen(true);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Create new branch</span>
                  </DropdownMenuItem>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="tags" className="max-h-[300px] overflow-y-auto">
              {filteredTags.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No matching tags found
                </div>
              ) : (
                filteredTags.map((tag) => (
                  <DropdownMenuItem
                    key={tag.name}
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => {
                      onChangeBranch(tag.name);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">{tag.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <span className="font-mono">{tag.commit?.hash?.substring(0, 7) || 'unknown'}</span>
                            <span className="mx-1">·</span>
                            <span>{tag.commit?.date ? formatRelativeTime(tag.commit.date) : 'unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              
              {onCreateTag && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="px-2 py-1.5 cursor-pointer text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setIsCreateTagDialogOpen(true);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Create new tag</span>
                  </DropdownMenuItem>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Create Branch Dialog */}
      <Dialog open={isCreateBranchDialogOpen} onOpenChange={setIsCreateBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new branch</DialogTitle>
            <DialogDescription>
              A branch allows you to develop features, fix bugs, or experiment safely.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newBranchName">Branch name</Label>
              <Input
                id="newBranchName"
                placeholder="feature/new-feature"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="baseBranch">Create from</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 mr-2" />
                      {baseBranch}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[300px] max-h-[200px] overflow-y-auto">
                  {branches.map((branch) => (
                    <DropdownMenuItem
                      key={branch.name}
                      onClick={() => setBaseBranch(branch.name)}
                    >
                      <div className="flex items-center">
                        <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{branch.name}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateBranchDialogOpen(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateBranch}
              disabled={!newBranchName || isLoading}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Create branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Tag Dialog */}
      <Dialog open={isCreateTagDialogOpen} onOpenChange={setIsCreateTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new tag</DialogTitle>
            <DialogDescription>
              Tags are used to mark specific points in your repository&apos;s history, typically for release versions.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newTagName">Tag name</Label>
              <Input
                id="newTagName"
                placeholder="v1.0.0"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tagCommit">Create from</Label>
              <div className="flex items-center border rounded-md p-2 bg-gray-50">
                <GitBranch className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">{currentBranch}</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({currentBranchData?.lastCommit?.hash?.substring(0, 7) || 'unknown'})
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                The tag will be created from the latest commit on {currentBranch}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateTagDialogOpen(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleCreateTag}
              disabled={!newTagName || isLoading}
            >
              <Tag className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Create tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}