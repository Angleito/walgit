'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type SkeletonVariant = 'card' | 'text' | 'avatar' | 'button' | 'input' | 'code' | 'terminal';
type SkeletonColor = 'blue' | 'purple' | 'pink' | 'teal' | 'multi';

interface CyberpunkSkeletonProps {
  /**
   * The visual variant of the skeleton
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /**
   * Custom width for the skeleton
   */
  width?: string | number;
  /**
   * Custom height for the skeleton
   */
  height?: string | number;
  /**
   * Number of skeleton items to render (for text variant)
   * @default 1
   */
  count?: number;
  /**
   * Custom CSS class to apply
   */
  className?: string;
  /**
   * The color theme to use
   * @default 'blue'
   */
  color?: SkeletonColor;
  /**
   * Whether to show the scanning line effect
   * @default true
   */
  showScanline?: boolean;
  /**
   * Whether to ignore the prefers-reduced-motion setting
   * @default false
   */
  ignoreReducedMotion?: boolean;
}

/**
 * Generates themed styles based on color
 */
const getColorStyles = (color: SkeletonColor) => {
  const colors = {
    blue: {
      primary: 'var(--neon-blue)',
      secondary: 'var(--glow-blue)',
      bg: 'rgba(0, 238, 255, 0.1)',
      border: 'var(--neon-blue)',
    },
    purple: {
      primary: 'var(--neon-purple)',
      secondary: 'var(--glow-purple)',
      bg: 'rgba(217, 0, 255, 0.1)',
      border: 'var(--neon-purple)',
    },
    pink: {
      primary: 'var(--neon-pink)',
      secondary: 'var(--glow-pink)',
      bg: 'rgba(255, 44, 223, 0.1)',
      border: 'var(--neon-pink)',
    },
    teal: {
      primary: 'var(--neon-teal)',
      secondary: 'var(--glow-teal)',
      bg: 'rgba(0, 255, 179, 0.1)',
      border: 'var(--neon-teal)',
    },
    multi: {
      primary: 'var(--gradient-cyberpunk)',
      secondary: 'var(--glow-blue)',
      bg: 'rgba(0, 238, 255, 0.1)',
      border: 'var(--neon-blue)',
    },
  };

  return colors[color];
};

/**
 * Creates randomized "data blocks" for the terminal variant
 */
