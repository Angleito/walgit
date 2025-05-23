'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  GitMerge,
  GitBranch,
  FileText,
  Check,
  AlertTriangle,
  ArrowUpDown,
  XCircle,
  CheckCircle,
  RefreshCw,
  CornerDownLeft,
  Loader2
} from 'lucide-react';
import { MergeConflictResolver } from './MergeConflictResolver';
import { MergeSummary } from './MergeSummary';

export interface MergeConflictLine {
  current: string;
  incoming: string;
  resolution?: 'current' | 'incoming' | 'both' | 'custom';
  customContent?: string;
  lineNumber: number;
}

export interface MergeConflict {
  filePath: string;
  conflicts: MergeConflictLine[][];
  resolved: boolean;
}

export interface MergedFile {
  filePath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'unchanged' | 'conflicted';
  stats?: {
    additions: number;
    deletions: number;
  };
}

export interface MergeContext {
  sourceBranch: string;
  targetBranch: string;
  conflicts: MergeConflict[];
  files: MergedFile[];
  committerName?: string;
  committerEmail?: string;
}

export interface MergeUIProps {
  mergeContext: MergeContext;
  onAbort: () => Promise<void>;
  onComplete: (message: string) => Promise<void>;
  onResolveConflict: (filePath: string, resolution: MergeConflictLine[][]) => Promise<void>;
}

/**
 * Advanced Merge UI component for handling git merge operations
 * Provides interactive conflict resolution and merge visualization
 */
