import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useCurrentAccount, useCurrentWallet, useSuiClient } from "@mysten/dapp-kit";
import { walletService } from "@/services/wallet";
import { useToast } from "@/components/ui/use-toast";
import { WalletProfile } from "@/components/wallet/WalletProfile";

const NewRepository = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const account = useCurrentAccount();
  const { wallet } = useCurrentWallet() || {};
  const client = useSuiClient();
  
  const [repoName, setRepoName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account || !wallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a repository.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if the user has a storage quota
      const hasQuota = await walletService.hasStorageQuota(client, account.address);
      
      // If not, create one
      if (!hasQuota) {
        toast({
          title: "Creating storage quota",
          description: "You need a storage quota to create repositories. Creating one now...",
        });
        
        await walletService.createStorageQuota(wallet);
      }
      
      // Create the repository
      await walletService.createRepository(client, wallet, {
        name: repoName,
        description,
        defaultBranch: 'main'
      });
      
      toast({
        title: "Repository created",
        description: `${repoName} has been created successfully.`,
      });
      
      // Navigate to the new repository
      navigate(`/${account.address}/${repoName}`);
    } catch (error) {
      console.error('Error creating repository:', error);
      toast({
        title: "Error creating repository",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8 max-w-2xl mx-auto">
         <Link to="/repositories" className="inline-flex items-center text-sm text-ocean-600 hover:text-ocean-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to repositories
          </Link>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Create a New Repository</CardTitle>
            <CardDescription>A repository contains all project files, including the revision history.</CardDescription>
          </CardHeader>
          <CardContent>
            {!account ? (
              <div className="text-center py-6">
                <p className="mb-4 text-muted-foreground">Please connect your wallet to create a repository</p>
                <Button variant="ocean" onClick={() => wallet?.select()}>Connect Wallet</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="repoName">Repository name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="repoName" 
                    placeholder="my-awesome-project" 
                    required 
                    value={repoName} 
                    onChange={(e) => setRepoName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Great repository names are short and memorable.</p>
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea 
                    id="description" 
                    placeholder="A short description of your project" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    variant="ocean" 
                    disabled={isLoading || !repoName}
                  >
                    {isLoading ? "Creating repository..." : "Create repository"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        
        {account && <WalletProfile />}
      </div>
    </div>
  );
};

export default NewRepository;
