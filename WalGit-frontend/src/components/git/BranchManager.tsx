'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, GitMerge, Plus, Trash2, ArrowRightLeft, Clock, Shield, CheckCircle2 } from 'lucide-react';

export interface Branch {
  name: string;
  isDefault: boolean;
  isProtected: boolean;
  lastCommit: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  ahead: number;
  behind: number;
}

export interface BranchManagerProps {
  branches: Branch[];
  currentBranch: string;
  onCreateBranch: (name: string, fromBranch: string) => Promise<void>;
  onDeleteBranch: (name: string) => Promise<void>;
  onSwitchBranch: (name: string) => Promise<void>;
  onMergeBranch: (from: string, to: string) => Promise<void>;
}

export function BranchManager({
  branches,
  currentBranch,
  onCreateBranch,
  onDeleteBranch,
  onSwitchBranch,
  onMergeBranch
}: BranchManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedBaseBranch, setSelectedBaseBranch] = useState(currentBranch);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeToBranch, setMergeToBranch] = useState(currentBranch);

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateBranch(newBranchName, selectedBaseBranch);
      setNewBranchName('');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    setIsDeleting(branchName);
    try {
      await onDeleteBranch(branchName);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleMergeBranch = async (fromBranch: string) => {
    setIsMerging(true);
    try {
      await onMergeBranch(fromBranch, mergeToBranch);
    } finally {
      setIsMerging(false);
    }
  };

  const activeBranches = branches.filter(b => !b.isDefault);
  const defaultBranch = branches.find(b => b.isDefault);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Branch Management
        </CardTitle>
        <CardDescription>
          Create, manage, and merge branches in your repository
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="merge">Merge</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{branch.name}</span>
                        {branch.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            default
                          </Badge>
                        )}
                        {branch.isProtected && (
                          <Shield className="h-3 w-3 text-muted-foreground" />
                        )}
                        {branch.name === currentBranch && (
                          <Badge variant="default" className="text-xs">
                            current
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {branch.lastCommit.message} • {branch.lastCommit.date}
                      </div>
                      {(branch.ahead > 0 || branch.behind > 0) && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          {branch.ahead > 0 && (
                            <span className="text-primary">
                              {branch.ahead} ahead
                            </span>
                          )}
                          {branch.behind > 0 && (
                            <span className="text-orange-600">
                              {branch.behind} behind
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {branch.name !== currentBranch && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSwitchBranch(branch.name)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-1" />
                        Switch
                      </Button>
                    )}
                    {!branch.isDefault && !branch.isProtected && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={branch.name === currentBranch}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete branch?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{branch.name}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteBranch(branch.name)}
                              disabled={isDeleting === branch.name}
                            >
                              {isDeleting === branch.name ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Branch name
                </label>
                <Input
                  placeholder="feature/new-feature"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Create from
                </label>
                <Select value={selectedBaseBranch} onValueChange={setSelectedBaseBranch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim() || isCreating}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create branch'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="merge" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Merge into
                </label>
                <Select value={mergeToBranch} onValueChange={setMergeToBranch}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.name} value={branch.name}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {branches
                  .filter(b => b.name !== mergeToBranch)
                  .map((branch) => (
                    <div
                      key={branch.name}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{branch.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {branch.ahead > 0 ? `${branch.ahead} commits ahead` : 'No new commits'}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMergeBranch(branch.name)}
                        disabled={branch.ahead === 0 || isMerging}
                      >
                        <GitMerge className="h-4 w-4 mr-1" />
                        {isMerging ? 'Merging...' : 'Merge'}
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}