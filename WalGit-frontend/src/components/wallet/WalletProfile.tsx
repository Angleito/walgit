'use client';

import { useCurrentAccount, useSuiClient, useCurrentWallet } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { walletService } from "@/services/wallet";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface WalletProfileProps {
  className?: string;
  title?: string;
  description?: string;
}

export function WalletProfile({ 
  className,
  title = "Wallet Information",
  description
}: WalletProfileProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const currentWallet = useCurrentWallet();
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
          toast({
            title: "Error checking storage quota",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive"
          });
        } finally {
          setIsCheckingQuota(false);
        }
      }
    }
    
    checkStorageQuota();
  }, [account, client, toast]);
  
  const handleCreateStorageQuota = async () => {
    if (!account || !currentWallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a storage quota.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await walletService.createStorageQuota(currentWallet);
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

  const handlePurchaseStorage = async () => {
    if (!account || !currentWallet) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to purchase storage.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      // Currently hardcoded to purchase 10 units of storage
      // In a real application, you'd have a form to input the amount
      const amount = 10;
      await walletService.purchaseStorage(currentWallet, amount);
      toast({
        title: "Storage purchased",
        description: `Successfully purchased ${amount} MB of storage.`,
      });
    } catch (error) {
      console.error("Error purchasing storage:", error);
      toast({
        title: "Error purchasing storage",
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
    <Card className={cn("mt-4", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium">Address</h3>
            <p className="text-sm text-muted-foreground font-mono break-all">
              {account.address}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium">Storage Quota</h3>
            {isCheckingQuota ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Checking quota status...</p>
              </div>
            ) : hasStorageQuota ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You have a storage quota for WalGit.
                </p>
                <Button 
                  onClick={handlePurchaseStorage} 
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Purchase More Storage"
                  )}
                </Button>
              </div>
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
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Storage Quota"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}