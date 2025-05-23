'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HardDrive, 
  BarChart, 
  Clock, 
  AlertCircle, 
  Zap, 
  Check, 
  ChevronUp, 
  Upload,
  Database,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface StorageStats {
  repositoryId: string;
  blobCount: number;
  storageSize: number;
  formattedSize: string;
  allocation?: {
    id: string;
    sizeBytes: number;
    usedBytes: number;
    tier: number;
    createdAt: number;
    expiresAt: number;
    autoRenew: boolean;
    utilization: number;
  };
}

interface StorageUsageHistoryItem {
  date: string;
  sizeBytes: number;
}

interface StorageDashboardProps {
  repositoryOwner: string;
  repositoryName: string;
  repositoryId: string;
}

/**
 * StorageDashboard component displays storage usage and allocation information
 */
export function StorageDashboard({ repositoryOwner, repositoryName, repositoryId }: StorageDashboardProps) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [storageHistory, setStorageHistory] = useState<StorageUsageHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch storage statistics
  useEffect(() => {
    async function fetchStorageStats() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, call API to get stats
        // For now, use mock data with a delay
        setTimeout(() => {
          setStats(mockStorageStats);
          setStorageHistory(mockStorageHistory);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching storage stats:', err);
        setError('Failed to load storage statistics');
        setIsLoading(false);
      }
    }
    
    fetchStorageStats();
  }, [repositoryId]);
  
  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };
  
  // Format date to human-readable format
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };
  
  // Calculate time remaining until expiration
  const getTimeRemaining = (expiresAt: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const secondsRemaining = expiresAt - now;
    
    if (secondsRemaining <= 0) {
      return 'Expired';
    }
    
    const days = Math.floor(secondsRemaining / 86400);
    
    if (days > 30) {
      return `${Math.floor(days / 30)} months, ${days % 30} days`;
    }
    
    return `${days} days`;
  };
  
  // Calculate warning level based on usage percentage
  const getUtilizationWarningLevel = (percentage: number): 'none' | 'warning' | 'critical' => {
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    return 'none';
  };
  
  // Calculate warning level based on time remaining
  const getExpirationWarningLevel = (expiresAt: number): 'none' | 'warning' | 'critical' => {
    const now = Math.floor(Date.now() / 1000);
    const daysRemaining = Math.floor((expiresAt - now) / 86400);
    
    if (daysRemaining <= 3) return 'critical';
    if (daysRemaining <= 7) return 'warning';
    return 'none';
  };
  
  // Get tier name
  const getTierName = (tier: number): string => {
    const tiers = ['Basic', 'Standard', 'Premium', 'Custom'];
    return tiers[tier];
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <h3 className="text-lg font-medium">No storage data found</h3>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage
        </CardTitle>
        {stats.allocation && (
          <CardDescription>
            {getTierName(stats.allocation.tier)} tier · {formatBytes(stats.allocation.sizeBytes)}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Storage Usage Overview */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h3 className="text-sm font-medium">Storage Usage</h3>
            <div className="text-sm text-gray-500">
              {stats.formattedSize} used
              {stats.allocation && (
                <span> of {formatBytes(stats.allocation.sizeBytes)}</span>
              )}
            </div>
          </div>
          
          {stats.allocation ? (
            <>
              <Progress 
                value={stats.allocation.utilization} 
                className={`h-2 ${
                  getUtilizationWarningLevel(stats.allocation.utilization) === 'critical' ? 'bg-red-100' : 
                  getUtilizationWarningLevel(stats.allocation.utilization) === 'warning' ? 'bg-amber-100' : 
                  'bg-gray-100'
                }`}
              />
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <div>
                  {stats.allocation.utilization.toFixed(1)}% used
                </div>
                <div className="flex items-center gap-2">
                  <span>Total Files: {stats.blobCount}</span>
                </div>
              </div>
              
              {getUtilizationWarningLevel(stats.allocation.utilization) !== 'none' && (
                <Alert variant={getUtilizationWarningLevel(stats.allocation.utilization) === 'critical' ? 'destructive' : 'default'} className="mt-2 py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {getUtilizationWarningLevel(stats.allocation.utilization) === 'critical' 
                      ? 'Storage almost full! Upgrade to avoid issues.'
                      : 'Storage usage is high. Consider upgrading soon.'}
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-center py-4 border rounded-md">
              <Database className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-2">No storage allocation found</p>
              <Button size="sm" variant="outline">Create Allocation</Button>
            </div>
          )}
        </div>
        
        {/* Storage Allocation Details */}
        {stats.allocation && (
          <>
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Allocation Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Tier</p>
                        <p className="text-sm font-medium">{getTierName(stats.allocation.tier)}</p>
                      </div>
                      <Badge variant="outline" className="font-normal">
                        {formatBytes(stats.allocation.sizeBytes)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Auto-Renew</p>
                      <div className="flex items-center">
                        {stats.allocation.autoRenew ? (
                          <>
                            <Check className="h-4 w-4 text-green-500 mr-1" />
                            <p className="text-sm font-medium">Enabled</p>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                            <p className="text-sm font-medium">Disabled</p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Created</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                        <p className="text-sm">{formatDate(stats.allocation.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={`shadow-none ${
                  getExpirationWarningLevel(stats.allocation.expiresAt) === 'critical' ? 'bg-red-50' :
                  getExpirationWarningLevel(stats.allocation.expiresAt) === 'warning' ? 'bg-amber-50' :
                  ''
                }`}>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Expires</p>
                      <div className="flex items-center">
                        <Clock className={`h-4 w-4 mr-1 ${
                          getExpirationWarningLevel(stats.allocation.expiresAt) === 'critical' ? 'text-red-500' :
                          getExpirationWarningLevel(stats.allocation.expiresAt) === 'warning' ? 'text-amber-500' :
                          'text-gray-500'
                        }`} />
                        <p className="text-sm">
                          {formatDate(stats.allocation.expiresAt)} 
                          <span className="text-xs ml-1">
                            ({getTimeRemaining(stats.allocation.expiresAt)})
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {getExpirationWarningLevel(stats.allocation.expiresAt) !== 'none' && (
                <Alert variant={getExpirationWarningLevel(stats.allocation.expiresAt) === 'critical' ? 'destructive' : 'default'} className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {getExpirationWarningLevel(stats.allocation.expiresAt) === 'critical' 
                      ? 'Storage allocation expires very soon! Renew now to avoid data loss.'
                      : 'Storage allocation expires soon. Consider renewing.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <ChevronUp className="h-4 w-4" />
                Upgrade
              </Button>
              
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Renew
              </Button>
            </div>
          </>
        )}
      </CardContent>
      
      {/* Storage Actions Footer */}
      <CardFooter className="flex justify-between border-t pt-4">
        <Button size="sm" variant="outline" asChild>
          <Link href={`/repositories/${repositoryOwner}/${repositoryName}/storage`}>
            <BarChart className="h-4 w-4 mr-2" />
            Storage Analytics
          </Link>
        </Button>
        
        <Button size="sm" asChild>
          <Link href={`/repositories/${repositoryOwner}/${repositoryName}/storage/manage`}>
            <Zap className="h-4 w-4 mr-2" />
            Manage Storage
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Mock data for testing
const mockStorageStats: StorageStats = {
  repositoryId: 'repo-123',
  blobCount: 247,
  storageSize: 536870912, // 512 MB
  formattedSize: '512 MB',
  allocation: {
    id: 'alloc-123',
    sizeBytes: 1073741824, // 1 GB
    usedBytes: 536870912, // 512 MB
    tier: 1, // Standard
    createdAt: Math.floor(Date.now() / 1000) - 30 * 86400, // 30 days ago
    expiresAt: Math.floor(Date.now() / 1000) + 15 * 86400, // 15 days from now
    autoRenew: true,
    utilization: 50
  }
};

const mockStorageHistory: StorageUsageHistoryItem[] = [
  { date: '2025-03-01', sizeBytes: 104857600 },   // 100 MB
  { date: '2025-03-08', sizeBytes: 209715200 },   // 200 MB
  { date: '2025-03-15', sizeBytes: 314572800 },   // 300 MB
  { date: '2025-03-22', sizeBytes: 419430400 },   // 400 MB
  { date: '2025-03-29', sizeBytes: 482344960 },   // 460 MB
  { date: '2025-04-05', sizeBytes: 536870912 },   // 512 MB
];