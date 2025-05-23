"use client";

import React, { useState } from 'react';
import { EnhancedCyberpunkCard } from './enhanced-cyberpunk-card';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface AnimationOption {
  id: string;
  name: string;
  description: string;
  value: 'glitch' | 'pulse' | 'shimmer' | 'wipe' | 'dataFlow' | 'bounce' | 'block' | 'none';
}

const animationOptions: AnimationOption[] = [
  { 
    id: 'glitch', 
    name: 'Glitch Effect', 
    description: 'Subtle digital distortion that creates a tech malfunction aesthetic',
    value: 'glitch'
  },
  { 
    id: 'pulse', 
    name: 'Energy Pulse', 
    description: 'Radiating energy waves that emanate from the center',
    value: 'pulse'
  },
  { 
    id: 'shimmer', 
    name: 'Holographic Shimmer', 
    description: 'Light refraction effect that mimics holographic materials',
    value: 'shimmer'
  },
  { 
    id: 'wipe', 
    name: 'Angular Wipe', 
    description: 'Sharp, angular transition that reveals content with a cyberpunk aesthetic',
    value: 'wipe'
  },
  { 
    id: 'dataFlow', 
    name: 'Data Flow', 
    description: 'Subtle pattern movement that suggests data transfer',
    value: 'dataFlow'
  },
  { 
    id: 'bounce', 
    name: 'Physics Bounce', 
    description: 'Spring-based motion that adds physical presence to digital elements',
    value: 'bounce'
  },
  { 
    id: 'block', 
    name: 'Glitch Blocks', 
    description: 'Digital artifacts that appear randomly like data corruption',
    value: 'block'
  },
];

const colorOptions = [
  { id: 'blue', name: 'Neon Blue' },
  { id: 'violet', name: 'Electric Purple' },
  { id: 'emerald', name: 'Digital Green' },
  { id: 'red', name: 'Cyber Red' },
  { id: 'amber', name: 'Tech Amber' },
  { id: 'mixed', name: 'Mixed Spectrum' },
];

export interface CyberpunkAnimationShowcaseProps {
  className?: string;
}

