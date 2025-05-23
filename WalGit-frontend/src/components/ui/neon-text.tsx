'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const neonTextVariants = cva(
  'relative transition-all duration-300',
  {
    variants: {
      font: {
        display: 'font-display',
        body: 'font-body',
        code: 'font-code',
      },
      weight: {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
        extrabold: 'font-extrabold',
      },
      color: {
        blue: [
          'text-blue-50',
          'text-shadow-neon-blue',
        ],
        violet: [
          'text-violet-50',
          'text-shadow-neon-violet',
        ],
        teal: [
          'text-green-50',
          'text-shadow-neon-terminal',
        ],
        pink: [
          'text-pink-50',
          'text-shadow-glow-pink',
        ],
        // Gradient colors
        cyberBlue: [
          'neon-gradient-blue-purple',
        ],
        cyberTeal: [
          'neon-gradient-teal-blue',
        ],
        cyberPink: [
          'neon-gradient-pink-purple',
        ],
        // Subdued neon variants
        blueSubdued: [
          'text-blue-100',
          'opacity-80',
        ],
        violetSubdued: [
          'text-violet-100',
          'opacity-80',
        ],
        tealSubdued: [
          'text-green-100',
          'opacity-80',
        ],
        pinkSubdued: [
          'text-pink-100',
          'opacity-80',
        ],
      },
      letterSpacing: {
        tight: 'letter-spacing-tight',
        normal: 'letter-spacing-normal',
        wide: 'letter-spacing-wide',
        wider: 'letter-spacing-wider',
      },
      size: {
        xs: 'text-xs md:text-sm',
        sm: 'text-sm md:text-base',
        base: 'text-base md:text-lg',
        lg: 'text-lg md:text-xl',
        xl: 'text-xl md:text-2xl',
        '2xl': 'text-2xl md:text-3xl',
        '3xl': 'text-3xl md:text-4xl',
        '4xl': 'text-4xl md:text-5xl',
        '5xl': 'text-5xl md:text-6xl',
      },
      glitch: {
        none: '',
        subtle: 'animate-text-glitch-subtle',
        medium: 'animate-text-glitch',
        strong: 'animate-text-glitch-intense',
      },
      flicker: {
        none: '',
        subtle: 'animate-neon-flicker-subtle',
        medium: 'animate-neon-flicker',
        strong: 'animate-neon-flicker-intense',
      },
      underline: {
        none: '',
        gradient: 'cyberpunk-text',
        solid: 'border-b border-current pb-1',
        dashed: 'border-b border-dashed border-current pb-1',
      },
      alignment: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      }
    },
    defaultVariants: {
      font: 'display',
      weight: 'bold',
      color: 'cyberBlue',
      size: '2xl',
      glitch: 'none',
      flicker: 'subtle',
      underline: 'none',
      letterSpacing: 'wide',
      alignment: 'left',
    },
  }
);

export interface NeonTextProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof neonTextVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  glitchText?: string;
  accessibleLabel?: string;
}

/**
 * Enhanced Neon text component with configurable typography properties and effects.
 * 
 * Features:
 * - Choose from display (Orbitron), body (Rajdhani), or code (Inter) fonts
 * - Multiple color options including gradients and subdued versions
 * - Size variations with responsive scaling
 * - Optional glitch, flicker, and underline effects
 * - Customizable letter spacing and alignment
 * - Can be rendered as different heading levels or text elements
 * - Optional ARIA label for accessibility
 * 
 * Usage:
 * ```tsx
 * <NeonText 
 *   as="h1" 
 *   color="cyberTeal" 
 *   size="4xl" 
 *   glitch="subtle"
 *   underline="gradient"
 * >
 *   WalGit Repository
 * </NeonText>
 * ```
 */
export const NeonText = React.forwardRef<HTMLHeadingElement, NeonTextProps>(
  ({ 
    className, 
    children, 
    color, 
    size, 
    font,
    weight,
    glitch, 
    glitchText, 
    flicker, 
    underline,
    letterSpacing,
    alignment,
    as = 'h2', 
    accessibleLabel,
    ...props 
  }, ref) => {
    const Component = as;
    const effectiveGlitchText = glitchText || (typeof children === 'string' ? children : undefined);
    
    return (
      <Component
        ref={ref}
        className={cn(
          neonTextVariants({ 
            color, 
            size, 
            font,
            weight,
            glitch, 
            flicker, 
            underline,
            letterSpacing,
            alignment,
          }), 
          className
        )}
        data-text={effectiveGlitchText}
        aria-label={accessibleLabel}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

NeonText.displayName = 'NeonText';

export default NeonText;