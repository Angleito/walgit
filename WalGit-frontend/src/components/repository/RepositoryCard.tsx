'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  Users, 
  Calendar, 
  Lock, 
  Copy, 
  ExternalLink,
  Download,
  Check
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface Repository {
  objectId: string;
  name: string;
  description: string;
  owner: string;
  collaborators: Array<{ address: string; role: number }>;
  sealPolicyId: string;
  defaultBranch: string;
  createdAt: number;
  updatedAt: number;
  isOwner?: boolean;
  role?: number;
}

interface RepositoryCardProps {
  repository: Repository;
  showOwner?: boolean;
  showCloneButton?: boolean;
}

export function RepositoryCard({ 
  repository, 
  showOwner = true, 
  showCloneButton = true 
}: RepositoryCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);

  // Role helpers
  const getRoleName = (role: number) => {
    switch (role) {
      case 1: return 'Reader';
      case 2: return 'Writer';
      case 3: return 'Admin';
      case 4: return 'Owner';
      default: return 'No Access';
    }
  };

  const getRoleColor = (role: number) => {
    switch (role) {
      case 1: return 'secondary';
      case 2: return 'default';
      case 3: return 'destructive';
      case 4: return 'default';
      default: return 'outline';
    }
  };

  // Copy functions
  const copyRepositoryId = async () => {
    await navigator.clipboard.writeText(repository.objectId);
    setCopiedId(true);
    toast({
      title: 'Repository ID copied',
      description: 'Use this ID to clone the repository'
    });
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyCloneCommand = async () => {
    await navigator.clipboard.writeText(`walgit clone ${repository.objectId}`);
    setCopiedClone(true);
    toast({
      title: 'Clone command copied',
      description: 'Paste this in your terminal to clone the repository'
    });
    setTimeout(() => setCopiedClone(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate flex items-center space-x-2">
              <Link 
                href={`/repositories/${repository.owner}/${repository.name}`}
                className="hover:underline truncate"
              >
                {repository.name}
              </Link>
              {repository.sealPolicyId && (
                <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" title="Encrypted with SEAL" />
              )}
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {repository.description || 'No description provided'}
            </CardDescription>
          </div>
          <Badge variant={getRoleColor(repository.role || 0)} className="ml-2 flex-shrink-0">
            {getRoleName(repository.role || 0)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Repository Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <GitBranch className="h-4 w-4" />
              <span>{repository.defaultBranch}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{repository.collaborators.length + 1}</span>
            </div>
          </div>
          {showOwner && (
            <div className="text-xs">
              Owner: {formatAddress(repository.owner)}
            </div>
          )}
        </div>

        {/* Repository ID */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Repository ID</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRepositoryId}
              className="h-6 px-2 text-xs"
            >
              {copiedId ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          <code className="text-xs font-mono text-muted-foreground break-all">
            {repository.objectId}
          </code>
        </div>

        {/* Timestamps */}
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Updated {formatDistanceToNow(new Date(repository.updatedAt), { addSuffix: true })}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href={`/repositories/${repository.owner}/${repository.name}`}>
              View Repository
            </Link>
          </Button>
          
          {showCloneButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={copyCloneCommand}
              className="flex items-center space-x-1"
            >
              {copiedClone ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              <span>Clone</span>
            </Button>
          )}
          
          <Button variant="ghost" size="sm" asChild>
            <a
              href={`https://suiexplorer.com/object/${repository.objectId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Sui Explorer"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        {/* Clone instruction (appears on hover) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 border-l-2 border-primary/20">
            <strong>CLI:</strong> <code>walgit clone {repository.objectId}</code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}