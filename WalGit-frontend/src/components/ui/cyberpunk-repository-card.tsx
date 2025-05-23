/**
 * @fileoverview Cyberpunk-styled repository card component
 * Advanced card component with animations, status indicators, and interactive elements
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Globe, 
  Star, 
  GitFork, 
  Eye, 
  Clock, 
  Users, 
  Activity,
  Settings,
  Share2,
  Download,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Repository {
  id: string;
  name: string;
  description: string;
  owner: string;
  isPrivate: boolean;
  isEncrypted: boolean;
  stars: number;
  forks: number;
  watchers: number;
  size: string;
  language: string;
  lastCommit: {
    message: string;
    author: string;
    timestamp: string;
  };
  collaborators: number;
  status: 'active' | 'archived' | 'syncing' | 'error';
  storageUsed: number;
  storageQuota: number;
}

interface CyberpunkRepositoryCardProps {
  repository: Repository;
  onSelect?: (repository: Repository) => void;
  onStar?: (repository: Repository) => void;
  onFork?: (repository: Repository) => void;
  onSettings?: (repository: Repository) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function CyberpunkRepositoryCard({
  repository,
  onSelect,
  onStar,
  onFork,
  onSettings,
  className,
  variant = 'default'
}: CyberpunkRepositoryCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isStarred, setIsStarred] = useState(false);

  const statusColors = {
    active: 'from-green-500/20 to-green-600/20 border-green-500/30',
    archived: 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
    syncing: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    error: 'from-red-500/20 to-red-600/20 border-red-500/30'
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStarred(!isStarred);
    onStar?.(repository);
  };

  const handleCardClick = () => {
    onSelect?.(repository);
  };

  const storagePercentage = (repository.storageUsed / repository.storageQuota) * 100;

  return (
    <TooltipProvider>
      <motion.div
        className={cn(
          'group relative overflow-hidden rounded-lg border bg-gradient-to-br backdrop-blur-sm transition-all duration-300 cursor-pointer',
          statusColors[repository.status],
          'hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/20',
          className
        )}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleCardClick}
        whileHover={{ y: -4 }}
        layout
      >
        {/* Background glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={{
            background: isHovered 
              ? ['linear-gradient(45deg, rgba(0,212,255,0.1), rgba(138,43,226,0.1))',
                 'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,212,255,0.1))',
                 'linear-gradient(225deg, rgba(0,212,255,0.1), rgba(138,43,226,0.1))']
              : 'linear-gradient(45deg, rgba(0,212,255,0.05), rgba(138,43,226,0.05))'
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />

        {/* Content */}
        <div className="relative p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {repository.isPrivate ? (
                  <Lock className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Globe className="h-4 w-4 text-green-500" />
                )}
                {repository.isEncrypted && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>SEAL Encrypted</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Badge variant="outline" className="text-xs">
                  {repository.status}
                </Badge>
              </div>

              <h3 className="font-semibold text-lg text-cyan-100 group-hover:text-cyan-50 transition-colors truncate">
                {repository.name}
              </h3>
              
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                {repository.description}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSettings?.(repository); }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in CLI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleStar}
                  className={cn(
                    'flex items-center gap-1 hover:text-yellow-400 transition-colors',
                    isStarred && 'text-yellow-400'
                  )}
                >
                  <Star className={cn('h-4 w-4', isStarred && 'fill-current')} />
                  <span>{repository.stars + (isStarred ? 1 : 0)}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isStarred ? 'Unstar' : 'Star'} repository</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); onFork?.(repository); }}
                  className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                >
                  <GitFork className="h-4 w-4" />
                  <span>{repository.forks}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fork repository</p>
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{repository.watchers}</span>
            </div>

            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{repository.collaborators}</span>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              <Activity className="h-4 w-4" />
              <span className="text-xs bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-medium">
                {repository.language}
              </span>
            </div>
          </div>

          {/* Last commit info */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span className="truncate flex-1">
              &quot;{repository.lastCommit.message}&quot; by {repository.lastCommit.author}
            </span>
            <span className="whitespace-nowrap">{repository.lastCommit.timestamp}</span>
          </div>

          {/* Storage indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Storage: {repository.size}</span>
              <span>{storagePercentage.toFixed(1)}% used</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  storagePercentage > 90 ? 'bg-red-500' :
                  storagePercentage > 75 ? 'bg-yellow-500' :
                  'bg-green-500'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${storagePercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Hover overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-gray-900/90 to-transparent"
              >
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                    Open
                  </Button>
                  <Button size="sm" variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                    Clone
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Corner accent */}
        <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-cyan-500/20 group-hover:border-t-cyan-500/40 transition-colors" />
      </motion.div>
    </TooltipProvider>
  );
}