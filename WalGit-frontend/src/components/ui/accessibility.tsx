'use client';

import React from 'react';
import {
  Keys,
  useId,
  useFocusTrap,
  useKeyboardNavigation,
  announce,
  useAnnouncer,
  useKeyboardShortcuts,
  SkipLink,
  ariaAttributes,
  useHighContrastMode,
  useReducedMotion
} from '@/lib/accessibility';

/**
 * LiveRegion component for dynamic announcements to screen readers
 */
export function LiveRegion({ 
  children, 
  politeness = 'polite', 
  'aria-atomic': atomic = true,
  className 
}: { 
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={className || 'sr-only'}
    >
      {children}
    </div>
  );
}

/**
 * VisuallyHidden component that hides content visually but keeps it accessible to screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * A component for providing screen reader only instructions
 */
export function ScreenReaderInstructions({ 
  instructions, 
  id 
}: { 
  instructions: string | React.ReactNode; 
  id?: string; 
}) {
  const generatedId = useId('sr-instructions');
  const elementId = id || generatedId;
  
  return (
    <div id={elementId} className="sr-only">
      {instructions}
    </div>
  );
}

/**
 * FocusRing component that adds a visible focus indicator to any element
 */
export function FocusRing({ 
  children, 
  className,
  disabled = false,
  asChild = false,
}: { 
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  asChild?: boolean;
}) {
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      className: cn(
        (children as React.ReactElement).props.className,
        !disabled && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      ),
    });
  }
  
  return (
    <div className={cn(
      !disabled && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}>
      {children}
    </div>
  );
}

/**
 * Helper to conditionally join class names
 */
function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

// Export all accessibility utilities and components
export {
  // Hooks and utilities from accessibility.ts
  Keys,
  useId,
  useFocusTrap,
  useKeyboardNavigation,
  announce,
  useAnnouncer,
  useKeyboardShortcuts,
  SkipLink,
  ariaAttributes,
  useHighContrastMode,
  useReducedMotion,
};