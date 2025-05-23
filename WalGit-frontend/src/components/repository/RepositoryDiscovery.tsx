'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Compass, 
  Download, 
  GitBranch,
  Users,
  Clock,
  Zap,
  TrendingUp,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { QuickClone } from './QuickClone';
import { RepositoryList } from './RepositoryList';

export function RepositoryDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock featured repositories for demo
  const featuredRepositories = [
    {
      id: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
      name: 'walgit-cli',
      description: 'Official WalGit command-line interface with SEAL encryption',
      owner: '0xowner1234...',
      language: 'JavaScript',
      stars: 245,
      forks: 42,
      isOfficial: true
    },
    {
      id: '0x2345678901bcdef02345678901bcdef02345678901bcdef02345678901bcdef023',
      name: 'walrus-sdk-examples',
      description: 'Example projects using Walrus decentralized storage',
      owner: '0xowner5678...',
      language: 'TypeScript',
      stars: 189,
      forks: 38,
      isOfficial: false
    },
    {
      id: '0x3456789012cdef123456789012cdef123456789012cdef123456789012cdef1234',
      name: 'seal-encryption-demo',
      description: 'Demonstration of SEAL threshold encryption patterns',
      owner: '0xowner9012...',
      language: 'Rust',
      stars: 156,
      forks: 29,
      isOfficial: false
    }
  ];

  const categories = [
    {
      name: 'Official',
      description: 'Official WalGit repositories and tools',
      icon: <Star className="h-5 w-5" />,
      count: 8
    },
    {
      name: 'Examples',
      description: 'Example projects and tutorials',
      icon: <GitBranch className="h-5 w-5" />,
      count: 24
    },
    {
      name: 'Tools',
      description: 'Developer tools and utilities',
      icon: <Zap className="h-5 w-5" />,
      count: 15
    },
    {
      name: 'Templates',
      description: 'Project templates and boilerplates',
      icon: <Users className="h-5 w-5" />,
      count: 12
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Compass className="h-8 w-8" />
          <h1 className="text-4xl font-bold">Discover Repositories</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore WalGit repositories with SEAL encryption and Walrus storage. 
          Clone any repository you have access to.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickClone />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Search Repositories</span>
            </CardTitle>
            <CardDescription>
              Find repositories by name, description, or technology
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['JavaScript', 'TypeScript', 'Rust', 'Python', 'React'].map((tech) => (
                <Badge key={tech} variant="outline" className="cursor-pointer hover:bg-muted">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Browse Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Browse by Category</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Card key={category.name} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <Badge variant="secondary" className="mt-2">
                      {category.count} repositories
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Featured Repositories</h3>
            <Badge variant="outline">Hand-picked</Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredRepositories.map((repo) => (
              <Card key={repo.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{repo.name}</span>
                        {repo.isOfficial && (
                          <Badge variant="default">Official</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {repo.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-4">
                      <span>{repo.language}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3" />
                        <span>{repo.stars}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <GitBranch className="h-3 w-3" />
                        <span>{repo.forks}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground font-mono">
                    {repo.id.slice(0, 16)}...
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/repositories/${repo.owner}/${repo.name}`}>
                        View
                      </Link>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => navigator.clipboard.writeText(`walgit clone ${repo.id}`)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Clone
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Trending This Week</h3>
            <Badge variant="outline" className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Hot</span>
            </Badge>
          </div>
          
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Trending repositories will appear here based on activity and engagement
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Recently Updated</h3>
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Fresh</span>
            </Badge>
          </div>
          
          <RepositoryList 
            title=""
            showCreateButton={false}
            emptyStateMessage="No recent repositories found"
          />
        </TabsContent>
      </Tabs>

      {/* CLI Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Using the CLI</CardTitle>
          <CardDescription>
            Common commands for discovering and cloning repositories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">List your repositories</h4>
              <code className="block bg-muted p-2 rounded text-sm">walgit list</code>
              <p className="text-sm text-muted-foreground">
                Shows all repositories you own or collaborate on
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Search repositories</h4>
              <code className="block bg-muted p-2 rounded text-sm">walgit search &quot;project name&quot;</code>
              <p className="text-sm text-muted-foreground">
                Find repositories by name or description
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Clone a repository</h4>
              <code className="block bg-muted p-2 rounded text-sm">walgit clone &lt;repository-id&gt;</code>
              <p className="text-sm text-muted-foreground">
                Clone and decrypt repository files locally
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Get repository info</h4>
              <code className="block bg-muted p-2 rounded text-sm">walgit info &lt;repository-id&gt;</code>
              <p className="text-sm text-muted-foreground">
                View repository details and access permissions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}