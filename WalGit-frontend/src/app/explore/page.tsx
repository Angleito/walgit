'use client';

import { useState } from 'react';
import { Search, TrendingUp, Star, GitBranch, Code } from 'lucide-react';
import { CyberpunkCard } from '@/components/ui/cyberpunk-card';
import { ResponsiveCyberpunkButton } from '@/components/ui/responsive-cyberpunk-ui';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrendingRepo {
  id: string;
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  trending: 'up' | 'stable';
}

const mockTrendingRepos: TrendingRepo[] = [
  {
    id: '1',
    name: 'defi-protocol',
    owner: 'sui-ecosystem',
    description: 'Advanced DeFi protocol built on Sui blockchain with innovative AMM design',
    stars: 1242,
    forks: 327,
    language: 'Move',
    trending: 'up',
  },
  {
    id: '2',
    name: 'nft-marketplace',
    owner: 'web3-builders',
    description: 'Decentralized NFT marketplace with low fees and instant transactions',
    stars: 892,
    forks: 215,
    language: 'TypeScript',
    trending: 'up',
  },
  {
    id: '3',
    name: 'sui-wallet-extension',
    owner: 'crypto-tools',
    description: 'Browser extension wallet for Sui with enhanced security features',
    stars: 674,
    forks: 142,
    language: 'JavaScript',
    trending: 'stable',
  },
  {
    id: '4',
    name: 'game-contracts',
    owner: 'gamefi-studio',
    description: 'Smart contracts for on-chain gaming with economic models',
    stars: 523,
    forks: 98,
    language: 'Move',
    trending: 'up',
  },
];

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const languages = ['Move', 'TypeScript', 'JavaScript', 'Rust', 'Solidity'];

  const filteredRepos = mockTrendingRepos.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         repo.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = !selectedLanguage || repo.language === selectedLanguage;
    return matchesSearch && matchesLanguage;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-[#05d9e8] to-[#ff2a6d] bg-clip-text text-transparent">
            Explore Repositories
          </span>
        </h1>
        <p className="text-gray-400">Discover trending projects and innovative solutions on WalGit</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/50 border-[#05d9e8]/30 focus:border-[#05d9e8] text-white placeholder:text-gray-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {languages.map((lang) => (
            <ResponsiveCyberpunkButton
              key={lang}
              variant={selectedLanguage === lang ? 'cyberNeon' : 'cyberGlitch'}
              size="sm"
              onClick={() => setSelectedLanguage(selectedLanguage === lang ? null : lang)}
              className={cn(
                "transition-all duration-300",
                selectedLanguage === lang && "shadow-[0_0_20px_rgba(255,0,255,0.6)]"
              )}
            >
              <Code className="w-4 h-4 mr-1" />
              {lang}
            </ResponsiveCyberpunkButton>
          ))}
        </div>
      </div>

      {/* Trending Repositories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRepos.map((repo) => (
          <CyberpunkCard
            key={repo.id}
            variant="blue"
            className={cn(
              "p-6 hover:shadow-[0_0_30px_rgba(5,217,232,0.5)] transition-all duration-300",
              "border-[#05d9e8]/30 hover:border-[#05d9e8]/60"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {repo.owner}/{repo.name}
                </h3>
                <p className="text-gray-400 text-sm">{repo.description}</p>
              </div>
              {repo.trending === 'up' && (
                <Badge variant="outline" className="border-[#00ff9f] text-[#00ff9f]">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1 text-gray-400">
                  <Star className="w-4 h-4 text-[#f9f871]" />
                  <span>{repo.stars}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <GitBranch className="w-4 h-4 text-[#05d9e8]" />
                  <span>{repo.forks}</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-[#05d9e8]/10 text-[#05d9e8] border-[#05d9e8]/30">
                {repo.language}
              </Badge>
            </div>
          </CyberpunkCard>
        ))}
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400">No repositories found matching your criteria</p>
        </div>
      )}
    </div>
  );
}