export function MergeUI({ 
  mergeContext,
  onAbort,
  onComplete,
  onResolveConflict
}: MergeUIProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [mergeMessage, setMergeMessage] = useState(`Merge branch '${mergeContext.sourceBranch}' into ${mergeContext.targetBranch}`);
  const [isAborting, setIsAborting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [localMergeContext, setLocalMergeContext] = useState<MergeContext>(mergeContext);

  // Set the first conflicted file as the selected file by default
  useEffect(() => {
    if (!selectedFile && localMergeContext.conflicts.length > 0) {
      setSelectedFile(localMergeContext.conflicts[0].filePath);
    }
  }, [localMergeContext.conflicts, selectedFile]);

  // Compute derived state
  const conflictCount = useMemo(() => localMergeContext.conflicts.length, [localMergeContext.conflicts]);
  const resolvedCount = useMemo(() => 
    localMergeContext.conflicts.filter(c => c.resolved).length, 
    [localMergeContext.conflicts]
  );
  const allResolved = useMemo(() => 
    resolvedCount === conflictCount,
    [resolvedCount, conflictCount]
  );
  
  const selectedConflict = useMemo(() => 
    localMergeContext.conflicts.find(c => c.filePath === selectedFile),
    [localMergeContext.conflicts, selectedFile]
  );

  // File statistics for the merge
  const fileStats = useMemo(() => {
    const stats = {
      added: 0,
      modified: 0,
      deleted: 0,
      conflicted: 0,
      unchanged: 0,
      renamed: 0
    };
    
    localMergeContext.files.forEach(file => {
      stats[file.status]++;
    });
    
    return stats;
  }, [localMergeContext.files]);

  // Handle resolving a conflict for a file
  const handleResolveConflict = async (filePath: string, resolution: MergeConflictLine[][]) => {
    try {
      await onResolveConflict(filePath, resolution);
      
      // Update local state to mark this file as resolved
      setLocalMergeContext(prev => ({
        ...prev,
        conflicts: prev.conflicts.map(conflict => 
          conflict.filePath === filePath 
            ? { ...conflict, resolved: true, conflicts: resolution }
            : conflict
        ),
        files: prev.files.map(file => 
          file.filePath === filePath && file.status === 'conflicted'
            ? { ...file, status: 'modified' }
            : file
        )
      }));
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  // Handle aborting the merge
  const handleAbortMerge = async () => {
    setIsAborting(true);
    try {
      await onAbort();
      // Redirect or handle post-abort logic here
    } catch (error) {
      console.error('Failed to abort merge:', error);
    } finally {
      setIsAborting(false);
    }
  };

  // Handle completing the merge
  const handleCompleteMerge = async () => {
    if (!allResolved) return;
    
    setIsCompleting(true);
    try {
      await onComplete(mergeMessage);
      // Redirect or handle post-merge logic here
    } catch (error) {
      console.error('Failed to complete merge:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitMerge className="h-6 w-6 text-blue-500" />
              <CardTitle>Merge in Progress</CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center text-sm">
                <GitBranch className="h-4 w-4 mr-1 text-green-500" />
                <span className="font-medium">{localMergeContext.sourceBranch}</span>
                <ArrowUpDown className="h-4 w-4 mx-1 text-gray-400" />
                <GitBranch className="h-4 w-4 mr-1 text-blue-500" />
                <span className="font-medium">{localMergeContext.targetBranch}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
            <div className="bg-green-50 rounded-md p-3 flex flex-col justify-center items-center">
              <span className="text-xs text-green-600 font-medium">Added</span>
              <span className="mt-1 text-xl font-bold text-green-700">{fileStats.added}</span>
            </div>
            
            <div className="bg-yellow-50 rounded-md p-3 flex flex-col justify-center items-center">
              <span className="text-xs text-yellow-600 font-medium">Modified</span>
              <span className="mt-1 text-xl font-bold text-yellow-700">{fileStats.modified}</span>
            </div>
            
            <div className="bg-red-50 rounded-md p-3 flex flex-col justify-center items-center">
              <span className="text-xs text-red-600 font-medium">Deleted</span>
              <span className="mt-1 text-xl font-bold text-red-700">{fileStats.deleted}</span>
            </div>
            
            <div className="bg-blue-50 rounded-md p-3 flex flex-col justify-center items-center">
              <span className="text-xs text-blue-600 font-medium">Renamed</span>
              <span className="mt-1 text-xl font-bold text-blue-700">{fileStats.renamed}</span>
            </div>
            
            <div className={`${conflictCount > 0 ? 'bg-orange-50' : 'bg-gray-50'} rounded-md p-3 flex flex-col justify-center items-center`}>
              <span className={`text-xs ${conflictCount > 0 ? 'text-orange-600' : 'text-gray-600'} font-medium`}>
                Conflicts
              </span>
              <span className={`mt-1 text-xl font-bold ${conflictCount > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                {conflictCount}
              </span>
            </div>
          </div>
          
          {conflictCount > 0 && (
            <Alert variant={allResolved ? "default" : "destructive"} className="mb-4">
              {allResolved ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{allResolved ? "Ready to Complete Merge" : "Conflicts Need Resolution"}</AlertTitle>
              <AlertDescription>
                {allResolved 
                  ? "All conflicts have been resolved. You can now complete the merge."
                  : `${resolvedCount} of ${conflictCount} conflicts resolved. Please resolve all conflicts before completing the merge.`
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conflicts" disabled={conflictCount === 0}>
            Conflicts
            {conflictCount > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                allResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {resolvedCount}/{conflictCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="files">Files Changed</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="overview">
            <MergeSummary 
              mergeContext={localMergeContext}
              conflictCount={conflictCount}
              resolvedCount={resolvedCount}
              onSelectFile={(filePath) => {
                setSelectedFile(filePath);
                if (conflictCount > 0 && localMergeContext.conflicts.some(c => c.filePath === filePath)) {
                  setActiveTab('conflicts');
                } else {
                  setActiveTab('files');
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="conflicts">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="border rounded-lg">
                  <div className="p-3 border-b bg-gray-50">
                    <h3 className="font-medium text-sm">Conflicted Files</h3>
                  </div>
                  
                  <div className="divide-y">
                    {localMergeContext.conflicts.map((conflict) => (
                      <div 
                        key={conflict.filePath}
                        className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          selectedFile === conflict.filePath ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedFile(conflict.filePath)}
                      >
                        <div className="flex items-center">
                          <FileText className={`h-4 w-4 mr-2 ${
                            conflict.resolved ? 'text-green-500' : 'text-orange-500'
                          }`} />
                          <span className="text-sm truncate max-w-[180px]">
                            {conflict.filePath.split('/').pop()}
                          </span>
                        </div>
                        
                        {conflict.resolved ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-3">
                {selectedConflict ? (
                  <MergeConflictResolver 
                    filePath={selectedConflict.filePath}
                    conflicts={selectedConflict.conflicts}
                    isResolved={selectedConflict.resolved}
                    onResolve={(resolution) => handleResolveConflict(selectedConflict.filePath, resolution)}
                  />
                ) : (
                  <div className="border rounded-lg p-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No conflict selected</h3>
                    <p className="text-gray-500">
                      Select a file from the list to resolve conflicts
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="files">
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-medium">Files Changed</h3>
                
                <div className="text-sm text-gray-500">
                  {localMergeContext.files.length} files total
                </div>
              </div>
              
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {localMergeContext.files.map((file) => (
                  <div key={file.filePath} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {file.status === 'added' && <span className="text-green-500 font-bold text-lg">+</span>}
                          {file.status === 'deleted' && <span className="text-red-500 font-bold text-lg">-</span>}
                          {file.status === 'modified' && <span className="text-yellow-500 font-bold text-lg">M</span>}
                          {file.status === 'renamed' && <span className="text-blue-500 font-bold text-lg">R</span>}
                          {file.status === 'conflicted' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        </div>
                        
                        <div>
                          <div className="font-medium">{file.filePath}</div>
                          {file.stats && (
                            <div className="text-xs text-gray-500 mt-1">
                              {file.stats.additions > 0 && (
                                <span className="text-green-600 mr-2">+{file.stats.additions}</span>
                              )}
                              {file.stats.deletions > 0 && (
                                <span className="text-red-600">-{file.stats.deletions}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {file.status === 'conflicted' && !localMergeContext.conflicts.find(c => c.filePath === file.filePath)?.resolved && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedFile(file.filePath);
                            setActiveTab('conflicts');
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Complete Merge</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <label htmlFor="commit-message" className="block text-sm font-medium mb-1">
              Commit Message
            </label>
            <textarea
              id="commit-message"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={mergeMessage}
              onChange={(e) => setMergeMessage(e.target.value)}
              disabled={!allResolved || isCompleting}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleAbortMerge}
            disabled={isAborting || isCompleting}
          >
            {isAborting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aborting...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Abort Merge
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleCompleteMerge}
            disabled={!allResolved || isCompleting || mergeMessage.trim() === ''}
          >
            {isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Merge
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}