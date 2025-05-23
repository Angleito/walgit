'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { BranchManager, Branch } from "@/components/git/BranchManager";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export default function BranchesPage() {
  const params = useParams();
  const owner = params.owner as string;
  const repo = params.repo as string;

  // Mock data - in production, this would come from Sui/Walrus
  const [branches, setBranches] = useState<Branch[]>([
    {
      name: 'main',
      isDefault: true,
      isProtected: true,
      lastCommit: {
        hash: 'abc1234',
        message: 'Initial commit',
        author: 'John Doe',
        date: '2 days ago'
      },
      ahead: 0,
      behind: 0
    },
    {
      name: 'feature/ui-update',
      isDefault: false,
      isProtected: false,
      lastCommit: {
        hash: 'def5678',
        message: 'Update UI components',
        author: 'Jane Smith',
        date: '3 hours ago'
      },
      ahead: 3,
      behind: 1
    },
    {
      name: 'fix/security-patch',
      isDefault: false,
      isProtected: false,
      lastCommit: {
        hash: 'ghi9012',
        message: 'Fix security vulnerability',
        author: 'Bob Johnson',
        date: '1 day ago'
      },
      ahead: 1,
      behind: 2
    },
    {
      name: 'develop',
      isDefault: false,
      isProtected: true,
      lastCommit: {
        hash: 'jkl3456',
        message: 'Merge pull request #42',
        author: 'Alice Brown',
        date: '4 hours ago'
      },
      ahead: 5,
      behind: 0
    }
  ]);

  const [currentBranch, setCurrentBranch] = useState('main');

  const handleCreateBranch = async (name: string, fromBranch: string) => {
    // Simulate API call
    console.log(`Creating branch ${name} from ${fromBranch}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newBranch: Branch = {
      name,
      isDefault: false,
      isProtected: false,
      lastCommit: {
        hash: 'new1234',
        message: `Branch created from ${fromBranch}`,
        author: 'Current User',
        date: 'just now'
      },
      ahead: 0,
      behind: 0
    };
    
    setBranches([...branches, newBranch]);
  };

  const handleDeleteBranch = async (name: string) => {
    // Simulate API call
    console.log(`Deleting branch ${name}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setBranches(branches.filter(b => b.name !== name));
  };

  const handleSwitchBranch = async (name: string) => {
    // Simulate API call
    console.log(`Switching to branch ${name}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentBranch(name);
  };

  const handleMergeBranch = async (from: string, to: string) => {
    // Simulate API call
    console.log(`Merging ${from} into ${to}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update branch stats after merge
    setBranches(branches.map(branch => {
      if (branch.name === from) {
        return { ...branch, ahead: 0 };
      }
      return branch;
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/repositories">Repositories</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/repositories/${owner}/${repo}`}>
                {owner}/{repo}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-foreground">Branches</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <BranchManager
          branches={branches}
          currentBranch={currentBranch}
          onCreateBranch={handleCreateBranch}
          onDeleteBranch={handleDeleteBranch}
          onSwitchBranch={handleSwitchBranch}
          onMergeBranch={handleMergeBranch}
        />
      </div>
    </div>
  );
}