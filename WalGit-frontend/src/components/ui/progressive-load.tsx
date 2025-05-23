'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { CyberpunkSkeleton } from './cyberpunk-skeleton';

type SkeletonVariant = 'card' | 'text' | 'avatar' | 'button' | 'input' | 'code' | 'terminal';
type ProgressiveLoadColor = 'blue' | 'purple' | 'pink' | 'teal' | 'multi';

interface ProgressiveLoadProps {
  /**
   * The content to render once loaded
   */
  children: React.ReactNode;
  /**
   * The skeleton variant to display during loading
   */
  skeletonVariant: SkeletonVariant;
  /**
   * Default delay before showing the content in ms
   * @default 800
   */
  delay?: number;
  /**
   * Whether to load content in sequence with siblings
   * @default false
   */
  sequential?: boolean;
  /**
   * The order in the sequence (only used when sequential is true)
   * @default 0
   */
  sequenceIndex?: number;
  /**
   * The delay between each item in the sequence
   * @default 300
   */
  sequenceDelay?: number;
  /**
   * Whether content should animate in when loaded
   * @default true
   */
  animate?: boolean;
  /**
   * The color theme to use
   * @default 'blue'
   */
  color?: ProgressiveLoadColor;
  /**
   * Additional CSS classes to apply
   */
  className?: string;
  /**
   * Width of the skeleton (passed to the skeleton component)
   */
  width?: string | number;
  /**
   * Height of the skeleton (passed to the skeleton component)
   */
  height?: string | number;
  /**
   * Number of skeleton items (for text or code)
   * @default 1
   */
  count?: number;
  /**
   * Whether to show the scanline effect
   * @default true
   */
  showScanline?: boolean;
  /**
   * Whether to override the user's reduced motion preference
   * @default false
   */
  ignoreReducedMotion?: boolean;
  /**
   * Whether the component should load when it enters the viewport
   * @default true
   */
  loadOnIntersection?: boolean;
  /**
   * Root margin for intersection observer
   * @default "100px"
   */
  intersectionMargin?: string;
  /**
   * Callback fired when the component starts loading
   */
  onLoadStart?: () => void;
  /**
   * Callback fired when the component finishes loading
   */
  onLoadComplete?: () => void;
}

export function ProgressiveLoad({
  children,
  skeletonVariant,
  delay = 800,
  sequential = false,
  sequenceIndex = 0,
  sequenceDelay = 300,
  animate = true,
  color = 'blue',
  className,
  width,
  height,
  count = 1,
  showScanline = true,
  ignoreReducedMotion = false,
  loadOnIntersection = true,
  intersectionMargin = '100px',
  onLoadStart,
  onLoadComplete,
}: ProgressiveLoadProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(!loadOnIntersection);
  const componentRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = 
    !ignoreReducedMotion && 
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false;

  // Set up intersection observer for viewport detection
  useEffect(() => {
    if (!loadOnIntersection) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, no need to keep observing
          if (componentRef.current) {
            observer.unobserve(componentRef.current);
          }
        }
      },
      {
        rootMargin: intersectionMargin,
        threshold: 0.1,
      }
    );

    if (componentRef.current) {
      observer.observe(componentRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loadOnIntersection, intersectionMargin]);

  // Handle loading sequence
  useEffect(() => {
    if (!isVisible) return;

    let timeoutId: NodeJS.Timeout;
    
    // Call onLoadStart callback
    if (onLoadStart) {
      onLoadStart();
    }

    const calculatedDelay = sequential 
      ? delay + (sequenceIndex * sequenceDelay)
      : delay;

    timeoutId = setTimeout(() => {
      setIsLoaded(true);
      
      // Call onLoadComplete callback
      if (onLoadComplete) {
        onLoadComplete();
      }
    }, calculatedDelay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, sequential, sequenceIndex, sequenceDelay, isVisible, onLoadStart, onLoadComplete]);

  // Define animation classes based on preferences
  const getAnimationClasses = () => {
    if (!animate || prefersReducedMotion) {
      return '';
    }

    // Different animation effects based on skeleton variant
    const animationMap = {
      card: 'translate-y-2 opacity-0',
      text: 'translate-x-2 opacity-0',
      avatar: 'scale-90 opacity-0',
      button: 'scale-95 opacity-0',
      input: 'translate-y-1 opacity-0',
      code: 'translate-y-2 opacity-0',
      terminal: 'scale-98 opacity-0',
    };

    return !isLoaded ? animationMap[skeletonVariant] : '';
  };

  return (
    <div 
      ref={componentRef}
      className={cn(
        'relative transition-all duration-500',
        getAnimationClasses(),
        className
      )}
      data-loaded={isLoaded ? 'true' : 'false'}
      data-sequence-index={sequenceIndex}
    >
      {!isLoaded && (
        <CyberpunkSkeleton
          variant={skeletonVariant}
          width={width}
          height={height}
          count={count}
          color={color}
          showScanline={showScanline}
          ignoreReducedMotion={ignoreReducedMotion}
        />
      )}

      <div
        className={cn(
          'transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        )}
        aria-hidden={!isLoaded}
      >
        {children}
      </div>
    </div>
  );
}