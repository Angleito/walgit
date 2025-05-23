'use client';

import React from 'react';
import { CyberpunkLoader } from './cyberpunk-loader';
import { cn } from '@/lib/utils';

// Export types for public API
export type LoaderVariant = 'spinner' | 'pulse' | 'circuit' | 'glitch';
export type LoaderColor = 'blue' | 'purple' | 'pink' | 'teal' | 'multi';
export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  /**
   * Additional CSS classes to apply to the loading spinner container
   */
  className?: string;
  /**
   * The variant of the loader to display
   * @default 'spinner'
   */
  variant?: LoaderVariant;
  /**
   * The size of the loading spinner
   * @default 'md'
   */
  size?: LoaderSize;
  /**
   * The color theme of the loader
   * @default 'blue'
   */
  color?: LoaderColor;
  /**
   * The text to display below the loader
   */
  text?: string;
  /**
   * The text for screen readers
   * @default 'Loading'
   */
  accessibilityText?: string;
  /**
   * Whether to show a full-screen overlay
   * @default false
   */
  fullScreen?: boolean;
  /**
   * The opacity of the full-screen overlay background (0-100)
   * @default 80
   */
  overlayOpacity?: number;
  /**
   * Whether to apply a blur effect to the background
   * @default true
   */
  blurBackground?: boolean;
  /**
   * Whether to override the user's reduced motion preference
   * @default false
   */
  ignoreReducedMotion?: boolean;
}

export function LoadingSpinner({
  className,
  variant = 'spinner',
  size = 'md',
  color = 'blue',
  text,
  accessibilityText = 'Loading',
  fullScreen = false,
  overlayOpacity = 80,
  blurBackground = true,
  ignoreReducedMotion = false,
}: LoadingSpinnerProps) {
  // Create a loader component that can be either full-screen or inline
  if (fullScreen) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          blurBackground ? 'backdrop-blur-sm' : '',
          className
        )}
        style={{
          backgroundColor: `rgba(8, 11, 20, ${overlayOpacity / 100})`,
        }}
        role="status"
        aria-live="polite"
      >
        <CyberpunkLoader
          variant={variant}
          size={size}
          color={color}
          text={text}
          accessibilityText={accessibilityText}
          ignoreReducedMotion={ignoreReducedMotion}
        />
      </div>
    );
  }

  // Regular inline loader
  return (
    <div 
      className={cn(
        'flex items-center justify-center w-full h-full', 
        className
      )}
    >
      <CyberpunkLoader
        variant={variant}
        size={size}
        color={color}
        text={text}
        accessibilityText={accessibilityText}
        ignoreReducedMotion={ignoreReducedMotion}
      />
    </div>
  );
}

// Also export the standard loading animation components
export { CyberpunkLoader } from './cyberpunk-loader';
export { CyberpunkSkeleton } from './cyberpunk-skeleton';
export { ProgressiveLoad } from './progressive-load';
export { PageTransition } from './page-transition';