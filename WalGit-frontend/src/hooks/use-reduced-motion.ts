import { useEffect, useState } from 'react';

/**
 * Hook that tracks the user's preference for reduced motion
 * This helps make cyberpunk effects more accessible
 * 
 * @returns boolean - true if user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  // Default to false if SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };
    
    // Set initial value
    updateMotionPreference();
    
    // Listen for changes
    mediaQuery.addEventListener('change', updateMotionPreference);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', updateMotionPreference);
    };
  }, []);
  
  return prefersReducedMotion;
}

/**
 * Hook that provides animation values based on reduced motion preference
 * 
 * @param fullMotionValue - Value to use when full motion is allowed
 * @param reducedMotionValue - Value to use when reduced motion is preferred
 * @returns The appropriate value based on user preference
 */
export function useMotionSafeValue<T>(fullMotionValue: T, reducedMotionValue: T): T {
  const prefersReducedMotion = useReducedMotion();
  
  return prefersReducedMotion ? reducedMotionValue : fullMotionValue;
}