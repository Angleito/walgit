/**
 * @fileoverview Advanced encryption management panel for SEAL integration
 * Comprehensive interface for managing threshold encryption, key rotation, and access control
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Key, 
  Users, 
  Clock, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Trash2,
  Plus,
  Download,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface EncryptionPolicy {
  id: string;
  name: string;
  algorithm: string;
  threshold: number;
  totalShares: number;
  createdAt: string;
  lastRotated: string;
  nextRotation: string;
  status: 'active' | 'rotating' | 'deprecated';
  accessList: AccessEntry[];
}

interface AccessEntry {
  address: string;
  alias?: string;
  role: 'owner' | 'admin' | 'writer' | 'reader';
  grantedAt: string;
  grantedBy: string;
  lastAccess?: string;
  shareIds: string[];
}

interface EncryptionManagementPanelProps {
  repositoryId: string;
  currentPolicy?: EncryptionPolicy;
  onPolicyUpdate?: (policy: EncryptionPolicy) => void;
  onAccessChange?: (accessList: AccessEntry[]) => void;
  className?: string;
}

export function EncryptionManagementPanel({
  repositoryId,
  currentPolicy,
  onPolicyUpdate,
  onAccessChange,
  className
}: EncryptionManagementPanelProps) {
  const [isRotating, setIsRotating] = useState(false);
  const [rotationProgress, setRotationProgress] = useState(0);
  const [showKeys, setShowKeys] = useState(false);
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'writer' | 'reader'>('reader');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data for demonstration
  const mockPolicy: EncryptionPolicy = useMemo(() => currentPolicy || {
    id: 'policy_threshold_789',
    name: 'Repository Threshold Policy',
    algorithm: 'SEAL Threshold Encryption',
    threshold: 2,
    totalShares: 3,
    createdAt: '2024-01-15T10:30:00Z',
    lastRotated: '2024-01-20T14:45:00Z',
    nextRotation: '2024-04-20T14:45:00Z',
    status: 'active',
    accessList: [
      {
        address: '0x123456789abcdef123456789abcdef123456789a',
        alias: 'alice.eth',
        role: 'owner',
        grantedAt: '2024-01-15T10:30:00Z',
        grantedBy: 'system',
        lastAccess: '2024-01-21T09:15:00Z',
        shareIds: ['share_1', 'share_2']
      },
      {
        address: '0x987654321fedcba987654321fedcba987654321f',
        alias: 'bob.dev',
        role: 'writer',
        grantedAt: '2024-01-16T16:20:00Z',
        grantedBy: '0x123456789abcdef123456789abcdef123456789a',
        lastAccess: '2024-01-21T11:30:00Z',
        shareIds: ['share_3']
      }
    ]
  }, [currentPolicy]);

  const handleKeyRotation = useCallback(async () => {
    setIsRotating(true);
    setRotationProgress(0);

    try {
      // Simulate key rotation process
      const steps = [
        { progress: 20, message: 'Generating new key shares...' },
        { progress: 40, message: 'Updating access policies...' },
        { progress: 60, message: 'Re-encrypting repository data...' },
        { progress: 80, message: 'Distributing new shares...' },
        { progress: 100, message: 'Rotation complete!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRotationProgress(step.progress);
      }

      // Update policy with new rotation timestamp
      const updatedPolicy = {
        ...mockPolicy,
        lastRotated: new Date().toISOString(),
        nextRotation: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const
      };

      onPolicyUpdate?.(updatedPolicy);
    } finally {
      setIsRotating(false);
      setRotationProgress(0);
    }
  }, [mockPolicy, onPolicyUpdate]);

  const addUserAccess = useCallback(() => {
    if (!newUserAddress.trim()) return;

    const newAccess: AccessEntry = {
      address: newUserAddress,
      role: newUserRole,
      grantedAt: new Date().toISOString(),
      grantedBy: mockPolicy.accessList[0].address, // Current user
      shareIds: [`share_${Date.now()}`]
    };

    const updatedAccessList = [...mockPolicy.accessList, newAccess];
    onAccessChange?.(updatedAccessList);
    setNewUserAddress('');
    setNewUserRole('reader');
  }, [newUserAddress, newUserRole, mockPolicy.accessList, onAccessChange]);

  const removeUserAccess = useCallback((address: string) => {
    const updatedAccessList = mockPolicy.accessList.filter(entry => entry.address !== address);
    onAccessChange?.(updatedAccessList);
  }, [mockPolicy.accessList, onAccessChange]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'writer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'reader': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rotating': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'deprecated': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Encryption Management</h2>
            <p className="text-gray-400">Manage SEAL threshold encryption and access control</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(mockPolicy.status)}>
              <Shield className="h-3 w-3 mr-1" />
              {mockPolicy.status}
            </Badge>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="access">Access Control</TabsTrigger>
            <TabsTrigger value="rotation">Key Rotation</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy Information */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-cyan-400" />
                    Encryption Policy
                  </CardTitle>
                  <CardDescription>Current encryption configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-400">Algorithm</Label>
                      <p className="font-mono text-cyan-400">{mockPolicy.algorithm}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Policy ID</Label>
                      <p className="font-mono text-gray-300 truncate">{mockPolicy.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Threshold</Label>
                      <p className="text-lg font-bold text-green-400">
                        {mockPolicy.threshold} of {mockPolicy.totalShares}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Created</Label>
                      <p className="text-gray-300">
                        {new Date(mockPolicy.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-300">
                      This repository requires <strong>{mockPolicy.threshold}</strong> key shares 
                      to decrypt content. {mockPolicy.totalShares} shares are distributed among authorized users.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Access Summary */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    Access Summary
                  </CardTitle>
                  <CardDescription>Current access permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {mockPolicy.accessList.map((entry) => (
                      <div key={entry.address} className="flex items-center justify-between p-2 rounded bg-gray-700/30">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                            {entry.alias?.[0]?.toUpperCase() || entry.address[2]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {entry.alias || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                            </p>
                            <Badge className={getRoleColor(entry.role)} size="sm">
                              {entry.role}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {entry.shareIds.length} share{entry.shareIds.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full" variant="outline" onClick={() => setSelectedTab('access')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Access
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Security Status */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="font-medium text-green-400">Encryption Active</p>
                      <p className="text-xs text-green-300">All data encrypted</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded bg-blue-500/10 border border-blue-500/20">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="font-medium text-blue-400">Key Rotation</p>
                      <p className="text-xs text-blue-300">Next: 88 days</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded bg-purple-500/10 border border-purple-500/20">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="font-medium text-purple-400">Access Control</p>
                      <p className="text-xs text-purple-300">{mockPolicy.accessList.length} authorized users</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Access Control Tab */}
          <TabsContent value="access" className="space-y-6">
            {/* Add New User */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Grant Access</CardTitle>
                <CardDescription>Add new users to the encryption policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="user-address">User Address</Label>
                    <Input
                      id="user-address"
                      placeholder="0x..."
                      value={newUserAddress}
                      onChange={(e) => setNewUserAddress(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-role">Role</Label>
                    <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="reader">Reader</SelectItem>
                        <SelectItem value="writer">Writer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addUserAccess} disabled={!newUserAddress.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Grant Access
                </Button>
              </CardContent>
            </Card>

            {/* Access List */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Current Access List</CardTitle>
                <CardDescription>Users with access to encrypted content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPolicy.accessList.map((entry) => (
                    <motion.div
                      key={entry.address}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 rounded border border-gray-700 bg-gray-700/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
                          {entry.alias?.[0]?.toUpperCase() || entry.address[2]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-200">
                              {entry.alias || {"'Unknown User'"}}
                            </p>
                            <Badge className={getRoleColor(entry.role)}>
                              {entry.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 font-mono">
                            {entry.address}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                            <span>Granted: {new Date(entry.grantedAt).toLocaleDateString()}</span>
                            {entry.lastAccess && (
                              <span>Last access: {new Date(entry.lastAccess).toLocaleDateString()}</span>
                            )}
                            <span>{entry.shareIds.length} key share{entry.shareIds.length !== 1 ? {"'s'"} : {"''"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy address</TooltipContent>
                        </Tooltip>

                        {entry.role !== 'owner' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => removeUserAccess(entry.address)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove access</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Key Rotation Tab */}
          <TabsContent value="rotation" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-orange-400" />
                  Key Rotation
                </CardTitle>
                <CardDescription>Manage encryption key lifecycle and rotation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Rotation Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Last Rotation</Label>
                    <p className="text-lg font-medium text-gray-200">
                      {new Date(mockPolicy.lastRotated).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      {Math.floor((Date.now() - new Date(mockPolicy.lastRotated).getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Next Scheduled</Label>
                    <p className="text-lg font-medium text-gray-200">
                      {new Date(mockPolicy.nextRotation).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      in {Math.floor((new Date(mockPolicy.nextRotation).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </div>

                {/* Rotation Progress */}
                <AnimatePresence>
                  {isRotating && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Rotating encryption keys...</span>
                        <span className="text-sm text-gray-400">{rotationProgress}%</span>
                      </div>
                      <Progress value={rotationProgress} className="h-2" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rotation Actions */}
                <div className="space-y-4">
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300">
                      Key rotation will temporarily interrupt access for all users. 
                      Ensure all team members are available to re-authenticate.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleKeyRotation}
                      disabled={isRotating}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {isRotating ? 'Rotating...' : 'Rotate Keys Now'}
                    </Button>

                    <Button variant="outline" disabled={isRotating}>
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule Rotation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle>Advanced Configuration</CardTitle>
                <CardDescription>Expert-level encryption settings and diagnostics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Policy Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Policy Details</Label>
                    <Switch checked={showKeys} onCheckedChange={setShowKeys} />
                  </div>

                  <AnimatePresence>
                    {showKeys && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Textarea
                          value={JSON.stringify(mockPolicy, null, 2)}
                          readOnly
                          className="bg-gray-900 border-gray-600 font-mono text-xs h-40"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Separator className="bg-gray-700" />

                {/* Export/Import */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-200">Policy Management</h4>
                  <div className="flex gap-4">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Policy
                    </Button>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Policy
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Danger Zone */}
                <div className="space-y-4">
                  <h4 className="font-medium text-red-400">Danger Zone</h4>
                  <Alert className="bg-red-500/10 border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">
                      These actions are irreversible and will affect all repository access.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive">
                          Disable Encryption
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-900 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-red-400">Disable Encryption</DialogTitle>
                          <DialogDescription>
                            This will permanently disable encryption for this repository. 
                            All encrypted data will be decrypted and stored in plain text.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-4">
                          <Button variant="outline">Cancel</Button>
                          <Button variant="destructive">Confirm Disable</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}