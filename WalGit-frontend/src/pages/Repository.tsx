import { useParams, Link } from "react-router-dom"; // Import Link
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, GitFork, Star, FileText, CircleAlert, Link as LinkIcon, GitCommit } from "lucide-react"; // Added GitCommit, renamed Link to LinkIcon
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components

const Repository = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();

  // Mock repository data
  const repository = {
    owner: owner || "walgit",
    name: name || "decentralized-git",
    description: "Core implementation of decentralized Git protocol with blockchain-based version control",
    stars: 1254,
    watchers: 278,
    forks: 178,
    issues: 42,
    pullRequests: 16,
    language: "TypeScript",
    languageColor: "text-blue-500",
    lastUpdated: "2 days ago",
    readme: `# Decentralized Git Protocol

A blockchain-based version control system that enables truly decentralized code collaboration.

## Features

- Decentralized repository hosting
- Blockchain-based commit verification
- Web3 authentication and access control
- Smart contract integration

## Getting Started

\`\`\`bash
# Clone the repository
git clone https://github.com/walgit/decentralized-git.git

# Install dependencies
cd decentralized-git
npm install

# Run development server
npm run dev
\`\`\`

## License

MIT
`
  };

  // Mock commit data
  const commits = [
    { id: '0xabc', message: 'Initial commit: Setup project structure', author: 'walgit', timestamp: Date.now() - 86400000 * 2 },
    { id: '0xdef', message: 'Feat: Implement basic repository creation', author: 'web3dev', timestamp: Date.now() - 86400000 },
    { id: '0xghi', message: 'Fix: Update merkle tree validation', author: 'walgit', timestamp: Date.now() - 3600000 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8">
        {/* Repository Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <LinkIcon className="h-4 w-4 mr-1" />
            <Link to={`/${repository.owner}`} className="font-medium text-blue-600 hover:underline">
              {repository.owner}
            </Link>
            <span className="mx-1">/</span>
            <Link to={`/${repository.owner}/${repository.name}`} className="font-semibold text-blue-700 hover:underline">
              {repository.name}
            </Link>
          </div>

          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground">{repository.name}</h1>
            <p className="text-muted-foreground mt-2">{repository.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="gap-1">
              <Eye className="h-4 w-4" />
              Watch
              <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-semibold ml-1">{repository.watchers}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Star className="h-4 w-4" />
              Star
              <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-semibold ml-1">{repository.stars}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <GitFork className="h-4 w-4" />
              Fork
              <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-semibold ml-1">{repository.forks}</span>
            </Button>
          </div>
        </div>

        {/* Repository Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="bg-card/80 backdrop-blur-sm overflow-hidden"> {/* Use Card */}
              {/* Tabs Navigation */}
              <Tabs defaultValue="code">
                <div className="border-b border-border/60">
                  <TabsList className="h-auto p-0 bg-transparent">
                    <TabsTrigger
                      value="code"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent px-4 py-3"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger
                      value="commits"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent px-4 py-3"
                    >
                      <GitCommit className="h-4 w-4 mr-2" />
                      Commits <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{commits.length}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="issues"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent px-4 py-3"
                    >
                      <CircleAlert className="h-4 w-4 mr-2" />
                      Issues <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{repository.issues}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="pulls"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent px-4 py-3"
                    >
                      <GitFork className="h-4 w-4 mr-2 rotate-90" />
                      Pull Requests <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{repository.pullRequests}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="code" className="p-0 m-0">
                  <div className="p-6">
                    <Card className="bg-muted/30">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                         <CardTitle className="text-lg font-semibold flex items-center">
                           <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                           README.md
                         </CardTitle>
                      </CardHeader>
                      <CardContent>
                         <pre className="text-xs bg-background p-4 rounded overflow-auto">{repository.readme}</pre>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="commits" className="p-0 m-0"> {/* Commits Content */}
                  <div className="border-t border-border/60">
                    <div className="flex justify-end p-4">
                       <Link to={`/${repository.owner}/${repository.name}/commit/new`}>
                         <Button variant="outline" size="sm">New Commit</Button>
                       </Link>
                    </div>
                    <ul>
                      {commits.map(c => (
                        <li key={c.id} className="border-b border-border/60 px-6 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex justify-between items-center">
                            <Link to={`/${repository.owner}/${repository.name}/commits/${c.id}`} className="text-sm font-medium hover:text-blue-600">
                              {c.message}
                            </Link>
                            <Link to={`/${repository.owner}/${repository.name}/commits/${c.id}`} className="text-xs font-mono text-muted-foreground hover:text-blue-600">
                              {c.id.substring(0, 9)}...
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">{c.author}</span> committed {new Date(c.timestamp).toLocaleDateString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="issues" className="p-0 m-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Issues</h2>
                      <Button variant="default" size="sm" className="bg-blue-500 hover:bg-blue-600">New Issue</Button>
                    </div>
                    <div className="rounded-lg border border-border/60 p-10 text-center">
                      <CircleAlert className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No issues are currently available in this repository</p>
                      <Button variant="outline" size="sm">Create Issue</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="pulls" className="p-0 m-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Pull Requests</h2>
                      <Button variant="default" size="sm" className="bg-blue-500 hover:bg-blue-600">New Pull Request</Button>
                    </div>
                    <div className="rounded-lg border border-border/60 p-10 text-center">
                      <GitFork className="h-10 w-10 mx-auto mb-3 text-muted-foreground rotate-90" />
                      <p className="text-muted-foreground mb-4">No pull requests are currently available in this repository</p>
                      <Button variant="outline" size="sm">Create Pull Request</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border border-border/60 bg-white p-4">
              <h3 className="font-semibold mb-3">About</h3>
              <p className="text-sm text-muted-foreground mb-4">{repository.description}</p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-5 h-5 mt-0.5 mr-2 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-white"></span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground">Language</span>
                    <span className="font-medium">{repository.language}</span>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Star className="w-5 h-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <span className="block text-muted-foreground">Stars</span>
                    <span className="font-medium">{repository.stars}</span>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <GitFork className="w-5 h-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <span className="block text-muted-foreground">Forks</span>
                    <span className="font-medium">{repository.forks}</span>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CircleAlert className="w-5 h-5 mt-0.5 mr-2 text-muted-foreground" />
                  <div>
                    <span className="block text-muted-foreground">Issues</span>
                    <span className="font-medium">{repository.issues}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-border/60 bg-gradient-to-b from-blue-50 to-white p-4">
              <h3 className="font-semibold mb-3">Network Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="relative p-2 rounded-md bg-blue-100/50 overflow-hidden">
                  <div className="relative z-10">
                    <span className="block text-muted-foreground mb-1">TPS</span>
                    <span className="font-bold text-lg text-blue-800">3,245</span>
                  </div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-1 w-full bg-blue-300 opacity-30"></div>
                    <div className="absolute bottom-0 h-1 w-[70%] bg-blue-500 animate-[flow_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
                
                <div className="relative p-2 rounded-md bg-blue-100/50 overflow-hidden">
                  <div className="relative z-10">
                    <span className="block text-muted-foreground mb-1">Gas Price</span>
                    <span className="font-bold text-lg text-blue-800">0.0042 WAL</span>
                  </div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-1 w-full bg-blue-300 opacity-30"></div>
                    <div className="absolute bottom-0 h-1 w-[30%] bg-blue-500 animate-[flow_3s_ease-in-out_infinite]"></div>
                  </div>
                </div>
                
                <div className="relative p-2 rounded-md bg-blue-100/50 overflow-hidden">
                  <div className="relative z-10">
                    <span className="block text-muted-foreground mb-1">Validators</span>
                    <span className="font-bold text-lg text-blue-800">129</span>
                  </div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-1 w-full bg-blue-300 opacity-30"></div>
                    <div className="absolute bottom-0 h-1 w-[80%] bg-blue-500 animate-[flow_2.5s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Repository;