const generateRandomTerminalData = (length: number) => {
  const chars = '01_$#>£%&!?@';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

export function CyberpunkSkeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
  color = 'blue',
  showScanline = true,
  ignoreReducedMotion = false,
}: CyberpunkSkeletonProps) {
  const colorStyles = getColorStyles(color);
  
  // Check if reduced motion is preferred
  const prefersReducedMotion = 
    !ignoreReducedMotion && 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;

  // Shared style object for all variants
  const baseStyle = {
    width: width,
    height: height,
    borderColor: colorStyles.border,
    boxShadow: `0 0 8px ${colorStyles.secondary}`
  };
  
  // Animation classes based on motion preference
  const animationClasses = !prefersReducedMotion 
    ? 'animate-pulse-subtle animate-scanner'
    : '';

  // Render content based on variant
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div 
            className={cn(
              'cyber-clip relative overflow-hidden',
              'border-2 bg-opacity-10',
              animationClasses,
              className
            )}
            style={{
              ...baseStyle,
              width: width || '100%',
              height: height || '200px',
              background: colorStyles.bg,
              borderColor: colorStyles.border,
            }}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            {/* Scanline effect */}
            {showScanline && !prefersReducedMotion && (
              <div className="absolute inset-0 bg-scanline opacity-10" />
            )}
            
            {/* Card content placeholders */}
            <div className="p-4 flex flex-col h-full">
              <div 
                className="w-3/4 h-5 mb-4 rounded-sm opacity-20"
                style={{ background: colorStyles.primary }}
              ></div>
              
              <div className="flex-1 grid grid-cols-3 gap-2 opacity-10">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div 
                    key={i}
                    className="rounded-sm h-full"
                    style={{ background: colorStyles.primary }}
                  ></div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-between opacity-20">
                <div 
                  className="w-1/4 h-4 rounded-sm"
                  style={{ background: colorStyles.primary }}
                ></div>
                <div 
                  className="w-1/4 h-4 rounded-sm"
                  style={{ background: colorStyles.primary }}
                ></div>
              </div>
            </div>
            
            {/* Animation overlay */}
            {!prefersReducedMotion && (
              <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ 
                  backgroundImage: `linear-gradient(45deg, transparent 25%, ${colorStyles.primary} 25%, ${colorStyles.primary} 50%, transparent 50%, transparent 75%, ${colorStyles.primary} 75%, ${colorStyles.primary} 100%)`,
                  backgroundSize: '4px 4px'
                }}
              ></div>
            )}
            
            <span className="sr-only">Loading content...</span>
          </div>
        );

      case 'text':
        return (
          <div
            className={cn('flex flex-col gap-2', className)}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            {Array.from({ length: count }).map((_, i) => {
              // Vary widths slightly for a more natural look
              const widthPercent = i === count - 1 ? '70%' : '100%';
              
              return (
                <div
                  key={i}
                  className={cn(
                    'h-4 rounded relative overflow-hidden',
                    animationClasses
                  )}
                  style={{
                    width: width || widthPercent,
                    height: height || '1rem',
                    background: colorStyles.bg,
                    borderLeft: `2px solid ${colorStyles.border}`,
                  }}
                >
                  {/* Scanline effect */}
                  {showScanline && !prefersReducedMotion && (
                    <div className="absolute inset-0 bg-scanline opacity-20" />
                  )}
                </div>
              );
            })}
            <span className="sr-only">Loading text content...</span>
          </div>
        );

      case 'avatar':
        return (
          <div
            className={cn(
              'rounded-full relative overflow-hidden',
              'border-2 flex items-center justify-center',
              animationClasses,
              className
            )}
            style={{
              ...baseStyle,
              width: width || '64px',
              height: height || '64px',
              background: colorStyles.bg,
              borderColor: colorStyles.border,
            }}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            {/* Pulsing center */}
            <div 
              className={cn(
                'rounded-full w-1/2 h-1/2',
                !prefersReducedMotion ? 'animate-pulse' : ''
              )}
              style={{ 
                background: colorStyles.primary,
                boxShadow: `0 0 10px ${colorStyles.secondary}`
              }}
            ></div>
            
            {/* Spinning outer ring */}
            {!prefersReducedMotion && (
              <div 
                className="absolute w-full h-full rounded-full border-2 border-dashed animate-spin-slow"
                style={{ 
                  borderColor: colorStyles.border,
                  animationDuration: '3s'
                }}
              ></div>
            )}
            
            <span className="sr-only">Loading avatar...</span>
          </div>
        );

      case 'button':
        return (
          <div
            className={cn(
              'cyber-clip relative overflow-hidden',
              'border-2 flex items-center justify-center',
              animationClasses,
              className
            )}
            style={{
              ...baseStyle,
              width: width || '120px',
              height: height || '40px',
              background: colorStyles.bg,
              borderColor: colorStyles.border,
            }}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            {/* Scanline effect */}
            {showScanline && !prefersReducedMotion && (
              <div className="absolute inset-0 bg-scanline opacity-20" />
            )}
            
            {/* Button content placeholder */}
            <div 
              className="w-1/2 h-2 rounded-sm opacity-30"
              style={{ background: colorStyles.primary }}
            ></div>
            
            <span className="sr-only">Loading button...</span>
          </div>
        );

      case 'input':
        return (
          <div
            className={cn(
              'relative overflow-hidden rounded-md',
              'border-2 flex items-center',
              animationClasses,
              className
            )}
            style={{
              ...baseStyle,
              width: width || '100%',
              height: height || '40px',
              background: colorStyles.bg,
              borderColor: colorStyles.border,
            }}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            {/* Scanline effect */}
            {showScanline && !prefersReducedMotion && (
              <div className="absolute inset-0 bg-scanline opacity-20" />
            )}
            
            {/* Input content placeholder */}
            <div className="pl-3 flex items-center gap-2 w-full">
              <div 
                className="w-1/4 h-2 rounded-sm opacity-30"
                style={{ background: colorStyles.primary }}
              ></div>
              
              {/* Blinking cursor */}
              {!prefersReducedMotion && (
                <div 
                  className="h-4 w-0.5 animate-blink-cursor"
                  style={{ 
                    background: colorStyles.primary,
                    boxShadow: `0 0 4px ${colorStyles.secondary}`
                  }}
                ></div>
              )}
            </div>
            
            <span className="sr-only">Loading input...</span>
          </div>
        );

      case 'code':
        return (
          <div
            className={cn(
              'relative overflow-hidden rounded-md',
              'border-2 font-mono p-4',
              animationClasses,
              className
            )}
            style={{
              ...baseStyle,
              width: width || '100%',
              height: height || 'auto',
              background: 'var(--dark-bg-3)',
              borderColor: colorStyles.border,
            }}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            {/* Scanline effect */}
            {showScanline && !prefersReducedMotion && (
              <div className="absolute inset-0 bg-scanline opacity-20" />
            )}
            
            {/* Code content placeholder */}
            <div className="flex flex-col gap-2">
              {Array.from({ length: count * 3 }).map((_, i) => {
                // Create varied line lengths for realistic code appearance
                const lineWidth = [80, 60, 95, 40, 70, 90][i % 6];
                
                return (
                  <div
                    key={i}
                    className="flex gap-2 items-center"
                  >
                    {/* Line number */}
                    <div 
                      className="text-xs opacity-40 w-5 text-right shrink-0"
                      style={{ color: colorStyles.primary }}
                    >
                      {i + 1}
                    </div>
                    
                    {/* Code line */}
                    <div 
                      className="h-3 rounded-sm opacity-20"
                      style={{ 
                        width: `${lineWidth}%`,
                        background: colorStyles.primary,
                      }}
                    ></div>
                  </div>
                );
              })}
            </div>
            
            <span className="sr-only">Loading code content...</span>
          </div>
        );

      case 'terminal':
        return (
          <div
            className={cn(
              'relative overflow-hidden rounded-md',
              'border-2 font-mono p-4 text-xs',
              animationClasses,
              className
            )}
            style={{
              ...baseStyle,
              width: width || '100%',
              height: height || '200px',
              background: 'var(--dark-bg-3)',
              borderColor: colorStyles.border,
            }}
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            {/* Terminal header */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <div style={{ color: colorStyles.primary }}>WALGIT://TERMINAL</div>
              <div className="opacity-50" style={{ color: colorStyles.primary }}>
                SYSTEM LOADING...
              </div>
            </div>
            
            {/* Terminal content */}
            <div className="flex flex-col gap-1">
              {Array.from({ length: count * 3 }).map((_, i) => {
                // Create varied line lengths for random terminal-like output
                const lineWidth = 30 + Math.floor(Math.random() * 70);
                const isCommand = i % 3 === 0;
                
                return (
                  <div
                    key={i}
                    className="flex"
                  >
                    {isCommand ? (
                      <>
                        {/* Command prompt */}
                        <div 
                          className="mr-2"
                          style={{ color: colorStyles.primary }}
                        >
                          {'>'}
                        </div>
                        
                        {/* Command text */}
                        <div 
                          className="opacity-70"
                          style={{ color: colorStyles.primary }}
                        >
                          {generateRandomTerminalData(5 + i % 6)}
                        </div>
                      </>
                    ) : (
                      <div 
                        className="h-2 rounded-sm opacity-40 ml-4"
                        style={{ 
                          width: `${lineWidth}%`,
                          background: colorStyles.primary,
                        }}
                      ></div>
                    )}
                  </div>
                );
              })}
              
              {/* Blinking cursor */}
              {!prefersReducedMotion && (
                <div className="flex items-center mt-2">
                  <div 
                    className="mr-2"
                    style={{ color: colorStyles.primary }}
                  >
                    {'>'}
                  </div>
                  <div 
                    className="h-3 w-1 animate-blink-cursor"
                    style={{ 
                      background: colorStyles.primary,
                      boxShadow: `0 0 4px ${colorStyles.secondary}`
                    }}
                  ></div>
                </div>
              )}
            </div>
            
            {/* Scanline effect */}
            {showScanline && !prefersReducedMotion && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.3) 50%)',
                  backgroundSize: '100% 4px'
                }}
              ></div>
            )}
            
            <span className="sr-only">Loading terminal content...</span>
          </div>
        );

      default:
        return null;
    }
  };

  return renderSkeleton();
}