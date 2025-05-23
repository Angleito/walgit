
'use client';

import Link from "next/link";
import { Star, GitFork, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Shimmer } from "@/components/ui/shimmer";

interface RepoCardProps {
  name: string;
  description: string;
  language?: string;
  stars: number;
  forks: number;
  className?: string;
  languageColor?: string;
  lastUpdated?: string;
  owner: string;
}

export const RepoCard = ({
  name,
  description,
  language,
  stars,
  forks,
  className,
  languageColor = "bg-ocean-400",
  lastUpdated,
  owner,
}: RepoCardProps) => {
  return (
    <Shimmer>
      <div
        className={cn(
          "cyber-clip cyberpunk-border relative p-6 bg-black/70 backdrop-blur-sm border border-[var(--neon-blue)]",
          "transition-all duration-300 hover:shadow-[0_0_15px_rgba(5,217,232,0.3)] hover:translate-y-[-5px] overflow-hidden",
          "group max-w-xl mx-auto",
          className
        )}
      >
      {/* Cyberpunk effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--neon-blue)]/5 to-[var(--neon-purple)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--neon-blue)]/0 via-[var(--neon-blue)]/10 to-[var(--neon-blue)]/0 opacity-0 group-hover:opacity-100 blur-sm transition-all duration-1000 group-hover:duration-500 animate-pulse"></div>

      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-[var(--neon-blue)]"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-r-2 border-t-2 border-[var(--neon-blue)]"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/repositories/${owner}/${name}`}
            className="text-lg font-orbitron font-medium text-cyber-accent hover:text-[var(--neon-teal)] transition-colors relative group"
          >
            {name}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[var(--neon-blue)] to-transparent group-hover:w-full transition-all duration-300"></span>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-cyber-primary">
              <Star className="mr-1.5 h-4 w-4 text-[var(--neon-yellow)]" />
              <span className="font-medium">{stars}</span>
            </div>
            <div className="flex items-center text-sm text-cyber-primary">
              <GitFork className="mr-1.5 h-4 w-4 text-[var(--neon-purple)]" />
              <span className="font-medium">{forks}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-cyber-secondary mb-4 line-clamp-2 leading-relaxed">{description}</p>

        <div className="flex items-center text-xs text-cyber-secondary space-x-4 mt-3 pt-2 border-t border-[var(--neon-blue)]/20">
          {language && (
            <div className="flex items-center">
              <Circle className={`mr-1.5 h-3 w-3 text-[var(--neon-teal)] fill-current`} />
              <span className="font-medium tracking-wide">{language}</span>
            </div>
          )}
          {lastUpdated && (
            <div className="flex items-center">
              <span className="text-[var(--neon-blue)]/70 mr-1">●</span>
              <span>Updated {lastUpdated}</span>
            </div>
          )}
        </div>
      </div>
    </div>
    </Shimmer>
  );
};
