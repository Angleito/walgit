'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * MobileCyberpunkCard - Optimized cyberpunk card component for mobile devices
 * Features:
 * - Simplified neon effects for improved performance
 * - Touch-friendly interactions with subtle feedback
 * - Battery-optimized effects
 * - Maintains cyberpunk aesthetic without performance burden
 */
interface MobileCyberpunkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accentColor?: 'blue' | 'pink' | 'green';
  isInteractive?: boolean;
  children: React.ReactNode;
}

export function MobileCyberpunkCard({
  className,
  children,
  accentColor = 'blue',
  isInteractive = false,
  onClick,
  ...props
}: MobileCyberpunkCardProps) {
  const isMobile = useIsMobile();
  const [isTouched, setIsTouched] = useState(false);

  // Get color values based on accent color
  const getColors = () => {
    switch (accentColor) {
      case 'blue':
        return {
          border: '#05d9e8',
          shadow: 'rgba(5, 217, 232, 0.3)',
          gradient: 'from-[#05d9e8]/10 to-transparent',
        };
      case 'pink':
        return {
          border: '#ff2a6d',
          shadow: 'rgba(255, 42, 109, 0.3)',
          gradient: 'from-[#ff2a6d]/10 to-transparent',
        };
      case 'green':
        return {
          border: '#00ff9f',
          shadow: 'rgba(0, 255, 159, 0.3)',
          gradient: 'from-[#00ff9f]/10 to-transparent',
        };
      default:
        return {
          border: '#05d9e8',
          shadow: 'rgba(5, 217, 232, 0.3)',
          gradient: 'from-[#05d9e8]/10 to-transparent',
        };
    }
  };

  const colors = getColors();

  // Touch event handlers - only used if card is interactive
  const handleTouchStart = () => {
    if (isInteractive) {
      setIsTouched(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isInteractive) {
      setIsTouched(false);
    }
  };

  // For non-mobile devices, use a simpler card style
  if (!isMobile) {
    return (
      <div
        className={cn(
          "relative rounded-md border bg-black/80 p-4",
          `border-[${colors.border}]/50`,
          className
        )}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        // Base styles
        "relative rounded-sm p-4 backdrop-blur-sm touch-manipulation",
        "border bg-black/70 transition-all duration-200",
        `border-[${colors.border}]/40`,
        
        // Dynamic shadow based on interaction
        isInteractive && isTouched 
          ? `shadow-[0_0_8px_${colors.shadow}]` 
          : `shadow-[0_0_4px_${colors.shadow}]`,
        
        // Scale effect for interactive cards
        isInteractive && isTouched && "transform scale-[0.99]",
        
        // Additional interactive styles
        isInteractive && "active:translate-y-[1px] cursor-pointer",
        
        // Custom classes
        className
      )}
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      {...props}
    >
      {/* Optimized gradient background - one div instead of multiple layers */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-b opacity-30 rounded-sm pointer-events-none", 
          colors.gradient
        )} 
        aria-hidden="true"
      />
      
      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Cyberpunk accent corner - simplified for performance */}
      <div 
        className={cn(
          "absolute top-0 right-0 w-4 h-4 pointer-events-none",
          `border-t border-r border-[${colors.border}]/60`
        )} 
        style={{
          clipPath: 'polygon(100% 0, 100% 100%, 0 0)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}