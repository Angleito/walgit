'use client';

import { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from './use-mobile';
import { useBatteryAware } from './use-battery-aware';

export interface TouchFeedbackOptions {
  /** Haptic feedback strength (0-100) */
  hapticStrength?: number;
  /** Visual feedback type */
  visualFeedback?: 'none' | 'opacity' | 'scale' | 'glow' | 'ripple' | 'all';
  /** Whether the element is interactive */
  isInteractive?: boolean;
}

export interface MobileOptimizationResult {
  /** Whether the device is a mobile device */
  isMobile: boolean;
  
  /** Battery and device optimization status */
  optimizationStatus: {
    /** Current optimization level (0-3) */
    level: number;
    /** Readable description of the current level */
    description: 'full' | 'balanced' | 'reduced' | 'minimal';
    /** Why we're at this optimization level */
    reason: string;
    /** Whether motion effects should be reduced */
    reduceMotion: boolean;
    /** Whether low-power mode is active */
    isLowPower: boolean;
    /** Whether data-saver mode is active */
    isDataSaver: boolean;
  };
  
  /** Animation parameters optimized for the current device status */
  animations: {
    /** Whether animations should be enabled */
    enabled: boolean;
    /** Animation speed multiplier (0-1) */
    speedFactor: number;
    /** Animation complexity level */
    complexity: 'high' | 'medium' | 'low' | 'none';
    /** Adaptive duration for common animations in ms */
    durations: {
      fast: number;
      medium: number;
      slow: number;
    };
    /** Whether background animations should be shown */
    showBackgroundEffects: boolean;
  };
  
  /** Visual effect parameters */
  visualEffects: {
    /** Whether glow effects should be shown */
    showGlowEffects: boolean;
    /** Opacity level for glow effects (0-1) */
    glowIntensity: number;
    /** Blur radius for effects in pixels */
    blurRadius: number;
    /** Whether to use complex gradients */
    useComplexGradients: boolean;
    /** Shadow size in pixels */
    shadowSize: number;
  };
  
  /** Adaptive cyberpunk color parameters based on optimization level */
  colors: {
    /** Primary neon color with applied alpha based on optimization */
    primaryWithAlpha: string;
    /** Secondary neon color with applied alpha based on optimization */
    secondaryWithAlpha: string;
    /** Accent neon color with applied alpha based on optimization */
    accentWithAlpha: string;
    /** Primary neon color at full intensity */
    primary: string;
    /** Secondary neon color at full intensity */
    secondary: string;
    /** Accent neon color at full intensity */
    accent: string;
  };
  
  /** Helper function to get touch feedback properties for interactive elements */
  getTouchFeedback: (options?: TouchFeedbackOptions) => {
    /** CSS classes to apply for touch feedback */
    className: string;
    /** Event handler for touch/click start */
    onTouchStart?: () => void;
    /** Event handler for touch/click end */
    onTouchEnd?: () => void;
    /** Style object for dynamic effects */
    style?: React.CSSProperties;
  };
  
  /** Get adaptive value based on current optimization level */
  getOptimizedValue: <T>(highPerf: T, mediumPerf: T, lowPerf: T, minimalPerf: T) => T;
}

/**
 * Hook that provides comprehensive mobile optimization settings
 * for cyberpunk UI elements based on device capabilities and status
 */
export function useMobileOptimization(): MobileOptimizationResult {
  const isMobile = useIsMobile();
  const { 
    optimizationLevel,
    prefersReducedMotion,
    isLowBattery,
    isDataSaverEnabled,
    getOptimizedValue: getBatteryAwareValue
  } = useBatteryAware();
  
  // Track touch feedback state
  const [isTouched, setIsTouched] = useState(false);
  
  // Track the reason for the current optimization level
  const optimizationReason = useMemo(() => {
    if (prefersReducedMotion) return 'User prefers reduced motion';
    if (isLowBattery && isDataSaverEnabled) return 'Low battery and data saver enabled';
    if (isLowBattery) return 'Low battery';
    if (isDataSaverEnabled) return 'Data saver enabled';
    if (optimizationLevel > 0) return 'Device performance optimization';
    return 'Standard performance';
  }, [optimizationLevel, prefersReducedMotion, isLowBattery, isDataSaverEnabled]);
  
  // Get readable description of optimization level
  const optimizationDescription = useMemo((): 'full' | 'balanced' | 'reduced' | 'minimal' => {
    switch (optimizationLevel) {
      case 0: return 'full';
      case 1: return 'balanced';
      case 2: return 'reduced';
      case 3: return 'minimal';
      default: return 'balanced';
    }
  }, [optimizationLevel]);
  
  // Animation parameters based on optimization level
  const animations = useMemo(() => {
    const animationEnabled = optimizationLevel < 3;
    
    return {
      enabled: animationEnabled,
      speedFactor: getBatteryAwareValue(1, 0.7, 0.5, 0.3),
      complexity: getBatteryAwareValue<'high' | 'medium' | 'low' | 'none'>(
        'high', 'medium', 'low', 'none'
      ),
      durations: {
        fast: getBatteryAwareValue(150, 200, 250, 300),
        medium: getBatteryAwareValue(300, 350, 400, 450),
        slow: getBatteryAwareValue(500, 600, 700, 800),
      },
      showBackgroundEffects: optimizationLevel < 2,
    };
  }, [optimizationLevel, getBatteryAwareValue]);
  
  // Visual effect parameters based on optimization level
  const visualEffects = useMemo(() => {
    return {
      showGlowEffects: optimizationLevel < 2,
      glowIntensity: getBatteryAwareValue(0.7, 0.5, 0.3, 0.1),
      blurRadius: getBatteryAwareValue(8, 5, 3, 0),
      useComplexGradients: optimizationLevel < 1,
      shadowSize: getBatteryAwareValue(8, 5, 3, 0),
    };
  }, [optimizationLevel, getBatteryAwareValue]);
  
  // Color parameters with applied alpha based on optimization level
  const colors = useMemo(() => {
    const alphaValue = visualEffects.glowIntensity;
    
    return {
      primaryWithAlpha: `rgba(5, 217, 232, ${alphaValue})`,
      secondaryWithAlpha: `rgba(255, 42, 109, ${alphaValue})`,
      accentWithAlpha: `rgba(0, 255, 159, ${alphaValue})`,
      primary: '#05d9e8',
      secondary: '#ff2a6d',
      accent: '#00ff9f',
    };
  }, [visualEffects.glowIntensity]);
  
  // Generate touch feedback properties for interactive elements
  const getTouchFeedback = (options?: TouchFeedbackOptions) => {
    const {
      hapticStrength = 10,
      visualFeedback = 'all',
      isInteractive = true,
    } = options || {};
    
    // Only apply feedback if element is interactive
    if (!isInteractive) {
      return { className: '' };
    }
    
    // Handle touch/click start
    const handleTouchStart = () => {
      setIsTouched(true);
      
      // Apply haptic feedback if available and enabled
      if (navigator.vibrate && hapticStrength > 0) {
        navigator.vibrate(Math.min(hapticStrength, 100));
      }
    };
    
    // Handle touch/click end
    const handleTouchEnd = () => {
      setIsTouched(false);
    };
    
    // Build CSS classes based on requested feedback type
    let className = 'touch-manipulation ';
    
    if (visualFeedback === 'opacity' || visualFeedback === 'all') {
      className += 'active:opacity-80 ';
    }
    
    if (visualFeedback === 'scale' || visualFeedback === 'all') {
      className += 'active:scale-95 ';
    }
    
    // Add custom style for glow effect if requested
    let style: React.CSSProperties | undefined;
    
    if ((visualFeedback === 'glow' || visualFeedback === 'all') && visualEffects.showGlowEffects) {
      style = {
        boxShadow: isTouched 
          ? `0 0 ${visualEffects.shadowSize}px ${colors.primaryWithAlpha}` 
          : 'none'
      };
    }
    
    return {
      className,
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
      style
    };
  };
  
  // Convert getBatteryAwareValue to a 4-level function
  const getOptimizedValue = <T,>(highPerf: T, mediumPerf: T, lowPerf: T, minimalPerf: T): T => {
    switch (optimizationLevel) {
      case 0: return highPerf;
      case 1: return mediumPerf;
      case 2: return lowPerf;
      case 3: return minimalPerf;
      default: return mediumPerf;
    }
  };
  
  return {
    isMobile,
    optimizationStatus: {
      level: optimizationLevel,
      description: optimizationDescription,
      reason: optimizationReason,
      reduceMotion: prefersReducedMotion,
      isLowPower: isLowBattery,
      isDataSaver: isDataSaverEnabled,
    },
    animations,
    visualEffects,
    colors,
    getTouchFeedback,
    getOptimizedValue,
  };
}