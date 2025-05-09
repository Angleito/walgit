import { useCurrentAccount, useSuiClient, useCurrentWallet } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { walletService } from "@/services/wallet";
import { useToast } from "@/components/ui/use-toast";

export function WalletProfile() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { wallet } = useCurrentWallet() || {};
  const { toast } = useToast();
  const [hasStorageQuota, setHasStorageQuota] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  
  useEffect(() => {
    async function checkStorageQuota() {
      if (account) {
        try {
          setIsCheckingQuota(true);
          const hasQuota = await walletService.hasStorageQuota(client, account.address);
          setHasStorageQuota(hasQuota);
        } catch (error) {
          console.error("Error checking storage quota:", error);
        } finally {
          setIsCheckingQuota(false);
        }
      }
    }
    
    checkStorageQuota();
  }, [account, client]);
  
  const handleCreateStorageQuota = async () => {
    if (!account || !wallet) return;
    
    try {
      setIsLoading(true);
      await walletService.createStorageQuota(wallet);
      setHasStorageQuota(true);
      toast({
        title: "Storage quota created",
        description: "You now have a storage quota for WalGit.",
      });
    } catch (error) {
      console.error("Error creating storage quota:", error);
      toast({
        title: "Error creating storage quota",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!account) {
    return null;
  }
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Wallet Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Address</h3>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {account.address}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Storage Quota</h3>
            {isCheckingQuota ? (
              <p className="text-sm text-muted-foreground">Checking quota status...</p>
            ) : hasStorageQuota ? (
              <p className="text-sm text-muted-foreground">
                You have a storage quota for WalGit.
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  You need a storage quota to create repositories.
                </p>
                <Button 
                  onClick={handleCreateStorageQuota} 
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? "Creating..." : "Create Storage Quota"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}