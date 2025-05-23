'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook that tracks the user's motion preference
 * @returns boolean indicating if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Default to false during SSR
    if (typeof window === 'undefined') {
      setPrefersReducedMotion(false);
      return;
    }

    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Create event listener for changes
    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    // Add event listener
    mediaQuery.addEventListener('change', handleChange);

    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;