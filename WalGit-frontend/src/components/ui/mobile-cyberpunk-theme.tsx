'use client';

import { useEffect } from 'react';
import { Moon, Sun, Zap, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStorage } from '@/hooks/use-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/ui/theme-switcher';
import { useIsMobile } from '@/hooks/use-mobile';

type CyberpunkIntensity = 'high' | 'medium' | 'low';

/**
 * MobileCyberpunkTheme - Optimized cyberpunk theme for mobile devices
 * Features reduced animations, optimized neon effects, and battery-friendly rendering
 */
export function MobileCyberpunkTheme() {
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [intensity, setIntensity] = useStorage<CyberpunkIntensity>('cyberpunk-intensity', 'medium');
  
  // Apply cyberpunk theme settings based on intensity level
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    
    // Remove previous intensity classes
    root.classList.remove('cyberpunk-low', 'cyberpunk-medium', 'cyberpunk-high');
    
    // Add current intensity class
    root.classList.add(`cyberpunk-${intensity}`);
    
    // Apply optimized CSS variables for mobile
    root.style.setProperty('--neon-blur-radius', getBlurRadius(intensity));
    root.style.setProperty('--neon-spread-radius', getSpreadRadius(intensity));
    root.style.setProperty('--animation-speed', getAnimationSpeed(intensity));
    root.style.setProperty('--scanline-opacity', getScanlineOpacity(intensity));
    root.style.setProperty('--text-shadow-intensity', getTextShadowIntensity(intensity));
  }, [intensity, isMobile]);

  // Helper functions to get appropriate values based on intensity
  function getBlurRadius(level: CyberpunkIntensity): string {
    switch (level) {
      case 'high': return '8px';
      case 'medium': return '5px';
      case 'low': return '2px';
    }
  }
  
  function getSpreadRadius(level: CyberpunkIntensity): string {
    switch (level) {
      case 'high': return '4px';
      case 'medium': return '2px';
      case 'low': return '1px';
    }
  }
  
  function getAnimationSpeed(level: CyberpunkIntensity): string {
    switch (level) {
      case 'high': return '1';
      case 'medium': return '0.7';
      case 'low': return '0.4';
    }
  }
  
  function getScanlineOpacity(level: CyberpunkIntensity): string {
    switch (level) {
      case 'high': return '0.3';
      case 'medium': return '0.15';
      case 'low': return '0.05';
    }
  }
  
  function getTextShadowIntensity(level: CyberpunkIntensity): string {
    switch (level) {
      case 'high': return '1';
      case 'medium': return '0.6';
      case 'low': return '0.3';
    }
  }
  
  // Only show the control on mobile devices
  if (!isMobile) return null;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed right-4 bottom-4 z-50 bg-black/20 backdrop-blur-sm rounded-full w-10 h-10"
        >
          <Zap className="w-5 h-5 text-cyan-400" />
          <span className="sr-only">Mobile display settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-black/80 backdrop-blur-md border-cyan-500/30">
        <DropdownMenuLabel className="text-cyan-400 font-orbitron">
          Cyberpunk Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-cyan-500/20" />
        <DropdownMenuItem
          className={`${intensity === 'high' ? 'bg-cyan-500/20' : ''}`}
          onClick={() => setIntensity('high')}
        >
          <div className="w-3 h-3 mr-2 bg-cyan-400 rounded-full" />
          <span>High Intensity</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`${intensity === 'medium' ? 'bg-cyan-500/20' : ''}`}
          onClick={() => setIntensity('medium')}
        >
          <div className="w-3 h-3 mr-2 bg-cyan-300 rounded-full" />
          <span>Medium Intensity</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`${intensity === 'low' ? 'bg-cyan-500/20' : ''}`}
          onClick={() => setIntensity('low')}
        >
          <div className="w-3 h-3 mr-2 bg-cyan-200 rounded-full" />
          <span>Low Intensity</span>
          <span className="ml-auto text-xs opacity-70">Battery Saver</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}