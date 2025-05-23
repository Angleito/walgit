'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Star, GitFork, Activity, Users, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RepositoryStatsProps {
  stars: number;
  forks: number;
  watchers: number;
  issues?: number;
  pullRequests?: number;
  contributors?: number;
  releases?: number;
  isStarred?: boolean;
  isWatching?: boolean;
  isForked?: boolean;
  onStar?: () => void;
  onWatch?: () => void;
  onFork?: () => void;
  className?: string;
}

export function RepositoryStats({
  stars,
  forks,
  watchers,
  issues = 0,
  pullRequests = 0,
  contributors = 0,
  releases = 0,
  isStarred = false,
  isWatching = false,
  isForked = false,
  onStar,
  onWatch,
  onFork,
  className
}: RepositoryStatsProps) {
  const [starred, setStarred] = useState(isStarred);
  const [watching, setWatching] = useState(isWatching);
  const [forked, setForked] = useState(isForked);

  const handleStar = () => {
    setStarred(!starred);
    onStar?.();
  };

  const handleWatch = () => {
    setWatching(!watching);
    onWatch?.();
  };

  const handleFork = () => {
    setForked(!forked);
    onFork?.();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}m`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleWatch}
                className={cn(
                  "h-7 bg-[#21262d] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]",
                  watching && "bg-[#30363d]"
                )}
              >
                <Eye size={16} className="mr-1" />
                {watching ? 'Unwatch' : 'Watch'}
                <span className="ml-1 bg-[#30363d] rounded-full px-1.5 py-0.5 text-xs">
                  {formatNumber(watchers)}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
              <p>Get notified when this repository updates</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStar}
                className={cn(
                  "h-7 bg-[#21262d] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]",
                  starred && "bg-[#30363d] text-[#f9826c]"
                )}
              >
                <Star size={16} className={cn("mr-1", starred && "fill-current")} />
                {starred ? 'Starred' : 'Star'}
                <span className="ml-1 bg-[#30363d] rounded-full px-1.5 py-0.5 text-xs">
                  {formatNumber(stars)}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
              <p>Star this repository to show appreciation</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFork}
                className={cn(
                  "h-7 bg-[#21262d] border-[#30363d] text-[#f0f6fc] hover:bg-[#30363d]",
                  forked && "bg-[#30363d]"
                )}
              >
                <GitFork size={16} className="mr-1" />
                Fork
                <span className="ml-1 bg-[#30363d] rounded-full px-1.5 py-0.5 text-xs">
                  {formatNumber(forks)}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
              <p>Create your own copy of this repository</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="hidden md:flex items-center gap-4 ml-auto text-sm text-[#8b949e]">
          {contributors > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{formatNumber(contributors)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                <p>Contributors</p>
              </TooltipContent>
            </Tooltip>
          )}

          {releases > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Package size={16} />
                  <span>{formatNumber(releases)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                <p>Releases</p>
              </TooltipContent>
            </Tooltip>
          )}

          {(issues > 0 || pullRequests > 0) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Activity size={16} />
                  <span>{formatNumber(issues + pullRequests)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1c2128] border-[#30363d] text-[#f0f6fc]">
                <p>{issues} Issues, {pullRequests} Pull Requests</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}