export const CyberpunkAnimationShowcase: React.FC<CyberpunkAnimationShowcaseProps> = ({ 
  className 
}) => {
  const [selectedAnimation, setSelectedAnimation] = useState<AnimationOption>(animationOptions[0]);
  const [selectedColor, setSelectedColor] = useState<string>('blue');
  const [glitchIntensity, setGlitchIntensity] = useState<number>(5);
  const [clipAngular, setClipAngular] = useState<boolean>(true);
  const [autoAnimate, setAutoAnimate] = useState<boolean>(true);
  
  // Trigger an energy pulse for the selected card
  const [pulseTriggered, setPulseTriggered] = useState(false);
  
  const triggerPulse = () => {
    setPulseTriggered(true);
    setTimeout(() => setPulseTriggered(false), 100);
  };
  
  return (
    <div className={cn("w-full grid grid-cols-1 md:grid-cols-12 gap-6", className)}>
      {/* Control Panel */}
      <div className="md:col-span-4 p-6 bg-black/40 border border-cyan-900/50 rounded-xl cyber-clip">
        <h2 className="text-xl font-bold mb-4 text-cyan-400 text-shadow-glow">Animation Controls</h2>
        
        <div className="space-y-6">
          {/* Animation Type */}
          <div className="space-y-2">
            <label className="text-sm text-cyan-300 block">Animation Style</label>
            <div className="grid grid-cols-2 gap-2">
              {animationOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={selectedAnimation.id === option.id ? "cyber" : "cyberFlat"}
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => setSelectedAnimation(option)}
                >
                  {option.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Color Theme */}
          <div className="space-y-2">
            <label className="text-sm text-cyan-300 block">Color Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {colorOptions.map((color) => (
                <Button
                  key={color.id}
                  variant={selectedColor === color.id 
                    ? color.id === 'blue' ? 'cyber' 
                    : color.id === 'violet' ? 'cyberPurple'
                    : color.id === 'emerald' ? 'cyberGreen'
                    : color.id === 'red' ? 'cyberRed'
                    : color.id === 'amber' ? 'cyberYellow'
                    : 'cyber'
                    : 'cyberFlat'
                  }
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedColor(color.id)}
                >
                  {color.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Glitch Intensity */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-cyan-300">Glitch Intensity</label>
              <span className="text-sm text-cyan-100">{glitchIntensity}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={glitchIntensity}
              onChange={(e) => setGlitchIntensity(parseInt(e.target.value))}
              className="w-full accent-cyan-500 bg-black/50 h-2 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          
          {/* Toggle Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-cyan-300">Angular Corners</label>
              <button
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors", 
                  clipAngular ? "bg-cyan-500" : "bg-gray-700"
                )}
                onClick={() => setClipAngular(!clipAngular)}
              >
                <span className={cn(
                  "block w-4 h-4 rounded-full bg-white transform transition-transform", 
                  clipAngular ? "translate-x-5" : "translate-x-1"
                )}/>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm text-cyan-300">Auto Animate</label>
              <button
                className={cn(
                  "relative w-10 h-5 rounded-full transition-colors", 
                  autoAnimate ? "bg-cyan-500" : "bg-gray-700"
                )}
                onClick={() => setAutoAnimate(!autoAnimate)}
              >
                <span className={cn(
                  "block w-4 h-4 rounded-full bg-white transform transition-transform", 
                  autoAnimate ? "translate-x-5" : "translate-x-1"
                )}/>
              </button>
            </div>
          </div>
          
          {/* Trigger Actions */}
          <div>
            <Button 
              variant="cyber" 
              className="w-full" 
              onClick={triggerPulse}
            >
              Trigger Animation
            </Button>
          </div>
        </div>
      </div>
      
      {/* Animation Preview */}
      <div className="md:col-span-8 grid grid-cols-1 gap-6">
        {/* Selected Animation Description */}
        <div className="p-4 border border-cyan-900/30 rounded-lg bg-black/30">
          <h3 className="text-lg font-bold text-cyan-400">{selectedAnimation.name}</h3>
          <p className="text-gray-300 text-sm">{selectedAnimation.description}</p>
        </div>
        
        {/* Animation Demo */}
        <div className="w-full aspect-video bg-black/20 cyber-grid-detailed rounded-lg flex items-center justify-center p-6">
          <EnhancedCyberpunkCard
            key={`${selectedAnimation.id}-${selectedColor}-${clipAngular}-${autoAnimate}-${pulseTriggered}`}
            title={`${selectedAnimation.name} Effect`}
            description={`This card demonstrates the ${selectedAnimation.name.toLowerCase()} animation with a ${selectedColor} color theme.`}
            glowColor={selectedColor as any}
            className="w-full max-w-md"
            animationStyle={selectedAnimation.value}
            clipAngular={clipAngular}
            autoAnimate={autoAnimate}
            glitchIntensity={glitchIntensity}
          >
            <div className="mt-4 p-3 bg-black/40 border border-cyan-900/30 rounded">
              <p className="text-xs text-cyan-300">
                Animation properties can be combined with other effects like glows, color gradients, and clip paths for
                a fully customized cyberpunk UI experience.
              </p>
            </div>
          </EnhancedCyberpunkCard>
        </div>
        
        {/* Multiple Card Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {animationOptions.slice(0, 3).map((option) => (
            <EnhancedCyberpunkCard
              key={option.id}
              title={option.name}
              description={option.description}
              glowColor={option.id === 'glitch' ? 'blue' : option.id === 'pulse' ? 'violet' : 'emerald'}
              className="h-full"
              animationStyle={option.value}
              clipAngular={clipAngular}
              autoAnimate={autoAnimate}
              glitchIntensity={glitchIntensity}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CyberpunkAnimationShowcase;