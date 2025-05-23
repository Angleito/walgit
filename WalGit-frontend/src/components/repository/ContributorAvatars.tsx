'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Contributor {
  id: string;
  name: string;
  avatar?: string;
  contributions: number;
  url?: string;
}

interface ContributorAvatarsProps {
  contributors: Contributor[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContributorAvatars({ 
  contributors, 
  maxDisplay = 5,
  size = 'md',
  className 
}: ContributorAvatarsProps) {
  const sortedContributors = [...contributors].sort((a, b) => b.contributions - a.contributions);
  const displayedContributors = sortedContributors.slice(0, maxDisplay);
  const remainingCount = contributors.length - maxDisplay;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    return words.map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const AvatarWrapper = ({ children, contributor }: { children: React.ReactNode; contributor: Contributor }) => {
    if (contributor.url) {
      return (
        <Link 
          href={contributor.url}
          className="transition-transform hover:scale-110"
        >
          {children}
        </Link>
      );
    }
    return <>{children}</>;
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center -space-x-2", className)}>
        {displayedContributors.map((contributor) => (
          <Tooltip key={contributor.id}>
            <TooltipTrigger asChild>
              <AvatarWrapper contributor={contributor}>
                <Avatar 
                  className={cn(
                    sizeClasses[size],
                    "border-2 border-[#0d1117] hover:z-10 transition-all"
                  )}
                >
                  <AvatarImage 
                    src={contributor.avatar} 
                    alt={contributor.name}
                  />
                  <AvatarFallback className="bg-[#30363d] text-[#f0f6fc] text-xs">
                    {getInitials(contributor.name)}
                  </AvatarFallback>
                </Avatar>
              </AvatarWrapper>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{contributor.name}</p>
              <p className="text-xs text-[#8b949e]">
                {contributor.contributions} contributions
              </p>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  sizeClasses[size],
                  "flex items-center justify-center rounded-full bg-[#30363d] border-2 border-[#0d1117] text-xs text-[#8b949e] hover:bg-[#424a53] transition-colors cursor-pointer"
                )}
              >
                <span>+{remainingCount}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>And {remainingCount} more contributors</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// Helper functions for generating avatar URLs
export function generateAvatarUrl(seed: string): string {
  // Using DiceBear API for avatar generation
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

export function generateGitHubAvatarUrl(username: string): string {
  return `https://github.com/${username}.png`;
}

// Generate mock contributors for testing
export function generateMockContributors(count: number = 10): Contributor[] {
  const names = [
    'Alice Chen', 'Bob Johnson', 'Carol Williams', 'David Kim', 'Eve Martinez',
    'Frank Brown', 'Grace Lee', 'Henry Wang', 'Ivy Chen', 'Jack Wilson',
    'Karen Davis', 'Leo Zhang', 'Maya Patel', 'Nathan Scott', 'Olivia Taylor'
  ];

  return Array.from({ length: count }, (_, i) => {
    const name = names[i % names.length];
    return {
      id: `contributor-${i}`,
      name,
      avatar: generateAvatarUrl(name),
      contributions: Math.floor(Math.random() * 100) + 1,
      url: `/users/${name.toLowerCase().replace(' ', '.')}`
    };
  });
}