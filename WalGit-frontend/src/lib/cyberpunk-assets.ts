/**
 * Cyberpunk Assets Configuration
 * 
 * Manages the loading strategy for cyberpunk theme assets
 * based on environment settings
 */

// Cyberpunk assets configuration
const cyberpunkConfig = {
  preloadHeavyAssets: false,
};

interface AssetConfig {
  path: string;
  type: 'image' | 'font' | 'video' | 'audio';
  priority: boolean;
  preload: boolean;
}

// Core theme assets (always loaded)
export const CORE_ASSETS: AssetConfig[] = [
  {
    path: '/fonts/rajdhani-v15-latin-600.woff2',
    type: 'font',
    priority: true,
    preload: true,
  },
  {
    path: '/fonts/orbitron-v29-latin-600.woff2',
    type: 'font',
    priority: true,
    preload: true,
  },
  {
    path: '/fonts/geist-mono-v2-latin-regular.woff2',
    type: 'font',
    priority: true,
    preload: true,
  },
  {
    path: '/walgitv3.png',
    type: 'image',
    priority: true,
    preload: true,
  },
];

// Heavy, non-essential assets (conditionally loaded)
export const THEME_ASSETS: AssetConfig[] = [
  {
    path: '/cyberpunk/background-grid.svg',
    type: 'image',
    priority: false,
    preload: cyberpunkConfig.preloadHeavyAssets,
  },
  {
    path: '/cyberpunk/circuit-pattern.svg',
    type: 'image',
    priority: false,
    preload: cyberpunkConfig.preloadHeavyAssets,
  },
  {
    path: '/cyberpunk/noise-texture.webp',
    type: 'image',
    priority: false,
    preload: cyberpunkConfig.preloadHeavyAssets,
  },
  {
    path: '/cyberpunk/glitch-overlay.webp',
    type: 'image',
    priority: false,
    preload: false, // Never preload, only load when needed
  },
  {
    path: '/cyberpunk/ambient-loop.mp3',
    type: 'audio',
    priority: false,
    preload: false, // Only load on user interaction
  },
];

/**
 * Generate preload link tags for critical assets
 */
export function generatePreloadTags(): string {
  // Always preload core assets
  const coreTags = CORE_ASSETS
    .filter(asset => asset.preload)
    .map(asset => {
      let asType = '';
      switch (asset.type) {
        case 'font':
          asType = 'font';
          break;
        case 'image':
          asType = 'image';
          break;
        case 'audio':
          asType = 'audio';
          break;
        case 'video':
          asType = 'video';
          break;
      }
      
      return `<link rel="preload" href="${asset.path}" as="${asType}" ${asset.type === 'font' ? 'crossorigin="anonymous"' : ''}>`;
    })
    .join('\n');
    
  // Only preload theme assets conditionally
  const themeTags = cyberpunkConfig.preloadHeavyAssets 
    ? THEME_ASSETS
      .filter(asset => asset.preload)
      .map(asset => {
        return `<link rel="preload" href="${asset.path}" as="${asset.type}">`;
      })
      .join('\n')
    : '';
    
  return `${coreTags}\n${themeTags}`;
}

/**
 * Get the Content Security Policy directives for the cyberpunk theme
 */
export function getCyberpunkCSP(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  const cspEnabled = process.env.NEXT_PUBLIC_CSP_ENABLED === 'true';
  
  // Only apply strict CSP in production when explicitly enabled
  if (!isProduction || !cspEnabled) {
    return '';
  }
  
  return `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https://*.sui.io https://walgit.io;
    font-src 'self';
    connect-src 'self' https://*.sui.io https://api.walrus.infrastructure.tech;
    media-src 'self';
    frame-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim();
}