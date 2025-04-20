
import { useParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, GitFork, Star, FileText, CircleAlert, Link } from "lucide-react";

const Repository = () => {
  const { owner, name } = useParams<{ owner: string; name: string }>();
  
  // Mock repository data
  const repository = {
    owner: owner || "suiocean",
    name: name || "sui-wave-protocol",
    description: "Liquid staking protocol for SUI with wave-based rewards distribution and oceanic governance",
    stars: 1254,
    watchers: 278,
    forks: 178,
    issues: 42,
    pullRequests: 16,
    language: "TypeScript",
    languageColor: "text-blue-500",
    lastUpdated: "2 days ago",
    readme: `# SUI Wave Protocol

A liquid staking protocol built for the SUI blockchain, featuring wave-based rewards distribution and oceanic governance mechanisms.

## Features

- Liquid staking with minimal slashing risk
- Wave-based reward distribution cycles
- Decentralized governance via Ocean DAO
- Deep integration with SUI Move objects

## Getting Started

\`\`\`bash
# Clone the repository
git clone https://github.com/suiocean/sui-wave-protocol.git

# Install dependencies
cd sui-wave-protocol
npm install

# Run development server
npm run dev
\`\`\`

## License

MIT
`
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white relative">
      <WaveBackground />
      <Header />
      
      <div className="container px-4 py-8">
        {/* Repository Header */}
        <div className="mb-8">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Link className="h-4 w-4 mr-1" />
            <a href={`/${repository.owner}`} className="font-medium text-ocean-600 hover:underline">
              {repository.owner}
            </a>
            <span className="mx-1">/</span>
            <a href={`/${repository.owner}/${repository.name}`} className="font-semibold text-ocean-700 hover:underline">
              {repository.name}
            </a>
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
            <div className="bg-white rounded-lg border border-border/60 overflow-hidden">
              {/* Tabs Navigation */}
              <Tabs defaultValue="code">
                <div className="border-b border-border/60">
                  <TabsList className="h-auto p-0 bg-transparent">
                    <TabsTrigger 
                      value="code" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-ocean-500 data-[state=active]:bg-transparent px-4 py-3"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger 
                      value="issues" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-ocean-500 data-[state=active]:bg-transparent px-4 py-3"
                    >
                      <CircleAlert className="h-4 w-4 mr-2" />
                      Issues <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{repository.issues}</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pulls" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-ocean-500 data-[state=active]:bg-transparent px-4 py-3"
                    >
                      <GitFork className="h-4 w-4 mr-2 rotate-90" />
                      Pull Requests <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{repository.pullRequests}</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="code" className="p-0 m-0">
                  <div className="p-6">
                    <div className="rounded-lg border border-border/60 bg-muted/30 p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                          <h2 className="text-lg font-semibold">README.md</h2>
                        </div>
                        <span className="text-sm text-muted-foreground">{repository.lastUpdated}</span>
                      </div>
                      <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap">{repository.readme}</pre>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="issues" className="p-0 m-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Issues</h2>
                      <Button variant="ocean" size="sm">New Issue</Button>
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
                      <Button variant="ocean" size="sm">New Pull Request</Button>
                    </div>
                    <div className="rounded-lg border border-border/60 p-10 text-center">
                      <GitFork className="h-10 w-10 mx-auto mb-3 text-muted-foreground rotate-90" />
                      <p className="text-muted-foreground mb-4">No pull requests are currently available in this repository</p>
                      <Button variant="outline" size="sm">Create Pull Request</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
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
            
            <div className="rounded-lg border border-border/60 bg-gradient-to-b from-ocean-50 to-white p-4">
              <h3 className="font-semibold mb-3">SUI Network Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="relative p-2 rounded-md bg-ocean-100/50 overflow-hidden">
                  <div className="relative z-10">
                    <span className="block text-muted-foreground mb-1">TPS</span>
                    <span className="font-bold text-lg text-ocean-800">3,245</span>
                  </div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-1 w-full bg-ocean-300 opacity-30"></div>
                    <div className="absolute bottom-0 h-1 w-[70%] bg-ocean-500 animate-[flow_2s_ease-in-out_infinite]"></div>
                  </div>
                </div>
                
                <div className="relative p-2 rounded-md bg-ocean-100/50 overflow-hidden">
                  <div className="relative z-10">
                    <span className="block text-muted-foreground mb-1">Gas Price</span>
                    <span className="font-bold text-lg text-ocean-800">0.0042 SUI</span>
                  </div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-1 w-full bg-ocean-300 opacity-30"></div>
                    <div className="absolute bottom-0 h-1 w-[30%] bg-ocean-500 animate-[flow_3s_ease-in-out_infinite]"></div>
                  </div>
                </div>
                
                <div className="relative p-2 rounded-md bg-ocean-100/50 overflow-hidden">
                  <div className="relative z-10">
                    <span className="block text-muted-foreground mb-1">Validators</span>
                    <span className="font-bold text-lg text-ocean-800">129</span>
                  </div>
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 h-1 w-full bg-ocean-300 opacity-30"></div>
                    <div className="absolute bottom-0 h-1 w-[80%] bg-ocean-500 animate-[flow_2.5s_ease-in-out_infinite]"></div>
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
