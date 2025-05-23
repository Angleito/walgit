'use client';

import { useState, useEffect } from 'react';
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RadioGroup,
  RadioGroupItem 
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Check,
  GitBranch,
  ArrowDown,
  Edit,
  AlertTriangle,
  ArrowDownUp,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { MergeConflictLine } from './MergeUI';

interface MergeConflictResolverProps {
  filePath: string;
  conflicts: MergeConflictLine[][];
  isResolved: boolean;
  onResolve: (resolution: MergeConflictLine[][]) => Promise<void>;
}

/**
 * Component for resolving merge conflicts in a file
 * Provides side-by-side diff view and resolution controls
 */
export function MergeConflictResolver({
  filePath,
  conflicts,
  isResolved,
  onResolve
}: MergeConflictResolverProps) {
  const [localConflicts, setLocalConflicts] = useState<MergeConflictLine[][]>(conflicts);
  const [activeConflictIndex, setActiveConflictIndex] = useState(0);
  const [isResolving, setIsResolving] = useState(false);
  const [customEditing, setCustomEditing] = useState<{[key: number]: boolean}>({});

  // Ensure the local conflicts state stays in sync with props
  useEffect(() => {
    setLocalConflicts(conflicts);
  }, [conflicts]);

  // Get the current conflict being resolved
  const currentConflict = localConflicts[activeConflictIndex] || [];
  
  // Calculate if all conflicts in the file have been resolved
  const allConflictsResolved = localConflicts.every(conflictGroup => 
    conflictGroup.every(conflict => conflict.resolution)
  );

  // Calculate percentage of conflicts resolved in this file
  const resolvedPercentage = localConflicts.reduce((acc, conflictGroup) => {
    const resolvedInGroup = conflictGroup.filter(conflict => conflict.resolution).length;
    return acc + resolvedInGroup;
  }, 0) / localConflicts.reduce((acc, conflictGroup) => acc + conflictGroup.length, 0) * 100;

  // Handle choosing a resolution option
  const handleChooseResolution = (option: 'current' | 'incoming' | 'both' | 'custom', lineIndex: number) => {
    const updatedConflicts = [...localConflicts];
    const conflictLine = updatedConflicts[activeConflictIndex][lineIndex];
    
    conflictLine.resolution = option;
    
    // Initialize custom content if choosing custom
    if (option === 'custom' && !conflictLine.customContent) {
      conflictLine.customContent = conflictLine.current || conflictLine.incoming || '';
      // Enable custom editing for this line
      setCustomEditing({...customEditing, [lineIndex]: true});
    }
    
    setLocalConflicts(updatedConflicts);
  };

  // Handle updating custom content
  const handleCustomContentChange = (content: string, lineIndex: number) => {
    const updatedConflicts = [...localConflicts];
    updatedConflicts[activeConflictIndex][lineIndex].customContent = content;
    setLocalConflicts(updatedConflicts);
  };

  // Submit the resolved conflicts
  const handleSubmitResolution = async () => {
    if (!allConflictsResolved) return;
    
    setIsResolving(true);
    try {
      await onResolve(localConflicts);
    } catch (error) {
      console.error('Failed to resolve conflicts:', error);
    } finally {
      setIsResolving(false);
    }
  };

  // Determine if we can navigate to the next conflict group
  const canGoNext = activeConflictIndex < localConflicts.length - 1;
  
  // Determine if we can navigate to the previous conflict group
  const canGoPrevious = activeConflictIndex > 0;

  // Go to the next conflict group
  const goToNextConflict = () => {
    if (canGoNext) {
      setActiveConflictIndex(activeConflictIndex + 1);
      setCustomEditing({});
    }
  };

  // Go to the previous conflict group
  const goToPreviousConflict = () => {
    if (canGoPrevious) {
      setActiveConflictIndex(activeConflictIndex - 1);
      setCustomEditing({});
    }
  };

  // Format line number for display
  const formatLineNumber = (num?: number) => {
    return num !== undefined ? num.toString().padStart(3, ' ') : '   ';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Resolve Conflicts: {filePath.split('/').pop()}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {localConflicts.length} conflict {localConflicts.length === 1 ? 'group' : 'groups'} in this file
            </p>
          </div>
          
          {isResolved ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span className="font-medium">Resolved</span>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="bg-gray-200 rounded-full h-2 w-24 mr-2">
                <div 
                  className="bg-green-500 rounded-full h-2" 
                  style={{ width: `${resolvedPercentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">
                {Math.round(resolvedPercentage)}% resolved
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={!canGoPrevious}
              onClick={goToPreviousConflict}
            >
              Previous
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={!canGoNext}
              onClick={goToNextConflict}
            >
              Next
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            Conflict {activeConflictIndex + 1} of {localConflicts.length}
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden mb-4">
          <div className="grid grid-cols-2 divide-x">
            <div className="p-2 bg-gray-50 text-center">
              <div className="flex items-center justify-center">
                <GitBranch className="h-4 w-4 mr-1 text-blue-500" />
                <span className="font-medium">{filePath}</span>
                <span className="mx-1 text-sm text-gray-500">in</span>
                <span className="font-medium">HEAD</span>
              </div>
            </div>
            
            <div className="p-2 bg-gray-50 text-center">
              <div className="flex items-center justify-center">
                <GitBranch className="h-4 w-4 mr-1 text-green-500" />
                <span className="font-medium">{filePath}</span>
                <span className="mx-1 text-sm text-gray-500">in</span>
                <span className="font-medium">incoming branch</span>
              </div>
            </div>
          </div>
          
          <div className="divide-y">
            {currentConflict.map((line, lineIndex) => (
              <div key={lineIndex} className="grid grid-cols-2 divide-x">
                <div className={`p-2 font-mono text-sm ${
                  line.resolution === 'incoming' ? 'bg-red-50' :
                  line.resolution === 'current' ? 'bg-green-50' :
                  line.resolution === 'both' ? 'bg-blue-50' :
                  line.resolution === 'custom' ? 'bg-purple-50' : ''
                }`}>
                  <div className="flex">
                    <span className="text-gray-400 w-8 select-none">
                      {formatLineNumber(line.lineNumber)}
                    </span>
                    <span className="whitespace-pre-wrap">{line.current || ' '}</span>
                  </div>
                </div>
                
                <div className={`p-2 font-mono text-sm ${
                  line.resolution === 'current' ? 'bg-red-50' :
                  line.resolution === 'incoming' ? 'bg-green-50' :
                  line.resolution === 'both' ? 'bg-blue-50' :
                  line.resolution === 'custom' ? 'bg-purple-50' : ''
                }`}>
                  <div className="flex">
                    <span className="text-gray-400 w-8 select-none">
                      {formatLineNumber(line.lineNumber)}
                    </span>
                    <span className="whitespace-pre-wrap">{line.incoming || ' '}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          {currentConflict.map((line, lineIndex) => (
            <div key={lineIndex} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Conflict at line {line.lineNumber}</h4>
                
                {line.resolution && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    line.resolution === 'current' ? 'bg-blue-100 text-blue-800' :
                    line.resolution === 'incoming' ? 'bg-green-100 text-green-800' :
                    line.resolution === 'both' ? 'bg-purple-100 text-purple-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {line.resolution === 'current' ? 'Keep Current' :
                     line.resolution === 'incoming' ? 'Use Incoming' :
                     line.resolution === 'both' ? 'Keep Both' : 'Custom'}
                  </span>
                )}
              </div>
              
              <RadioGroup 
                value={line.resolution} 
                onValueChange={(value) => handleChooseResolution(value as any, lineIndex)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="current" id={`current-${lineIndex}`} />
                    <Label htmlFor={`current-${lineIndex}`} className="flex items-center">
                      <span className="text-blue-600 font-semibold mr-1">Keep Current</span>
                      <span className="text-xs text-gray-500">(HEAD)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="incoming" id={`incoming-${lineIndex}`} />
                    <Label htmlFor={`incoming-${lineIndex}`} className="flex items-center">
                      <span className="text-green-600 font-semibold mr-1">Use Incoming</span>
                      <span className="text-xs text-gray-500">(branch)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id={`both-${lineIndex}`} />
                    <Label htmlFor={`both-${lineIndex}`} className="flex items-center">
                      <span className="text-purple-600 font-semibold mr-1">Keep Both</span>
                      <span className="text-xs text-gray-500">(current + incoming)</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id={`custom-${lineIndex}`} />
                    <Label htmlFor={`custom-${lineIndex}`} className="flex items-center">
                      <span className="text-yellow-600 font-semibold mr-1">Custom</span>
                      <span className="text-xs text-gray-500">(edit manually)</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              
              {line.resolution === 'custom' && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor={`custom-content-${lineIndex}`} className="text-sm font-medium">
                      Custom Resolution
                    </Label>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setCustomEditing({
                        ...customEditing, 
                        [lineIndex]: !customEditing[lineIndex]
                      })}
                    >
                      {customEditing[lineIndex] ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Done
                        </>
                      ) : (
                        <>
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <Textarea
                    id={`custom-content-${lineIndex}`}
                    value={line.customContent || ''}
                    onChange={(e) => handleCustomContentChange(e.target.value, lineIndex)}
                    disabled={!customEditing[lineIndex]}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="justify-between">
        <div className="flex items-center text-sm text-gray-500">
          {allConflictsResolved ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>All conflicts in this file resolved</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>Resolve all conflicts to continue</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            disabled={!canGoNext && allConflictsResolved}
            onClick={canGoNext ? goToNextConflict : undefined}
          >
            {canGoNext ? (
              <>Next Conflict</>
            ) : (
              <>Done</>
            )}
          </Button>
          
          <Button 
            disabled={!allConflictsResolved || isResolving || isResolved}
            onClick={handleSubmitResolution}
          >
            {isResolving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resolving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {isResolved ? 'Resolved' : 'Resolve File'}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}