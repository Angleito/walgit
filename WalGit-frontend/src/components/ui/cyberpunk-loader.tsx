'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type CyberpunkLoaderProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'pulse' | 'circuit' | 'glitch';
  color?: 'blue' | 'purple' | 'pink' | 'teal' | 'multi';
  className?: string;
  text?: string;
  /**
   * Adds text for screen readers while hiding it visually
   */
  accessibilityText?: string;
  /**
   * Whether the loader should ignore prefers-reduced-motion preference
   * @default false
   */
  ignoreReducedMotion?: boolean;
};

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

const colorVariants = {
  blue: {
    primary: 'var(--neon-blue)',
    secondary: 'var(--glow-blue)',
    accent: 'rgba(0, 238, 255, 0.3)',
  },
  purple: {
    primary: 'var(--neon-purple)',
    secondary: 'var(--glow-purple)',
    accent: 'rgba(217, 0, 255, 0.3)',
  },
  pink: {
    primary: 'var(--neon-pink)',
    secondary: 'var(--glow-pink)',
    accent: 'rgba(255, 44, 223, 0.3)',
  },
  teal: {
    primary: 'var(--neon-teal)',
    secondary: 'var(--glow-teal)',
    accent: 'rgba(0, 255, 179, 0.3)',
  },
  multi: {
    primary: 'var(--gradient-cyberpunk)',
    secondary: 'var(--glow-blue)',
    accent: 'rgba(0, 238, 255, 0.3)',
  },
};

