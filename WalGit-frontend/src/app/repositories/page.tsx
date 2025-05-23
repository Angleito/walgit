'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitForkIcon, StarIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RepositoriesPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Sample repository data
  const repositories = [
    {
      id: '1',
      name: 'walgit-core',
      description: 'Core implementation of the WalGit decentralized version control system',
      owner: 'walgit',
      stars: 42,
      forks: 12,
      updatedAt: '2025-04-01T12:00:00Z',
      language: 'TypeScript'
    },
    {
      id: '2',
      name: 'move-contracts',
      description: 'Smart contracts for the WalGit platform implemented on Sui Move',
      owner: 'walgit',
      stars: 28,
      forks: 8,
      updatedAt: '2025-03-28T15:30:00Z',
      language: 'Move'
    },
    {
      id: '3',
      name: 'documentation',
      description: 'Official documentation for the WalGit protocol and platform',
      owner: 'walgit',
      stars: 15,
      forks: 5,
      updatedAt: '2025-03-15T09:45:00Z',
      language: 'Markdown'
    }
  ];

  const getLanguageColor = (language: string) => {
    const colors = {
      'TypeScript': 'from-[var(--neon-blue)] to-[var(--neon-teal)]',
      'Move': 'from-[var(--neon-purple)] to-[var(--neon-pink)]',
      'Markdown': 'from-[var(--neon-yellow)] to-[var(--neon-green)]',
      'default': 'from-[var(--neon-blue)] to-[var(--neon-teal)]'
    };
    return colors[language as keyof typeof colors] || colors.default;
  };

  return (
    <div className="w-full">
      <div className="border-b gh-border-subtle gh-mb-5 gh-pb-3">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-xl font-semibold gh-text-primary">
            Repositories
          </h1>
          <Link href="/new-repository">
            <button className="gh-btn-sm gh-bg-success border gh-border-success text-white hover:bg-[#2ea043] flex items-center">
              <svg className="gh-mr-1" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="#ffffff">
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-3.5a.25.25 0 0 1-.25-.25Z"></path>
              </svg>
              New
            </button>
          </Link>
        </div>
      </div>

      <div className="gh-mb-5 gh-px-3 gh-py-2 gh-bg-canvas-subtle border gh-border-subtle rounded-md gh-text-secondary text-sm">
        <p>Find repositories secured by blockchain technology and distributed storage</p>
      </div>

      <div className="divide-y gh-border-subtle gh-mt-4">
        {repositories.map((repo) => (
          <div key={repo.id} className="hover:gh-bg-canvas-subtle transition-colors gh-py-6 gh-px-0 border-b gh-border-subtle last:border-b-0">
            <div className="flex justify-between gh-mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[18px] gh-text-link hover:underline">
                  <Link href={`/repositories/${repo.owner}/${repo.name}`}>
                    <span className="gh-text-secondary">{repo.owner}</span> / {repo.name}
                  </Link>
                </h3>
                <p className="text-sm gh-text-secondary gh-mt-1 gh-mb-3 leading-[1.5] max-w-xl">{repo.description || 'No description provided'}</p>
              </div>

              <div className="flex-shrink-0 ml-4">
                <button className="gh-btn-sm border gh-border-subtle bg-[#21262d] gh-text-primary hover:bg-[#30363d] flex items-center">
                  <StarIcon className="h-4 w-4 gh-mr-1" />
                  <span>Star</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gh-gap-4 text-xs gh-text-secondary">
              {repo.language && (
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full gh-mr-2" style={{ backgroundColor: repo.language === 'TypeScript' ? '#3178c6' : repo.language === 'Move' ? '#4FC08D' : '#e34c26' }}></span>
                  {repo.language}
                </div>
              )}
              <div className="flex items-center">
                <StarIcon className="h-4 w-4 gh-mr-1" />
                {repo.stars || 0}
              </div>
              <div className="flex items-center">
                <GitForkIcon className="h-4 w-4 gh-mr-1" />
                {repo.forks || 0}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 gh-mr-1" />
                Updated {new Date(repo.updatedAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}