import { Button } from "@/components/ui/button";
import WaveBackground from "@/components/layout/WaveBackground";
import { Link } from "react-router-dom";
import { GitBranchIcon, GitPullRequestIcon, CodeIcon, StarIcon, ShieldCheckIcon } from "lucide-react";
import WalletConnect from "@/components/wallet/WalletConnect";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <WaveBackground className="absolute inset-0 z-0" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <img 
              src="/placeholder.svg" 
              alt="WalGit Logo" 
              className="h-8 w-8" 
            />
            <h1 className="text-xl font-bold">WalGit</h1>
          </div>
          <nav className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
              <li><a href="#why-walgit" className="hover:text-blue-400 transition-colors">Why WalGit</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Docs</a></li>
            </ul>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/repositories">
              <Button variant="outline" className="border-white/20 hover:border-white/40">
                Explore
              </Button>
            </Link>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-violet-500 inline-block text-transparent bg-clip-text">
          Decentralized Git for Web3
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Build, collaborate, and deploy with confidence on the blockchain
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/repositories">
            <Button variant="default" className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600">
              Explore Projects
            </Button>
          </Link>
          <Link to="/new">
            <Button variant="outline" className="border-white/20 hover:border-white/40">
              Create Repository
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 bg-black/50 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-violet-500 inline-block text-transparent bg-clip-text">
              Why developers choose WalGit
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<GitBranchIcon className="h-10 w-10 text-blue-400" />}
              title="Decentralized Repositories"
              description="Store your code on the Sui blockchain for increased resilience, transparency, and no single point of failure."
            />
            <FeatureCard 
              icon={<ShieldCheckIcon className="h-10 w-10 text-violet-400" />}
              title="Wallet-based Authentication"
              description="Secure access to repositories using your Web3 wallet. No more password management headaches."
            />
            <FeatureCard 
              icon={<GitPullRequestIcon className="h-10 w-10 text-blue-400" />}
              title="Transparent Collaboration"
              description="All contributions and code changes are permanently recorded on-chain, creating a trustless environment."
            />
          </div>
        </div>
      </section>

      {/* Why WalGit Section */}
      <section id="why-walgit" className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 to-violet-500 inline-block text-transparent bg-clip-text">
                  The future of code collaboration
                </span>
              </h2>
              <p className="text-gray-300 mb-6">
                Traditional version control systems are centralized, requiring trust in a single authority.
                WalGit leverages blockchain technology to create a decentralized alternative that ensures:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-500/20 p-1 mt-1">
                    <CodeIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Immutable History</h3>
                    <p className="text-gray-400">Once committed, your code history cannot be altered or deleted</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-violet-500/20 p-1 mt-1">
                    <StarIcon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Ownership Authentication</h3>
                    <p className="text-gray-400">Cryptographically verify code ownership and contributions</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-500/20 p-1 mt-1">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Censorship Resistance</h3>
                    <p className="text-gray-400">Your code remains accessible regardless of political or corporate decisions</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-900/20 to-violet-900/20 rounded-xl p-8 border border-white/10">
              <div className="rounded-lg bg-black/50 p-4 border border-white/10 font-mono text-sm text-gray-300 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-500 text-xs ml-2">terminal</span>
                </div>
                <div>
                  <p className="text-green-400 mb-2">$ walgit init</p>
                  <p className="text-gray-400 mb-2">Initializing new repository on Sui blockchain...</p>
                  <p className="text-gray-400 mb-2">Repository created with ID: 0x3f8a...</p>
                  <p className="text-green-400 mb-2">$ walgit commit -m "Initial commit"</p>
                  <p className="text-gray-400">Commit 0x2c4f added to blockchain!</p>
                </div>
              </div>
              <div className="rounded-lg bg-black/50 p-4 border border-white/10 font-mono text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">repository.move</span>
                  <span className="text-xs text-gray-500">10 KB</span>
                </div>
                <pre className="text-blue-300">
                  <code>
{`module walgit::repository {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    
    struct Repository has key, store {
        id: UID,
        name: String,
        owner: address,
        // ... other fields
    }
    
    // ... repository functions
}`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 bg-black/50 backdrop-blur-sm py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="100+" label="Active Repositories" />
            <StatCard number="1,000+" label="Commits" />
            <StatCard number="50+" label="Contributors" />
            <StatCard number="24/7" label="Blockchain Uptime" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to join the decentralized development revolution?
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Start building with WalGit today and experience the future of secure, collaborative, 
              decentralized code management.
            </p>
            <WalletConnect />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/70 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <img 
                src="/placeholder.svg" 
                alt="WalGit Logo" 
                className="h-8 w-8" 
              />
              <h1 className="text-xl font-bold">WalGit</h1>
            </div>
            <nav className="mb-6 md:mb-0">
              <ul className="flex flex-wrap justify-center items-center gap-6">
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </nav>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-discord"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M7.5 7.2c.3-.1.6-.2.8-.2h7.2c.3 0 .8.1.9.2.1.1.1.2.1.3v8.2c0 .2-.1.3-.2.4-.1.1-.2.1-.3.1-.3 0-1.3-.4-1.7-.7-.1-.1-.1-.2-.1-.3v-.7c0-.2.1-.4.2-.5.1-.1.2-.1.3-.1h.5c.2 0 .4-.1.5-.3.1-.1.1-.3.1-.4 0-.2-.1-.3-.2-.4-.1-.1-.3-.2-.4-.2h-6.5c-.1 0-.3.1-.4.2-.1.1-.2.2-.2.4 0 .1 0 .3.1.4.1.2.3.3.5.3h.5c.1 0 .2 0 .3.1.1.1.2.3.2.5v.7c0 .1 0 .2-.1.3-.4.3-1.4.7-1.7.7-.1 0-.2 0-.3-.1-.1-.1-.2-.2-.2-.4V7.5c0-.1 0-.2.1-.3z"/><path d="M8.5 14.2s1-.4 2-.4 2.1.4 2.1.4"/><path d="M17 14.6c.7-1.7 1.3-3.6 1-6 0-.6-.1-1.4-.3-2.1-.3-.7-1.3-1.2-1.9-1.5-.5-.3-1.2-.6-2-.7-2-.3-3.8-.3-6 0-.6.1-1.5.3-2 .7-.6.3-1.6.8-1.9 1.5-.2.7-.3 1.5-.3 2.1-.3 2.4.3 4.3 1 6 .5 1.2 1.2 1.5 1.2 1.5s-.1-.7 0-1.2c.1-.5.3-.9.6-1.1.5.1 1.1.1 1.6.1 1.2.1 2.5.1 3.7 0 .5 0 1.1-.1 1.6-.1.3.2.5.6.6 1.1.1.5 0 1.2 0 1.2s.7-.3 1.2-1.5z"/></svg>
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} WalGit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-900/10 to-violet-900/10 p-6 border border-white/10 hover:border-white/20 transition-all hover:translate-y-[-4px]">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ number, label }: {
  number: string;
  label: string;
}) => {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-violet-500 inline-block text-transparent bg-clip-text mb-2">
        {number}
      </div>
      <p className="text-gray-300">{label}</p>
    </div>
  );
};

export default HomePage;