'use client';

import Link from 'next/link';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Wallet } from "lucide-react";
import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";

export default function NewRepositoryPage() {
  const account = useCurrentAccount();
  
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
      
      <Card>
        <CardHeader>
          <CardTitle>Repository Form</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Repository creation form will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}