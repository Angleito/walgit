'use client';

import { useCurrentAccount, useCurrentWallet, ConnectButton } from '@mysten/dapp-kit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, GitBranch, FolderOpen, Activity, Settings } from 'lucide-react';
import Link from 'next/link';
import { shortenAddress } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';

export default function ProfilePage() {
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const client = useSuiClient();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    async function fetchUserData() {
      if (account?.address) {
        try {
          // Fetch user's SUI balance
          const balanceResult = await client.getBalance({
            owner: account.address,
            coinType: '0x2::sui::SUI'
          });
          setBalance((Number(balanceResult.totalBalance) / 1_000_000_000).toFixed(4));
          
          // TODO: Fetch user's repositories from blockchain
          // This is a placeholder
          setRepositories([
            { id: 1, name: 'defi-protocol', description: 'Decentralized finance protocol', lastUpdated: '2025-04-01' },
            { id: 2, name: 'nft-marketplace', description: 'NFT marketplace smart contracts', lastUpdated: '2025-03-28' }
          ]);
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    
    fetchUserData();
  }, [account, client]);

  if (!account) {
    return (
      <div className="container max-w-4xl pt-16 pb-16">
        <Card className="text-center py-12">
          <CardContent>
            <div className="mb-6">
              <Wallet className="h-16 w-16 mx-auto text-muted-foreground/50" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view your profile and repositories
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
    <div className="container max-w-6xl pt-8 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {account.address.substring(2, 4).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-lg">{shortenAddress(account.address, 6)}</CardTitle>
                  {wallet.wallet && (
                    <CardDescription className="text-sm">
                      Connected via {wallet.wallet.name}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span className="font-mono">{balance} SUI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm">Devnet</span>
              </div>
              <div className="pt-4 space-y-3">
                <Link href="/new-repository">
                  <Button className="w-full" variant="outline">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    New Repository
                  </Button>
                </Link>
                <Button className="w-full" variant="outline" disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Repositories</span>
                <span className="font-semibold">{repositories.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Commits</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="font-semibold">0 MB</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Repositories</CardTitle>
              <CardDescription>
                Manage your decentralized code repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading repositories...</p>
                </div>
              ) : repositories.length > 0 ? (
                <div className="space-y-4">
                  {repositories.map((repo) => (
                    <div key={repo.id} className="border rounded-lg p-4 hover:border-foreground/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center">
                            <GitBranch className="mr-2 h-4 w-4" />
                            {repo.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {repo.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Last updated: {repo.lastUpdated}
                          </p>
                        </div>
                        <Link href={`/repositories/${account.address}/${repo.name}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GitBranch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">No repositories yet</p>
                  <Link href="/new-repository">
                    <Button>Create Your First Repository</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your blockchain transactions and repository actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Activity className="mr-2 h-4 w-4" />
                <span>No recent activity</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}