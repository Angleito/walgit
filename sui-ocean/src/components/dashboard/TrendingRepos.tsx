
import { RepoCard } from "./RepoCard";

const TrendingRepos = () => {
  const trendingRepos = [
    {
      name: "sui-core",
      owner: "sui-foundation",
      description: "Core implementation of Sui blockchain with improved gas mechanisms and faster consensus",
      language: "Rust",
      languageColor: "text-orange-600",
      stars: 2547,
      forks: 423,
      lastUpdated: "yesterday"
    },
    {
      name: "move-stdlib",
      owner: "mysten-labs",
      description: "Standard library for Move programming language with extensible cryptographic primitives",
      language: "Move",
      languageColor: "text-blue-600",
      stars: 1876,
      forks: 321,
      lastUpdated: "today"
    },
    {
      name: "sui-wave-protocol",
      owner: "ocean-labs",
      description: "Liquid staking protocol for Sui with wave-based rewards distribution and oceanic governance",
      language: "TypeScript",
      languageColor: "text-blue-500",
      stars: 1254,
      forks: 178,
      lastUpdated: "2 days ago"
    },
    {
      name: "deep-blue-wallet",
      owner: "tidal-finance",
      description: "Self-custodial wallet for Sui with intuitive UX and enhanced security features",
      language: "JavaScript",
      languageColor: "text-yellow-500",
      stars: 957,
      forks: 124,
      lastUpdated: "3 days ago"
    }
  ];

  return (
    <div className="w-full p-4 rounded-lg border border-border/60 bg-card">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Trending Repositories</h3>
      <div className="grid grid-cols-1 gap-3">
        {trendingRepos.map((repo) => (
          <RepoCard key={repo.name} {...repo} />
        ))}
      </div>
    </div>
  );
};

export default TrendingRepos;
