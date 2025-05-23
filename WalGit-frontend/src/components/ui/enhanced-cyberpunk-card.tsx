'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  detectFeatureSupport,
  isLowPerformanceDevice,
  prefersReducedMotion,
  getPrefixedStyles,
  getFallbackStyles
} from './browser-compatibility';

export interface EnhancedCyberpunkCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  glowColor?: 'blue' | 'violet' | 'emerald' | 'red' | 'amber' | 'mixed';
  className?: string;
  onClick?: () => void;
  disableAnimation?: boolean;
  disableGlow?: boolean;
  disableBlur?: boolean;
  /**
   * Animation style to apply
   * @default "none"
   */
  animationStyle?: 'glitch' | 'pulse' | 'shimmer' | 'wipe' | 'dataFlow' | 'bounce' | 'block' | 'none';
  /**
   * Whether to apply the angular clip path
   * @default false
   */
  clipAngular?: boolean;
  /**
   * Whether to auto-animate on mount
   * @default false
   */
  autoAnimate?: boolean;
  /**
   * Glitch effect intensity (1-10)
   * @default 5
   */
  glitchIntensity?: number;
}

export const EnhancedCyberpunkCard: React.FC<EnhancedCyberpunkCardProps> = ({
  title,
  description,
  icon,
  children,
  glowColor = 'blue',
  className = '',
  onClick,
  disableAnimation = false,
  disableGlow = false,
  disableBlur = false,
  animationStyle = 'none',
  clipAngular = false,
  autoAnimate = false,
  glitchIntensity = 5
}) => {
  const [featureSupport, setFeatureSupport] = useState({
    mixBlendMode: true,
    backdropFilter: true,
    clipPath: true,
    cssGrid: true,
    flexbox: true,
    webkitBackdropFilter: false,
    mozBackdropFilter: false,
    msBackdropFilter: false
  });

  const [reducedMotion, setReducedMotion] = useState(false);
  const [lowPerformance, setLowPerformance] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Detect browser capabilities on component mount
  useEffect(() => {
    setFeatureSupport(detectFeatureSupport());
    setReducedMotion(prefersReducedMotion());
    setLowPerformance(isLowPerformanceDevice());
  }, []);

  // Setup random glitch effect
  useEffect(() => {
    if (autoAnimate && animationStyle === 'glitch' && !shouldReduceEffects) {
      const interval = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }, Math.random() * 5000 + 3000);

      return () => clearInterval(interval);
    }
  }, [autoAnimate, animationStyle, shouldReduceEffects]);

  // Color mapping for different glow effects
  const colorMap = {
    blue: {
      border: 'border-blue-500/50',
      glow: 'before:bg-blue-500/20',
      shadow: 'shadow-blue-500/20',
      iconBg: 'bg-blue-900/30',
      iconBorder: 'border-blue-500/50',
      titleGradient: 'from-blue-400 to-blue-300',
      fallbackColor: '#3b82f6',
      pulseColor: 'rgba(59, 130, 246, 0.7)',
      pulseColorAlt: 'rgba(29, 78, 216, 0.5)'
    },
    violet: {
      border: 'border-violet-500/50',
      glow: 'before:bg-violet-500/20',
      shadow: 'shadow-violet-500/20',
      iconBg: 'bg-violet-900/30',
      iconBorder: 'border-violet-500/50',
      titleGradient: 'from-violet-400 to-violet-300',
      fallbackColor: '#8b5cf6',
      pulseColor: 'rgba(139, 92, 246, 0.7)',
      pulseColorAlt: 'rgba(91, 33, 182, 0.5)'
    },
    emerald: {
      border: 'border-emerald-500/50',
      glow: 'before:bg-emerald-500/20',
      shadow: 'shadow-emerald-500/20',
      iconBg: 'bg-emerald-900/30',
      iconBorder: 'border-emerald-500/50',
      titleGradient: 'from-emerald-400 to-emerald-300',
      fallbackColor: '#10b981',
      pulseColor: 'rgba(16, 185, 129, 0.7)',
      pulseColorAlt: 'rgba(4, 120, 87, 0.5)'
    },
    red: {
      border: 'border-red-500/50',
      glow: 'before:bg-red-500/20',
      shadow: 'shadow-red-500/20',
      iconBg: 'bg-red-900/30',
      iconBorder: 'border-red-500/50',
      titleGradient: 'from-red-400 to-red-300',
      fallbackColor: '#ef4444',
      pulseColor: 'rgba(239, 68, 68, 0.7)',
      pulseColorAlt: 'rgba(185, 28, 28, 0.5)'
    },
    amber: {
      border: 'border-amber-500/50',
      glow: 'before:bg-amber-500/20',
      shadow: 'shadow-amber-500/20',
      iconBg: 'bg-amber-900/30',
      iconBorder: 'border-amber-500/50',
      titleGradient: 'from-amber-400 to-amber-300',
      fallbackColor: '#f59e0b',
      pulseColor: 'rgba(245, 158, 11, 0.7)',
      pulseColorAlt: 'rgba(180, 83, 9, 0.5)'
    },
    mixed: {
      border: 'border-indigo-500/50',
      glow: 'before:bg-gradient-to-r before:from-blue-500/20 before:to-violet-500/20',
      shadow: 'shadow-indigo-500/20',
      iconBg: 'bg-gradient-to-r from-blue-900/30 to-violet-900/30',
      iconBorder: 'border-indigo-500/50',
      titleGradient: 'from-blue-400 to-violet-400',
      fallbackColor: '#6366f1',
      pulseColor: 'rgba(99, 102, 241, 0.7)',
      pulseColorAlt: 'rgba(79, 70, 229, 0.5)'
    }
  };

  const colors = colorMap[glowColor];

  // Determine if we should use reduced effects
  const shouldReduceEffects = reducedMotion || lowPerformance || disableAnimation;

  // Create backdrop blur style with fallbacks
  const getBackdropStyles = () => {
    if (disableBlur) return {};

    // If backdrop-filter is not supported, use a solid background instead
    if (!featureSupport.backdropFilter &&
        !featureSupport.webkitBackdropFilter &&
        !featureSupport.mozBackdropFilter) {
      return { backgroundColor: 'rgba(0, 0, 0, 0.85)' };
    }

    // Apply the appropriate prefixed backdrop-filter
    const blurValue = lowPerformance ? '5px' : '8px';
    const backdropStyle = { backdropFilter: `blur(${blurValue})` };

    return getPrefixedStyles(backdropStyle);
  };

  // Create the title gradient with fallbacks
  const getTitleStyles = () => {
    // If background-clip: text is not well-supported in the browser,
    // use a solid color instead of a gradient
    const textColorStyle = { color: colors.fallbackColor };

    if (lowPerformance) {
      return textColorStyle;
    }

    return {};
  };

  // Create animations with fallbacks
  const getAnimationProps = () => {
    if (shouldReduceEffects) {
      // Simplified animation for devices with reduced motion preference
      return {
        initial: { opacity: 0.8 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 },
        whileHover: { scale: 1.01, transition: { duration: 0.2 } }
      };
    }

    // Full animations for capable devices
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4 },
      whileHover: { scale: 1.02, transition: { duration: 0.2 } }
    };
  };

  // Get animation classes based on animation style
  const getAnimationClasses = () => {
    if (shouldReduceEffects) return '';

    switch (animationStyle) {
      case 'glitch':
        return cn(
          'glitch-block',
          isGlitching ? 'animate' : '',
          autoAnimate ? 'glitch-subtle' : ''
        );
      case 'pulse':
        return 'energy-pulse';
      case 'shimmer':
        return 'holographic-shimmer';
      case 'wipe':
        return 'angular-wipe';
      case 'dataFlow':
        return 'data-flow';
      case 'bounce':
        return 'cyber-bounce';
      case 'block':
        return 'glitch-block animate';
      default:
        return '';
    }
  };

  // Handle click with pulse animation
  const handleClick = (e: React.MouseEvent) => {
    // Trigger energy pulse effect
    if (!shouldReduceEffects && !pulseActive) {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 1000);
    }

    // Call the provided onClick handler if it exists
    if (onClick) {
      onClick();
    }
  };

  // Set custom CSS variables for animations
  const customStyles = {
    '--glitch-strength': glitchIntensity / 10,
    '--pulse-color': colors.pulseColor,
    '--pulse-color-alt': colors.pulseColorAlt,
    '--hologram-primary': colors.pulseColor,
    '--hologram-secondary': colors.pulseColorAlt
  } as React.CSSProperties;

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        'relative flex flex-col p-6 bg-black/50 border overflow-hidden',
        colors.border,
        clipAngular ? 'cyber-clip' : 'rounded-xl',
        getAnimationClasses(),
        pulseActive ? 'energy-pulse' : '',
        autoAnimate && !shouldReduceEffects ? 'power-up' : '',
        className
      )}
      style={{
        ...getBackdropStyles(),
        ...customStyles
      }}
      {...getAnimationProps()}
      onClick={handleClick}
      data-text={title} // For glitch effects that use data-text
    >
      {/* Glow effect - only render if not disabled and not low performance */}
      {!disableGlow && !lowPerformance && (
        <div
          className={cn(
            'absolute inset-0 before:content-[""] before:absolute before:inset-0',
            clipAngular ? 'before:cyber-clip' : 'before:rounded-xl',
            'before:blur-xl',
            colors.glow,
            shouldReduceEffects ? 'opacity-40' : 'opacity-60'
          )}
        ></div>
      )}

      {/* Add scanlines effect for cyberpunk feel */}
      {!shouldReduceEffects && (
        <div className="absolute inset-0 scanlines opacity-10 pointer-events-none"></div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {icon && (
          <div className={cn(
            'self-start p-3 mb-5 border',
            clipAngular ? 'cyber-clip' : 'rounded-xl',
            colors.iconBg,
            colors.iconBorder
          )}>
            {icon}
          </div>
        )}

        <h3
          className={cn(
            'text-xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent',
            colors.titleGradient,
            animationStyle === 'glitch' && !shouldReduceEffects ? 'glitch-subtle' : ''
          )}
          style={getTitleStyles() as React.CSSProperties}
          data-text={title}
        >
          {title}
        </h3>

        <p className="text-gray-300 flex-grow">
          {description}
        </p>

        {children}

        {/* Cyberpunk corner accent - only if not reduced effects */}
        {!shouldReduceEffects && (
          <>
            <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-1 bg-gradient-to-r from-transparent to-white/40"></div>
              <div className="absolute top-0 right-0 w-1 h-16 bg-gradient-to-b from-transparent to-white/40"></div>
            </div>
            <div className="absolute bottom-0 left-0 w-12 h-12 overflow-hidden">
              <div className="absolute bottom-0 left-0 w-16 h-1 bg-gradient-to-l from-transparent to-white/40"></div>
              <div className="absolute bottom-0 left-0 w-1 h-16 bg-gradient-to-t from-transparent to-white/40"></div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default EnhancedCyberpunkCard;