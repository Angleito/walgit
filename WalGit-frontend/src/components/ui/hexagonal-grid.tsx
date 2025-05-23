'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface HexagonalGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The color theme of the grid
   */
  color?: 'blue' | 'violet' | 'cyber' | 'terminal';
  
  /**
   * The size of hexagons in the grid
   */
  hexSize?: 'small' | 'medium' | 'large';
  
  /**
   * Whether to animate the grid
   */
  animate?: boolean;
  
  /**
   * The opacity of the grid
   */
  opacity?: 'subtle' | 'medium' | 'high';
}

const colorMap = {
  blue: {
    stroke: '#60a5fa30', // blue-400 with transparency
    highlight: '#3b82f680', // blue-500 with transparency
    glow: '0 0 8px rgba(59, 130, 246, 0.3)', // blue-500 glow
  },
  violet: {
    stroke: '#a78bfa30', // violet-400 with transparency
    highlight: '#8b5cf680', // violet-500 with transparency
    glow: '0 0 8px rgba(139, 92, 246, 0.3)', // violet-500 glow
  },
  cyber: {
    stroke: 'rgba(96, 165, 250, 0.2)', // blue-400 with transparency
    highlight: 'rgba(167, 139, 250, 0.4)', // violet-400 with transparency
    glow: '0 0 8px rgba(139, 92, 246, 0.2), 0 0 12px rgba(59, 130, 246, 0.2)', // combined glow
  },
  terminal: {
    stroke: 'rgba(16, 185, 129, 0.2)', // emerald-500 with transparency
    highlight: 'rgba(5, 150, 105, 0.4)', // emerald-600 with transparency
    glow: '0 0 8px rgba(16, 185, 129, 0.3)', // emerald-500 glow
  }
};

const sizeMap = {
  small: { size: 20, spacing: 2 },
  medium: { size: 30, spacing: 4 },
  large: { size: 40, spacing: 6 },
};

const opacityMap = {
  subtle: 'opacity-20',
  medium: 'opacity-40',
  high: 'opacity-60',
};

/**
 * A cyberpunk-themed hexagonal grid visualization.
 * Creates a canvas that draws an animated hexagonal grid pattern.
 */
export const HexagonalGrid: React.FC<HexagonalGridProps> = ({
  className,
  color = 'cyber',
  hexSize = 'medium',
  animate = true,
  opacity = 'medium',
  ...props
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Get a point on a hexagon given center coordinates, size and angle
  const getHexPoint = (centerX: number, centerY: number, size: number, angle: number) => {
    return {
      x: centerX + size * Math.cos(angle),
      y: centerY + size * Math.sin(angle),
    };
  };
  
  // Draw a single hexagon
  const drawHexagon = (
    ctx: CanvasRenderingContext2D, 
    centerX: number, 
    centerY: number, 
    size: number, 
    strokeColor: string,
    filled: boolean = false,
    fillColor: string = ''
  ) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const point = getHexPoint(centerX, centerY, size, angle);
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.closePath();
    
    if (filled) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    
    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  };
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { size: hexRadius, spacing } = sizeMap[hexSize];
    const { stroke: strokeColor, highlight: highlightColor, glow } = colorMap[color];
    
    // Set up the grid
    let hexagons: { x: number; y: number; highlight: boolean; pulse: number }[] = [];
    
    const setupGrid = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      
      hexagons = [];
      
      // Hexagon dimensions for offset grid
      const horizDistance = Math.sqrt(3) * hexRadius;
      const vertDistance = 1.5 * hexRadius;
      
      // Calculate how many hexagons can fit
      const cols = Math.ceil(width / horizDistance) + 2;
      const rows = Math.ceil(height / vertDistance) + 2;
      
      // Create the grid of hexagons
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          // Offset every other row
          const offset = row % 2 === 0 ? horizDistance / 2 : 0;
          const x = col * horizDistance + offset;
          const y = row * vertDistance;
          
          // Randomly highlight some hexagons
          const highlight = Math.random() < 0.08; // 8% chance of highlight
          const pulse = Math.random() * Math.PI * 2; // Random starting phase for pulse
          
          hexagons.push({ x, y, highlight, pulse });
        }
      }
    };
    
    const renderGrid = (time: number = 0) => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set shadow for glow effect on highlights
      ctx.shadowBlur = 5;
      ctx.shadowColor = highlightColor;
      ctx.lineWidth = spacing;
      
      for (const hex of hexagons) {
        const { x, y, highlight, pulse } = hex;
        
        if (highlight) {
          // For highlighted hexagons, use pulse animation
          const pulseSize = animate
            ? hexRadius * (1 + 0.1 * Math.sin(time / 1000 + pulse))
            : hexRadius;
          
          // Draw highlighted hexagon
          drawHexagon(ctx, x, y, pulseSize, strokeColor, true, highlightColor);
        } else {
          // Regular hexagon
          drawHexagon(ctx, x, y, hexRadius, strokeColor);
        }
      }
    };
    
    // Animation loop
    const animateLoop = (time: number) => {
      renderGrid(time);
      animationRef.current = requestAnimationFrame(animateLoop);
    };
    
    // Initialize
    setupGrid();
    
    // Handle resize
    window.addEventListener('resize', setupGrid);
    
    // Start animation or render once
    if (animate) {
      animationRef.current = requestAnimationFrame(animateLoop);
    } else {
      renderGrid();
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', setupGrid);
      cancelAnimationFrame(animationRef.current);
    };
  }, [hexSize, color, animate, drawHexagon]);
  
  return (
    <div className={cn('relative overflow-hidden', opacityMap[opacity], className)} {...props}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full" 
        aria-hidden="true"
      />
    </div>
  );
};

export default HexagonalGrid;