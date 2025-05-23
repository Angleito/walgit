'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { MergeUI, MergeContext, MergeConflictLine } from '@/components/merge';

/**
 * Sample page for the merge UI
 * In a real implementation, data would be fetched from API
 */
export default function MergePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [mergeContext, setMergeContext] = useState<MergeContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch merge data
  useEffect(() => {
    async function fetchMergeData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, data would be fetched from API
        // For demonstration, we'll use mock data
        setTimeout(() => {
          setMergeContext(mockMergeContext);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error('Error fetching merge data:', err);
        setError('Failed to load merge data');
        setIsLoading(false);
      }
    }

    fetchMergeData();
  }, [params.owner, params.repo]);

  // Handle resolving a conflict
  const handleResolveConflict = async (filePath: string, resolution: MergeConflictLine[][]) => {
    // In a real implementation, this would call the API
    console.log(`Resolving conflict in file: ${filePath}`);
    console.log('Resolution:', resolution);
    
    // Mock successful resolution
    return new Promise<void>(resolve => {
      setTimeout(() => {
        toast({
          title: "Conflict resolved",
          description: `Successfully resolved conflicts in ${filePath}`,
        });
        resolve();
      }, 1000);
    });
  };

  // Handle aborting the merge
  const handleAbortMerge = async () => {
    // In a real implementation, this would call the API
    console.log('Aborting merge');
    
    // Mock abort operation
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Merge aborted",
          description: "The merge operation has been aborted",
        });
        router.push(`/repositories/${params.owner}/${params.repo}`);
        resolve();
      }, 1500);
    });
  };

  // Handle completing the merge
  const handleCompleteMerge = async (message: string) => {
    // In a real implementation, this would call the API
    console.log(`Completing merge with message: ${message}`);
    
    // Mock completion operation
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        toast({
          title: "Merge completed",
          description: "The branches have been successfully merged",
        });
        router.push(`/repositories/${params.owner}/${params.repo}`);
        resolve();
      }, 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium">Loading merge details...</h2>
        </div>
      </div>
    );
  }

  if (error || !mergeContext) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error || 'Failed to load merge data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <MergeUI
        mergeContext={mergeContext}
        onAbort={handleAbortMerge}
        onComplete={handleCompleteMerge}
        onResolveConflict={handleResolveConflict}
      />
    </div>
  );
}

// Mock data for demonstration
const mockMergeContext: MergeContext = {
  sourceBranch: 'feature/new-ui',
  targetBranch: 'main',
  conflicts: [
    {
      filePath: 'src/components/Header.tsx',
      resolved: false,
      conflicts: [
        [
          {
            lineNumber: 15,
            current: 'import { Button } from "./ui/button";',
            incoming: 'import { Button, IconButton } from "./ui/button";',
            resolution: undefined
          },
          {
            lineNumber: 16,
            current: 'import { Search } from "lucide-react";',
            incoming: 'import { Search, Menu } from "lucide-react";',
            resolution: undefined
          }
        ],
        [
          {
            lineNumber: 42,
            current: '  return (',
            incoming: '  return (',
            resolution: undefined
          },
          {
            lineNumber: 43,
            current: '    <header className="bg-white border-b">',
            incoming: '    <header className="bg-gray-50 border-b dark:bg-gray-900">',
            resolution: undefined
          },
          {
            lineNumber: 44,
            current: '      <div className="container mx-auto px-4 py-3 flex justify-between items-center">',
            incoming: '      <div className="container mx-auto px-4 py-4 flex justify-between items-center">',
            resolution: undefined
          }
        ]
      ]
    },
    {
      filePath: 'src/components/Footer.tsx',
      resolved: false,
      conflicts: [
        [
          {
            lineNumber: 22,
            current: 'export function Footer() {',
            incoming: 'export function Footer({ showSocial = true }) {',
            resolution: undefined
          },
          {
            lineNumber: 23,
            current: '  return (',
            incoming: '  return (',
            resolution: undefined
          }
        ]
      ]
    },
    {
      filePath: 'src/styles/globals.css',
      resolved: true,
      conflicts: [
        [
          {
            lineNumber: 8,
            current: '  --background: 0 0% 100%;',
            incoming: '  --background: 0 0% 98%;',
            resolution: 'incoming'
          },
          {
            lineNumber: 9,
            current: '  --foreground: 222.2 47.4% 11.2%;',
            incoming: '  --foreground: 222.2 47.4% 11.2%;',
            resolution: 'both'
          }
        ]
      ]
    }
  ],
  files: [
    {
      filePath: 'src/components/Header.tsx',
      status: 'conflicted',
      stats: {
        additions: 5,
        deletions: 3
      }
    },
    {
      filePath: 'src/components/Footer.tsx',
      status: 'conflicted',
      stats: {
        additions: 2,
        deletions: 1
      }
    },
    {
      filePath: 'src/components/Sidebar.tsx',
      status: 'modified',
      stats: {
        additions: 12,
        deletions: 8
      }
    },
    {
      filePath: 'src/styles/globals.css',
      status: 'modified',
      stats: {
        additions: 4,
        deletions: 2
      }
    },
    {
      filePath: 'src/hooks/use-theme.ts',
      status: 'added',
      stats: {
        additions: 35,
        deletions: 0
      }
    },
    {
      filePath: 'src/components/ThemeSwitcher.tsx',
      status: 'added',
      stats: {
        additions: 42,
        deletions: 0
      }
    }
  ],
  committerName: 'John Doe',
  committerEmail: 'john.doe@example.com'
};