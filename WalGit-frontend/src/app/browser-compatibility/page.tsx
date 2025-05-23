'use client';

import React, { useState, useEffect } from 'react';
import { ScanlineOverlay } from '@/components/ui/scanline-overlay';
import { ScanlineDemo } from '@/components/ui/scanline-demo';
import { CyberpunkTerminal } from '@/components/ui/cyberpunk-terminal';
import { Button } from '@/components/ui/button';

export default function BrowserCompatibilityTestPage() {
  const [browserInfo, setBrowserInfo] = useState<string>('Detecting browser...');
  const [hasBlendModeSupport, setHasBlendModeSupport] = useState<boolean>(true);
  const [hasBackdropFilterSupport, setHasBackdropFilterSupport] = useState<boolean>(true);
  const [hasClipPathSupport, setHasClipPathSupport] = useState<boolean>(true);
  const [hasGradientSupport, setHasGradientSupport] = useState<boolean>(true);
  const [hasGridSupport, setHasGridSupport] = useState<boolean>(true);
  const [hasFlexboxSupport, setHasFlexboxSupport] = useState<boolean>(true);
  const [hasWebkitBackdropFilter, setHasWebkitBackdropFilter] = useState<boolean>(false);
  const [hasMsBackdropFilter, setHasMsBackdropFilter] = useState<boolean>(false);
  const [performanceProfile, setPerformanceProfile] = useState<'high' | 'medium' | 'low' | 'unknown'>('unknown');

  useEffect(() => {
    // Detect browser
    const ua = navigator.userAgent;
    let browserName;
    let browserVersion;

    if (ua.indexOf("Firefox") > -1) {
      browserName = "Firefox";
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("SamsungBrowser") > -1) {
      browserName = "Samsung Browser";
      browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
      browserName = "Opera";
      browserVersion = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
      browserVersion = ua.match(/rv:([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Edge") > -1) {
      browserName = "Edge (Legacy)";
      browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Edg") > -1) {
      browserName = "Edge (Chromium)";
      browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Chrome") > -1) {
      browserName = "Chrome";
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "Unknown";
    } else if (ua.indexOf("Safari") > -1) {
      browserName = "Safari";
      browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "Unknown";
    } else {
      browserName = "Unknown";
      browserVersion = "Unknown";
    }

    setBrowserInfo(`${browserName} ${browserVersion} on ${navigator.platform}`);

    // Detect feature support
    const testEl = document.createElement('div');
    
    // Test mix-blend-mode
    setHasBlendModeSupport('mixBlendMode' in testEl.style);
    
    // Test backdrop-filter
    setHasBackdropFilterSupport(
      'backdropFilter' in testEl.style || 
      'webkitBackdropFilter' in testEl.style || 
      'mozBackdropFilter' in testEl.style || 
      'msBackdropFilter' in testEl.style
    );
    
    // Test webkit specific backdrop filter
    setHasWebkitBackdropFilter('webkitBackdropFilter' in testEl.style);
    
    // Test ms specific backdrop filter
    setHasMsBackdropFilter('msBackdropFilter' in testEl.style);
    
    // Test clip-path
    setHasClipPathSupport('clipPath' in testEl.style);
    
    // Test gradient
    testEl.style.backgroundImage = 'linear-gradient(to right, red, blue)';
    setHasGradientSupport(testEl.style.backgroundImage.includes('gradient'));
    
    // Test grid
    setHasGridSupport('grid' in testEl.style);
    
    // Test flexbox
    setHasFlexboxSupport('flexBasis' in testEl.style);

    // Performance test
    const startTime = performance.now();
    let counter = 0;
    
    // Simple performance test - how many iterations in 100ms
    while (performance.now() - startTime < 100) {
      counter++;
    }
    
    if (counter > 1000000) {
      setPerformanceProfile('high');
    } else if (counter > 500000) {
      setPerformanceProfile('medium');
    } else {
      setPerformanceProfile('low');
    }
  }, []);

  // Example code for the terminal component
  const sampleCode = `// Cyberpunk Theme Effects
import { ScanlineOverlay } from './components/ui/scanline-overlay';

function CyberpunkComponent() {
  return (
    <ScanlineOverlay 
      intensity="medium"
      transparency="medium"
      animation="scroll"
    >
      <div className="neon-border">
        <h2 className="cyberpunk-text flicker-text">Walgit</h2>
        <p>Decentralized version control with style</p>
      </div>
    </ScanlineOverlay>
  );
}`;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Cyberpunk Theme Cross-Browser Compatibility Test</h1>
      
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Browser Detection</h2>
        <p className="mb-1"><strong>Current Browser:</strong> {browserInfo}</p>
        <p className="mb-1"><strong>Performance Profile:</strong> {performanceProfile}</p>
      </div>
      
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <h2 className="text-xl font-semibold mb-2">CSS Feature Support</h2>
        <ul className="space-y-1">
          <li className={hasBlendModeSupport ? "text-green-600" : "text-red-600"}>
            mix-blend-mode: {hasBlendModeSupport ? "✓ Supported" : "✗ Not Supported"}
          </li>
          <li className={hasBackdropFilterSupport ? "text-green-600" : "text-red-600"}>
            backdrop-filter: {hasBackdropFilterSupport ? "✓ Supported" : "✗ Not Supported"}
            {hasWebkitBackdropFilter && " (webkit prefix)"}
            {hasMsBackdropFilter && " (ms prefix)"}
          </li>
          <li className={hasClipPathSupport ? "text-green-600" : "text-red-600"}>
            clip-path: {hasClipPathSupport ? "✓ Supported" : "✗ Not Supported"}
          </li>
          <li className={hasGradientSupport ? "text-green-600" : "text-red-600"}>
            linear-gradient: {hasGradientSupport ? "✓ Supported" : "✗ Not Supported"}
          </li>
          <li className={hasGridSupport ? "text-green-600" : "text-red-600"}>
            grid: {hasGridSupport ? "✓ Supported" : "✗ Not Supported"}
          </li>
          <li className={hasFlexboxSupport ? "text-green-600" : "text-red-600"}>
            flexbox: {hasFlexboxSupport ? "✓ Supported" : "✗ Not Supported"}
          </li>
        </ul>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h2 className="text-xl font-semibold mb-4">Scanline Effect Test</h2>
          
          {/* Regular scanline overlay */}
          <ScanlineOverlay 
            intensity="medium"
            transparency="medium"
            animation="scroll"
            className="p-4 mb-4 bg-gray-900 text-cyan-400 rounded"
          >
            <h3 className="text-lg font-bold mb-2">Default Scanline Effect</h3>
            <p>This tests the standard scanline overlay implementation.</p>
            <Button className="mt-2">Interactive Button</Button>
          </ScanlineOverlay>
          
          {/* Fallback implementation for browsers without mix-blend-mode */}
          <div className="relative p-4 bg-gray-900 text-cyan-400 rounded overflow-hidden">
            <h3 className="text-lg font-bold mb-2">Fallback Implementation</h3>
            <p>This uses opacity-only implementation for older browsers.</p>
            <Button className="mt-2">Interactive Button</Button>
            
            {/* Simple scanline without blend mode */}
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0, 0, 0, 0.1) 4px, rgba(0, 0, 0, 0.1) 8px)',
                opacity: 0.3
              }}
            ></div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h2 className="text-xl font-semibold mb-4">Text Effect Tests</h2>
          
          {/* Cyberpunk text styles */}
          <div className="space-y-4 p-4 bg-gray-900 rounded">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Text Effects</h3>
            
            {/* Standard cyberpunk text */}
            <p className="text-cyan-400 font-semibold" 
               style={{ textShadow: '0 0 5px rgba(5, 217, 232, 0.7)' }}>
              Standard neon text with shadow
            </p>
            
            {/* Flickering text */}
            <p className="text-pink-500 font-semibold"
               style={{ 
                 textShadow: '0 0 5px rgba(255, 42, 109, 0.7)',
                 animation: 'textFlicker 4s infinite alternate' 
               }}>
              Flickering neon text effect
            </p>
            
            {/* Fallback for browsers without animation support */}
            <p className="text-green-400 font-semibold" 
               style={{ textShadow: '0 0 5px rgba(0, 255, 159, 0.7)' }}>
              Non-animated fallback text
            </p>
            
            {/* Add keyframe animation for flickering */}
            <style jsx>{`
              @keyframes textFlicker {
                0%, 19.999%, 22%, 62.999%, 64%, 97.999%, 99.999%, 100% {
                  opacity: 0.99;
                  text-shadow: 0 0 4px rgba(255, 42, 109, 0.7);
                }
                20%, 21.999%, 63%, 63.999%, 98%, 99.998% {
                  opacity: 0.4;
                  text-shadow: none;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
      
      {/* Terminal component with code example */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Terminal Component Test</h2>
        <CyberpunkTerminal 
          code={sampleCode} 
          language="jsx"
          title="compatibility-test.tsx"
        />
      </div>
      
      {/* Interactive scanline demo with controls */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Interactive Scanline Demo</h2>
        <ScanlineDemo />
      </div>
      
      {/* Device detection */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Device Information</h2>
        <p className="mb-1"><strong>Screen Resolution:</strong> <span id="resolution">Loading...</span></p>
        <p className="mb-1"><strong>Device Pixel Ratio:</strong> <span id="pixelRatio">Loading...</span></p>
        <p className="mb-1"><strong>Reduced Motion:</strong> <span id="reducedMotion">Loading...</span></p>
        <p className="mb-1"><strong>Color Scheme:</strong> <span id="colorScheme">Loading...</span></p>
        
        {/* Script to update device information */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.getElementById('resolution').textContent = window.innerWidth + 'x' + window.innerHeight;
              document.getElementById('pixelRatio').textContent = window.devicePixelRatio;
              document.getElementById('reducedMotion').textContent = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Enabled' : 'Disabled';
              document.getElementById('colorScheme').textContent = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
            `
          }}
        />
      </div>
    </div>
  );
}