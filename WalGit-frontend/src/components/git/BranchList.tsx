'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export interface BranchSummary {
  name: string;
  isDefault: boolean;
  isProtected: boolean;
  lastCommitDate: string;
  ahead: number;
  behind: number;
}

export interface BranchListProps {
  branches: BranchSummary[];
  currentBranch: string;
  repoUrl: string;
}

export function BranchList({ branches, currentBranch, repoUrl }: BranchListProps) {
  // Show only the most recent branches
  const recentBranches = branches.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Branches
            </CardTitle>
            <CardDescription>
              {branches.length} branch{branches.length !== 1 ? 'es' : ''}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${repoUrl}/branches`}>
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentBranches.map((branch) => (
            <div
              key={branch.name}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{branch.name}</span>
                {branch.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    default
                  </Badge>
                )}
                {branch.isProtected && (
                  <Shield className="h-3 w-3 text-muted-foreground" />
                )}
                {branch.name === currentBranch && (
                  <Badge variant="default" className="text-xs">
                    current
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {(branch.ahead > 0 || branch.behind > 0) && (
                  <div className="flex items-center gap-2">
                    {branch.ahead > 0 && (
                      <span className="text-primary">+{branch.ahead}</span>
                    )}
                    {branch.behind > 0 && (
                      <span className="text-orange-600">-{branch.behind}</span>
                    )}
                  </div>
                )}
                <span>{branch.lastCommitDate}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}