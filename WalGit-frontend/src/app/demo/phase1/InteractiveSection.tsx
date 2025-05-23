"use client";

import { useState, useCallback } from 'react';
import { RepositoryActions } from '@/components/repository/RepositoryActions';
import type { RepositoryActionsState } from './types';

export function InteractiveRepositorySection() {
  const [repoState, setRepoState] = useState<RepositoryActionsState>({
    stars: 42,
    watches: 12,
    forks: 5
  });

  // Memoized handlers to prevent re-renders
  const handleStar = useCallback(() => {
    setRepoState(prev => ({ ...prev, stars: prev.stars + 1 }));
  }, []);

  const handleUnstar = useCallback(() => {
    setRepoState(prev => ({ ...prev, stars: Math.max(0, prev.stars - 1) }));
  }, []);

  const handleWatch = useCallback(() => {
    setRepoState(prev => ({ ...prev, watches: prev.watches + 1 }));
  }, []);

  const handleUnwatch = useCallback(() => {
    setRepoState(prev => ({ ...prev, watches: Math.max(0, prev.watches - 1) }));
  }, []);

  const handleFork = useCallback(() => {
    setRepoState(prev => ({ ...prev, forks: prev.forks + 1 }));
  }, []);

  return (
    <div className="flex justify-center">
      <RepositoryActions
        stars={repoState.stars}
        watches={repoState.watches}
        forks={repoState.forks}
        onStar={handleStar}
        onUnstar={handleUnstar}
        onWatch={handleWatch}
        onUnwatch={handleUnwatch}
        onFork={handleFork}
      />
    </div>
  );
}