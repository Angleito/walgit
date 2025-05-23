'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  BarChart3,
  HardDrive,
  HardDriveDownload,
  HardDriveUpload,
  AlertCircle,
  Clock,
  Calendar,
  RefreshCw,
  Zap,
  Plus,
  Upload,
  DownloadCloud
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

interface StorageHistoryData {
  date: string;
  sizeBytes: number;
}

interface StorageActivity {
  id: string;
  type: 'upload' | 'download' | 'delete';
  fileName: string;
  fileSize: number;
  timestamp: string;
  user: string;
}

interface BlobStat {
  fileType: string;
  count: number;
  size: number;
}

/**
 * Storage Analytics page shows detailed storage usage for a repository
 */
export default function StorageAnalyticsPage() {
  const params = useParams();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [historyData, setHistoryData] = useState<StorageHistoryData[]>([]);
  const [activities, setActivities] = useState<StorageActivity[]>([]);
  const [blobStats, setBlobStats] = useState<BlobStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchStorageData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real implementation, call API to get data
        // For now, use mock data with a delay
        setTimeout(() => {
          setStats(mockStorageStats);
          setHistoryData(mockHistoryData);
          setActivities(mockActivities);
          setBlobStats(mockBlobStats);
          setIsLoading(false);
        }, 500);
      } catch (err) {
        console.error('Error fetching storage data:', err);
        setError('Failed to load storage data');
        setIsLoading(false);
      }
    }
    
    fetchStorageData();
  }, [params.owner, params.repo]);
  
  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };
  
  // Format date
  const formatDate = (timestamp: number | string): string => {
    const date = typeof timestamp === 'number' 
      ? new Date(timestamp * 1000)
      : new Date(timestamp);
    
    return date.toLocaleDateString();
  };
  
  // Get activity icon
  const getActivityIcon = (type: 'upload' | 'download' | 'delete') => {
    switch (type) {
      case 'upload':
        return <HardDriveUpload className="h-4 w-4 text-green-500" />;
      case 'download':
        return <HardDriveDownload className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  // Get tier name
  const getTierName = (tier: number): string => {
    const tiers = ['Basic', 'Standard', 'Premium', 'Custom'];
    return tiers[tier];
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/repositories/${params.owner}/${params.repo}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            <span>Storage Analytics</span>
          </h1>
        </div>
        
        <p className="text-gray-500">
          View and manage storage usage for {params.owner}/{params.repo}
        </p>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Total Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.formattedSize}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats?.blobCount} files stored
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Storage Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.allocation ? (
              <>
                <div className="text-3xl font-bold">
                  {stats.allocation.utilization.toFixed(1)}%
                </div>
                <div className="mt-2">
                  <Progress value={stats.allocation.utilization} className="h-2" />
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  of {formatBytes(stats.allocation.sizeBytes)} allocated
                </div>
              </>
            ) : (
              <div className="text-center py-2">
                <div className="text-sm text-gray-500">No allocation found</div>
                <Button size="sm" variant="outline" className="mt-2">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Allocation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Remaining
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.allocation ? (
              <>
                <div className="text-3xl font-bold">
                  {Math.max(0, Math.floor((stats.allocation.expiresAt - Math.floor(Date.now() / 1000)) / 86400))} days
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Expires on {formatDate(stats.allocation.expiresAt)}
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className={
                    stats.allocation.autoRenew ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }>
                    {stats.allocation.autoRenew ? "Auto-renew enabled" : "Auto-renew disabled"}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500 py-4">
                No allocation found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for detailed analytics */}
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="usage">Usage History</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="breakdown">Storage Breakdown</TabsTrigger>
        </TabsList>
        
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage History</CardTitle>
              <CardDescription>
                View how your storage usage has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyData.length > 0 ? (
                <div className="h-80 w-full">
                  {/* In a real implementation, use a chart library like Recharts */}
                  <div className="border rounded-md p-4 h-full flex items-end">
                    {historyData.map((item, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="bg-blue-500 rounded-t-sm w-8" 
                          style={{ 
                            height: `${(item.sizeBytes / Math.max(...historyData.map(d => d.sizeBytes))) * 200}px`
                          }}
                        />
                        <div className="text-xs mt-2 text-gray-500">
                          {item.date.split('-')[1]}/{item.date.split('-')[2]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No usage history available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Monthly Growth</div>
                  <div className="text-2xl font-bold text-green-600">+32.4%</div>
                  <div className="text-sm text-gray-500">vs. previous month</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Average File Size</div>
                  <div className="text-2xl font-bold">{formatBytes(stats?.storageSize! / stats?.blobCount!)}</div>
                  <div className="text-sm text-gray-500">across all files</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Projected Full Date</div>
                  <div className="text-2xl font-bold">Jul 15, 2025</div>
                  <div className="text-sm text-gray-500">at current growth rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent storage operations in your repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start p-3 border rounded-md">
                      <div className="mr-3 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{activity.fileName}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm">
                          {activity.type === 'upload' ? 'Uploaded' :
                           activity.type === 'download' ? 'Downloaded' : 'Deleted'} by {activity.user}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatBytes(activity.fileSize)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No activity recorded yet
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Load More Activity</Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-sm">Today</div>
                    <div className="text-sm font-medium">{formatBytes(12582912)}</div>
                  </div>
                  <Progress value={20} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">This Week</div>
                    <div className="text-sm font-medium">{formatBytes(83886080)}</div>
                  </div>
                  <Progress value={50} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm">This Month</div>
                    <div className="text-sm font-medium">{formatBytes(209715200)}</div>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-xs font-medium">JD</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">johndoe</div>
                        <div className="text-xs text-gray-500">43 operations</div>
                      </div>
                    </div>
                    <div className="text-sm">{formatBytes(125829120)}</div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-xs font-medium">AS</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">alice_smith</div>
                        <div className="text-xs text-gray-500">28 operations</div>
                      </div>
                    </div>
                    <div className="text-sm">{formatBytes(83886080)}</div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-xs font-medium">BW</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">bob_walker</div>
                        <div className="text-xs text-gray-500">15 operations</div>
                      </div>
                    </div>
                    <div className="text-sm">{formatBytes(41943040)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="breakdown" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Storage by File Type</CardTitle>
              <CardDescription>
                Breakdown of storage usage by file type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blobStats.length > 0 ? (
                <div className="space-y-4">
                  {blobStats.map((stat, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium">{stat.fileType}</div>
                        <div className="text-sm">{formatBytes(stat.size)} ({((stat.size / stats!.storageSize) * 100).toFixed(1)}%)</div>
                      </div>
                      <Progress 
                        value={(stat.size / stats!.storageSize) * 100} 
                        className="h-2"
                        style={{
                          backgroundColor: index % 2 === 0 ? '#e0f2fe' : '#e0e7ff',
                          '--tw-progress-fill-color': index % 2 === 0 ? '#3b82f6' : '#6366f1'
                        } as any}
                      />
                      <div className="text-xs text-gray-500">{stat.count} files</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No file type breakdown available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Large Files</CardTitle>
              <CardDescription>
                Files taking up the most storage space
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-medium">.zip</span>
                    </div>
                    <div>
                      <div className="font-medium">project-archive.zip</div>
                      <div className="text-xs text-gray-500">Added 2 weeks ago</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{formatBytes(52428800)}</div>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-medium">.mp4</span>
                    </div>
                    <div>
                      <div className="font-medium">demo-video.mp4</div>
                      <div className="text-xs text-gray-500">Added 5 days ago</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{formatBytes(41943040)}</div>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center">
                      <span className="text-xs font-medium">.bin</span>
                    </div>
                    <div>
                      <div className="font-medium">data-model.bin</div>
                      <div className="text-xs text-gray-500">Added 3 weeks ago</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{formatBytes(31457280)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/repositories/${params.owner}/${params.repo}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Repository
          </Link>
        </Button>
        
        <div className="space-x-2">
          <Button variant="outline">
            <DownloadCloud className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          
          <Button asChild>
            <Link href={`/repositories/${params.owner}/${params.repo}/storage/manage`}>
              <Zap className="h-4 w-4 mr-2" />
              Manage Storage
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Mock data for testing
const mockStorageStats = {
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

const mockHistoryData = [
  { date: '2025-03-01', sizeBytes: 104857600 },   // 100 MB
  { date: '2025-03-08', sizeBytes: 209715200 },   // 200 MB
  { date: '2025-03-15', sizeBytes: 314572800 },   // 300 MB
  { date: '2025-03-22', sizeBytes: 419430400 },   // 400 MB
  { date: '2025-03-29', sizeBytes: 482344960 },   // 460 MB
  { date: '2025-04-05', sizeBytes: 536870912 },   // 512 MB
];

const mockActivities = [
  { 
    id: 'act-1', 
    type: 'upload', 
    fileName: 'large-dataset.csv', 
    fileSize: 52428800, // 50 MB 
    timestamp: '2025-04-05T14:30:00Z',
    user: 'johndoe'
  },
  { 
    id: 'act-2', 
    type: 'download', 
    fileName: 'project-docs.pdf', 
    fileSize: 15728640, // 15 MB
    timestamp: '2025-04-04T09:45:00Z',
    user: 'alice_smith'
  },
  { 
    id: 'act-3', 
    type: 'upload', 
    fileName: 'analysis-results.json', 
    fileSize: 8388608, // 8 MB
    timestamp: '2025-04-03T16:20:00Z',
    user: 'bob_walker'
  },
  { 
    id: 'act-4', 
    type: 'delete', 
    fileName: 'outdated-config.xml', 
    fileSize: 1048576, // 1 MB
    timestamp: '2025-04-02T11:15:00Z',
    user: 'johndoe'
  },
  { 
    id: 'act-5', 
    type: 'upload', 
    fileName: 'application-logs.txt', 
    fileSize: 31457280, // 30 MB
    timestamp: '2025-04-01T08:50:00Z',
    user: 'alice_smith'
  }
];

const mockBlobStats = [
  { fileType: 'Data Files (.csv, .json)', count: 78, size: 209715200 }, // 200 MB
  { fileType: 'Documents (.pdf, .docx)', count: 42, size: 125829120 }, // 120 MB
  { fileType: 'Source Code (.js, .py, .java)', count: 96, size: 31457280 }, // 30 MB
  { fileType: 'Images (.png, .jpg)', count: 23, size: 83886080 }, // 80 MB
  { fileType: 'Archives (.zip, .tar)', count: 8, size: 85983232 } // 82 MB
];