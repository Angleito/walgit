'use client';

import { useEffect, useState } from 'react';
import { cyberpunkConfig, AnimationIntensity } from '@/lib/cyberpunk-config';
import { useMediaQuery } from '@/hooks/use-mobile';
import * as React from 'react';

interface CyberpunkEffectsContextType {
  effectsEnabled: boolean;
  animationIntensity: AnimationIntensity;
  toggleEffects: () => void;
  setAnimationIntensity: (intensity: AnimationIntensity) => void;
}

export const CyberpunkEffectsContext = React.createContext<CyberpunkEffectsContextType>({
  effectsEnabled: true,
  animationIntensity: 'medium',
  toggleEffects: () => {},
  setAnimationIntensity: () => {},
});

export const useCyberpunkEffects = () => React.useContext(CyberpunkEffectsContext);

interface CyberpunkEffectsProviderProps {
  children: React.ReactNode;
}

export function CyberpunkEffectsProvider({ children }: CyberpunkEffectsProviderProps) {
  // Start with config defaults but allow runtime toggling
  const [effectsEnabled, setEffectsEnabled] = useState(cyberpunkConfig.enableAnimations);
  const [animationIntensity, setAnimationIntensity] = useState<AnimationIntensity>(
    cyberpunkConfig.animationIntensity
  );
  
  // Check if device is low-powered
  const isMobile = useMediaQuery('(max-width: 768px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Adjust effects based on device capabilities and user preferences
  useEffect(() => {
    if (prefersReducedMotion) {
      setEffectsEnabled(false);
    } else if (isMobile && animationIntensity === 'high') {
      // Automatically reduce intensity on mobile devices
      setAnimationIntensity('medium');
    }
  }, [isMobile, prefersReducedMotion, animationIntensity]);
  
  // Add scanline effect to body if enabled
  useEffect(() => {
    if (!effectsEnabled) {
      document.body.classList.remove('bg-scanline-subtle', 'bg-scanline-medium', 'bg-scanline-strong');
      return;
    }
    
    // Apply scanline effect based on intensity
    document.body.classList.remove('bg-scanline-subtle', 'bg-scanline-medium', 'bg-scanline-strong');
    if (cyberpunkConfig.enableCrtEffects) {
      switch (animationIntensity) {
        case 'low':
          document.body.classList.add('bg-scanline-subtle');
          break;
        case 'medium':
          document.body.classList.add('bg-scanline-medium');
          break;
        case 'high':
          document.body.classList.add('bg-scanline-strong');
          break;
        default:
          break;
      }
    }
  }, [effectsEnabled, animationIntensity]);
  
  // Toggle effects on/off
  const toggleEffects = () => {
    setEffectsEnabled(prev => !prev);
  };
  
  // Expose context to consumers
  const contextValue = {
    effectsEnabled,
    animationIntensity,
    toggleEffects,
    setAnimationIntensity,
  };
  
  return (
    <CyberpunkEffectsContext.Provider value={contextValue}>
      {children}
    </CyberpunkEffectsContext.Provider>
  );
}

