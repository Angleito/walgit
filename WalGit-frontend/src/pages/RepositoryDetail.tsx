import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  GitFork, 
  Eye, 
  AlertCircle, 
  Code, 
  BookOpen, 
  GitPullRequest, 
  Play, 
  Shield,
  History,
  FileCode,
  Settings
} from "lucide-react";

// Mock data for demonstration
const mockRepoData = {
  name: "walgit-core",
  description: "Core functionality for the WalGit decentralized version control system",
  language: "Move",
  languageColor: "#6e5494",
  stars: 42,
  forks: 12,
  watchers: 8,
  issues: 5,
  pullRequests: 3,
  lastUpdated: "2 days ago",
  owner: "walrus-dev",
  defaultBranch: "main",
  license: "MIT",
};

const mockFiles = [
  { name: "sources", type: "directory", lastCommit: "Initial commit", lastUpdated: "2 days ago" },
  { name: "tests", type: "directory", lastCommit: "Add unit tests", lastUpdated: "2 days ago" },
  { name: "Move.toml", type: "file", lastCommit: "Update dependencies", lastUpdated: "2 days ago" },
  { name: "README.md", type: "file", lastCommit: "Update documentation", lastUpdated: "2 days ago" },
  { name: "LICENSE", type: "file", lastCommit: "Initial commit", lastUpdated: "2 days ago" },
];

export default function RepositoryDetail() {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  const [repoData] = useState(mockRepoData);
  const [files] = useState(mockFiles);
  
  // In a real implementation, you would fetch repository data based on the owner and repo parameters

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Repository header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <span className="text-muted-foreground">
                <Link to={`/${owner || repoData.owner}`} className="hover:underline">
                  {owner || repoData.owner}
                </Link>
              </span>
              <span>/</span>
              <Link to={`/${owner || repoData.owner}/${name || repoData.name}`} className="hover:underline">
                {name || repoData.name}
              </Link>
              <span className="ml-2 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Public</span>
            </h1>
            <p className="text-muted-foreground mt-1">{repoData.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Eye size={16} />
              <span>Watch</span>
              <span className="ml-1">{repoData.watchers}</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Star size={16} />
              <span>Star</span>
              <span className="ml-1">{repoData.stars}</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <GitFork size={16} />
              <span>Fork</span>
              <span className="ml-1">{repoData.forks}</span>
            </Button>
          </div>
        </div>
        
        <div className="border-b border-border">
          <Tabs defaultValue="code" className="w-full">
            <TabsList className="mb-0">
              <TabsTrigger value="code" className="flex items-center gap-1">
                <Code size={16} />
                <span>Code</span>
              </TabsTrigger>
              <TabsTrigger value="issues" className="flex items-center gap-1">
                <AlertCircle size={16} />
                <span>Issues</span>
                <span className="ml-1 text-xs">{repoData.issues}</span>
              </TabsTrigger>
              <TabsTrigger value="pull-requests" className="flex items-center gap-1">
                <GitPullRequest size={16} />
                <span>Pull Requests</span>
                <span className="ml-1 text-xs">{repoData.pullRequests}</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-1">
                <Play size={16} />
                <span>Actions</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Shield size={16} />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-1">
                <FileCode size={16} />
                <span>Insights</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1">
                <Settings size={16} />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className="pt-6">
              {/* Branch selector and code navigation */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <span>Branch: {repoData.defaultBranch}</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <History size={16} className="mr-1" />
                    <Link to={`/${owner || repoData.owner}/${name || repoData.name}/commits`}>
                      <span>Commits</span>
                    </Link>
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Go to file</Button>
                  <Button variant="outline" size="sm">Add file</Button>
                  <Button size="sm">Clone</Button>
                </div>
              </div>
              
              {/* Repository content */}
              <div className="border border-border rounded-lg overflow-hidden mb-6">
                <div className="bg-muted/30 p-3 border-b border-border flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    Last commit: <span className="font-mono">a1b2c3d</span> · Updated {repoData.lastUpdated}
                  </div>
                </div>
                
                <div className="divide-y divide-border">
                  {files.map((file) => (
                    <div key={file.name} className="flex justify-between items-center p-3 hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        {file.type === "directory" ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                        )}
                        <Link 
                          to={`/${owner || repoData.owner}/${name || repoData.name}/blob/main/${file.name}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {file.name}
                        </Link>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{file.lastCommit}</span>
                        <span className="mx-2">•</span>
                        <span>{file.lastUpdated}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* README section */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 p-3 border-b border-border flex items-center gap-2">
                  <BookOpen size={16} />
                  <h2 className="font-semibold">README.md</h2>
                </div>
                
                <div className="p-6 prose prose-invert max-w-none">
                  <h1>WalGit Core</h1>
                  <p>Core functionality for the WalGit decentralized version control system built on Sui.</p>
                  
                  <h2>Features</h2>
                  <ul>
                    <li>Decentralized storage of git repositories</li>
                    <li>On-chain access control</li>
                    <li>Integration with Sui blockchain</li>
                  </ul>
                  
                  <h2>Getting Started</h2>
                  <p>To use WalGit, you'll need:</p>
                  <ul>
                    <li>A Sui wallet</li>
                    <li>The WalGit CLI</li>
                  </ul>
                  
                  <h2>License</h2>
                  <p>This project is licensed under the {repoData.license} License.</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="issues">
              <div className="text-center py-8 text-muted-foreground">
                Issues will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="pull-requests">
              <div className="text-center py-8 text-muted-foreground">
                Pull requests will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="actions">
              <div className="text-center py-8 text-muted-foreground">
                Actions will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="text-center py-8 text-muted-foreground">
                Security information will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="insights">
              <div className="text-center py-8 text-muted-foreground">
                Repository insights will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="settings">
              <div className="text-center py-8 text-muted-foreground">
                Repository settings will be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
