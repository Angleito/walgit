// @ts-check

/**
 * @typedef {Object} CyberpunkThemeConfig
 * @property {boolean} enabled - Whether the cyberpunk theme is enabled
 * @property {Object} optimization - Optimization settings
 * @property {boolean} optimization.minifyCSS - Whether to minify CSS
 * @property {boolean} optimization.minifyJS - Whether to minify JS
 * @property {boolean} optimization.optimizeImages - Whether to optimize images
 * @property {boolean} optimization.optimizeFonts - Whether to optimize fonts
 * @property {boolean} optimization.bundleAnalyzer - Whether to use webpack bundle analyzer
 * @property {Object} features - Feature flags
 * @property {boolean} features.enableAnimations - Whether to enable animations
 * @property {boolean} features.enableIntensiveEffects - Whether to enable intensive effects
 * @property {boolean} features.enableCrtEffects - Whether to enable CRT effects
 * @property {boolean} features.enableGlitchEffects - Whether to enable glitch effects
 * @property {boolean} features.enableNeonEffects - Whether to enable neon effects
 * @property {Object} performance - Performance settings
 * @property {string} performance.animationIntensity - Animation intensity level (off, low, medium, high)
 * @property {boolean} performance.preloadFonts - Whether to preload fonts
 * @property {boolean} performance.preloadHeavyAssets - Whether to preload heavy assets
 * @property {boolean} performance.lazyLoadAnimations - Whether to lazy load animations
 * @property {Object} assets - Asset settings
 * @property {string[]} assets.imagePaths - Paths to cyberpunk images
 * @property {string[]} assets.fontPaths - Paths to cyberpunk fonts
 * @property {string[]} assets.audioPaths - Paths to cyberpunk audio files
 */

/**
 * @type {CyberpunkThemeConfig}
 */
const cyberpunkConfig = {
  enabled: true,
  optimization: {
    minifyCSS: process.env.NODE_ENV === 'production',
    minifyJS: process.env.NODE_ENV === 'production',
    optimizeImages: process.env.NODE_ENV === 'production',
    optimizeFonts: true,
    bundleAnalyzer: process.env.ANALYZE === 'true',
  },
  features: {
    enableAnimations: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS !== 'false',
    enableIntensiveEffects: process.env.NODE_ENV !== 'production' && 
                           process.env.NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS !== 'false',
    enableCrtEffects: process.env.NODE_ENV !== 'production' && 
                     process.env.NEXT_PUBLIC_ENABLE_CRT_EFFECTS !== 'false',
    enableGlitchEffects: process.env.NEXT_PUBLIC_ENABLE_GLITCH_EFFECTS !== 'false',
    enableNeonEffects: process.env.NEXT_PUBLIC_ENABLE_NEON_EFFECTS !== 'false',
  },
  performance: {
    animationIntensity: process.env.NODE_ENV === 'production' ? 'medium' : 'high',
    preloadFonts: true,
    preloadHeavyAssets: process.env.NODE_ENV === 'production',
    lazyLoadAnimations: process.env.NODE_ENV === 'production',
  },
  assets: {
    imagePaths: [
      '/public/cyberpunk',
    ],
    fontPaths: [
      '/public/fonts',
    ],
    audioPaths: [
      '/public/audio',
    ],
  },
};

module.exports = cyberpunkConfig;