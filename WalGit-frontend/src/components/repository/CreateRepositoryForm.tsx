'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount, useSignAndExecuteTransactionBlock } from '@mysten/dapp-kit';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GitBranch, 
  Lock, 
  Globe, 
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CreateRepositoryFormProps {
  onSuccess?: (repositoryId: string) => void;
  onCancel?: () => void;
}

export function CreateRepositoryForm({ onSuccess, onCancel }: CreateRepositoryFormProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true,
    defaultBranch: 'main',
    template: '',
    encryptionThreshold: 2,
    encryptionShares: 3
  });
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Template options
  const templates = [
    { id: '', name: 'Empty Repository', description: 'Start with a clean slate' },
    { id: 'javascript', name: 'JavaScript/Node.js', description: 'Basic Node.js project structure' },
    { id: 'python', name: 'Python', description: 'Python project with virtual environment' },
    { id: 'rust', name: 'Rust', description: 'Cargo project structure' },
    { id: 'react', name: 'React App', description: 'Modern React application' },
    { id: 'next', name: 'Next.js', description: 'Full-stack React framework' }
  ];
  
  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Repository name is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      newErrors.name = 'Repository name can only contain letters, numbers, hyphens, and underscores';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Repository name must be 50 characters or less';
    }
    
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be 500 characters or less';
    }
    
    if (formData.encryptionThreshold > formData.encryptionShares) {
      newErrors.encryptionThreshold = 'Threshold cannot be greater than total shares';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAccount) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to create a repository',
        variant: 'destructive'
      });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setCurrentStep(1);
    setProgress(0);
    
    try {
      // Step 1: Generate SEAL policy ID
      setCurrentStep(1);
      setProgress(20);
      const policyId = `walgit-${formData.name}-${currentAccount.address.slice(0, 8)}-${Date.now()}`;
      
      // Step 2: Create initial commit manifest (empty for now)
      setCurrentStep(2);
      setProgress(40);
      const initialManifest = {
        timestamp: new Date().toISOString(),
        author: currentAccount.address,
        message: 'Initial commit',
        parent_commit_cid: null,
        tree: {},
        metadata: {
          template: formData.template,
          encrypted: true
        }
      };
      
      // For demo purposes, we'll use placeholder CIDs
      // In real implementation, these would be uploaded to Walrus
      const manifestCid = `manifest_${Date.now()}`;
      const encryptedDekCid = `dek_${Date.now()}`;
      
      // Step 3: Create repository on Sui blockchain
      setCurrentStep(3);
      setProgress(60);
      
      const tx = new TransactionBlock();
      tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::git_repository::create_repository`,
        arguments: [
          tx.pure(formData.name),
          tx.pure(formData.description),
          tx.pure(manifestCid),
          tx.pure(encryptedDekCid),
          tx.pure(policyId),
          tx.pure(formData.defaultBranch),
          tx.object(process.env.NEXT_PUBLIC_STORAGE_QUOTA_ID!)
        ],
      });
      
      // Step 4: Execute transaction
      setCurrentStep(4);
      setProgress(80);
      
      const result = await new Promise<any>((resolve, reject) => {
        signAndExecute(
          {
            transactionBlock: tx,
            options: {
              showEffects: true,
              showEvents: true,
              showObjectChanges: true
            }
          },
          {
            onSuccess: resolve,
            onError: reject
          }
        );
      });
      
      // Step 5: Extract repository ID
      setCurrentStep(5);
      setProgress(100);
      
      const createdObjects = result.objectChanges?.filter(
        (change: any) => change.type === 'created' && change.objectType.includes('Repo')
      );
      
      if (!createdObjects || createdObjects.length === 0) {
        throw new Error('Failed to create repository on blockchain');
      }
      
      const repositoryId = createdObjects[0].objectId;
      
      toast({
        title: 'Repository created successfully!',
        description: `${formData.name} has been created with SEAL encryption`,
      });
      
      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(repositoryId);
      } else {
        router.push(`/repositories/${currentAccount.address}/${formData.name}`);
      }
      
    } catch (error: any) {
      console.error('Failed to create repository:', error);
      toast({
        title: 'Failed to create repository',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setCurrentStep(1);
      setProgress(0);
    }
  };
  
  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  
  const stepDescriptions = [
    'Generating SEAL policy',
    'Creating commit manifest',
    'Preparing blockchain transaction',
    'Executing on Sui network',
    'Finalizing repository'
  ];
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5" />
          <span>Create New Repository</span>
        </CardTitle>
        <CardDescription>
          Create a new WalGit repository with SEAL encryption and Walrus storage
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Repository Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="my-awesome-project"
                className={errors.name ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe your repository..."
                className={errors.description ? 'border-destructive' : ''}
                disabled={isSubmitting}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select value={formData.template} onValueChange={(value) => updateFormData('template', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Privacy & Security */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Privacy & Security</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Repository Privacy</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.isPrivate ? 'Only you and collaborators can access' : 'Anyone can view this repository'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {formData.isPrivate ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => updateFormData('isPrivate', checked)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                All repositories use SEAL threshold encryption for data protection.
                Files are encrypted before upload to Walrus storage.
              </AlertDescription>
            </Alert>
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Repository will be created on Sui {process.env.NEXT_PUBLIC_NETWORK || 'testnet'}
            </div>
            <div className="flex items-center space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !currentAccount}
                className="min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Create Repository
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}