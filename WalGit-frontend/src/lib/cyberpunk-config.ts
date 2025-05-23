/**
 * Cyberpunk Theme Configuration
 * 
 * This file manages feature flags and settings for the cyberpunk theme
 * It respects environment settings for production vs development
 */

export type AnimationIntensity = 'off' | 'low' | 'medium' | 'high';

export interface CyberpunkConfig {
  // Feature toggles
  enableAnimations: boolean;
  enableIntensiveEffects: boolean;
  enableCrtEffects: boolean;
  enableGlitchEffects: boolean;
  enableNeonEffects: boolean;
  
  // Animation settings
  animationIntensity: AnimationIntensity;
  
  // Performance settings
  preloadFonts: boolean;
  preloadHeavyAssets: boolean; 
  lazyLoadAnimations: boolean;
  
  // Debug
  debugMode: boolean;
}

// Parse boolean environment variables safely
const parseBool = (value: string | undefined): boolean => {
  if (!value) return false;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

// Parse animation intensity level
const parseIntensity = (value: string | undefined): AnimationIntensity => {
  if (!value) return 'medium';
  
  switch (value.toLowerCase()) {
    case 'off': return 'off';
    case 'low': return 'low';
    case 'high': return 'high';
    default: return 'medium';
  }
};

// Create configuration from environment variables
export const getCyberpunkConfig = (): CyberpunkConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Default values are different based on production vs development
  const defaultConfig: CyberpunkConfig = {
    enableAnimations: !isProduction,
    enableIntensiveEffects: !isProduction,
    enableCrtEffects: !isProduction,
    enableGlitchEffects: true,
    enableNeonEffects: true,
    animationIntensity: isProduction ? 'medium' : 'high',
    preloadFonts: true,
    preloadHeavyAssets: isProduction,
    lazyLoadAnimations: isProduction,
    debugMode: !isProduction,
  };
  
  // Override with environment variables if available
  return {
    enableAnimations: parseBool(process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS) ?? defaultConfig.enableAnimations,
    enableIntensiveEffects: parseBool(process.env.NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS) ?? defaultConfig.enableIntensiveEffects,
    enableCrtEffects: parseBool(process.env.NEXT_PUBLIC_ENABLE_CRT_EFFECTS) ?? defaultConfig.enableCrtEffects,
    enableGlitchEffects: parseBool(process.env.NEXT_PUBLIC_ENABLE_GLITCH_EFFECTS) ?? defaultConfig.enableGlitchEffects,
    enableNeonEffects: parseBool(process.env.NEXT_PUBLIC_ENABLE_NEON_EFFECTS) ?? defaultConfig.enableNeonEffects,
    animationIntensity: parseIntensity(process.env.NEXT_PUBLIC_ANIMATION_INTENSITY) ?? defaultConfig.animationIntensity,
    preloadFonts: parseBool(process.env.NEXT_PUBLIC_PRELOAD_FONTS) ?? defaultConfig.preloadFonts, 
    preloadHeavyAssets: parseBool(process.env.NEXT_PUBLIC_PRELOAD_HEAVY_ASSETS) ?? defaultConfig.preloadHeavyAssets,
    lazyLoadAnimations: parseBool(process.env.NEXT_PUBLIC_LAZY_LOAD_ANIMATIONS) ?? defaultConfig.lazyLoadAnimations,
    debugMode: parseBool(process.env.NEXT_PUBLIC_DEBUG_MODE) ?? defaultConfig.debugMode,
  };
};

// Export a singleton instance for client components
export const cyberpunkConfig = getCyberpunkConfig();

/**
 * Hook to get animation class based on feature flags and intensity
 * @param animationName The base animation name
 * @returns The appropriate animation class or empty string if disabled
 */
export function getAnimationClass(animationName: string): string {
  if (!cyberpunkConfig.enableAnimations) return '';
  
  // Apply intensity modifiers
  switch (cyberpunkConfig.animationIntensity) {
    case 'off':
      return '';
    case 'low':
      if (animationName.includes('intense')) return '';
      if (animationName.includes('flicker')) return animationName.replace('flicker', 'flicker-subtle');
      return animationName + '-subtle';
    case 'high':
      if (animationName.includes('subtle')) return animationName.replace('subtle', '');
      if (cyberpunkConfig.enableIntensiveEffects && !animationName.includes('intense')) {
        return animationName.includes('flicker') ? animationName.replace('flicker', 'flicker-intense') : animationName + '-intense';
      }
      return animationName;
    default: // medium
      return animationName;
  }
}

/**
 * Apply scanline effect based on configuration
 */
export function getScanlineClass(): string {
  if (!cyberpunkConfig.enableCrtEffects) return '';
  
  switch (cyberpunkConfig.animationIntensity) {
    case 'off':
      return '';
    case 'low':
      return 'bg-scanline-subtle';
    case 'high':
      return 'bg-scanline-strong';
    default: // medium
      return 'bg-scanline-medium';
  }
}