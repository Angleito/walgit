'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CyberpunkLoader } from './cyberpunk-loader';

type PageTransitionProps = {
  /**
   * The children to render
   */
  children: React.ReactNode;
  /**
   * The style of transition to use
   * @default 'fade'
   */
  variant?: 'fade' | 'slide' | 'circuit' | 'glitch';
  /**
   * The duration of the transition in milliseconds
   * @default 500
   */
  duration?: number;
  /**
   * The color theme of the transition
   * @default 'blue'
   */
  color?: 'blue' | 'purple' | 'pink' | 'teal' | 'multi';
  /**
   * Whether to show a loader during transition
   * @default true
   */
  showLoader?: boolean;
  /**
   * The minimum time to show the loader in milliseconds
   * @default 300
   */
  minLoaderTime?: number;
  /**
   * Whether to enable transitions even when prefers-reduced-motion is set
   * @default false
   */
  ignoreReducedMotion?: boolean;
  /**
   * Text to display during loading
   */
  loadingText?: string;
};

export function PageTransition({
  children,
  variant = 'fade',
  duration = 500,
  color = 'blue',
  showLoader = true,
  minLoaderTime = 300,
  ignoreReducedMotion = false,
  loadingText,
}: PageTransitionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [prevRoute, setPrevRoute] = useState('');
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Check for reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setShouldAnimate(!prefersReducedMotion || ignoreReducedMotion);
  }, [ignoreReducedMotion]);

  useEffect(() => {
    const currentRoute = pathname + searchParams.toString();
    
    // Only trigger transition effects if the route has changed
    if (prevRoute && currentRoute !== prevRoute) {
      // Start loading
      setIsLoading(true);
      setShowContent(false);
      
      // Wait for minimum loader time then transition in the content
      const minimumLoadingTimer = setTimeout(() => {
        setIsLoading(false);
        
        // Small delay before showing content for smooth transition
        setTimeout(() => {
          setShowContent(true);
        }, 50);
      }, minLoaderTime);
      
      return () => clearTimeout(minimumLoadingTimer);
    } else if (!prevRoute) {
      // Initial load
      const initialLoadTimer = setTimeout(() => {
        setIsLoading(false);
        
        setTimeout(() => {
          setShowContent(true);
        }, 50);
      }, minLoaderTime);
      
      return () => clearTimeout(initialLoadTimer);
    }
    
    setPrevRoute(currentRoute);
  }, [pathname, searchParams, prevRoute, minLoaderTime]);

  // Define transition classes based on variants
  const getTransitionClasses = () => {
    if (!shouldAnimate) {
      return '';
    }
    
    const transitionBase = `transition-all duration-${duration}ms ease-in-out`;
    
    if (variant === 'fade') {
      return cn(
        transitionBase,
        showContent ? 'opacity-100' : 'opacity-0'
      );
    }
    
    if (variant === 'slide') {
      return cn(
        transitionBase,
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      );
    }
    
    if (variant === 'circuit') {
      return cn(
        transitionBase,
        showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      );
    }
    
    if (variant === 'glitch') {
      return cn(
        transitionBase,
        showContent ? 'opacity-100 blur-none' : 'opacity-0 blur-sm'
      );
    }
    
    return '';
  };

  // Generate circuit paths for background
  const renderCircuitBackground = () => {
    if (variant !== 'circuit' || !shouldAnimate) return null;
    
    const colorStyle = {
      blue: {
        primary: 'var(--neon-blue)',
        secondary: 'var(--glow-blue)',
      },
      purple: {
        primary: 'var(--neon-purple)',
        secondary: 'var(--glow-purple)',
      },
      pink: {
        primary: 'var(--neon-pink)',
        secondary: 'var(--glow-pink)',
      },
      teal: {
        primary: 'var(--neon-teal)',
        secondary: 'var(--glow-teal)',
      },
      multi: {
        primary: 'var(--neon-blue)',
        secondary: 'var(--glow-blue)',
      },
    }[color];
    
    return (
      <div
        className={cn(
          'absolute inset-0 -z-10 opacity-10 pointer-events-none',
          showContent ? 'opacity-10' : 'opacity-0',
          'transition-opacity duration-1000'
        )}
        aria-hidden="true"
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 L30,20 L30,50 L70,50 L70,80 L100,80"
            stroke={colorStyle.primary}
            strokeWidth="0.2"
            fill="none"
            className="data-flow-path"
          />
          <path
            d="M0,80 L20,80 L20,40 L80,40 L80,10 L100,10"
            stroke={colorStyle.primary}
            strokeWidth="0.2"
            fill="none"
            className="data-flow-path"
          />
          <path
            d="M50,0 L50,30 L20,30 L20,70 L50,70 L50,100"
            stroke={colorStyle.primary}
            strokeWidth="0.2"
            fill="none"
            className="data-flow-path"
          />
          <path
            d="M80,0 L80,20 L40,20 L40,80 L80,80 L80,100"
            stroke={colorStyle.primary}
            strokeWidth="0.2"
            fill="none"
            className="data-flow-path"
          />
          
          {/* Animated data particles */}
          <circle
            r="0.5"
            fill={colorStyle.primary}
            className="data-flow-particle"
          >
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path="M0,20 L30,20 L30,50 L70,50 L70,80 L100,80"
            />
          </circle>
          <circle
            r="0.5"
            fill={colorStyle.primary}
            className="data-flow-particle"
          >
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path="M0,80 L20,80 L20,40 L80,40 L80,10 L100,10"
            />
          </circle>
          <circle
            r="0.5"
            fill={colorStyle.primary}
            className="data-flow-particle"
          >
            <animateMotion
              dur="2.5s"
              repeatCount="indefinite"
              path="M50,0 L50,30 L20,30 L20,70 L50,70 L50,100"
            />
          </circle>
          <circle
            r="0.5"
            fill={colorStyle.primary}
            className="data-flow-particle"
          >
            <animateMotion
              dur="3.5s"
              repeatCount="indefinite"
              path="M80,0 L80,20 L40,20 L40,80 L80,80 L80,100"
            />
          </circle>
        </svg>
      </div>
    );
  };

  // Apply a glitch effect layer if using glitch variant
  const renderGlitchEffect = () => {
    if (variant !== 'glitch' || !shouldAnimate) return null;
    
    return (
      <div
        className={cn(
          'absolute inset-0 overflow-hidden pointer-events-none z-50',
          'transition-opacity duration-300',
          isLoading ? 'opacity-70' : 'opacity-0'
        )}
        aria-hidden="true"
      >
        {/* Horizontal glitch lines */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-70">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[1px] w-full animate-glitch-offset"
              style={{
                backgroundColor: i % 2 === 0 ? 'var(--neon-blue)' : 'var(--neon-pink)',
                animationDelay: `${i * 0.1}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
        
        {/* Scanline effect */}
        <div
          className="absolute inset-0 bg-scanline opacity-10"
          style={{
            backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
            backgroundSize: '100% 4px',
            animation: 'scanline-scroll 0.2s linear infinite',
          }}
        />
        
        {/* Glitch overlay */}
        <div
          className="absolute inset-0 animate-glitch-overlay"
          style={{
            mixBlendMode: 'difference',
            background: 'rgba(0, 238, 255, 0.1)',
          }}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-screen">
      {/* Background effects for specific variants */}
      {renderCircuitBackground()}
      
      {/* Main content with transition effects */}
      <div className={cn('w-full h-full', getTransitionClasses())}>
        {children}
      </div>
      
      {/* Loading overlay */}
      {showLoader && (
        <div
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center',
            'bg-background bg-opacity-90 backdrop-blur-sm',
            'transition-opacity duration-300',
            isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          role="status"
          aria-live="polite"
        >
          <CyberpunkLoader
            variant={variant === 'circuit' ? 'circuit' : variant === 'glitch' ? 'glitch' : 'spinner'}
            size="lg"
            color={color}
            text={loadingText || 'Loading'}
            accessibilityText={loadingText || 'Page is loading'}
            ignoreReducedMotion={ignoreReducedMotion}
          />
        </div>
      )}
      
      {/* Glitch effect overlay */}
      {renderGlitchEffect()}
    </div>
  );
}