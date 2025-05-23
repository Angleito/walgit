/**
 * Utility functions for browser compatibility detection and fallbacks
 * for cyberpunk theme effects
 */

/**
 * Detects support for various CSS features needed for cyberpunk effects
 */
export const detectFeatureSupport = () => {
  // Only run in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      mixBlendMode: true,
      backdropFilter: true,
      clipPath: true,
      cssGrid: true,
      flexbox: true,
      webkitBackdropFilter: false,
      mozBackdropFilter: false,
      msBackdropFilter: false
    };
  }

  const testEl = document.createElement('div');
  
  // Check for mix-blend-mode support
  const mixBlendMode = 'mixBlendMode' in testEl.style;
  
  // Check for backdrop-filter support (and vendor prefixes)
  const backdropFilter = 'backdropFilter' in testEl.style;
  const webkitBackdropFilter = 'webkitBackdropFilter' in testEl.style;
  const mozBackdropFilter = 'mozBackdropFilter' in testEl.style;
  const msBackdropFilter = 'msBackdropFilter' in testEl.style;
  
  // Check for clip-path support
  const clipPath = 'clipPath' in testEl.style;
  
  // Check for CSS Grid support
  const cssGrid = 'grid' in testEl.style;
  
  // Check for Flexbox support
  const flexbox = 'flexBasis' in testEl.style;
  
  return {
    mixBlendMode,
    backdropFilter,
    clipPath,
    cssGrid,
    flexbox,
    webkitBackdropFilter,
    mozBackdropFilter,
    msBackdropFilter
  };
};

/**
 * Determines whether the current browser is a mobile device
 */
export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detects browser type
 */
export const getBrowserInfo = () => {
  if (typeof navigator === 'undefined') return { name: 'unknown', version: 'unknown' };
  
  const ua = navigator.userAgent;
  let browserName = 'unknown';
  let browserVersion = 'unknown';

  if (ua.indexOf("Firefox") > -1) {
    browserName = "firefox";
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || "unknown";
  } else if (ua.indexOf("SamsungBrowser") > -1) {
    browserName = "samsung";
    browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/)?.[1] || "unknown";
  } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
    browserName = "opera";
    browserVersion = ua.match(/(?:Opera|OPR)\/([0-9.]+)/)?.[1] || "unknown";
  } else if (ua.indexOf("Trident") > -1) {
    browserName = "ie";
    browserVersion = ua.match(/rv:([0-9.]+)/)?.[1] || "unknown";
  } else if (ua.indexOf("Edge") > -1) {
    browserName = "edge-legacy";
    browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || "unknown";
  } else if (ua.indexOf("Edg") > -1) {
    browserName = "edge";
    browserVersion = ua.match(/Edg\/([0-9.]+)/)?.[1] || "unknown";
  } else if (ua.indexOf("Chrome") > -1) {
    browserName = "chrome";
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || "unknown";
  } else if (ua.indexOf("Safari") > -1) {
    browserName = "safari";
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || "unknown";
  }

  return {
    name: browserName,
    version: browserVersion
  };
};

/**
 * Determines if reduced motion is preferred
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Determines if the device has low hardware capabilities
 * (where we might want to disable some effects)
 */
export const isLowPerformanceDevice = () => {
  if (typeof navigator === 'undefined') return false;
  
  // Check if it's a mobile device first
  const isMobile = isMobileDevice();
  
  // Try to detect older/lower-end devices
  const cores = navigator.hardwareConcurrency || 1;
  
  // Memory detection (works in Chrome and some other browsers)
  const hasLowMemory = 'deviceMemory' in navigator && (navigator as any).deviceMemory < 4;
  
  // Low CPU power devices
  const hasLowCPU = cores <= 2;
  
  // Safari on iOS doesn't provide hardwareConcurrency reliably
  const isOlderIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                      /OS 11|OS 10|OS 9|OS 8/.test(navigator.userAgent);
  
  return isMobile && (hasLowMemory || hasLowCPU || isOlderIOS);
};

/**
 * Returns CSS prefixed properties when needed based on the current browser
 */
export const getPrefixedStyles = (styles: Record<string, any>): Record<string, any> => {
  const browserInfo = getBrowserInfo();
  const featureSupport = detectFeatureSupport();
  const prefixedStyles = { ...styles };
  
  // Handle backdrop-filter prefixes
  if (styles.backdropFilter) {
    if (featureSupport.webkitBackdropFilter) {
      prefixedStyles.WebkitBackdropFilter = styles.backdropFilter;
    }
    if (featureSupport.mozBackdropFilter) {
      prefixedStyles.MozBackdropFilter = styles.backdropFilter;
    }
    if (featureSupport.msBackdropFilter) {
      prefixedStyles.msBackdropFilter = styles.backdropFilter;
    }
  }
  
  // Handle other prefixes if needed
  // e.g., animation prefixes for older browsers
  if (styles.animation && browserInfo.name === 'safari' && parseFloat(browserInfo.version) < 13) {
    prefixedStyles.WebkitAnimation = styles.animation;
  }
  
  return prefixedStyles;
};

/**
 * Determines the appropriate cyberpunk effect intensity based on device capabilities
 */
export const getCyberpunkIntensity = (): 'high' | 'medium' | 'low' => {
  if (prefersReducedMotion()) return 'low';
  if (isLowPerformanceDevice()) return 'low';
  
  const browserInfo = getBrowserInfo();
  
  // Safari on macOS struggles with some effects
  if (browserInfo.name === 'safari') return 'medium';
  
  // Older browsers should get medium intensity
  if (
    (browserInfo.name === 'chrome' && parseFloat(browserInfo.version) < 80) ||
    (browserInfo.name === 'firefox' && parseFloat(browserInfo.version) < 70) ||
    (browserInfo.name === 'edge' && parseFloat(browserInfo.version) < 80)
  ) {
    return 'medium';
  }
  
  // Default to high for modern browsers
  return 'high';
};

/**
 * Creates fallback styles when advanced CSS features aren't supported
 */
export const getFallbackStyles = (effectType: 'scanline' | 'glow' | 'background' | 'animation') => {
  const featureSupport = detectFeatureSupport();
  
  switch (effectType) {
    case 'scanline':
      // Fallback for scanlines when mix-blend-mode is not supported
      if (!featureSupport.mixBlendMode) {
        return {
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0, 0, 0, 0.1) 4px, rgba(0, 0, 0, 0.1) 8px)',
          opacity: 0.3,
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0
        };
      }
      break;
      
    case 'glow':
      // Fallback for text glow effects
      if (!featureSupport.mixBlendMode) {
        return {
          textShadow: '0 0 5px rgba(5, 217, 232, 0.5)'
        };
      }
      break;
      
    case 'background':
      // Fallback for backdrop-filter
      if (!featureSupport.backdropFilter && 
          !featureSupport.webkitBackdropFilter && 
          !featureSupport.mozBackdropFilter) {
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.8)' // Solid background as fallback
        };
      }
      break;
      
    case 'animation':
      // Fallback when animations might cause performance issues
      if (isLowPerformanceDevice() || prefersReducedMotion()) {
        return {
          animation: 'none',
          transition: 'none'
        };
      }
      break;
  }
  
  return {};
};

const browserCompatibility = {
  detectFeatureSupport,
  isMobileDevice,
  getBrowserInfo,
  prefersReducedMotion,
  isLowPerformanceDevice,
  getPrefixedStyles,
  getCyberpunkIntensity,
  getFallbackStyles
};

export default browserCompatibility;