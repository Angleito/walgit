'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useStorage, safeSetStorage } from '@/hooks/use-storage';
import { 
  GitBranch, 
  Github, 
  Upload, 
  Database, 
  Rocket, 
  Check, 
  User, 
  Settings, 
  Code,
  Wallet,
  Info
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isCompleted: boolean;
  isOptional?: boolean;
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

/**
 * Comprehensive onboarding flow component for new users
 */
export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isSkippable, setIsSkippable] = useState(false);
  
  // Define onboarding steps
  const steps: OnboardingStep[] = useMemo(() => [
    {
      id: 'profile',
      title: 'Set Up Your Profile',
      description: 'Personalize your WalGit experience',
      component: <ProfileSetup onComplete={() => markStepComplete('profile')} />,
      isCompleted: !!completedSteps.profile
    },
    {
      id: 'wallet',
      title: 'Connect Your Wallet',
      description: 'Connect to Sui blockchain',
      component: <WalletSetup onComplete={() => markStepComplete('wallet')} />,
      isCompleted: !!completedSteps.wallet
    },
    {
      id: 'repository',
      title: 'Create Your First Repository',
      description: 'Start with a new repository or import an existing one',
      component: <RepositorySetup onComplete={() => markStepComplete('repository')} />,
      isCompleted: !!completedSteps.repository
    },
    {
      id: 'storage',
      title: 'Set Up Storage',
      description: 'Configure your decentralized storage',
      component: <StorageSetup onComplete={() => markStepComplete('storage')} />,
      isCompleted: !!completedSteps.storage
    },
    {
      id: 'cli',
      title: 'Setup CLI Tools',
      description: 'Set up your local development environment',
      component: <CLISetup onComplete={() => markStepComplete('cli')} />,
      isCompleted: !!completedSteps.cli,
      isOptional: true
    },
  ], [completedSteps]);
  
  // Check if current step is last
  const isLastStep = currentStepIndex === steps.length - 1;
  
  // Mark a step as completed
  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: true
    }));
  };
  
  // Go to next step
  const goToNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleComplete();
    }
  };
  
  // Go to previous step
  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  // Skip current step
  const skipStep = () => {
    // If last step, complete onboarding
    if (isLastStep) {
      handleComplete();
    } else {
      goToNextStep();
    }
  };
  
  // Complete onboarding
  const handleComplete = () => {
    // Save onboarding completion status
    if (typeof window !== 'undefined') {
      safeSetStorage('onboardingCompleted', 'true');
      safeSetStorage('onboardingSteps', completedSteps);
    }
    
    onComplete();
  };
  
  // Skip all onboarding
  const handleSkipAll = () => {
    if (onSkip) {
      onSkip();
    } else {
      handleComplete();
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    const completed = Object.values(completedSteps).filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };
  
  // Check if current step is optional
  useEffect(() => {
    setIsSkippable(!!steps[currentStepIndex].isOptional);
  }, [currentStepIndex, steps]);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">{steps[currentStepIndex].title}</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleSkipAll}>
              Skip All
            </Button>
          </div>
          <CardDescription>{steps[currentStepIndex].description}</CardDescription>
          
          <div className="mt-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
          
          <div className="flex gap-2 overflow-x-auto py-3 mt-2">
            {steps.map((step, index) => (
              <Button
                key={step.id}
                variant={index === currentStepIndex ? "default" : "outline"}
                size="sm"
                className={`rounded-full px-4 ${
                  completedSteps[step.id] ? "bg-green-100 text-green-700 hover:bg-green-200" : ""
                }`}
                onClick={() => setCurrentStepIndex(index)}
              >
                {completedSteps[step.id] && <Check className="h-4 w-4 mr-1" />}
                {step.title}
                {step.isOptional && <span className="ml-1 text-xs">(Optional)</span>}
              </Button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {steps[currentStepIndex].component}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <Button 
            variant="outline" 
            onClick={goToPrevStep}
            disabled={currentStepIndex === 0}
          >
            Previous
          </Button>
          
          <div>
            {isSkippable && (
              <Button 
                variant="ghost" 
                onClick={skipStep} 
                className="mr-2"
              >
                Skip
              </Button>
            )}
            
            <Button 
              onClick={goToNextStep}
              disabled={!steps[currentStepIndex].isCompleted && !isSkippable}
            >
              {isLastStep ? 'Complete' : 'Next'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Profile setup component
 */
function ProfileSetup({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isValid, setIsValid] = useState(false);
  
  // Validate form data
  useEffect(() => {
    setIsValid(!!username && !!email);
  }, [username, email]);
  
  // Handle submit
  const handleSubmit = () => {
    if (isValid) {
      // Save profile data
      if (typeof window !== 'undefined') {
        safeSetStorage('user_profile', {
          username,
          displayName,
          email,
          bio
        });
      }
      
      onComplete();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username *</Label>
        <Input 
          id="username" 
          placeholder="e.g., johndoe" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input 
          id="displayName" 
          placeholder="e.g., John Doe" 
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="your@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea 
          id="bio" 
          className="w-full min-h-[100px] p-2 border rounded-md"
          placeholder="Tell us about yourself..." 
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      
      <Button onClick={handleSubmit} disabled={!isValid} className="w-full">
        Save Profile
      </Button>
    </div>
  );
}

/**
 * Wallet setup component
 */
function WalletSetup({ onComplete }: { onComplete: () => void }) {
  const [walletType, setWalletType] = useState('sui');
  const [isConnected, setIsConnected] = useState(false);
  
  // Handle wallet connection
  const connectWallet = (type: string) => {
    // Simulate wallet connection
    setTimeout(() => {
      setIsConnected(true);
      
      // Save wallet information
      if (typeof window !== 'undefined') {
        safeSetStorage('wallet_connected', true);
        safeSetStorage('wallet_type', type);
      }
      
      onComplete();
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <Wallet className="h-16 w-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">Connect Your Wallet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Connect your wallet to interact with the Sui blockchain and enable decentralized storage.
        </p>
      </div>
      
      <Tabs defaultValue="sui" onValueChange={setWalletType}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="sui">Sui Wallet</TabsTrigger>
          <TabsTrigger value="other">Other Wallets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sui" className="p-4 border rounded-md mt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L19.5 6V18L12 22L4.5 18V6L12 2Z" fill="#6895FE" />
                </svg>
              </div>
              <div>
                <div className="font-medium">Sui Wallet</div>
                <div className="text-sm text-gray-500">Connect to your Sui wallet extension</div>
              </div>
            </div>
            
            <Button 
              className="w-full"
              onClick={() => connectWallet('sui')}
              disabled={isConnected}
            >
              {isConnected ? 'Connected' : 'Connect to Sui Wallet'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="other" className="p-4 border rounded-md mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="16" height="16" rx="8" fill="#F6851B" />
                    </svg>
                  </div>
                  <div className="font-medium">MetaMask</div>
                </div>
              </div>
              
              <div className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="16" height="16" rx="8" fill="#1A1A1A" />
                    </svg>
                  </div>
                  <div className="font-medium">Wallet Connect</div>
                </div>
              </div>
              
              <div className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="16" height="16" rx="8" fill="#0052FF" />
                    </svg>
                  </div>
                  <div className="font-medium">Coinbase</div>
                </div>
              </div>
              
              <div className="border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="16" height="16" rx="8" fill="#627EEA" />
                    </svg>
                  </div>
                  <div className="font-medium">Ethos</div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Repository setup component
 */
function RepositorySetup({ onComplete }: { onComplete: () => void }) {
  const [selectedOption, setSelectedOption] = useState('create');
  const [repoName, setRepoName] = useState('');
  const [repoDesc, setRepoDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isValid, setIsValid] = useState(false);
  
  // Validate form data
  useEffect(() => {
    setIsValid(!!repoName);
  }, [repoName]);
  
  // Handle submit
  const handleSubmit = () => {
    if (isValid) {
      // Save repository data
      if (typeof window !== 'undefined') {
        safeSetStorage('first_repository', {
          name: repoName,
          description: repoDesc,
          isPrivate
        });
      }
      
      onComplete();
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="create" onValueChange={setSelectedOption}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="create">Create New</TabsTrigger>
          <TabsTrigger value="import">Import Existing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="pt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repoName">Repository Name *</Label>
              <Input 
                id="repoName" 
                placeholder="my-awesome-project" 
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="repoDesc">Description</Label>
              <Input 
                id="repoDesc" 
                placeholder="Describe your repository..." 
                value={repoDesc}
                onChange={(e) => setRepoDesc(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPrivate" 
                checked={isPrivate}
                onCheckedChange={(checked) => setIsPrivate(!!checked)}
              />
              <Label htmlFor="isPrivate">Make this repository private</Label>
            </div>
            
            <Button onClick={handleSubmit} disabled={!isValid} className="w-full">
              Create Repository
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="import" className="pt-4">
          <div className="space-y-4">
            <div className="p-6 border rounded-md bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full">
                  <Github className="h-8 w-8 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Import from GitHub</h3>
                  <p className="text-sm text-gray-500">Import an existing GitHub repository</p>
                </div>
              </div>
              
              <Button className="mt-4 w-full">
                Connect to GitHub
              </Button>
            </div>
            
            <div className="p-6 border rounded-md">
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Upload className="h-8 w-8 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Upload .git Repository</h3>
                  <p className="text-sm text-gray-500">Upload a local git repository</p>
                </div>
              </div>
              
              <Button variant="outline" className="mt-4 w-full">
                Choose File
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Storage setup component
 */
function StorageSetup({ onComplete }: { onComplete: () => void }) {
  const [selectedTier, setSelectedTier] = useState('standard');
  const [autoRenew, setAutoRenew] = useState(true);
  
  // Handle submit
  const handleSubmit = () => {
    // Save storage preferences
    if (typeof window !== 'undefined') {
      safeSetStorage('storage_preferences', {
        tier: selectedTier,
        autoRenew
      });
    }
    
    onComplete();
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <Database className="h-16 w-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">Configure Storage</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Set up decentralized storage for your repositories. Your files will be stored securely on the Sui blockchain.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            selectedTier === 'basic' ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => setSelectedTier('basic')}
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium">Basic</h3>
            <p className="text-2xl font-bold my-2">1 SUI</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>100 MB storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>30-day storage period</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Basic metrics</span>
            </li>
          </ul>
        </div>
        
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            selectedTier === 'standard' ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => setSelectedTier('standard')}
        >
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white py-1 px-3 rounded-full text-xs">
            RECOMMENDED
          </div>
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium">Standard</h3>
            <p className="text-2xl font-bold my-2">5 SUI</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>1 GB storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>180-day storage period</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Advanced metrics</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Priority support</span>
            </li>
          </ul>
        </div>
        
        <div 
          className={`border rounded-lg p-4 cursor-pointer ${
            selectedTier === 'premium' ? 'border-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => setSelectedTier('premium')}
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium">Premium</h3>
            <p className="text-2xl font-bold my-2">20 SUI</p>
            <p className="text-sm text-gray-500">per month</p>
          </div>
          
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>10 GB storage</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>365-day storage period</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Comprehensive analytics</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Dedicated support</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Enhanced performance</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mt-4">
        <Checkbox 
          id="autoRenew" 
          checked={autoRenew}
          onCheckedChange={(checked) => setAutoRenew(!!checked)}
        />
        <Label htmlFor="autoRenew">Enable auto-renewal to avoid data loss</Label>
      </div>
      
      <Button onClick={handleSubmit} className="w-full">
        Set Up Storage
      </Button>
    </div>
  );
}

/**
 * CLI setup component
 */
function CLISetup({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <Code className="h-16 w-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-xl font-medium mb-2">Set Up CLI Tools</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Install and configure the WalGit CLI for seamless interaction with your repositories.
        </p>
      </div>
      
      <div className="bg-black text-white p-4 rounded-md font-mono text-sm">
        <p className="mb-2"># Install WalGit CLI</p>
        <p className="mb-4">npm install -g @walgit/cli</p>
        
        <p className="mb-2"># Configure with your wallet</p>
        <p>walgit configure --wallet your-wallet-address</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium">CLI Setup is Optional</h4>
            <p className="text-sm text-gray-600 mt-1">
              You can still use WalGit through the web interface without installing the CLI tools. 
              The CLI provides additional features for advanced users.
            </p>
          </div>
        </div>
      </div>
      
      <Button onClick={onComplete} className="w-full">
        I&apos;ve Installed CLI Tools
      </Button>
      
      <div className="text-center">
        <Button variant="link" onClick={onComplete}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}