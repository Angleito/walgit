import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import TrendingRepos from "@/components/dashboard/TrendingRepos";
import { RepoCard } from "@/components/dashboard/RepoCard";
import WaveBackground from "@/components/layout/WaveBackground";

const Index = () => {
  // Mock data for popular repositories
  const popularRepos = [
    {
      name: "coral-defi",
      owner: "suiocean",
      description: "Decentralized finance protocol built on Sui with oceanic liquidity pools and wave mechanisms",
      language: "TypeScript",
      languageColor: "text-blue-500",
      stars: 1254,
      forks: 178,
      lastUpdated: "2 days ago"
    },
    {
      name: "tidepool-forge",
      owner: "suiocean",
      description: "NFT minting and trading platform with unique ocean-themed assets and Sui-powered marketplace",
      language: "Rust",
      languageColor: "text-orange-600",
      stars: 876,
      forks: 92,
      lastUpdated: "1 week ago"
    },
    {
      name: "wave-validator",
      owner: "suiocean",
      description: "Validator node implementation with improved stake delegation and oceanic consensus algorithm",
      language: "Go",
      languageColor: "text-teal-500",
      stars: 543,
      forks: 76,
      lastUpdated: "3 days ago"
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <WaveBackground />
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 to-[#0A192F] text-white py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-white dark:bg-[#0A192F] rounded-t-[100%]"></div>
          <div className="absolute bottom-10 left-0 right-0 h-20 bg-white dark:bg-[#112240] rounded-t-[100%] animate-[wave_8s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-5 left-0 right-0 h-20 bg-white dark:bg-[#0A192F] rounded-t-[100%] animate-[wave_10s_ease-in-out_infinite_reverse]"></div>
        </div>
        
        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Dive into the Sui Ocean</h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              Explore, collaborate, and build on the waves of decentralized innovation
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="sui" className="font-medium">
                Explore Repositories
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                Learn Sui Development
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Dashboard Section */}
      <section className="container px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 space-y-6">
            <ProfileCard 
              username="suiocean"
              fullName="SUI Ocean Labs"
              bio="Building the next generation of oceanic blockchain experiences on SUI"
              followers={1254}
              following={87}
              repos={32}
            />
          </div>
          
          <div className="md:col-span-6 space-y-6">
            <div className="p-4 rounded-lg border border-border/60 bg-card/30">
              <h2 className="text-xl font-semibold mb-4 text-ocean-800">Your Repositories</h2>
              <div className="grid grid-cols-1 gap-3">
                {popularRepos.map((repo) => (
                  <RepoCard key={repo.name} {...repo} />
                ))}
              </div>
              <div className="mt-4 text-center">
                <Button variant="ocean-ghost">View All Repositories</Button>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-3 space-y-6">
            <TrendingRepos />
            <ActivityFeed />
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-20 bg-gradient-to-t from-blue-950 to-[#0A192F] text-white py-8">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Sui Ocean</h3>
              <p className="text-ocean-100 text-sm">
                The oceanic GitHub for Sui blockchain development and collaboration.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">Community Forum</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">Team</a></li>
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-ocean-100 hover:text-white transition-colors">License</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-ocean-700/50 dark:border-[#112240] text-center text-sm text-ocean-200">
            &copy; {new Date().getFullYear()} Sui Ocean. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
