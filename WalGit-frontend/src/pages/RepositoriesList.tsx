import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RepositoriesList = () => {
  // TODO: pull on‑chain repositories via RPC
  const repos = [
    { 
      id: '0x1', 
      owner: 'walgit', 
      name: 'protocol',
      description: 'Core implementation of decentralized Git protocol with blockchain integration'
    },
    { 
      id: '0x2', 
      owner: 'walgit', 
      name: 'web3-git',
      description: 'Web3 authentication and access control for decentralized Git'
    },
    { 
      id: '0x3', 
      owner: 'walgit', 
      name: 'blockchain-git',
      description: 'Git implementation with blockchain-based storage and validation'
    },
    { 
      id: '0x4', 
      owner: 'walgit-labs', 
      name: 'crypto-git',
      description: 'Cryptographic primitives for secure decentralized Git operations'
    },
    { 
      id: '0x5', 
      owner: 'walgit-community', 
      name: 'examples',
      description: 'Example repositories showing WalGit integration patterns'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Repositories</h1>
          <Link to="/new">
            <Button variant="default" className="bg-blue-500 hover:bg-blue-600">Create New Repository</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map(r => (
            <Card key={r.id} className="bg-card/80 backdrop-blur-sm hover:border-blue-400/50 transition-colors">
              <CardHeader>
                <CardTitle>
                  <Link to={`/${r.owner}/${r.name}`} className="hover:text-blue-500 transition-colors">
                    {r.owner} / {r.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RepositoriesList;