export function CyberpunkLoader({
  size = 'md',
  variant = 'spinner',
  color = 'blue',
  className,
  text,
  accessibilityText = 'Loading',
  ignoreReducedMotion = false,
}: CyberpunkLoaderProps) {
  const colorStyle = colorVariants[color];
  const sizeStyle = sizeClasses[size];
  const textSize = textSizeClasses[size];

  // For screen readers
  const ariaLabel = accessibilityText || 'Loading';
  
  const containerClasses = cn(
    'relative flex flex-col items-center justify-center',
    text ? 'gap-3' : '',
    className
  );

  // Required for reduced motion
  const prefersReducedMotion = 
    !ignoreReducedMotion && 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;

  return (
    <div 
      className={containerClasses}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {variant === 'spinner' && (
        <div
          className={cn(
            'relative flex items-center justify-center',
            sizeStyle
          )}
        >
          {/* Base spinning ring */}
          <div 
            className={cn(
              'absolute inset-0 rounded-full',
              'border-4 border-t-transparent',
              'animate-spin',
              prefersReducedMotion ? 'animate-none border-opacity-50' : '',
            )}
            style={{ 
              borderColor: 'var(--dark-bg-3)',
              borderTopColor: 'transparent',
            }}
          />
          
          {/* Neon spinner */}
          <div 
            className={cn(
              'absolute inset-0 rounded-full', 
              'border-4 border-t-transparent',
              'animate-spin',
              prefersReducedMotion ? 'animate-none' : '',
            )}
            style={{ 
              borderColor: colorStyle.primary,
              borderTopColor: 'transparent',
              boxShadow: `0 0 10px ${colorStyle.secondary}`,
              animationDuration: '0.8s',
            }}
          />
          
          {/* Glitch effect layer */}
          <div 
            className={cn(
              'absolute inset-0 rounded-full opacity-50',
              'border-[1px] border-t-transparent',
              prefersReducedMotion ? 'hidden' : 'animate-glitch',
            )}
            style={{ 
              borderColor: colorStyle.primary,
              borderTopColor: 'transparent',
              boxShadow: `0 0 5px ${colorStyle.secondary}`,
            }}
          />
          
          {/* Inner dot */}
          <div 
            className="absolute rounded-full w-[30%] h-[30%]" 
            style={{ 
              backgroundColor: colorStyle.primary,
              boxShadow: `0 0 10px ${colorStyle.secondary}`,
            }}
          />
        </div>
      )}

      {variant === 'pulse' && (
        <div 
          className={cn(
            'relative flex items-center justify-center',
            sizeStyle
          )}
        >
          {/* Outer pulsing circle */}
          <div 
            className={cn(
              'absolute inset-0 rounded-full',
              prefersReducedMotion ? 'opacity-30' : 'animate-pulse opacity-0',
            )}
            style={{ 
              border: `2px solid ${colorStyle.primary}`,
              boxShadow: `0 0 15px ${colorStyle.secondary}`,
              animationDuration: '2s',
            }}
          />
          
          {/* Middle pulsing circle */}
          <div 
            className={cn(
              'absolute rounded-full w-[75%] h-[75%]',
              prefersReducedMotion ? 'opacity-50' : 'animate-pulse opacity-30',
            )}
            style={{ 
              border: `2px solid ${colorStyle.primary}`,
              boxShadow: `0 0 10px ${colorStyle.secondary}`,
              animationDuration: '2s',
              animationDelay: '0.3s',
            }}
          />
          
          {/* Inner dot */}
          <div 
            className={cn(
              'absolute rounded-full w-[30%] h-[30%]',
              prefersReducedMotion ? '' : 'animate-pulse',
            )}
            style={{ 
              backgroundColor: colorStyle.primary,
              boxShadow: `0 0 10px ${colorStyle.secondary}`,
              animationDuration: '1.5s',
              animationDelay: '0.6s',
            }}
          />

          {/* Glitch effect */}
          {!prefersReducedMotion && (
            <div 
              className="absolute inset-0 rounded-full animate-glitch opacity-40"
              style={{ 
                border: `1px solid ${colorStyle.primary}`,
                animationDuration: '0.3s',
              }}
            />
          )}
        </div>
      )}

      {variant === 'circuit' && (
        <div 
          className={cn(
            'relative',
            sizeStyle
          )}
        >
          {/* SVG circuit pattern */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
            aria-hidden="true"
          >
            {/* Circuit paths */}
            <path
              d="M20,50 L40,50 L40,25 L60,25 L60,50 L80,50"
              fill="none"
              strokeWidth="2"
              className={prefersReducedMotion ? '' : 'animate-circuit-path-1'}
              style={{ 
                stroke: colorStyle.primary,
                strokeDasharray: 150,
                strokeDashoffset: prefersReducedMotion ? 0 : 150,
              }}
            />
            <path
              d="M20,75 L30,75 L30,60 L70,60 L70,75 L80,75"
              fill="none"
              strokeWidth="2"
              className={prefersReducedMotion ? '' : 'animate-circuit-path-2'}
              style={{ 
                stroke: colorStyle.primary,
                strokeDasharray: 150,
                strokeDashoffset: prefersReducedMotion ? 0 : 150,
              }}
            />
            <path
              d="M50,20 L50,40 L25,40 L25,60 L50,60 L50,80"
              fill="none"
              strokeWidth="2"
              className={prefersReducedMotion ? '' : 'animate-circuit-path-3'}
              style={{ 
                stroke: colorStyle.primary,
                strokeDasharray: 150,
                strokeDashoffset: prefersReducedMotion ? 0 : 150,
              }}
            />
            
            {/* Data particles */}
            <circle
              cx="20"
              cy="50"
              r="3"
              className={prefersReducedMotion ? 'opacity-70' : 'animate-data-particle-1'}
              style={{ fill: colorStyle.primary }}
            />
            <circle
              cx="20"
              cy="75"
              r="3"
              className={prefersReducedMotion ? 'opacity-70' : 'animate-data-particle-2'}
              style={{ fill: colorStyle.primary }}
            />
            <circle
              cx="50"
              cy="20"
              r="3"
              className={prefersReducedMotion ? 'opacity-70' : 'animate-data-particle-3'}
              style={{ fill: colorStyle.primary }}
            />
            
            {/* Central rotating hexagon */}
            <polygon
              points="50,35 60,42.5 60,57.5 50,65 40,57.5 40,42.5"
              className={prefersReducedMotion ? 'opacity-90' : 'animate-rotate'}
              style={{ 
                fill: 'var(--dark-bg-2)',
                stroke: colorStyle.primary,
                strokeWidth: 2,
              }}
            />
            
            {/* Inner center dot */}
            <circle
              cx="50"
              cy="50"
              r="5"
              className={prefersReducedMotion ? '' : 'animate-pulse'}
              style={{ 
                fill: colorStyle.primary,
                filter: `drop-shadow(0 0 3px ${colorStyle.secondary})`
              }}
            />
          </svg>
        </div>
      )}

      {variant === 'glitch' && (
        <div 
          className={cn(
            'relative flex items-center justify-center overflow-hidden',
            sizeStyle
          )}
        >
          {/* Base square with cyberpunk clip path */}
          <div 
            className="cyber-clip absolute inset-0 border-2 cyberpunk-border"
            style={{
              borderColor: colorStyle.primary,
              boxShadow: `0 0 10px ${colorStyle.secondary}, inset 0 0 5px ${colorStyle.secondary}`,
            }}
          />
          
          {/* Scanning line effect */}
          {!prefersReducedMotion && (
            <div 
              className="absolute h-full w-[5px] animate-scanner"
              style={{
                background: `linear-gradient(to bottom, transparent, ${colorStyle.primary}, transparent)`,
                boxShadow: `0 0 10px ${colorStyle.secondary}`,
              }}
            />
          )}
          
          {/* Glitching segments */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i}
              className={cn(
                'absolute cyber-clip border border-opacity-80',
                prefersReducedMotion ? 'opacity-40' : '',
              )}
              style={{
                width: '90%',
                height: '90%',
                borderColor: colorStyle.primary,
                opacity: prefersReducedMotion ? 0.4 : 0,
                animation: prefersReducedMotion ? 'none' : `glitch-segment-${i+1} 2s infinite ${i * 0.2}s`,
              }}
            />
          ))}
          
          {/* Center symbol */}
          <div 
            className={cn(
              'relative text-center font-mono font-bold',
              size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-4xl',
            )}
            style={{
              color: colorStyle.primary,
              textShadow: `0 0 5px ${colorStyle.secondary}`,
            }}
          >
            {size === 'sm' ? '×' : '⟁'}
          </div>
        </div>
      )}

      {/* Optional text label */}
      {text && (
        <div 
          className={cn(
            'text-center font-mono cyberpunk-text',
            textSize
          )}
          style={{
            color: colorStyle.primary,
            textShadow: `0 0 5px ${colorStyle.secondary}`,
          }}
        >
          {text}
        </div>
      )}

      {/* Visually hidden text for screen readers */}
      <span className="sr-only">{accessibilityText}</span>
    </div>
  );
}