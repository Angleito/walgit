'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBatteryAware } from '@/hooks/use-battery-aware';
import { Button, ButtonProps } from '@/components/ui/button';

/**
 * Enhanced MobileCyberpunkButton - Performance-optimized cyberpunk button for mobile
 * Features:
 * - Adaptive haptic feedback based on button importance
 * - Enhanced touch feedback with ripple effect
 * - Battery-aware animations and effects
 * - Improved accessibility with enhanced contrast options
 * - Smart degradation for low-power and reduced motion modes
 */
export interface MobileCyberpunkButtonProps extends Omit<ButtonProps, 'ref'> {
  glowColor?: 'blue' | 'pink' | 'green' | 'mixed';
  intensity?: 'high' | 'medium' | 'low' | 'auto';
  showGlow?: boolean;
  importance?: 'primary' | 'secondary' | 'tertiary';
  rippleEffect?: boolean;
  highContrast?: boolean;
}

export function MobileCyberpunkButton({
  children,
  className,
  variant = 'default',
  size = 'default',
  glowColor = 'blue',
  intensity = 'auto',
  showGlow = true,
  importance = 'secondary',
  rippleEffect = true,
  highContrast = false,
  onClick,
  disabled,
  ...props
}: MobileCyberpunkButtonProps) {
  const isMobile = useIsMobile();
  const {
    optimizationLevel,
    getOptimizedValue
  } = useBatteryAware();

  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{x: number, y: number, id: number}>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  // Check if we're in a high optimization mode
  const shouldOptimize = optimizationLevel > 1;

  // Determine effective intensity based on auto setting
  const effectiveIntensity = intensity === 'auto'
    ? getOptimizedValue('high', 'medium', 'low')
    : intensity;

  // Check if glows should be disabled entirely based on optimization level
  const effectiveShowGlow = showGlow && (optimizationLevel < 2);

  // Get color values based on glow color
  const getColors = () => {
    // If using high contrast, adjust the colors for better visibility
    const contrastMultiplier = highContrast ? 1.2 : 1;

    switch (glowColor) {
      case 'blue':
        return {
          border: '#05d9e8',
          glow: `rgba(5, 217, 232, ${0.7 * contrastMultiplier})`,
          text: highContrast ? '#ffffff' : '#05d9e8',
          gradient: 'from-[#05d9e8] to-[#05d9e8]/70',
        };
      case 'pink':
        return {
          border: '#ff2a6d',
          glow: `rgba(255, 42, 109, ${0.7 * contrastMultiplier})`,
          text: highContrast ? '#ffffff' : '#ff2a6d',
          gradient: 'from-[#ff2a6d] to-[#ff2a6d]/70',
        };
      case 'green':
        return {
          border: '#00ff9f',
          glow: `rgba(0, 255, 159, ${0.7 * contrastMultiplier})`,
          text: highContrast ? '#ffffff' : '#00ff9f',
          gradient: 'from-[#00ff9f] to-[#00ff9f]/70',
        };
      case 'mixed':
        return {
          border: '#05d9e8',
          glow: `rgba(255, 42, 109, ${0.6 * contrastMultiplier})`,
          text: highContrast ? '#ffffff' : '#05d9e8',
          gradient: 'from-[#05d9e8] via-[#d16aff]/60 to-[#ff2a6d]',
        };
      default:
        return {
          border: '#05d9e8',
          glow: `rgba(5, 217, 232, ${0.7 * contrastMultiplier})`,
          text: highContrast ? '#ffffff' : '#05d9e8',
          gradient: 'from-[#05d9e8] to-[#05d9e8]/70',
        };
    }
  };

  // Get intensity values based on selected intensity
  const getIntensityValues = () => {
    switch (effectiveIntensity) {
      case 'high':
        return {
          borderOpacity: '0.7',
          glowSize: '8px',
          animationSpeed: '2s',
          textShadow: '0 0 4px',
          rippleDuration: '600ms',
        };
      case 'medium':
        return {
          borderOpacity: '0.5',
          glowSize: '5px',
          animationSpeed: '3s',
          textShadow: '0 0 2px',
          rippleDuration: '500ms',
        };
      case 'low':
        return {
          borderOpacity: '0.3',
          glowSize: '2px',
          animationSpeed: '0s', // No animation in low power mode
          textShadow: 'none',
          rippleDuration: '400ms',
        };
      default:
        return {
          borderOpacity: '0.5',
          glowSize: '5px',
          animationSpeed: '3s',
          textShadow: '0 0 2px',
          rippleDuration: '500ms',
        };
    }
  };

  const colors = getColors();
  const intensityValues = getIntensityValues();

  // Enhanced click handler with adaptive haptic feedback
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Trigger haptic feedback with intensity based on button importance
    if (isMobile && navigator.vibrate) {
      switch (importance) {
        case 'primary':
          navigator.vibrate([15]); // Strong feedback for primary action
          break;
        case 'secondary':
          navigator.vibrate([8]); // Medium feedback for secondary action
          break;
        case 'tertiary':
          navigator.vibrate([5]); // Light feedback for tertiary action
          break;
      }
    }

    // Add ripple effect if enabled and not in high optimization mode
    if (rippleEffect && !shouldOptimize && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = {
        x,
        y,
        id: rippleIdRef.current++
      };

      setRipples(prev => [...prev, newRipple]);

      // Clean up ripple after animation completes
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, parseInt(intensityValues.rippleDuration) + 100);
    }

    // Visual pressed state
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 300);

    // Call original click handler
    if (onClick) onClick(e);
  };

  // Handle touch events for better mobile experience
  const handleTouchStart = () => {
    if (disabled) return;
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    if (disabled) return;
    setIsPressed(false);
  };

  // For non-mobile devices, render a regular button
  if (!isMobile) {
    return (
      <Button
        className={className}
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </Button>
    );
  }

  // Custom cyberpunk styles for mobile with adaptive features
  const cyberpunkClasses = cn(
    // Base styles - always applied
    "relative overflow-hidden touch-manipulation select-none",
    "border transition-all ease-out active:translate-y-[1px]",
    "text-white font-medium",

    // Border styles with reduced opacity for better performance
    `border-[${colors.border}]/[${intensityValues.borderOpacity}]`,

    // Only add box-shadow if effects are enabled
    effectiveShowGlow ? `shadow-[0_0_${intensityValues.glowSize}_${colors.glow}]` : "",

    // Active/Pressed state - enhance for better touch feedback
    isPressed ? `bg-[${colors.border}]/20` : "bg-black/80",

    // Disabled state
    disabled && "opacity-50 cursor-not-allowed",

    // Pass through the original className
    className
  );

  // Animation style based on intensity
  const animationStyle =
    !effectiveShowGlow || effectiveIntensity === 'low' || intensityValues.animationSpeed === '0s'
      ? {}
      : {
          animation: `pulse-light-${glowColor} ${intensityValues.animationSpeed} infinite alternate`,
        };

  // Text style with optimal contrast
  const textStyle = highContrast
    ? { color: colors.text }
    : {};

  return (
    <>
      <Button
        ref={buttonRef}
        variant={variant}
        size={size}
        className={cyberpunkClasses}
        style={animationStyle}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        disabled={disabled}
        {...props}
      >
        {/* Optimized background effect only if effects are enabled */}
        {effectiveShowGlow && !shouldOptimize && (
          <span
            className={`absolute inset-0 bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
            aria-hidden="true"
          />
        )}

        {/* Ripple effects - only rendered when active and enabled */}
        {rippleEffect && !shouldOptimize && ripples.map(ripple => (
          <span
            key={ripple.id}
            style={{
              position: 'absolute',
              top: ripple.y,
              left: ripple.x,
              transform: 'translate(-50%, -50%)',
              backgroundColor: colors.text,
              borderRadius: '50%',
              opacity: 0,
              width: '120px',
              height: '120px',
              animation: `ripple ${intensityValues.rippleDuration} ease-out forwards`
            }}
            aria-hidden="true"
          />
        ))}

        {/* Optimized text with appropriate contrast */}
        <span
          className="relative z-10"
          style={textStyle}
        >
          {children}
        </span>
      </Button>

      {/* Only include animation styles if effects are enabled */}
      {effectiveShowGlow && !shouldOptimize && (
        <style jsx global>{`
          @keyframes pulse-light-blue {
            0% { box-shadow: 0 0 5px rgba(5, 217, 232, 0.5); }
            100% { box-shadow: 0 0 8px rgba(5, 217, 232, 0.8); }
          }

          @keyframes pulse-light-pink {
            0% { box-shadow: 0 0 5px rgba(255, 42, 109, 0.5); }
            100% { box-shadow: 0 0 8px rgba(255, 42, 109, 0.8); }
          }

          @keyframes pulse-light-green {
            0% { box-shadow: 0 0 5px rgba(0, 255, 159, 0.5); }
            100% { box-shadow: 0 0 8px rgba(0, 255, 159, 0.8); }
          }

          @keyframes pulse-light-mixed {
            0% { box-shadow: 0 0 5px rgba(5, 217, 232, 0.5); }
            50% { box-shadow: 0 0 6px rgba(209, 106, 255, 0.65); }
            100% { box-shadow: 0 0 8px rgba(255, 42, 109, 0.8); }
          }

          @keyframes ripple {
            0% {
              width: 0;
              height: 0;
              opacity: 0.5;
            }
            100% {
              width: 200px;
              height: 200px;
              opacity: 0;
            }
          }
        `}</style>
      )}
    </>
  );
}