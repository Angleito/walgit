"use client";

import React from 'react';
import { motion } from 'framer-motion';

export interface ScanlineOverlayProps {
  children?: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
  transparency?: 'light' | 'medium' | 'strong';
  animation?: 'none' | 'scroll' | 'flicker';
  speed?: 'slow' | 'medium' | 'fast';
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({
  children,
  className = '',
  intensity = 'medium',
  transparency = 'medium',
  animation = 'scroll',
  speed = 'medium'
}) => {
  // Map intensity to CSS variables
  const intensityMap = {
    light: '8px',
    medium: '4px',
    strong: '2px'
  };

  // Map transparency to CSS variables
  const transparencyMap = {
    light: '0.05',
    medium: '0.1',
    strong: '0.15'
  };

  // Animation speed
  const speedMap = {
    slow: '8s',
    medium: '4s',
    fast: '2s'
  };

  // Create scanline effect styles
  const scanlineStyles = {
    '--scanline-gap': intensityMap[intensity],
    '--scanline-opacity': transparencyMap[transparency],
    '--animation-duration': speedMap[speed],
  } as React.CSSProperties;

  // Animation variants
  const getAnimationClass = () => {
    switch (animation) {
      case 'none':
        return '';
      case 'scroll':
        return 'animate-scanline-scroll';
      case 'flicker':
        return 'animate-scanline-flicker';
      default:
        return 'animate-scanline-scroll';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      
      {/* Scanlines overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none overflow-hidden ${getAnimationClass()}`}
        style={scanlineStyles}
      >
        <div 
          className="absolute inset-0 z-50" 
          style={{
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              transparent 0%,
              rgba(0, 0, 0, var(--scanline-opacity)) 0.5%,
              transparent 1%
            )`,
            backgroundSize: `100% var(--scanline-gap)`,
            mixBlendMode: 'overlay',
          }}
        ></div>
      </div>

      <style jsx global>{`
        @keyframes scanline-scroll {
          0% { background-position: 0 0; }
          100% { background-position: 0 100%; }
        }
        
        @keyframes scanline-flicker {
          0% { opacity: var(--scanline-opacity); }
          5% { opacity: calc(var(--scanline-opacity) * 0.8); }
          10% { opacity: var(--scanline-opacity); }
          15% { opacity: calc(var(--scanline-opacity) * 0.9); }
          20% { opacity: var(--scanline-opacity); }
          70% { opacity: var(--scanline-opacity); }
          80% { opacity: calc(var(--scanline-opacity) * 0.7); }
          85% { opacity: var(--scanline-opacity); }
          100% { opacity: var(--scanline-opacity); }
        }
        
        .animate-scanline-scroll > div {
          animation: scanline-scroll var(--animation-duration) linear infinite;
        }
        
        .animate-scanline-flicker > div {
          animation: scanline-flicker var(--animation-duration) steps(1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ScanlineOverlay;