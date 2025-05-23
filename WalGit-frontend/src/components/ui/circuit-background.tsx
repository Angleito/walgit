"use client";

import React, { useEffect, useRef } from 'react';

export interface CircuitBackgroundProps {
  className?: string;
  lineColor?: string;
  nodeColor?: string;
  density?: number; // 1-10, controls how many nodes/lines are drawn
  animationSpeed?: number; // 1-10, controls animation speed
  interactive?: boolean; // Whether mouse interactions affect the circuit
}

export const CircuitBackground: React.FC<CircuitBackgroundProps> = ({
  className = '',
  lineColor = 'rgba(0, 195, 255, 0.2)',
  nodeColor = 'rgba(0, 215, 255, 0.4)',
  density = 5,
  animationSpeed = 5,
  interactive = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;
    
    // Set canvas size to match container
    const resizeCanvas = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Setup context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Circuit nodes
    const normalizedDensity = Math.max(1, Math.min(10, density)) / 10;
    const nodeCount = Math.floor(50 * normalizedDensity);
    const speedFactor = Math.max(1, Math.min(10, animationSpeed)) / 5;
    
    let mouseX = 0;
    let mouseY = 0;
    let isMouseOver = false;
    
    // Node class
    class Node {
      x: number;
      y: number;
      size: number;
      connections: Node[];
      pulseSize: number;
      pulseOpacity: number;
      speed: number;
      
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = 1.5 + Math.random() * 2;
        this.connections = [];
        this.pulseSize = 0;
        this.pulseOpacity = 0;
        this.speed = (0.2 + Math.random() * 0.8) * speedFactor;
      }
      
      draw(ctx: CanvasRenderingContext2D) {
        // Draw node
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.fill();
        
        // Draw pulse effect
        if (this.pulseOpacity > 0) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${parseInt(nodeColor.slice(5, 8))}, ${parseInt(nodeColor.slice(9, 12))}, ${parseInt(nodeColor.slice(13, 16))}, ${this.pulseOpacity})`;
          ctx.fill();
          
          this.pulseSize += this.speed;
          this.pulseOpacity -= 0.02 * speedFactor;
          
          if (this.pulseOpacity <= 0) {
            this.pulseOpacity = 0;
            this.pulseSize = 0;
          }
        }
        
        // Random chance to start a new pulse
        if (this.pulseOpacity === 0 && Math.random() < 0.002 * speedFactor) {
          this.pulseOpacity = 0.8;
          this.pulseSize = this.size;
        }
      }
      
      drawConnections(ctx: CanvasRenderingContext2D) {
        for (const node of this.connections) {
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    
    // Create nodes
    const nodes: Node[] = [];
    const { width, height } = canvas.getBoundingClientRect();
    
    for (let i = 0; i < nodeCount; i++) {
      const node = new Node(
        Math.random() * width,
        Math.random() * height
      );
      nodes.push(node);
    }
    
    // Connect nodes
    const maxDistance = Math.sqrt(width * width + height * height) * 0.15;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          nodeA.connections.push(nodeB);
          nodeB.connections.push(nodeA);
        }
      }
    }
    
    // Make a subset of nodes more active
    const activeNodes = nodes.slice(0, Math.floor(nodes.length * 0.3));
    activeNodes.forEach(node => {
      node.speed *= 1.5;
    });
    
    // Main render loop
    const render = () => {
      if (!canvas || !ctx) return;
      
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      
      // Draw connections first
      nodes.forEach(node => node.drawConnections(ctx));
      
      // Draw nodes on top
      nodes.forEach(node => node.draw(ctx));
      
      // Mouse interaction
      if (interactive && isMouseOver) {
        ctx.beginPath();
        const radius = 80;
        ctx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(
          mouseX, mouseY, 0,
          mouseX, mouseY, radius
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    
    const handleMouseEnter = () => {
      isMouseOver = true;
    };
    
    const handleMouseLeave = () => {
      isMouseOver = false;
    };
    
    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseenter', handleMouseEnter);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseenter', handleMouseEnter);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [lineColor, nodeColor, density, animationSpeed, interactive]);
  
  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full" 
      />
    </div>
  );
};

export default CircuitBackground;