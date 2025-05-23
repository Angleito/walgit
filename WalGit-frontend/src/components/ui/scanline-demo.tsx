'use client';

import React, { useState } from 'react';
import { ScanlineOverlay } from './scanline-overlay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Switch } from './switch';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Slider } from './slider';

/**
 * Demo component showing how to use the ScanlineOverlay in different configurations.
 * This can be used on its own, or to showcase the effect to users.
 */
export function ScanlineDemo() {
  // Controls for the demo
  const [enabled, setEnabled] = useState(true);
  const [intensity, setIntensity] = useState<'subtle' | 'medium' | 'strong'>('medium');
  const [transparency, setTransparency] = useState<'low' | 'medium' | 'high'>('medium');
  const [animation, setAnimation] = useState<'none' | 'flicker' | 'pulse'>('flicker');
  const [fullScreen, setFullScreen] = useState(false);

  // Toggle between full screen and card-only overlay
  const toggleFullScreen = () => {
    setFullScreen(!fullScreen);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4">
      {/* Full screen overlay when enabled */}
      {fullScreen && (
        <ScanlineOverlay
          fullScreen
          enabled={enabled}
          intensity={intensity}
          transparency={transparency}
          animation={animation}
        />
      )}

      {/* Controls Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Scanline Overlay Controls</CardTitle>
          <CardDescription>
            Adjust settings to customize the cyberpunk CRT scanline effect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-scanlines">Enable Scanlines</Label>
            <Switch 
              id="enable-scanlines" 
              checked={enabled} 
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="fullscreen-toggle">Fullscreen Mode</Label>
            <Switch 
              id="fullscreen-toggle" 
              checked={fullScreen} 
              onCheckedChange={toggleFullScreen}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intensity-select">Intensity</Label>
            <Select 
              value={intensity} 
              onValueChange={(value) => setIntensity(value as any)}
            >
              <SelectTrigger id="intensity-select">
                <SelectValue placeholder="Select intensity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="subtle">Subtle</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="strong">Strong</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transparency-select">Transparency</Label>
            <Select 
              value={transparency} 
              onValueChange={(value) => setTransparency(value as any)}
            >
              <SelectTrigger id="transparency-select">
                <SelectValue placeholder="Select transparency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (10%)</SelectItem>
                <SelectItem value="medium">Medium (20%)</SelectItem>
                <SelectItem value="high">High (30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="animation-select">Animation</Label>
            <Select 
              value={animation} 
              onValueChange={(value) => setAnimation(value as any)}
            >
              <SelectTrigger id="animation-select">
                <SelectValue placeholder="Select animation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="flicker">Flicker</SelectItem>
                <SelectItem value="pulse">Pulse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Demo Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card with scanline overlay */}
        <ScanlineOverlay
          enabled={enabled && !fullScreen}
          intensity={intensity}
          transparency={transparency}
          animation={animation}
        >
          <Card>
            <CardHeader>
              <CardTitle>Content with Scanlines</CardTitle>
              <CardDescription>
                This card has the scanline effect applied directly to it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The scanline overlay wraps this content, creating a retro CRT effect
                that enhances the cyberpunk aesthetic.
              </p>
              <Button variant="outline">Interact With Me</Button>
            </CardContent>
          </Card>
        </ScanlineOverlay>

        {/* Stand-alone scanline element */}
        <div className="relative">
          <Card>
            <CardHeader>
              <CardTitle>Standalone Comparison</CardTitle>
              <CardDescription>
                This card doesn&apos;t have the effect applied
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This content has no scanline effect applied, for comparison.
                Use the controls to adjust the effect.
              </p>
              <Button variant="outline">Regular Button</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ScanlineDemo;