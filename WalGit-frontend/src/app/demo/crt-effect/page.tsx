'use client';

import { ScanlineDemo } from '@/components/ui/scanline';
import { Button } from '@/components/ui/button';
import { ScanlineOverlay } from '@/components/ui/scanline-overlay';
import Link from 'next/link';

export default function CRTEffectDemoPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cyberpunk CRT Effect</h1>
          <p className="text-muted-foreground">
            A customizable retro scanline overlay for enhancing the cyberpunk aesthetic
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>

      {/* Component Demo */}
      <ScanlineDemo />

      {/* Documentation Section */}
      <div className="mt-12 mb-6">
        <h2 className="text-2xl font-bold mb-4">Implementation Guide</h2>
        
        <div className="space-y-6">
          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Basic Usage</h3>
            <p className="mb-4">Wrap any content with the ScanlineOverlay component:</p>
            <ScanlineOverlay className="h-32 w-full bg-card flex items-center justify-center">
              <code className="bg-secondary p-4 rounded">
                {`<ScanlineOverlay>\n  <YourComponent />\n</ScanlineOverlay>`}
              </code>
            </ScanlineOverlay>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Customization Options</h3>
            <p className="mb-4">The ScanlineOverlay component accepts these props:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><code className="text-primary">enabled</code>: Boolean to toggle the effect on/off</li>
              <li><code className="text-primary">intensity</code>: &apos;subtle&apos;, &apos;medium&apos;, or &apos;strong&apos;</li>
              <li><code className="text-primary">transparency</code>: &apos;low&apos;, &apos;medium&apos;, or &apos;high&apos;</li>
              <li><code className="text-primary">animation</code>: &apos;none&apos;, &apos;flicker&apos;, or &apos;pulse&apos;</li>
              <li><code className="text-primary">fullScreen</code>: Boolean to apply effect to entire viewport</li>
            </ul>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Fullscreen Mode</h3>
            <p className="mb-4">
              Use fullScreen mode to apply the effect to the entire viewport:
            </p>
            <code className="block bg-secondary p-4 rounded">
              {`<ScanlineOverlay\n  fullScreen\n  intensity="medium"\n  transparency="low"\n  animation="flicker"\n/>`}
            </code>
          </div>

          <div className="p-6 border border-border rounded-lg">
            <h3 className="text-xl font-medium mb-2">Accessibility Considerations</h3>
            <p>
              The ScanlineOverlay component automatically disables animations for users with reduced motion 
              preferences. The overlay is also marked with <code>aria-hidden=&quot;true&quot;</code> to prevent 
              screen readers from announcing it. The intensity and transparency options help ensure 
              that content remains readable despite the effect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}