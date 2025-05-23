'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Star, Eye, GitFork, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RepositoryActionsProps {
  stars: number;
  watches: number;  
  forks: number;
  isStarred?: boolean;
  isWatching?: boolean;
  watchMode?: 'releases' | 'all' | 'ignore';
  onStar?: () => void;
  onWatch?: (mode: 'releases' | 'all' | 'ignore') => void;
  onFork?: () => void;
  className?: string;
}

export function RepositoryActions({
  stars,
  watches,
  forks,
  isStarred = false,
  isWatching = false,
  watchMode = 'releases',
  onStar,
  onWatch,
  onFork,
  className
}: RepositoryActionsProps) {
  const [starred, setStarred] = useState(isStarred);
  const [watching, setWatching] = useState(isWatching);
  const [currentWatchMode, setCurrentWatchMode] = useState(watchMode);

  const handleStar = () => {
    setStarred(!starred);
    onStar?.();
  };

  const handleWatch = (mode: 'releases' | 'all' | 'ignore') => {
    setCurrentWatchMode(mode);
    setWatching(mode !== 'ignore');
    onWatch?.(mode);
  };

  const watchModeLabels = {
    releases: 'Release only',
    all: 'All activity',
    ignore: 'Ignore',
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Star Button */}
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleStar}
          className={cn(
            "rounded-r-none border-r-0",
            starred && "bg-[#21262d] border-[#30363d]"
          )}
        >
          <Star 
            size={16} 
            className={cn(
              "mr-1",
              starred ? "fill-[#e3b341] text-[#e3b341]" : "text-[#8b949e]"
            )}
          />
          {starred ? 'Starred' : 'Star'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-l-none px-3 min-w-[50px]"
          disabled
        >
          {formatCount(stars + (starred ? 1 : 0))}
        </Button>
      </div>

      {/* Watch Dropdown */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-r-none border-r-0"
            >
              <Eye 
                size={16} 
                className={cn(
                  "mr-1",
                  watching ? "text-[#58a6ff]" : "text-[#8b949e]"
                )}
              />
              {watching ? 'Watching' : 'Watch'}
              <ChevronDown size={14} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {(Object.keys(watchModeLabels) as Array<keyof typeof watchModeLabels>).map((mode) => (
              <DropdownMenuItem
                key={mode}
                onClick={() => handleWatch(mode)}
                className="flex items-center justify-between"
              >
                <span>{watchModeLabels[mode]}</span>
                {currentWatchMode === mode && (
                  <Check size={16} className="text-[#58a6ff]" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="rounded-l-none px-3 min-w-[50px]"
          disabled
        >
          {formatCount(watches + (watching ? 1 : 0))}
        </Button>
      </div>

      {/* Fork Button */}
      <div className="flex items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onFork}
          className="rounded-r-none border-r-0"
        >
          <GitFork size={16} className="mr-1 text-[#8b949e]" />
          Fork
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-l-none px-3 min-w-[50px]"
          disabled
        >
          {formatCount(forks)}
        </Button>
      </div>
    </div>
  );
}

// Helper function to format large numbers
function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}