import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StarIcon, GitForkIcon, Users } from "lucide-react";

// Mock data for demonstration
const mockUserData = {
  username: "walrus-dev",
  fullName: "Walrus Developer",
  bio: "Building decentralized version control on Sui blockchain",
  avatarUrl: "/walgitv3.png",
  followers: 128,
  following: 64,
  repos: 15,
  location: "Blockchain, Sui Network",
  website: "https://walgit.io",
  twitter: "@walrus_dev",
  joined: "January 2025"
};

const mockRepos = [
  {
    name: "walgit-core",
    description: "Core functionality for the WalGit decentralized version control system",
    language: "Move",
    languageColor: "#6e5494",
    stars: 42,
    forks: 12,
    lastUpdated: "2 days ago",
    owner: "walrus-dev"
  },
  {
    name: "walgit-frontend",
    description: "Frontend interface for WalGit",
    language: "TypeScript",
    languageColor: "#3178c6",
    stars: 28,
    forks: 8,
    lastUpdated: "5 days ago",
    owner: "walrus-dev"
  },
  {
    name: "sui-examples",
    description: "Example projects built on the Sui blockchain",
    language: "Move",
    languageColor: "#6e5494",
    stars: 35,
    forks: 15,
    lastUpdated: "1 week ago",
    owner: "walrus-dev"
  },
  {
    name: "walgit-docs",
    description: "Documentation for WalGit",
    language: "Markdown",
    languageColor: "#083fa1",
    stars: 18,
    forks: 5,
    lastUpdated: "3 days ago",
    owner: "walrus-dev"
  },
];

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [userData] = useState(mockUserData);
  const [repos] = useState(mockRepos);
  
  // In a real implementation, you would fetch user data and repos based on the username parameter

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar with profile info */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border p-6">
            {/* Avatar */}
            <div className="mb-4">
              <div className="w-full aspect-square rounded-full overflow-hidden border-4 border-border">
                <img 
                  src={userData.avatarUrl} 
                  alt={`${username || userData.username}'s avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/walgitv3.png";
                  }}
                />
              </div>
            </div>
            
            {/* User info */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold">{userData.fullName}</h1>
              <h2 className="text-lg text-muted-foreground mb-2">{username || userData.username}</h2>
              <p className="text-sm mb-4">{userData.bio}</p>
              <Button variant="outline" className="w-full">Follow</Button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-2 mb-6 text-sm">
              <div className="flex items-center gap-1">
                <Users size={16} />
                <Link to="#" className="hover:text-primary">
                  <span className="font-semibold">{userData.followers}</span> followers
                </Link>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Link to="#" className="hover:text-primary">
                  <span className="font-semibold">{userData.following}</span> following
                </Link>
              </div>
            </div>
            
            {/* Additional info */}
            <div className="space-y-2 text-sm">
              {userData.location && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{userData.location}</span>
                </div>
              )}
              {userData.website && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <a href={userData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {userData.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {userData.twitter && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                  <a href={`https://twitter.com/${userData.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {userData.twitter}
                  </a>
                </div>
              )}
              {userData.joined && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                  <span>Joined {userData.joined}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="repositories" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="repositories">
                Repositories <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-muted">{userData.repos}</span>
              </TabsTrigger>
              <TabsTrigger value="stars">Stars</TabsTrigger>
              <TabsTrigger value="followers">Followers</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            
            <TabsContent value="repositories" className="space-y-4">
              {/* Search and filter options */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Find a repository..."
                  className="w-full sm:w-64 px-3 py-2 bg-background border border-border rounded-md"
                />
                <div className="flex gap-2">
                  <select className="px-3 py-2 bg-background border border-border rounded-md text-sm">
                    <option>Type: All</option>
                    <option>Public</option>
                    <option>Private</option>
                  </select>
                  <select className="px-3 py-2 bg-background border border-border rounded-md text-sm">
                    <option>Language: All</option>
                    <option>Move</option>
                    <option>TypeScript</option>
                    <option>JavaScript</option>
                  </select>
                  <select className="px-3 py-2 bg-background border border-border rounded-md text-sm">
                    <option>Sort: Last updated</option>
                    <option>Name</option>
                    <option>Stars</option>
                  </select>
                </div>
              </div>

              {/* Repository list */}
              <div className="space-y-4">
                {repos.map((repo) => (
                  <div key={repo.name} className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">
                        <Link to={`/${repo.owner}/${repo.name}`} className="text-primary hover:underline">
                          {repo.name}
                        </Link>
                      </h3>
                      <Button variant="outline" size="sm" className="h-8">
                        <StarIcon size={16} className="mr-1" />
                        Star
                      </Button>
                    </div>
                    <p className="text-muted-foreground mb-4">{repo.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {repo.language && (
                        <div className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: repo.languageColor }}></span>
                          <span>{repo.language}</span>
                        </div>
                      )}
                      {repo.stars > 0 && (
                        <div className="flex items-center gap-1">
                          <StarIcon size={16} />
                          <span>{repo.stars}</span>
                        </div>
                      )}
                      {repo.forks > 0 && (
                        <div className="flex items-center gap-1">
                          <GitForkIcon size={16} />
                          <span>{repo.forks}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <span>Updated {repo.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="stars">
              <div className="text-center py-8 text-muted-foreground">
                Stars will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="followers">
              <div className="text-center py-8 text-muted-foreground">
                Followers will be displayed here
              </div>
            </TabsContent>
            
            <TabsContent value="following">
              <div className="text-center py-8 text-muted-foreground">
                Following will be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
