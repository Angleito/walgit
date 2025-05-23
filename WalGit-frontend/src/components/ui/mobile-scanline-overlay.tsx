'use client';

import React, { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBatteryAware } from '@/hooks/use-battery-aware';

interface MobileScanlineOverlayProps {
  children?: React.ReactNode;
  intensity?: 'high' | 'medium' | 'low' | 'auto';
  color?: 'blue' | 'pink' | 'green' | 'mixed';
}

/**
 * Enhanced MobileScanlineOverlay - Performance-optimized cyberpunk scanline effect for mobile
 * Features:
 * - Adaptive intensity based on device capabilities and battery status
 * - Multiple color options with gradient support
 * - Smart rendering with optimization levels
 * - Data-saver and battery-aware implementations
 */
export function MobileScanlineOverlay({
  children,
  intensity = 'auto',
  color = 'blue'
}: MobileScanlineOverlayProps) {
  const isMobile = useIsMobile();
  const {
    optimizationLevel,
    shouldOptimizeEffects,
    getOptimizedValue
  } = useBatteryAware();

  const [isLoaded, setIsLoaded] = useState(false);

  // Load animation with a slight delay to improve initial page load performance
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Determine actual intensity level based on props and device status
  const effectiveIntensity = useMemo(() => {
    if (intensity !== 'auto') return intensity;

    // Auto mode - use optimization level to determine intensity
    return getOptimizedValue('high', 'medium', 'low');
  }, [intensity, getOptimizedValue]);

  // Don't render effects if device explicitly requests no animations
  // or if we're at maximum optimization level
  if (!isMobile || optimizationLevel === 3) {
    return <>{children}</>;
  }

  // Get color values
  const getColorValues = () => {
    switch (color) {
      case 'blue':
        return {
          primary: 'rgba(5, 217, 232, VAR_OPACITY)',
          secondary: 'rgba(5, 217, 232, VAR_OPACITY)',
        };
      case 'pink':
        return {
          primary: 'rgba(255, 42, 109, VAR_OPACITY)',
          secondary: 'rgba(255, 42, 109, VAR_OPACITY)',
        };
      case 'green':
        return {
          primary: 'rgba(0, 255, 159, VAR_OPACITY)',
          secondary: 'rgba(0, 255, 159, VAR_OPACITY)',
        };
      case 'mixed':
        return {
          primary: 'rgba(5, 217, 232, VAR_OPACITY)',
          secondary: 'rgba(255, 42, 109, VAR_OPACITY)',
        };
      default:
        return {
          primary: 'rgba(5, 217, 232, VAR_OPACITY)',
          secondary: 'rgba(5, 217, 232, VAR_OPACITY)',
        };
    }
  };

  // Get intensity values
  const getIntensityValues = () => {
    switch (effectiveIntensity) {
      case 'high':
        return {
          opacity: '0.04',
          speed: '8s',
          size: '3px',
          frequency: '3px', // More frequent scanlines
        };
      case 'medium':
        return {
          opacity: '0.03',
          speed: '12s',
          size: '4px',
          frequency: '4px',
        };
      case 'low':
        return {
          opacity: '0.02',
          speed: '15s',
          size: '5px',
          frequency: '5px', // Less frequent scanlines
        };
      default:
        return {
          opacity: '0.03',
          speed: '12s',
          size: '4px',
          frequency: '4px',
        };
    }
  };

  const colors = getColorValues();
  const intensityValues = getIntensityValues();

  // Replace placeholder with actual opacity
  const primaryColor = colors.primary.replace('VAR_OPACITY', intensityValues.opacity);
  const secondaryColor = colors.secondary.replace('VAR_OPACITY', intensityValues.opacity);

  // Generate appropriate gradient based on color mode
  const getBackground = () => {
    if (color === 'mixed') {
      return `repeating-linear-gradient(
        75deg,
        ${primaryColor} 0px,
        ${primaryColor} 1px,
        transparent 1px,
        transparent ${intensityValues.frequency},
        ${secondaryColor} ${intensityValues.frequency},
        ${secondaryColor} calc(${intensityValues.frequency} + 1px),
        transparent calc(${intensityValues.frequency} + 1px),
        transparent calc(${intensityValues.frequency} * 2)
      )`;
    }

    return `repeating-linear-gradient(
      0deg,
      ${primaryColor} 0px,
      ${primaryColor} 1px,
      transparent 1px,
      transparent ${intensityValues.frequency}
    )`;
  };

  // Choose appropriate style based on device status
  const overlayStyle = {
    pointerEvents: 'none' as const,
    position: 'fixed' as const,
    zIndex: 9999,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: getBackground(),
    opacity: 1, // Opacity is baked into the colors
    mixBlendMode: 'overlay' as const,
    animation: isLoaded ? `mobileScanline ${intensityValues.speed} linear infinite` : 'none',
    willChange: shouldOptimizeEffects ? 'auto' : 'background-position', // Only use willChange when not optimizing
    backgroundSize: `100% ${intensityValues.size}`,
  };

  return (
    <>
      <div style={overlayStyle} aria-hidden="true" />
      {children}

      {/* Optimized animation keyframes */}
      <style jsx global>{`
        @keyframes mobileScanline {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 100%;
          }
        }

        /* Pause animations when page is not visible */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </>
  );
}