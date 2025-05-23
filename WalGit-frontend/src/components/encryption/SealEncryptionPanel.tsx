/**
 * @fileoverview SEAL Encryption Panel with comprehensive UX
 * Demonstrates complete SEAL encryption workflow with wallet signing
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Shield, 
  Key, 
  Upload, 
  Download, 
  Share, 
  Lock, 
  Unlock, 
  Users, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  UserPlus,
  UserMinus,
  Settings
} from 'lucide-react';
import { useSealEncryption } from '@/hooks/use-seal-encryption';
import { useWallet } from '@mysten/dapp-kit';

interface EncryptionFormData {
  content: string;
  policyId: string;
  contentType: string;
  metadata: Record<string, string>;
}

interface PolicyFormData {
  name: string;
  threshold: number;
  shareholders: string[];
}

/**
 * Comprehensive SEAL Encryption Panel
 */
export function SealEncryptionPanel() {
  const { currentAccount } = useWallet();
  const {
    isLoading,
    progress,
    policies,
    error,
    createPolicy,
    encryptContent,
    decryptContent,
    shareAccess,
    revokeAccess,
    loadPolicies,
    checkAccess,
    isConnected,
    isReady
  } = useSealEncryption();

  // Form states
  const [encryptionForm, setEncryptionForm] = useState<EncryptionFormData>({
    content: '',
    policyId: '',
    contentType: 'text/plain',
    metadata: {}
  });

  const [policyForm, setPolicyForm] = useState<PolicyFormData>({
    name: '',
    threshold: 2,
    shareholders: ['']
  });

  const [decryptionData, setDecryptionData] = useState({
    encryptedContentId: '',
    dekId: '',
    policyId: ''
  });

  const [shareAccessData, setShareAccessData] = useState({
    policyId: '',
    recipientAddress: '',
    permissions: ['read']
  });

  const [activeTab, setActiveTab] = useState('encrypt');
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [showDecryptedContent, setShowDecryptedContent] = useState(false);

  /**
   * Handle encryption form submission
   */
  const handleEncrypt = useCallback(async () => {
    if (!encryptionForm.content || !encryptionForm.policyId) {
      toast.error('Please provide content and select a policy');
      return;
    }

    try {
      const result = await encryptContent(encryptionForm.content, {
        policyId: encryptionForm.policyId,
        contentType: encryptionForm.contentType,
        metadata: encryptionForm.metadata
      });

      toast.success('Content encrypted successfully!');
      
      // Show result dialog with copy-to-clipboard functionality
      const resultText = `Encrypted Content ID: ${result.encryptedContentId}\nDEK ID: ${result.dekId}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(resultText);
        toast.success('Result copied to clipboard');
      }

      // Reset form
      setEncryptionForm({ content: '', policyId: '', contentType: 'text/plain', metadata: {} });
      
    } catch (error: any) {
      toast.error(`Encryption failed: ${error.message}`);
    }
  }, [encryptionForm, encryptContent]);

  /**
   * Handle decryption form submission
   */
  const handleDecrypt = useCallback(async () => {
    if (!decryptionData.encryptedContentId || !decryptionData.dekId || !decryptionData.policyId) {
      toast.error('Please provide all required decryption parameters');
      return;
    }

    try {
      const result = await decryptContent(
        decryptionData.encryptedContentId,
        decryptionData.dekId,
        decryptionData.policyId
      );

      const decryptedText = new TextDecoder().decode(result);
      setDecryptedContent(decryptedText);
      setShowDecryptedContent(true);
      
      toast.success('Content decrypted successfully!');
      
    } catch (error: any) {
      toast.error(`Decryption failed: ${error.message}`);
    }
  }, [decryptionData, decryptContent]);

  /**
   * Handle policy creation
   */
  const handleCreatePolicy = useCallback(async () => {
    if (!policyForm.name || policyForm.shareholders.length === 0) {
      toast.error('Please provide policy name and at least one shareholder');
      return;
    }

    const validShareholders = policyForm.shareholders.filter(addr => addr.trim().length > 0);
    
    if (validShareholders.length < policyForm.threshold) {
      toast.error('Threshold cannot be greater than number of shareholders');
      return;
    }

    try {
      await createPolicy(policyForm.name, policyForm.threshold, validShareholders);
      
      toast.success('SEAL policy created successfully!');
      setShowCreatePolicy(false);
      
      // Reset form
      setPolicyForm({ name: '', threshold: 2, shareholders: [''] });
      
    } catch (error: any) {
      toast.error(`Policy creation failed: ${error.message}`);
    }
  }, [policyForm, createPolicy]);

  /**
   * Handle access sharing
   */
  const handleShareAccess = useCallback(async () => {
    if (!shareAccessData.policyId || !shareAccessData.recipientAddress) {
      toast.error('Please provide policy ID and recipient address');
      return;
    }

    try {
      await shareAccess(
        shareAccessData.policyId,
        shareAccessData.recipientAddress,
        shareAccessData.permissions
      );
      
      // Reset form
      setShareAccessData({ policyId: '', recipientAddress: '', permissions: ['read'] });
      
    } catch (error: any) {
      toast.error(`Access sharing failed: ${error.message}`);
    }
  }, [shareAccessData, shareAccess]);

  /**
   * Add shareholder input field
   */
  const addShareholderField = useCallback(() => {
    setPolicyForm(prev => ({
      ...prev,
      shareholders: [...prev.shareholders, '']
    }));
  }, []);

  /**
   * Remove shareholder input field
   */
  const removeShareholderField = useCallback((index: number) => {
    setPolicyForm(prev => ({
      ...prev,
      shareholders: prev.shareholders.filter((_, i) => i !== index)
    }));
  }, []);

  /**
   * Update shareholder address
   */
  const updateShareholder = useCallback((index: number, value: string) => {
    setPolicyForm(prev => ({
      ...prev,
      shareholders: prev.shareholders.map((addr, i) => i === index ? value : addr)
    }));
  }, []);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SEAL Encryption
          </CardTitle>
          <CardDescription>
            Connect your wallet to use SEAL encryption features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your Sui wallet to access SEAL encryption features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            SEAL Encryption Dashboard
          </CardTitle>
          <CardDescription>
            Secure your content with threshold encryption using SEAL protocol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={isReady ? 'default' : 'secondary'}>
              {isReady ? 'Ready' : 'Initializing...'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Connected as: {currentAccount?.address.substring(0, 8)}...
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadPolicies}
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Refresh Policies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Progress Display */}
      {progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.message}</span>
                <span>{Math.round(progress.progress)}%</span>
              </div>
              <Progress value={progress.progress} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {progress.stage}
                </Badge>
                {progress.details && (
                  <span>{JSON.stringify(progress.details)}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
          <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
        </TabsList>

        {/* Encryption Tab */}
        <TabsContent value="encrypt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Encrypt Content
              </CardTitle>
              <CardDescription>
                Encrypt your content using SEAL threshold encryption
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Content to Encrypt</Label>
                <Textarea
                  id="content"
                  placeholder="Enter the content you want to encrypt..."
                  value={encryptionForm.content}
                  onChange={(e) => setEncryptionForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="policy">SEAL Policy</Label>
                  <Select
                    value={encryptionForm.policyId}
                    onValueChange={(value) => setEncryptionForm(prev => ({ ...prev, policyId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a SEAL policy" />
                    </SelectTrigger>
                    <SelectContent>
                      {policies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.name} ({policy.threshold}/{policy.shares})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={encryptionForm.contentType}
                    onValueChange={(value) => setEncryptionForm(prev => ({ ...prev, contentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text/plain">Text</SelectItem>
                      <SelectItem value="application/json">JSON</SelectItem>
                      <SelectItem value="text/markdown">Markdown</SelectItem>
                      <SelectItem value="application/octet-stream">Binary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleEncrypt}
                  disabled={isLoading || !encryptionForm.content || !encryptionForm.policyId}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Encrypt Content
                </Button>

                {policies.length === 0 && (
                  <Button variant="outline" onClick={() => setShowCreatePolicy(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Create Policy
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decryption Tab */}
        <TabsContent value="decrypt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Unlock className="h-4 w-4" />
                Decrypt Content
              </CardTitle>
              <CardDescription>
                Decrypt content using your SEAL policy access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="encryptedContentId">Encrypted Content ID</Label>
                <Input
                  id="encryptedContentId"
                  placeholder="Enter the encrypted content ID from Walrus..."
                  value={decryptionData.encryptedContentId}
                  onChange={(e) => setDecryptionData(prev => ({ ...prev, encryptedContentId: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dekId">DEK ID</Label>
                <Input
                  id="dekId"
                  placeholder="Enter the encrypted DEK ID from Walrus..."
                  value={decryptionData.dekId}
                  onChange={(e) => setDecryptionData(prev => ({ ...prev, dekId: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decryptPolicyId">SEAL Policy ID</Label>
                <Select
                  value={decryptionData.policyId}
                  onValueChange={(value) => setDecryptionData(prev => ({ ...prev, policyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select the SEAL policy used for encryption" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.name} ({policy.threshold}/{policy.shares})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleDecrypt}
                disabled={isLoading || !decryptionData.encryptedContentId || !decryptionData.dekId || !decryptionData.policyId}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Unlock className="h-4 w-4 mr-2" />
                )}
                Decrypt Content
              </Button>

              {/* Decrypted Content Display */}
              {decryptedContent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Decrypted Content
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDecryptedContent(!showDecryptedContent)}
                      >
                        {showDecryptedContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {showDecryptedContent ? (
                      <div className="space-y-2">
                        <Textarea
                          value={decryptedContent}
                          readOnly
                          rows={6}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard?.writeText(decryptedContent);
                            toast.success('Content copied to clipboard');
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy to Clipboard
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Content hidden for security</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your SEAL Policies</h3>
            <Button onClick={() => setShowCreatePolicy(true)}>
              <Key className="h-4 w-4 mr-2" />
              Create New Policy
            </Button>
          </div>

          <div className="grid gap-4">
            {policies.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No SEAL policies found</p>
                    <p className="text-sm">Create your first policy to start encrypting content</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              policies.map((policy) => (
                <Card key={policy.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{policy.name}</span>
                      <Badge variant={policy.isActive ? 'default' : 'secondary'}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Threshold: {policy.threshold}/{policy.shares} • Created: {new Date(policy.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="text-sm font-medium">Shareholders:</span>
                      </div>
                      <div className="space-y-1">
                        {policy.shareholders.map((shareholder, index) => (
                          <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                            {shareholder}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Access Management Tab */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share Access
              </CardTitle>
              <CardDescription>
                Grant access to encrypted content for other users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sharePolicy">SEAL Policy</Label>
                <Select
                  value={shareAccessData.policyId}
                  onValueChange={(value) => setShareAccessData(prev => ({ ...prev, policyId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy to share access for" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="Enter the recipient's Sui address..."
                  value={shareAccessData.recipientAddress}
                  onChange={(e) => setShareAccessData(prev => ({ ...prev, recipientAddress: e.target.value }))}
                />
              </div>

              <Button 
                onClick={handleShareAccess}
                disabled={isLoading || !shareAccessData.policyId || !shareAccessData.recipientAddress}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Share Access
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Policy Dialog */}
      <Dialog open={showCreatePolicy} onOpenChange={setShowCreatePolicy}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create SEAL Policy</DialogTitle>
            <DialogDescription>
              Create a new threshold encryption policy for securing your content
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="policyName">Policy Name</Label>
              <Input
                id="policyName"
                placeholder="Enter policy name..."
                value={policyForm.name}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                value={policyForm.threshold}
                onChange={(e) => setPolicyForm(prev => ({ ...prev, threshold: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground">
                Minimum number of shareholders required to decrypt content
              </p>
            </div>

            <div className="space-y-2">
              <Label>Shareholders</Label>
              {policyForm.shareholders.map((shareholder, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Enter Sui address..."
                    value={shareholder}
                    onChange={(e) => updateShareholder(index, e.target.value)}
                  />
                  {policyForm.shareholders.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeShareholderField(index)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addShareholderField}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Shareholder
              </Button>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreatePolicy}
                disabled={isLoading || !policyForm.name}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Key className="h-4 w-4 mr-2" />
                )}
                Create Policy
              </Button>
              <Button variant="outline" onClick={() => setShowCreatePolicy(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SealEncryptionPanel;