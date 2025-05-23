'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft,
  HardDrive,
  AlertCircle,
  Clock,
  Calendar,
  RefreshCw,
  Zap,
  BarChart3,
  CreditCard,
  Check,
  Info,
  ShieldCheck
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

interface TierOption {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  duration: string;
  durationDays: number;
  price: number;
  features: string[];
}

/**
 * Storage Management page allows users to create, upgrade, or renew storage allocations
 */
export default function StorageManagePage() {
  const params = useParams();
  const router = useRouter();
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('standard');
  const [customSize, setCustomSize] = useState<number>(5); // GB
  const [customDuration, setCustomDuration] = useState<number>(30); // days
  const [autoRenew, setAutoRenew] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  
  // Define tier options
  const tierOptions: TierOption[] = [
    {
      id: 'basic',
      name: 'Basic',
      size: '100 MB',
      sizeBytes: 104857600,
      duration: '30 days',
      durationDays: 30,
      price: 1,
      features: [
        '100 MB storage',
        '30-day storage period',
        'Basic metrics',
        'Manual renewal'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      size: '1 GB',
      sizeBytes: 1073741824,
      duration: '180 days',
      durationDays: 180,
      price: 5,
      features: [
        '1 GB storage',
        '180-day storage period',
        'Advanced metrics',
        'Auto-renewal option',
        'Priority support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      size: '10 GB',
      sizeBytes: 10737418240,
      duration: '365 days',
      durationDays: 365,
      price: 20,
      features: [
        '10 GB storage',
        '365-day storage period',
        'Comprehensive analytics',
        'Auto-renewal option',
        'Dedicated support',
        'Enhanced performance'
      ]
    },
    {
      id: 'custom',
      name: 'Custom',
      size: 'Custom',
      sizeBytes: 0,
      duration: 'Custom',
      durationDays: 0,
      price: 0,
      features: [
        'Custom storage size',
        'Custom duration',
        'All premium features',
        'Flexible pricing'
      ]
    }
  ];
  
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
          setIsLoading(false);
          
          // Set default selected tier based on current allocation
          if (mockStorageStats.allocation) {
            const tierMap = ['basic', 'standard', 'premium', 'custom'];
            setSelectedTier(tierMap[mockStorageStats.allocation.tier]);
            setAutoRenew(mockStorageStats.allocation.autoRenew);
          }
        }, 500);
      } catch (err) {
        console.error('Error fetching storage stats:', err);
        setError('Failed to load storage statistics');
        setIsLoading(false);
      }
    }
    
    fetchStorageStats();
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
  
  // Calculate custom tier price
  const calculateCustomPrice = (): number => {
    // Base price: 2 SUI per GB per month
    const basePrice = 2;
    const sizeMultiplier = customSize;
    const durationMultiplier = customDuration / 30; // Convert days to months
    
    return parseFloat((basePrice * sizeMultiplier * durationMultiplier).toFixed(2));
  };
  
  // Handle tier selection
  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
    
    // If custom tier, set default values
    if (tierId === 'custom') {
      setCustomSize(5); // 5 GB
      setCustomDuration(30); // 30 days
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setProcessing(true);
    
    try {
      // In a real implementation, call API to create/upgrade allocation
      console.log('Creating/upgrading allocation with:', {
        tier: selectedTier,
        customSize: selectedTier === 'custom' ? customSize : undefined,
        customDuration: selectedTier === 'custom' ? customDuration : undefined,
        autoRenew,
        repositoryId: params.repo
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to storage page
      router.push(`/repositories/${params.owner}/${params.repo}/storage`);
    } catch (err) {
      console.error('Error creating/upgrading allocation:', err);
      setError('Failed to create or upgrade storage allocation');
    } finally {
      setProcessing(false);
    }
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
          <AlertTitle>Error</AlertTitle>
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
          <Link href={`/repositories/${params.owner}/${params.repo}/storage`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive className="h-6 w-6" />
            <span>Manage Storage</span>
          </h1>
        </div>
        
        <p className="text-gray-500">
          Create, upgrade, or renew storage allocation for {params.owner}/{params.repo}
        </p>
      </div>
      
      {/* Current Allocation (if exists) */}
      {stats?.allocation && (
        <Card>
          <CardHeader>
            <CardTitle>Current Allocation</CardTitle>
            <CardDescription>
              Your current storage allocation for this repository
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">Tier</div>
                <div className="text-lg">{tierOptions[stats.allocation.tier].name}</div>
                <div className="text-sm text-gray-500">{formatBytes(stats.allocation.sizeBytes)}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Utilization</div>
                <div className="text-lg">{stats.allocation.utilization.toFixed(1)}%</div>
                <Progress value={stats.allocation.utilization} className="h-2 mt-1" />
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-medium">Expires</div>
                <div className="text-lg">{formatDate(stats.allocation.expiresAt)}</div>
                <div className="text-sm text-gray-500">
                  {getTimeRemaining(stats.allocation.expiresAt)} remaining
                </div>
              </div>
            </div>
            
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Allocation Management</AlertTitle>
              <AlertDescription>
                You can upgrade to a higher tier at any time. Time remaining on your current allocation will be credited toward the new tier.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
      
      {/* Tier Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{stats?.allocation ? 'Upgrade Storage Tier' : 'Select Storage Tier'}</CardTitle>
          <CardDescription>
            Choose a storage tier that fits your repository needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedTier} 
            onValueChange={handleTierSelect}
            className="space-y-4"
          >
            {tierOptions.map((tier, index) => {
              // Skip tiers at or below current tier for upgrades
              if (stats?.allocation && 
                 ['basic', 'standard', 'premium'].indexOf(tier.id) <= stats.allocation.tier && 
                 tier.id !== 'custom') {
                return null;
              }
              
              return (
                <div 
                  key={tier.id}
                  className={`flex items-start space-x-3 border rounded-lg p-4 ${
                    selectedTier === tier.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <RadioGroupItem 
                    value={tier.id} 
                    id={tier.id}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Label 
                          htmlFor={tier.id} 
                          className="text-lg font-medium"
                        >
                          {tier.name}
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">
                          {tier.id === 'custom' 
                            ? 'Customize storage size and duration to fit your needs'
                            : `${tier.size} for ${tier.duration}`}
                        </p>
                      </div>
                      <div className="text-lg font-bold">
                        {tier.id === 'custom' 
                          ? `${calculateCustomPrice()} SUI`
                          : `${tier.price} SUI`}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-2">Features:</div>
                      <ul className="space-y-1">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
          
          {/* Custom tier options */}
          {selectedTier === 'custom' && (
            <div className="mt-6 p-4 border rounded-lg space-y-6">
              <div className="space-y-2">
                <Label htmlFor="custom-size">Storage Size (GB)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="custom-size"
                    min={1}
                    max={50}
                    step={1}
                    value={[customSize]}
                    onValueChange={(value) => setCustomSize(value[0])}
                    className="flex-1"
                  />
                  <div className="w-16 text-center font-medium">
                    {customSize} GB
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-duration">Duration (days)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="custom-duration"
                    min={30}
                    max={365}
                    step={30}
                    value={[customDuration]}
                    onValueChange={(value) => setCustomDuration(value[0])}
                    className="flex-1"
                  />
                  <div className="w-16 text-center font-medium">
                    {customDuration} days
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium mb-1">Price Calculation:</div>
                <div className="text-sm">
                  {customSize} GB × {(customDuration / 30).toFixed(1)} months × 2 SUI = {calculateCustomPrice()} SUI
                </div>
              </div>
            </div>
          )}
          
          {/* Auto-renew option */}
          <div className="mt-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="auto-renew" 
                checked={autoRenew}
                onCheckedChange={setAutoRenew}
              />
              <Label htmlFor="auto-renew">Enable auto-renewal</Label>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-7">
              Automatically renew storage allocation before expiration to avoid data loss
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" asChild>
            <Link href={`/repositories/${params.owner}/${params.repo}/storage`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={processing}
          >
            {processing ? (
              <>Processing...</>
            ) : stats?.allocation ? (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Storage
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Create Allocation
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">What happens if my storage allocation expires?</h3>
            <p className="text-sm text-gray-600">
              If your storage allocation expires, your data remains intact for a 7-day grace period. 
              After the grace period, data may be marked for cleanup. To prevent data loss, renew your
              allocation before expiration or enable auto-renewal.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Can I downgrade my tier?</h3>
            <p className="text-sm text-gray-600">
              Direct downgrades are not supported. However, you can wait for your current allocation to expire,
              then create a new allocation with a lower tier. Make sure to backup any data that might exceed
              the lower tier&apos;s capacity.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">How is the cost calculated for the Custom tier?</h3>
            <p className="text-sm text-gray-600">
              Custom tier pricing is based on a rate of 2 SUI per GB per month. The final cost is 
              calculated by multiplying your selected storage size (in GB) by the duration (in months)
              by the rate (2 SUI).
            </p>
          </div>
        </CardContent>
      </Card>
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