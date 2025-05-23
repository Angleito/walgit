'use client';

import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Import both mobile and desktop components
import { CyberpunkCard } from './cyberpunk-card';
import { MobileCyberpunkCard } from './mobile-cyberpunk-card';
import { ScanlineOverlay } from './scanline-overlay';
import { MobileScanlineOverlay } from './mobile-scanline-overlay';
import { MobileCyberpunkButton } from './mobile-cyberpunk-button';
import { Button } from './button';
import { MobileCyberpunkNavigation } from '../layout/MobileCyberpunkNavigation';
import { useBatteryAware } from '@/hooks/use-battery-aware';

/**
 * A responsive cyberpunk card that automatically switches between
 * the standard and mobile-optimized versions based on screen size
 */
export function ResponsiveCyberpunkCard(props: React.ComponentProps<typeof CyberpunkCard>) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileCyberpunkCard {...props} />;
  }
  
  return <CyberpunkCard {...props} />;
}

/**
 * A responsive scanline overlay that switches between
 * standard and mobile-optimized versions
 */
export function ResponsiveScanlineOverlay(props: React.ComponentProps<typeof ScanlineOverlay>) {
  const isMobile = useIsMobile();
  const { shouldOptimizeEffects } = useBatteryAware();
  
  // If we need to optimize for battery/performance, don't use effects on mobile
  if (isMobile) {
    if (shouldOptimizeEffects) {
      // Just render children without effects - safely handle undefined children
      return <>{props.children || null}</>;
    }
    return <MobileScanlineOverlay {...props} />;
  }
  
  return <ScanlineOverlay {...props} />;
}

/**
 * A responsive cyberpunk button that switches between
 * standard and mobile-optimized versions
 */
export function ResponsiveCyberpunkButton(
  props: React.ComponentProps<typeof Button> & { showGlow?: boolean }
) {
  const isMobile = useIsMobile();
  const { showGlow, ...buttonProps } = props;
  
  if (isMobile) {
    return <MobileCyberpunkButton showGlow={showGlow} {...buttonProps} />;
  }
  
  // Use cyberpunk variants for more immersive experience
  return <Button 
    variant={buttonProps.variant || "cyberNeon"} 
    {...buttonProps} 
    glowText={showGlow}
  />;
}

/**
 * Responsive mobile navigation that only renders on mobile devices
 */
export function ResponsiveMobileNavigation(props: React.ComponentProps<typeof MobileCyberpunkNavigation>) {
  const isMobile = useIsMobile();
  
  if (!isMobile) {
    return null; // Don't render anything on desktop
  }
  
  return <MobileCyberpunkNavigation {...props} />;
}

/**
 * A hook that returns cyberpunk CSS classes optimized for the current device
 */
export function useCyberpunkClasses() {
  const isMobile = useIsMobile();
  const { shouldOptimizeEffects } = useBatteryAware();
  
  return {
    // Text with glow effect
    glowText: isMobile 
      ? shouldOptimizeEffects ? 'text-white' : 'mobile-cyberpunk-glow text-[#05d9e8]' 
      : 'cyberpunk-glow text-[#05d9e8]',
    
    // Border with glow effect  
    glowBorder: isMobile
      ? shouldOptimizeEffects ? 'border border-[#05d9e8]/30' : 'border border-[#05d9e8]/40 mobile-cyberpunk-glow'
      : 'cyberpunk-border',
    
    // Text meant to be readable
    readableText: isMobile
      ? 'mobile-enhanced-readability'
      : 'text-body',
    
    // Touch-friendly elements
    touchTarget: isMobile
      ? 'touch-feedback touch-manipulation min-h-[44px] py-2.5 px-4'
      : '',
      
    // Optimized gradient text
    gradientText: isMobile && shouldOptimizeEffects
      ? 'text-white'  // Simple white text when optimizing
      : 'cyber-gradient-text', // Normal gradient text otherwise
  };
}