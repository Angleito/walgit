'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { useTheme } from 'next-themes';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type PathPoint = {
  x: number;
  y: number;
};

type DataFlowAnimationProps = {
  fromSection: string;
  toSection: string;
  color?: 'blue' | 'purple' | 'teal' | 'pink' | 'mixed' | 'random';
  density?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
  pathType?: 'cubic' | 'linear' | 'angular';
  particleCount?: number;
  particleSize?: number;
  particleSpeed?: number;
  opacity?: number;
  className?: string;
  reducedMotion?: boolean;
};

const getColorFromPreference = (
  color: DataFlowAnimationProps['color'],
  theme: string | undefined
): string => {
  const cyberpunkColors = {
    blue: '#00eeff',
    purple: '#d900ff',
    teal: '#00ffb3',
    pink: '#ff2cdf',
    random: ['#00eeff', '#d900ff', '#00ffb3', '#ff2cdf'],
    mixed: ['#00eeff', '#d900ff', '#00ffb3', '#ff2cdf'],
  };

  if (color === 'random') {
    const randomIndex = Math.floor(Math.random() * cyberpunkColors.random.length);
    return cyberpunkColors.random[randomIndex];
  }

  if (color === 'mixed') {
    return 'url(#dataFlowGradient)';
  }

  return cyberpunkColors[color || 'blue'];
};

export const DataFlowAnimation = ({
  fromSection,
  toSection,
  color = 'blue',
  density = 'medium',
  width = 100,
  height = 300,
  pathType = 'cubic',
  particleCount,
  particleSize = 3,
  particleSpeed = 2,
  opacity = 0.8,
  className = '',
  reducedMotion,
}: DataFlowAnimationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [startPoint, setStartPoint] = useState<PathPoint | null>(null);
  const [endPoint, setEndPoint] = useState<PathPoint | null>(null);
  const [path, setPath] = useState<string>('');
  const [particles, setParticles] = useState<{ id: number; position: number; speed: number; size: number }[]>([]);
  const animationRef = useRef<number>();
  const { theme } = useTheme();
  
  // Determine particle count based on density
  const getParticleCount = useCallback(() => {
    if (particleCount !== undefined) return particleCount;
    
    switch (density) {
      case 'low': return 3;
      case 'high': return 12;
      case 'medium':
      default: return 6;
    }
  }, [particleCount, density]);

  // Observer for source and target elements
  const { ref: fromRef, inView: fromInView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const { ref: toRef, inView: toInView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Attach refs to elements
  useEffect(() => {
    const fromElement = document.querySelector(fromSection);
    const toElement = document.querySelector(toSection);

    if (fromElement) {
      fromRef(fromElement);
    }
    
    if (toElement) {
      toRef(toElement);
    }
  }, [fromSection, toSection, fromRef, toRef]);

  // Calculate positions of elements
  useEffect(() => {
    const calculatePositions = () => {
      const fromElement = document.querySelector(fromSection);
      const toElement = document.querySelector(toSection);
      
      if (!fromElement || !toElement || !svgRef.current) return;
      
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();
      
      // Get coordinates relative to the SVG
      const start = {
        x: fromRect.left + fromRect.width / 2 - svgRect.left,
        y: fromRect.bottom - svgRect.top,
      };
      
      const end = {
        x: toRect.left + toRect.width / 2 - svgRect.left,
        y: toRect.top - svgRect.top,
      };
      
      setStartPoint(start);
      setEndPoint(end);
    };

    calculatePositions();
    window.addEventListener('resize', calculatePositions);
    
    return () => {
      window.removeEventListener('resize', calculatePositions);
    };
  }, [fromSection, toSection, fromInView, toInView]);

  // Generate path
  useEffect(() => {
    if (!startPoint || !endPoint) return;
    
    let pathData = '';
    const distance = endPoint.y - startPoint.y;
    
    switch (pathType) {
      case 'linear':
        pathData = `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
        break;
      case 'angular':
        pathData = `M${startPoint.x},${startPoint.y} L${startPoint.x},${startPoint.y + distance/2} L${endPoint.x},${startPoint.y + distance/2} L${endPoint.x},${endPoint.y}`;
        break;
      case 'cubic':
      default:
        const controlPoint1 = {
          x: startPoint.x,
          y: startPoint.y + distance * 0.3,
        };
        const controlPoint2 = {
          x: endPoint.x,
          y: endPoint.y - distance * 0.3,
        };
        pathData = `M${startPoint.x},${startPoint.y} C${controlPoint1.x},${controlPoint1.y} ${controlPoint2.x},${controlPoint2.y} ${endPoint.x},${endPoint.y}`;
    }
    
    setPath(pathData);
  }, [startPoint, endPoint, pathType]);

  // Initialize particles
  useEffect(() => {
    if (!path) return;
    
    const count = getParticleCount();
    const initialParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      position: Math.random(), // Position along the path (0 to 1)
      speed: (0.8 + Math.random() * 0.4) * particleSpeed * 0.001, // Random speed
      size: particleSize * (0.7 + Math.random() * 0.6),
    }));
    
    setParticles(initialParticles);
  }, [path, particleSize, particleSpeed, getParticleCount]);

  // Animate particles
  useEffect(() => {
    // Skip animation if reducedMotion is requested or both elements are not in view
    if (reducedMotion || (!fromInView && !toInView) || !path || particles.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          position: (particle.position + particle.speed) % 1,
        }))
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, path, fromInView, toInView, reducedMotion]);

  // Check media query for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setParticles(prev => prev.map(p => ({ ...p, speed: mediaQuery.matches ? 0 : p.speed })));
    
    const handleChange = () => {
      setParticles(prev => prev.map(p => ({ ...p, speed: mediaQuery.matches ? 0 : p.speed })));
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Don't render if no path
  if (!path) return null;
  
  // Only render when either source or target is in view
  if (!fromInView && !toInView) return null;

  return (
    <svg 
      ref={svgRef}
      className={`absolute pointer-events-none z-0 ${className}`}
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        overflow: 'visible',
        opacity: opacity,
      }}
    >
      <defs>
        <linearGradient id="dataFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--neon-blue)" />
          <stop offset="33%" stopColor="var(--neon-purple)" />
          <stop offset="66%" stopColor="var(--neon-teal)" />
          <stop offset="100%" stopColor="var(--neon-pink)" />
        </linearGradient>
      </defs>
      
      {/* Base path (visible but less opaque) */}
      <path
        d={path}
        fill="none"
        stroke={getColorFromPreference(color, theme)}
        strokeWidth="1"
        strokeOpacity="0.2"
        strokeDasharray="4 6"
      />
      
      {/* Particles */}
      {particles.map(particle => {
        // We need a way to position the particle along the path
        return (
          <circle
            key={particle.id}
            r={particle.size}
            fill={getColorFromPreference(color === 'mixed' ? 'random' : color, theme)}
          >
            <animateMotion
              dur={`${6 / (particle.speed * 1000)}s`}
              repeatCount="indefinite"
              path={path}
              rotate="auto"
              // Offset each particle
              keyPoints={`${particle.position};${particle.position + 0.99}`}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        );
      })}
      
      {/* Glow effect */}
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </svg>
  );
};

// Wrap component to provide feedback to screen readers
export const DataFlowConnector = (props: DataFlowAnimationProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <>
      <div aria-hidden="true">
        <DataFlowAnimation {...props} reducedMotion={props.reducedMotion || prefersReducedMotion} />
      </div>
      <div className="sr-only">
        Animated data flow connection between sections
      </div>
    </>
  );
};

export default DataFlowConnector;