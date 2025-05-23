'use client';

import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitMerge,
  GitBranch,
  FileText,
  ArrowDownUp,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Plus,
  Minus,
  Pencil,
  FolderOpen
} from 'lucide-react';
import { MergeContext } from './MergeUI';

interface MergeSummaryProps {
  mergeContext: MergeContext;
  conflictCount: number;
  resolvedCount: number;
  onSelectFile: (filePath: string) => void;
}

/**
 * Summary overview component for a merge in progress
 * Shows statistics, affected files, and merge status
 */
export function MergeSummary({
  mergeContext,
  conflictCount,
  resolvedCount,
  onSelectFile
}: MergeSummaryProps) {
  // Organize files by directory
  const filesByDirectory = mergeContext.files.reduce((acc, file) => {
    const parts = file.filePath.split('/');
    const fileName = parts.pop() || '';
    const directory = parts.join('/') || '/';
    
    if (!acc[directory]) {
      acc[directory] = [];
    }
    
    acc[directory].push({
      ...file,
      name: fileName
    });
    
    return acc;
  }, {} as Record<string, Array<{name: string} & typeof mergeContext.files[0]>>);
  
  // Get statistics for additions/deletions
  const totalAdditions = mergeContext.files.reduce((sum, file) => 
    sum + (file.stats?.additions || 0), 0
  );
  
  const totalDeletions = mergeContext.files.reduce((sum, file) => 
    sum + (file.stats?.deletions || 0), 0
  );
  
  // Get conflict files
  const conflictedFiles = mergeContext.files.filter(f => f.status === 'conflicted');
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Merge Summary</CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GitMerge className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Merging Branches</h3>
              </div>
              
              <div className="pl-7 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-green-500" />
                <span className="font-medium">{mergeContext.sourceBranch}</span>
                <ArrowDownUp className="h-4 w-4 text-gray-400" />
                <GitBranch className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{mergeContext.targetBranch}</span>
              </div>
              
              <div className="mt-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Changes Overview</h3>
              </div>
              
              <div className="pl-7 grid grid-cols-2 gap-2">
                <div className="border rounded-md p-3">
                  <div className="text-sm text-gray-500">Files Changed</div>
                  <div className="text-2xl font-bold">{mergeContext.files.length}</div>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="text-sm text-gray-500">Lines Changed</div>
                  <div className="flex items-center">
                    <span className="text-green-600 font-bold">+{totalAdditions}</span>
                    <span className="mx-1">/</span>
                    <span className="text-red-600 font-bold">-{totalDeletions}</span>
                  </div>
                </div>
              </div>
              
              {conflictCount > 0 && (
                <>
                  <div className="mt-6 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h3 className="font-medium">Merge Conflicts</h3>
                  </div>
                  
                  <div className="pl-7">
                    <Card className={conflictCount === resolvedCount ? 'border-green-300' : 'border-orange-300'}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {conflictCount === resolvedCount ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                            )}
                            <span>
                              {resolvedCount}/{conflictCount} conflicts resolved
                            </span>
                          </div>
                          
                          {conflictCount > 0 && resolvedCount < conflictCount && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                const firstUnresolvedFile = mergeContext.conflicts
                                  .find(c => !c.resolved)?.filePath;
                                if (firstUnresolvedFile) {
                                  onSelectFile(firstUnresolvedFile);
                                }
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {conflictedFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {conflictedFiles.map(file => {
                          const isResolved = mergeContext.conflicts.find(
                            c => c.filePath === file.filePath
                          )?.resolved || false;
                          
                          return (
                            <div 
                              key={file.filePath}
                              className="flex items-center justify-between border rounded-md p-2 hover:bg-gray-50 cursor-pointer"
                              onClick={() => onSelectFile(file.filePath)}
                            >
                              <div className="flex items-center">
                                <FileCode className="h-4 w-4 text-orange-500 mr-2" />
                                <span className="text-sm">{file.filePath}</span>
                              </div>
                              
                              {isResolved ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  Conflict
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Changed Files</h3>
              </div>
              
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-gray-50">
                  <div className="text-sm font-medium">Files by Directory</div>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {Object.entries(filesByDirectory).map(([directory, files]) => (
                    <div key={directory} className="border-b">
                      <div className="p-2 bg-gray-50 flex items-center">
                        <FolderOpen className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm font-medium">{directory || '/'}</span>
                      </div>
                      
                      <div className="divide-y">
                        {files.map(file => (
                          <div 
                            key={file.filePath}
                            className="p-2 pl-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onSelectFile(file.filePath)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {file.status === 'added' && <Plus className="h-3 w-3 text-green-500 mr-1" />}
                                {file.status === 'deleted' && <Minus className="h-3 w-3 text-red-500 mr-1" />}
                                {file.status === 'modified' && <Pencil className="h-3 w-3 text-yellow-500 mr-1" />}
                                {file.status === 'conflicted' && <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />}
                                <span className="text-sm">{file.name}</span>
                              </div>
                              
                              {file.status === 'conflicted' ? (
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                  Conflict
                                </Badge>
                              ) : (
                                <Badge variant="outline" className={`text-xs ${
                                  file.status === 'added' ? 'bg-green-50 text-green-700 border-green-200' :
                                  file.status === 'deleted' ? 'bg-red-50 text-red-700 border-red-200' :
                                  file.status === 'modified' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  file.status === 'renamed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                  {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}