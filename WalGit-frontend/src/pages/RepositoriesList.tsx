import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import WaveBackground from "@/components/layout/WaveBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RepositoriesList = () => {
  // TODO: pull on‑chain repositories via Sui RPC
  const repos = [
    { id: '0x1', owner: 'suidev', name: 'example-repo' },
    { id: '0x2', owner: 'walrus-labs', name: 'walgit-core' },
    // Add more mock repos
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-50/30 to-white dark:from-dark-300 dark:to-dark-100 relative">
      <WaveBackground />
      <Header />

      <div className="container px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Repositories</h1>
          <Link to="/new">
            <Button variant="ocean">Create New Repository</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map(r => (
            <Card key={r.id} className="bg-card/80 backdrop-blur-sm hover:border-ocean-400/50 transition-colors">
              <CardHeader>
                <CardTitle>
                  <Link to={`/${r.owner}/${r.name}`} className="hover:text-ocean-500 transition-colors">
                    {r.owner} / {r.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Repository description placeholder...</p>
                {/* Add more repo details like stars, forks, language later */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RepositoriesList;
