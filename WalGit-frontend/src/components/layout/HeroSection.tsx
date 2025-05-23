"use client";

import React from "react";
import { CircuitBackground } from "@/components/ui/circuit-background";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  circuitOptions?: {
    lineColor?: string;
    nodeColor?: string;
    density?: number;
    animationSpeed?: number;
  };
}

export function HeroSection({
  title,
  subtitle,
  children,
  className,
  circuitOptions,
}: HeroSectionProps) {
  return (
    <section 
      className={cn(
        "relative overflow-hidden py-20 md:py-32 px-4",
        "bg-gradient-to-br from-background to-background/80",
        className
      )}
    >
      <CircuitBackground
        lineColor={circuitOptions?.lineColor}
        nodeColor={circuitOptions?.nodeColor}
        density={circuitOptions?.density}
        animationSpeed={circuitOptions?.animationSpeed}
      />
      
      <div className="container relative z-10 mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
        
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}