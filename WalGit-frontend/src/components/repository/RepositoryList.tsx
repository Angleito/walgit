'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitBranch, 
  Users, 
  Calendar, 
  Search, 
  Filter,
  Plus,
  Lock,
  Globe,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
  latestCommitManifestCid: string;
  isOwner?: boolean;
  role?: number;
}

interface RepositoryListProps {
  showCreateButton?: boolean;
  filterByOwner?: boolean;
  title?: string;
  emptyStateMessage?: string;
}

export function RepositoryList({ 
  showCreateButton = true,
  filterByOwner = false,
  title = 'Your Repositories',
  emptyStateMessage = 'No repositories found. Create your first repository to get started!'
}: RepositoryListProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated');
  const [roleFilter, setRoleFilter] = useState<'all' | 'owner' | 'collaborator'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch repositories
  const fetchRepositories = useCallback(async () => {
    if (!currentAccount) {
      setRepositories([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Query for repositories where user is owner
      const ownedRepos = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::git_repository::Repo`
        },
        options: {
          showContent: true,
          showType: true
        }
      });

      // TODO: Query for repositories where user is collaborator
      // This would require indexing events or maintaining a separate index
      
      const repoList: Repository[] = [];
      
      for (const repoRef of ownedRepos.data) {
        if (repoRef.data?.content && 'fields' in repoRef.data.content) {
          const fields = repoRef.data.content.fields as any;
          
          // Parse collaborators
          const collaborators = [];
          if (fields.collaborators?.fields?.contents) {
            for (const collab of fields.collaborators.fields.contents) {
              collaborators.push({
                address: collab.fields.key,
                role: collab.fields.value
              });
            }
          }
          
          repoList.push({
            objectId: repoRef.data.objectId,
            name: fields.name,
            description: fields.description,
            owner: fields.owner,
            collaborators,
            sealPolicyId: fields.seal_policy_id,
            defaultBranch: fields.default_branch,
            createdAt: fields.created_at,
            updatedAt: fields.updated_at,
            latestCommitManifestCid: fields.latest_commit_manifest_cid,
            isOwner: fields.owner === currentAccount.address,
            role: fields.owner === currentAccount.address ? 4 : 0 // 4 = owner
          });
        }
      }
      
      setRepositories(repoList);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setLoading(false);
    }
  }, [currentAccount, suiClient]);

  // Refresh repositories
  const refreshRepositories = async () => {
    setRefreshing(true);
    await fetchRepositories();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRepositories();
  }, [currentAccount, suiClient, fetchRepositories]);

  // Filter and sort repositories
  const filteredAndSortedRepos = repositories
    .filter(repo => {
      // Search filter
      if (searchTerm && !repo.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !repo.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Role filter
      if (roleFilter === 'owner' && !repo.isOwner) return false;
      if (roleFilter === 'collaborator' && repo.isOwner) return false;
      
      // Owner filter
      if (filterByOwner && !repo.isOwner) return false;
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt - a.createdAt;
        case 'updated':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

  // Role name mapping
  const getRoleName = (role: number) => {
    switch (role) {
      case 1: return 'Reader';
      case 2: return 'Writer';
      case 3: return 'Admin';
      case 4: return 'Owner';
      default: return 'Unknown';
    }
  };

  // Role color mapping
  const getRoleColor = (role: number) => {
    switch (role) {
      case 1: return 'secondary';
      case 2: return 'default';
      case 3: return 'destructive';
      case 4: return 'default';
      default: return 'secondary';
    }
  };

  if (!currentAccount) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Connect your wallet to view repositories</p>
            <Button asChild>
              <Link href="/auth/wallet">Connect Wallet</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">
            Manage your WalGit repositories with SEAL encryption and Walrus storage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={refreshRepositories}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          {showCreateButton && (
            <Button asChild>
              <Link href="/new-repository">
                <Plus className="h-4 w-4 mr-2" />
                New Repository
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Created Date</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Repositories</SelectItem>
            <SelectItem value="owner">Owned by Me</SelectItem>
            <SelectItem value="collaborator">Collaborating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repository List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAndSortedRepos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedRepos.map((repo) => (
            <Card key={repo.objectId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate flex items-center space-x-2">
                      <Link 
                        href={`/repositories/${repo.owner}/${repo.name}`}
                        className="hover:underline"
                      >
                        {repo.name}
                      </Link>
                      {repo.sealPolicyId && (
                        <Lock className="h-4 w-4 text-muted-foreground" title="Encrypted with SEAL" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {repo.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <Badge variant={getRoleColor(repo.role || 0)} className="ml-2">
                    {getRoleName(repo.role || 0)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Repository Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <GitBranch className="h-4 w-4" />
                      <span>{repo.defaultBranch}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{repo.collaborators.length + 1}</span>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Updated {formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/repositories/${repo.owner}/${repo.name}`}>
                        View Repository
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://suiexplorer.com/object/${repo.objectId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Explorer</span>
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <GitBranch className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">{emptyStateMessage}</p>
              {showCreateButton && (
                <Button asChild>
                  <Link href="/new-repository">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Repository
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}