'use client';

import { useState, useEffect } from 'react';
import { 
  detectFeatureSupport, 
  getBrowserInfo, 
  isLowPerformanceDevice, 
  prefersReducedMotion 
} from '@/components/ui/browser-compatibility';

/**
 * Custom hook for detecting browser compatibility with cyberpunk effects
 * and determining the appropriate fallback strategies
 */
export function useBrowserCompatibility() {
  const [compatibility, setCompatibility] = useState({
    browserName: 'unknown',
    browserVersion: 'unknown',
    isLowPerformanceDevice: false,
    prefersReducedMotion: false,
    features: {
      mixBlendMode: true,
      backdropFilter: true,
      clipPath: true,
      cssGrid: true,
      flexbox: true,
      webkitBackdropFilter: false,
      mozBackdropFilter: false,
      msBackdropFilter: false
    },
    effectLevel: 'high' as 'high' | 'medium' | 'low' | 'minimal',
    isInitialized: false
  });

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    // Detect browser information
    const browserInfo = getBrowserInfo();
    const features = detectFeatureSupport();
    const isLowPerf = isLowPerformanceDevice();
    const reducedMotion = prefersReducedMotion();
    
    // Determine appropriate effect level based on device and browser capabilities
    let effectLevel: 'high' | 'medium' | 'low' | 'minimal' = 'high';
    
    // If user prefers reduced motion, use minimal effects
    if (reducedMotion) {
      effectLevel = 'minimal';
    } 
    // If device has low performance, use low effects
    else if (isLowPerf) {
      effectLevel = 'low';
    }
    // Check for specific browser limitations
    else {
      // IE11 and older Edge get minimal effects
      if (browserInfo.name === 'ie' || browserInfo.name === 'edge-legacy') {
        effectLevel = 'minimal';
      }
      // Old Safari gets medium effects (some backdrop-filter issues)
      else if (browserInfo.name === 'safari' && parseFloat(browserInfo.version) < 14) {
        effectLevel = 'medium';
      }
      // Old Firefox had limited backdrop-filter support
      else if (browserInfo.name === 'firefox' && parseFloat(browserInfo.version) < 70) {
        effectLevel = 'medium';
      }
      // If mix-blend-mode or backdrop-filter not supported, use medium effects
      else if (!features.mixBlendMode || 
              (!features.backdropFilter && 
               !features.webkitBackdropFilter && 
               !features.mozBackdropFilter)) {
        effectLevel = 'medium';
      }
    }
    
    // Update state with all compatibility information
    setCompatibility({
      browserName: browserInfo.name,
      browserVersion: browserInfo.version,
      isLowPerformanceDevice: isLowPerf,
      prefersReducedMotion: reducedMotion,
      features,
      effectLevel,
      isInitialized: true
    });
    
    // Set CSS variables for use in stylesheets
    document.documentElement.style.setProperty('--browser-name', `'${browserInfo.name}'`);
    document.documentElement.style.setProperty('--supports-backdrop-filter', 
      features.backdropFilter || features.webkitBackdropFilter ? '1' : '0');
    document.documentElement.style.setProperty('--supports-mix-blend-mode', 
      features.mixBlendMode ? '1' : '0');
    
    // Set appropriate theme class on body based on effect level
    document.body.classList.remove(
      'cyberpunk-high-performance',
      'cyberpunk-low-motion',
      'optimize-for-low-end'
    );
    
    if (effectLevel === 'minimal') {
      document.body.classList.add('optimize-for-low-end');
    } else if (effectLevel === 'low') {
      document.body.classList.add('cyberpunk-low-motion');
    } else if (effectLevel === 'high') {
      document.body.classList.add('cyberpunk-high-performance');
    }
    
    // Listen for changes in reduced motion preference
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateMotionPreference = (e: MediaQueryListEvent) => {
      setCompatibility(prev => ({
        ...prev,
        prefersReducedMotion: e.matches,
        effectLevel: e.matches ? 'minimal' : 
          (prev.isLowPerformanceDevice ? 'low' : 
           (prev.effectLevel === 'minimal' ? 'medium' : prev.effectLevel))
      }));
      
      // Update body class
      if (e.matches) {
        document.body.classList.remove('cyberpunk-high-performance');
        document.body.classList.add('optimize-for-low-end');
      } else if (!isLowPerf) {
        document.body.classList.remove('optimize-for-low-end');
        document.body.classList.add('cyberpunk-high-performance');
      }
    };
    
    // Add event listener
    motionMediaQuery.addEventListener('change', updateMotionPreference);
    
    // Cleanup
    return () => {
      motionMediaQuery.removeEventListener('change', updateMotionPreference);
    };
  }, []);

  // Helper methods for component use
  const getComponentProps = (componentType: 'scanline' | 'card' | 'text' | 'animation') => {
    const { effectLevel, features } = compatibility;
    
    switch (componentType) {
      case 'scanline':
        return {
          intensity: effectLevel === 'high' ? 'medium' : 
                     effectLevel === 'medium' ? 'light' : 
                     'light',
          transparency: effectLevel === 'high' ? 'medium' : 'light',
          animation: effectLevel === 'minimal' ? 'none' : 
                     effectLevel === 'low' ? 'none' : 
                     'scroll',
          disableBlendMode: !features.mixBlendMode
        };
        
      case 'card':
        return {
          disableAnimation: effectLevel === 'minimal',
          disableGlow: effectLevel === 'minimal',
          disableBlur: !features.backdropFilter && 
                       !features.webkitBackdropFilter
        };
        
      case 'text':
        return {
          disableGradient: effectLevel === 'minimal' || !features.clipPath,
          disableFlicker: effectLevel === 'minimal' || effectLevel === 'low',
          reducedShadow: effectLevel !== 'high'
        };
        
      case 'animation':
        return {
          disabled: effectLevel === 'minimal',
          reduced: effectLevel === 'low',
          duration: effectLevel === 'high' ? 1 : 
                    effectLevel === 'medium' ? 1.5 : 
                    2 // Slower animations for lower effect levels
        };
        
      default:
        return {};
    }
  };

  return {
    ...compatibility,
    getComponentProps
  };
}

export default useBrowserCompatibility;