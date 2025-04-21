import { RepoCard } from "./RepoCard";

const TrendingRepos = () => {
  const trendingRepos = [
    {
      name: "core",
      owner: "walgit",
      description: "Core implementation of decentralized Git protocol with blockchain integration",
      language: "Rust",
      languageColor: "text-orange-600",
      stars: 2547,
      forks: 423,
      lastUpdated: "yesterday"
    },
    {
      name: "web3-git-sync",
      owner: "walgit-labs",
      description: "Decentralized Git synchronization protocol with Web3 capabilities",
      language: "TypeScript",
      languageColor: "text-blue-500",
      stars: 1876,
      forks: 321,
      lastUpdated: "today"
    },
    {
      name: "smart-contracts",
      owner: "walgit",
      description: "Smart contract implementation for decentralized Git operations",
      language: "Move",
      languageColor: "text-violet-600",
      stars: 1254,
      forks: 178,
      lastUpdated: "2 days ago"
    },
    {
      name: "decentralized-wallet",
      owner: "walgit-labs",
      description: "Secure wallet implementation for decentralized Git authentication",
      language: "TypeScript",
      languageColor: "text-blue-500",
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
