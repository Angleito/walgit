'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  detectFeatureSupport, 
  getBrowserInfo, 
  isLowPerformanceDevice, 
  prefersReducedMotion,
  getPrefixedStyles,
  getFallbackStyles
} from './browser-compatibility';

export interface EnhancedScanlineOverlayProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  transparency?: 'light' | 'medium' | 'strong';
  animation?: 'none' | 'scroll' | 'flicker';
  speed?: 'slow' | 'medium' | 'fast';
  fullScreen?: boolean;
  enabled?: boolean;
  autoAdapt?: boolean; // Automatically adapt settings for different browsers
}

export const EnhancedScanlineOverlay: React.FC<EnhancedScanlineOverlayProps> = ({
  children,
  className = '',
  intensity = 'medium',
  transparency = 'medium',
  animation = 'scroll',
  speed = 'medium',
  fullScreen = false,
  enabled = true,
  autoAdapt = true
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
  
  const [browserInfo, setBrowserInfo] = useState({ name: '', version: '' });
  const [isLowPerfDevice, setIsLowPerfDevice] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Detect browser capabilities on component mount
  useEffect(() => {
    setFeatureSupport(detectFeatureSupport());
    setBrowserInfo(getBrowserInfo());
    setIsLowPerfDevice(isLowPerformanceDevice());
    setReducedMotion(prefersReducedMotion());
  }, []);
  
  // Intensity mapping (scanline gap - smaller = more intense)
  const intensityMap = {
    light: '8px',
    medium: '4px',
    strong: '2px'
  };
  
  // Transparency mapping (opacity values)
  const transparencyMap = {
    light: '0.05',
    medium: '0.1',
    strong: '0.15'
  };
  
  // Animation speed mapping
  const speedMap = {
    slow: '8s',
    medium: '4s',
    fast: '2s'
  };
  
  // Automatically adjust settings based on browser capabilities if autoAdapt is true
  const adaptedIntensity = autoAdapt ? 
    (isLowPerfDevice || reducedMotion ? 'light' : intensity) : 
    intensity;
    
  const adaptedAnimation = autoAdapt ? 
    (reducedMotion ? 'none' : 
     isLowPerfDevice ? (animation === 'none' ? 'none' : 'scroll') : 
     animation) : 
    animation;
  
  // Create scanline styles
  const createScanlineStyles = () => {
    // Base styles that work for all browsers
    let styles: React.CSSProperties = {
      '--scanline-gap': intensityMap[adaptedIntensity],
      '--scanline-opacity': transparencyMap[transparency],
      '--animation-duration': speedMap[speed],
    } as React.CSSProperties;
    
    if (!enabled) {
      return { display: 'none' };
    }
    
    // Browser-specific adaptations
    if (!featureSupport.mixBlendMode) {
      // Fallback for browsers without mix-blend-mode support
      // (IE, older Edge, older Safari)
      return {
        ...styles,
        backgroundImage: `repeating-linear-gradient(
          to bottom,
          transparent 0%,
          rgba(0, 0, 0, ${transparencyMap[transparency]}) 0.5%,
          transparent 1%
        )`,
        backgroundSize: `100% ${intensityMap[adaptedIntensity]}`,
        opacity: 0.7, // Slightly higher opacity to compensate for lack of blend mode
      };
    }
    
    // Standard implementation with mix-blend-mode
    return {
      ...styles,
      backgroundImage: `repeating-linear-gradient(
        to bottom,
        transparent 0%,
        rgba(0, 0, 0, var(--scanline-opacity)) 0.5%,
        transparent 1%
      )`,
      backgroundSize: `100% var(--scanline-gap)`,
      mixBlendMode: 'overlay',
    };
  };
  
  // Get animation class based on selected animation type and browser support
  const getAnimationClass = () => {
    if (adaptedAnimation === 'none' || reducedMotion) {
      return '';
    }
    
    // Some older browsers have issues with certain animations,
    // so we provide appropriate fallbacks
    
    // Safari-specific handling for older versions
    if (browserInfo.name === 'safari' && parseFloat(browserInfo.version) < 13) {
      return adaptedAnimation === 'flicker' ? 'animate-scanline-basic' : 'animate-scanline-basic';
    }
    
    // Standard animations for modern browsers
    switch (adaptedAnimation) {
      case 'scroll':
        return 'animate-scanline-scroll';
      case 'flicker':
        return 'animate-scanline-flicker';
      default:
        return 'animate-scanline-scroll';
    }
  };
  
  // Apply browser prefixes to styles if needed
  const applyPrefixedStyles = (styles: React.CSSProperties): React.CSSProperties => {
    return getPrefixedStyles(styles) as React.CSSProperties;
  };
  
  // Determine wrapper styles
  const wrapperStyles: React.CSSProperties = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 50,
    pointerEvents: 'none'
  } : {};
  
  // Don't render anything if disabled
  if (!enabled) {
    return <>{children}</>;
  }
  
  return (
    <div className={`relative ${className}`}>
      {children}
      
      {/* Scanlines overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none overflow-hidden ${getAnimationClass()}`}
        style={fullScreen ? wrapperStyles : {}}
      >
        <div 
          className="absolute inset-0 z-50" 
          style={applyPrefixedStyles(createScanlineStyles())}
        ></div>
      </div>
      
      <style jsx>{`
        /* Animation keyframes for scanline effects */
        @keyframes scanlineScroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        
        @keyframes scanlineFlicker {
          0%, 5%, 10% { opacity: 0.9; }
          2.5%, 7.5% { opacity: 0.7; }
        }
        
        @keyframes scanlineBasic {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        
        /* Animation classes */
        :global(.animate-scanline-scroll) {
          animation: scanlineScroll var(--animation-duration) linear infinite;
        }
        
        :global(.animate-scanline-flicker) {
          animation: scanlineFlicker var(--animation-duration) linear infinite;
        }
        
        :global(.animate-scanline-basic) {
          animation: scanlineBasic 4s ease-in-out infinite;
        }
        
        /* Reduce animations when prefers-reduced-motion is set */
        @media (prefers-reduced-motion: reduce) {
          :global(.animate-scanline-scroll),
          :global(.animate-scanline-flicker),
          :global(.animate-scanline-basic) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedScanlineOverlay;