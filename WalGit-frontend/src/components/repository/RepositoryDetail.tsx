'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  GitBranch, 
  Users, 
  Calendar, 
  Lock, 
  Globe,
  Copy,
  ExternalLink,
  Settings,
  Download,
  FileText,
  History,
  Shield,
  Eye,
  Edit,
  Plus,
  MoreHorizontal
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
  latestCommitManifestCid: string;
  encryptedDekCid: string;
}

interface Commit {
  cid: string;
  author: string;
  message: string;
  timestamp: string;
  parentCid?: string;
}

interface RepositoryDetailProps {
  repositoryId: string;
  owner?: string;
  name?: string;
}

export function RepositoryDetail({ repositoryId, owner, name }: RepositoryDetailProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [userRole, setUserRole] = useState<number>(0);
  const [isOwner, setIsOwner] = useState(false);
  
  // Fetch repository data
  const fetchRepository = async () => {
    try {
      setLoading(true);
      
      const repoObject = await suiClient.getObject({
        id: repositoryId,
        options: {
          showContent: true,
          showType: true
        }
      });
      
      if (!repoObject.data?.content || !('fields' in repoObject.data.content)) {
        throw new Error('Repository not found');
      }
      
      const fields = repoObject.data.content.fields as any;
      
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
      
      const repo: Repository = {
        objectId: repoObject.data.objectId,
        name: fields.name,
        description: fields.description,
        owner: fields.owner,
        collaborators,
        sealPolicyId: fields.seal_policy_id,
        defaultBranch: fields.default_branch,
        createdAt: fields.created_at,
        updatedAt: fields.updated_at,
        latestCommitManifestCid: fields.latest_commit_manifest_cid,
        encryptedDekCid: fields.encrypted_dek_cid
      };
      
      setRepository(repo);
      
      // Determine user role
      if (currentAccount) {
        const isRepoOwner = repo.owner === currentAccount.address;
        setIsOwner(isRepoOwner);
        
        if (isRepoOwner) {
          setUserRole(4); // Owner
        } else {
          const collaboration = repo.collaborators.find(
            c => c.address === currentAccount.address
          );
          setUserRole(collaboration?.role || 0);
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch repository:', error);
      toast({
        title: 'Error',
        description: 'Failed to load repository details',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch commit history (mock for now)
  const fetchCommits = async () => {
    if (!repository) return;
    
    try {
      setLoadingCommits(true);
      
      // In real implementation, this would fetch and decrypt commit manifests
      // For now, we'll create mock data
      const mockCommits: Commit[] = [
        {
          cid: repository.latestCommitManifestCid,
          author: repository.owner,
          message: 'Latest changes with enhanced features',
          timestamp: new Date(repository.updatedAt).toISOString(),
          parentCid: 'previous_commit_cid'
        },
        {
          cid: 'previous_commit_cid',
          author: repository.owner,
          message: 'Initial commit',
          timestamp: new Date(repository.createdAt).toISOString()
        }
      ];
      
      setCommits(mockCommits);
    } catch (error) {
      console.error('Failed to fetch commits:', error);
    } finally {
      setLoadingCommits(false);
    }
  };
  
  useEffect(() => {
    fetchRepository();
  }, [repositoryId, currentAccount, fetchRepository]);
  
  useEffect(() => {
    if (repository && userRole > 0) {
      fetchCommits();
    }
  }, [repository, userRole, fetchCommits]);
  
  // Copy functions
  const copyRepositoryId = () => {
    navigator.clipboard.writeText(repositoryId);
    toast({
      title: 'Copied',
      description: 'Repository ID copied to clipboard'
    });
  };
  
  const copyCloneCommand = () => {
    navigator.clipboard.writeText(`walgit clone ${repositoryId}`);
    toast({
      title: 'Copied',
      description: 'Clone command copied to clipboard'
    });
  };
  
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
  
  const canRead = userRole >= 1;
  const canWrite = userRole >= 2;
  const canAdmin = userRole >= 3 || isOwner;
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  if (!repository) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Repository not found</h3>
            <p className="text-muted-foreground mb-4">
              The repository you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button asChild>
              <Link href="/repositories">Browse Repositories</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold">{repository.name}</h1>
            {repository.sealPolicyId && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <Lock className="h-3 w-3" />
                <span>Encrypted</span>
              </Badge>
            )}
            <Badge variant={getRoleColor(userRole)}>
              {getRoleName(userRole)}
            </Badge>
          </div>
          
          <p className="text-muted-foreground max-w-2xl">
            {repository.description || 'No description provided'}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{repository.collaborators.length + 1} contributors</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitBranch className="h-4 w-4" />
              <span>{repository.defaultBranch}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Updated {formatDistanceToNow(new Date(repository.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {canRead && (
            <Button variant="outline" onClick={copyCloneCommand}>
              <Download className="h-4 w-4 mr-2" />
              Clone
            </Button>
          )}
          {canAdmin && (
            <Button variant="outline" asChild>
              <Link href={`/repositories/${repository.owner}/${repository.name}/settings`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Repository ID</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {repositoryId.slice(0, 16)}...
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={copyRepositoryId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">SEAL Policy</p>
                <p className="text-xs text-muted-foreground">
                  Threshold encryption enabled
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Storage</p>
                <p className="text-xs text-muted-foreground">
                  Walrus distributed storage
                </p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      {userRole === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Access Required</h3>
              <p className="text-muted-foreground mb-4">
                You need access permissions to view this repository&apos;s contents.
              </p>
              <p className="text-sm text-muted-foreground">
                Contact the repository owner to request access.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="code" className="space-y-4">
          <TabsList>
            <TabsTrigger value="code">
              <FileText className="h-4 w-4 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger value="commits">
              <History className="h-4 w-4 mr-2" />
              Commits
            </TabsTrigger>
            <TabsTrigger value="collaborators">
              <Users className="h-4 w-4 mr-2" />
              Collaborators
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="code">
            <Card>
              <CardHeader>
                <CardTitle>Repository Files</CardTitle>
                <CardDescription>
                  Files are encrypted and stored on Walrus. Use the CLI to interact with repository contents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Latest Commit</span>
                      <Badge variant="outline">{repository.latestCommitManifestCid.slice(0, 8)}...</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Files are encrypted with SEAL and stored on Walrus. Use the WalGit CLI to clone and work with files locally.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={copyCloneCommand}>
                      <Download className="h-4 w-4 mr-2" />
                      Clone Repository
                    </Button>
                    <Button variant="ghost" asChild>
                      <a
                        href={`https://suiexplorer.com/object/${repositoryId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Explorer
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commits">
            <Card>
              <CardHeader>
                <CardTitle>Commit History</CardTitle>
                <CardDescription>
                  Recent commits to the {repository.defaultBranch} branch
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCommits ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : commits.length > 0 ? (
                  <div className="space-y-4">
                    {commits.map((commit, index) => (
                      <div key={commit.cid} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <Avatar>
                          <AvatarFallback>
                            {commit.author.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{commit.message}</p>
                            <Badge variant="outline">
                              {commit.cid.slice(0, 8)}...
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span>{commit.author.slice(0, 6)}...{commit.author.slice(-4)}</span>
                            <span>{formatDistanceToNow(new Date(commit.timestamp), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No commits found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="collaborators">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Collaborators</CardTitle>
                    <CardDescription>
                      Manage repository access and permissions
                    </CardDescription>
                  </div>
                  {canAdmin && (
                    <Button size="sm" asChild>
                      <Link href={`/repositories/${repository.owner}/${repository.name}/collaborators/add`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Collaborator
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Owner */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {repository.owner.slice(2, 4).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {repository.owner.slice(0, 6)}...{repository.owner.slice(-4)}
                        </p>
                        <p className="text-sm text-muted-foreground">Repository owner</p>
                      </div>
                    </div>
                    <Badge>Owner</Badge>
                  </div>
                  
                  {/* Collaborators */}
                  {repository.collaborators.map((collaborator) => (
                    <div key={collaborator.address} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {collaborator.address.slice(2, 4).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {collaborator.address.slice(0, 6)}...{collaborator.address.slice(-4)}
                          </p>
                          <p className="text-sm text-muted-foreground">Collaborator</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getRoleColor(collaborator.role)}>
                          {getRoleName(collaborator.role)}
                        </Badge>
                        {canAdmin && (
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {repository.collaborators.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No collaborators yet</p>
                      {canAdmin && (
                        <Button className="mt-4" asChild>
                          <Link href={`/repositories/${repository.owner}/${repository.name}/collaborators/add`}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Collaborator
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}