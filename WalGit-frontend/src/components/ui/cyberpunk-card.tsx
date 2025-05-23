'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface CyberpunkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'blue' | 'red' | 'green' | 'purple' | 'yellow';
  glowIntensity?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  hoverAnimation?: boolean;
  pulseEffect?: boolean;
  cornerAccent?: boolean;
  cornerStyle?: 'default' | 'sharp' | 'rounded' | 'diagonal' | 'jagged' | 'asymmetric';
  scanlineEffect?: boolean;
  motionEffect?: boolean;
  lightStrips?: boolean;
  energyFlow?: boolean;
  glassMorphism?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export function CyberpunkCard({
  children,
  className,
  variant = 'blue',
  glowIntensity = 'md',
  interactive = true,
  hoverAnimation = true,
  pulseEffect = false,
  cornerAccent = true,
  cornerStyle = 'default',
  scanlineEffect = false,
  motionEffect = true,
  lightStrips = false,
  energyFlow = false,
  glassMorphism = false,
  onClick,
  ...props
}: CyberpunkCardProps) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Enhanced color mapping with deeper brand colors
  const colorMap = {
    blue: {
      border: 'border-[#05d9e8]',
      glow: 'glow-blue-500',
      bgGlow: 'from-blue-900/20 to-blue-500/10',
      accent: 'bg-[#05d9e8]',
      text: 'text-[#05d9e8]',
      rgb: '5, 217, 232',
      stripGradient: 'from-[#032e4a] via-[#05d9e8] to-[#032e4a]',
      energyColor: 'rgba(5, 217, 232, 0.8)'
    },
    red: {
      border: 'border-[#ff2a6d]',
      glow: 'glow-red-500',
      bgGlow: 'from-red-900/20 to-red-500/10',
      accent: 'bg-[#ff2a6d]',
      text: 'text-[#ff2a6d]',
      rgb: '255, 42, 109',
      stripGradient: 'from-[#4a0315] via-[#ff2a6d] to-[#4a0315]',
      energyColor: 'rgba(255, 42, 109, 0.8)'
    },
    green: {
      border: 'border-[#00ff9f]',
      glow: 'glow-green-500',
      bgGlow: 'from-green-900/20 to-green-500/10',
      accent: 'bg-[#00ff9f]',
      text: 'text-[#00ff9f]',
      rgb: '0, 255, 159',
      stripGradient: 'from-[#004a2e] via-[#00ff9f] to-[#004a2e]',
      energyColor: 'rgba(0, 255, 159, 0.8)'
    },
    purple: {
      border: 'border-[#bf5af2]',
      glow: 'glow-purple-500',
      bgGlow: 'from-purple-900/20 to-purple-500/10',
      accent: 'bg-[#bf5af2]',
      text: 'text-[#bf5af2]',
      rgb: '191, 90, 242',
      stripGradient: 'from-[#2e0047] via-[#bf5af2] to-[#2e0047]',
      energyColor: 'rgba(191, 90, 242, 0.8)'
    },
    yellow: {
      border: 'border-[#f9f871]',
      glow: 'glow-yellow-500',
      bgGlow: 'from-yellow-900/20 to-yellow-500/10',
      accent: 'bg-[#f9f871]',
      text: 'text-[#f9f871]',
      rgb: '249, 248, 113',
      stripGradient: 'from-[#4a4500] via-[#f9f871] to-[#4a4500]',
      energyColor: 'rgba(249, 248, 113, 0.8)'
    },
  };

  // Enhanced glow intensity classes
  const glowSizes = {
    sm: `shadow-[0_0_15px_0px_rgba(${colorMap[variant].rgb},0.5)]`,
    md: `shadow-[0_0_25px_2px_rgba(${colorMap[variant].rgb},0.6)]`,
    lg: `shadow-[0_0_35px_5px_rgba(${colorMap[variant].rgb},0.7)]`,
    xl: `shadow-[0_0_45px_8px_rgba(${colorMap[variant].rgb},0.8)]`
  };

  // Animation classes for hover effects
  const hoverClasses = interactive && hoverAnimation && !motionEffect
    ? 'transition-all duration-300 transform hover:translate-y-[-3px]'
    : '';

  // Pulse animation if enabled
  const pulseClasses = pulseEffect
    ? 'animate-pulse-subtle'
    : '';
    
  // Handle mouse move for light effects if card is interactive
  useEffect(() => {
    if (!interactive || !energyFlow || !cardRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const card = cardRef.current;
    card.addEventListener('mousemove', handleMouseMove);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
    };
  }, [interactive, energyFlow]);

  // Select corner styling based on the cornerStyle prop
  const getCornerClasses = () => {
    if (!cornerAccent) return '';
    
    switch(cornerStyle) {
      case 'sharp':
        return 'cyber-corners-sharp';
      case 'rounded':
        return 'cyber-corners-rounded';
      case 'diagonal':
        return 'cyber-corners-diagonal';
      case 'jagged':
        return 'cyber-corners-jagged';
      case 'asymmetric':
        return 'cyber-corners-asymmetric';
      default:
        return 'cyber-clip';
    }
  };

  const cardContent = (
    <>
      {/* Background glow effect */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-20 z-0',
        colorMap[variant].bgGlow,
        interactive && hovered ? 'opacity-50' : '',
        glassMorphism ? 'backdrop-blur-md' : ''
      )}></div>

      {/* Corner accent elements - enhanced with directional glow */}
      {cornerAccent && cornerStyle === 'default' && (
        <>
          <div className={cn(
            'absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2',
            colorMap[variant].border,
            hovered ? `shadow-[-5px_5px_10px_-1px_rgba(${colorMap[variant].rgb},0.5)]` : ''
          )}></div>
          <div className={cn(
            'absolute bottom-0 left-0 w-8 h-8 border-r-2 border-t-2',
            colorMap[variant].border,
            hovered ? `shadow-[5px_-5px_10px_-1px_rgba(${colorMap[variant].rgb},0.5)]` : ''
          )}></div>
        </>
      )}
      
      {/* Light strips for advanced aesthetic */}
      {lightStrips && (
        <>
          <div className={cn(
            'absolute top-0 left-[15%] right-[15%] h-[2px]',
            `bg-gradient-to-r ${colorMap[variant].stripGradient}`,
            hovered ? 'opacity-100' : 'opacity-50',
            'transition-opacity duration-300'
          )}></div>
          <div className={cn(
            'absolute bottom-0 left-[15%] right-[15%] h-[2px]',
            `bg-gradient-to-r ${colorMap[variant].stripGradient}`,
            hovered ? 'opacity-100' : 'opacity-50',
            'transition-opacity duration-300'
          )}></div>
          <div className={cn(
            'absolute left-0 top-[15%] bottom-[15%] w-[2px]',
            `bg-gradient-to-b ${colorMap[variant].stripGradient}`,
            hovered ? 'opacity-100' : 'opacity-50',
            'transition-opacity duration-300'
          )}></div>
          <div className={cn(
            'absolute right-0 top-[15%] bottom-[15%] w-[2px]',
            `bg-gradient-to-b ${colorMap[variant].stripGradient}`,
            hovered ? 'opacity-100' : 'opacity-50',
            'transition-opacity duration-300'
          )}></div>
        </>
      )}

      {/* Energy flow effect - follows cursor */}
      {energyFlow && interactive && (
        <div 
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
          style={{
            background: hovered ? 
              `radial-gradient(circle 80px at ${mousePosition.x}px ${mousePosition.y}px, ${colorMap[variant].energyColor} 0%, transparent 70%)` : 
              'none',
            opacity: hovered ? 0.8 : 0,
            transition: 'opacity 0.3s ease'
          }}
        ></div>
      )}

      {/* Scanline effect */}
      {scanlineEffect && (
        <div className="absolute inset-0 bg-scanline-pattern opacity-5 pointer-events-none z-10"></div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Pulsing border accents for corners */}
      {cornerAccent && cornerStyle === 'sharp' && (
        <>
          <div className={cn(
            'absolute top-0 left-0 w-[10px] h-[10px] border-t-2 border-l-2',
            colorMap[variant].border,
            pulseEffect ? 'animate-pulse-subtle' : ''
          )}></div>
          <div className={cn(
            'absolute top-0 right-0 w-[10px] h-[10px] border-t-2 border-r-2',
            colorMap[variant].border,
            pulseEffect ? 'animate-pulse-subtle animate-delay-300' : ''
          )}></div>
          <div className={cn(
            'absolute bottom-0 left-0 w-[10px] h-[10px] border-b-2 border-l-2',
            colorMap[variant].border,
            pulseEffect ? 'animate-pulse-subtle animate-delay-600' : ''
          )}></div>
          <div className={cn(
            'absolute bottom-0 right-0 w-[10px] h-[10px] border-b-2 border-r-2',
            colorMap[variant].border,
            pulseEffect ? 'animate-pulse-subtle animate-delay-900' : ''
          )}></div>
        </>
      )}
    </>
  );

  // Custom corner clipping CSS classes based on cornerStyle
  const cornerClipStyles = getCornerClasses();
  
  // Glass morphism effect classes
  const glassMorphismClasses = glassMorphism 
    ? 'backdrop-blur-sm bg-black/40 border border-white/10' 
    : 'bg-black/70 border';

  // If motion effects are enabled, use framer-motion
  if (motionEffect) {
    return (
      <motion.div
        ref={cardRef}
        className={cn(
          'relative overflow-hidden p-6',
          glassMorphismClasses,
          colorMap[variant].border,
          cornerClipStyles,
          pulseClasses,
          interactive && hovered ? glowSizes[glowIntensity] : '',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={interactive ? {
          scale: 1.03,
          transition: { 
            type: "spring", 
            stiffness: 400, 
            damping: 17 
          },
          boxShadow: `0 0 20px 5px rgba(${colorMap[variant].rgb}, 0.7)`
        } : undefined}
        onClick={onClick}
        onMouseEnter={() => interactive && setHovered(true)}
        onMouseLeave={() => interactive && setHovered(false)}
        {...props}
      >
        {cardContent}
        
        {/* Animated accents for motion-enabled cards */}
        {interactive && (
          <motion.div
            className={cn(
              'absolute w-full h-[2px] bottom-0 left-0',
              colorMap[variant].accent
            )}
            initial={{ scaleX: 0, originX: 0 }}
            animate={hovered ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </motion.div>
    );
  }

  // Without motion effects
  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden p-6',
        glassMorphismClasses,
        colorMap[variant].border,
        cornerClipStyles,
        hoverClasses,
        pulseClasses,
        interactive && hovered ? glowSizes[glowIntensity] : '',
        className
      )}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => interactive && setHovered(false)}
      onClick={onClick}
      {...props}
    >
      {cardContent}
      
      {/* Non-motion version of the animated accent */}
      {interactive && (
        <div className={cn(
          'absolute w-full h-[2px] bottom-0 left-0 scale-x-0 origin-left transition-transform duration-500',
          colorMap[variant].accent,
          hovered ? 'scale-x-100' : ''
        )} />
      )}
    </div>
  );
}

export default CyberpunkCard;