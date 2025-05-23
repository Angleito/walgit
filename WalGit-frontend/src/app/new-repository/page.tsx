'use client';

import Link from 'next/link';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wallet } from "lucide-react";
import { useCurrentAccount, useCurrentWallet, useSuiClient, ConnectButton } from "@mysten/dapp-kit";
import { walletService } from "@/services/wallet";
import { useToast } from "@/components/ui/use-toast";
import { useNotification } from "@/components/ui/notification-system";
import { WalletProfile } from "@/components/wallet/WalletProfile";
import { useRouter } from 'next/navigation';
import { RepositoryWizard } from "@/components/repository/RepositoryWizard";
import { FormContainer } from "@/components/ui/form-container";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTour } from "@/components/ui/tour-provider";
import { ContextualHelp } from "@/components/ui/tour-templates";
import { RepositoryTemplateSelector, RepositoryGuide, CreationContextHelp } from "./repository-helpers";

import {
  repositorySchema,
  type RepositoryFormValues
} from "@/lib/form-schemas";

export default function NewRepositoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const account = useCurrentAccount();
  const { wallet } = useCurrentWallet() || {};
  const client = useSuiClient();
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [hasStorageQuota, setHasStorageQuota] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { startTour, getTourPreference } = useTour();
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Form setup
  const form = useForm<RepositoryFormValues>({
    resolver: zodResolver(repositorySchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: "public",
      defaultBranch: "main",
      addReadme: true,
      addGitignore: true,
      gitignoreTemplate: "Node",
      addLicense: true,
      licenseType: "MIT",
    },
  });
  
  // Check storage quota on mount
  useEffect(() => {
    const checkQuota = async () => {
      if (account?.address) {
        setIsCheckingQuota(true);
        try {
          const hasQuota = await walletService.hasStorageQuota(client, account.address);
          setHasStorageQuota(hasQuota);
        } catch (error) {
          console.error("Error checking storage quota:", error);
          toast({
            title: "Error checking storage quota",
            description: "Failed to check your storage quota. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsCheckingQuota(false);
        }
      } else {
        setIsCheckingQuota(false);
      }
    };
    
    checkQuota();
  }, [account, client, toast]);
  
  // Handle repository creation
  const handleCreateRepository = async (data: RepositoryFormValues) => {
    if (!account || !wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a repository.",
        variant: "destructive"
      });
      return;
    }
    
    // Confirm repository creation
    const shouldCreate = window.confirm(
      `Are you sure you want to create the repository "${data.name}"?`
    );
    
    if (!shouldCreate) return;
    
    try {
      setIsCreating(true);
      
      // Show progress notification
      addNotification({
        title: "Creating repository",
        message: "Setting up your decentralized repository...",
        type: "info",
        duration: null, // Keep it until we update
        id: "create-repo-progress"
      });
      
      // Create repository on blockchain
      const createParams = {
        name: data.name,
        description: data.description || "",
        defaultBranch: data.defaultBranch || "main",
        addReadme: data.addReadme,
        addGitignore: data.addGitignore,
        addLicense: data.addLicense,
        template: data.template,
        isPublic: data.visibility === "public",
      };
      
      if (data.addLicense && data.licenseType) {
        createParams.addLicense = data.licenseType;
      }
      
      if (data.addGitignore && data.gitignoreTemplate) {
        createParams.addGitignore = data.gitignoreTemplate;
      }
      
      const result = await walletService.createRepository(client, wallet, createParams);
      
      // Update notification
      addNotification({
        title: "Repository created!",
        message: `${data.name} has been created successfully.`,
        type: "success",
        duration: 5000,
        id: "create-repo-progress", // Same ID to replace the progress notification
      });
      
      toast({
        title: "Repository created successfully!",
        description: "Your repository is now available on-chain.",
      });
      
      // Navigate to the new repository
      setTimeout(() => {
        router.push(`/repositories/${account.address}/${data.name}`);
      }, 500);
      
    } catch (error) {
      console.error("Error creating repository:", error);
      
      // Update notification to show error
      addNotification({
        title: "Failed to create repository",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        type: "error",
        duration: 7000,
        id: "create-repo-progress", // Same ID to replace the progress notification
      });
      
      toast({
        title: "Error creating repository",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle storage quota initialization
  const handleInitializeQuota = async () => {
    if (!wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to initialize storage.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsInitializing(true);
      await walletService.createStorageQuota(wallet);
      setHasStorageQuota(true);
      
      toast({
        title: "Storage initialized!",
        description: "You can now create repositories.",
      });
    } catch (error) {
      console.error("Error initializing storage:", error);
      toast({
        title: "Error initializing storage",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };
  
  // Handle tour start
  useEffect(() => {
    if (!getTourPreference("repository-creation-tour-seen")) {
      setShowHelp(true);
    }
  }, [getTourPreference]);
  
  // If wallet not connected, show connection prompt
  if (!account) {
    return (
      <div className="container max-w-2xl pt-8 pb-16">
        <Card className="text-center py-12">
          <CardContent>
            <div className="mb-6">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Wallet Connection Required</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to create repositories on WalGit
            </p>
            <ConnectButton className="mx-auto">
              {({ connect, connecting }) => (
                <Button 
                  onClick={connect} 
                  disabled={connecting}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              )}
            </ConnectButton>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl pt-8 pb-16">
      <Link href="/" className="mb-6 flex items-center text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
      
      <div className="relative mb-12">
        <h1 className="text-4xl font-bold mb-2">Create a new repository</h1>
        <p className="text-lg text-muted-foreground">
          Set up a decentralized repository on the blockchain with Walrus storage.
        </p>
      </div>
      
      {isCheckingQuota ? (
        <Card className="text-center py-12">
          <CardContent>
            <p>Checking your storage quota...</p>
          </CardContent>
        </Card>
      ) : !hasStorageQuota ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>Initialize Storage Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              You need to initialize your storage quota before creating repositories.
            </p>
            <Button 
              onClick={handleInitializeQuota}
              disabled={isInitializing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isInitializing ? "Initializing..." : "Initialize Storage"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {showHelp && (
            <CreationContextHelp
              onClose={() => setShowHelp(false)}
              onStartTour={() => {
                setShowHelp(false);
                startTour("repository-creation-tour");
              }}
            />
          )}
          
          <RepositoryWizard
            form={form}
            onSubmit={handleCreateRepository}
            isSubmitting={isCreating}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={setSelectedTemplate}
          />
        </>
      )}
    </div>
  );
}