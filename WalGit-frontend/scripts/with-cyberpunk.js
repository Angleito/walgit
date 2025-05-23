// @ts-check

/**
 * Next.js plugin for applying Cyberpunk theme optimizations
 * This plugin enhances the Next.js configuration with cyberpunk-specific optimizations,
 * performance improvements, and feature flag management.
 */

const path = require('path');
const fs = require('fs');

/**
 * Cyberpunk theme plugin for Next.js
 * @param {Object} cyberpunkConfig - The cyberpunk configuration object
 * @returns {function} - Next.js configuration wrapper
 */
const withCyberpunk = (cyberpunkConfig) => (nextConfig = {}) => {
  return {
    ...nextConfig,
    
    // Apply cyberpunk theme optimizations to webpack config
    webpack: (config, options) => {
      const { dev, isServer } = options;
      
      // Apply user webpack config if provided
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, options);
      }
      
      // Handle image optimization based on cyberpunk config
      if (cyberpunkConfig.optimization.optimizeImages) {
        // Define image paths to optimize
        const cyberpunkImagePaths = cyberpunkConfig.assets.imagePaths || [];
        
        config.module.rules.push({
          test: /\.(png|jpe?g|gif|webp)$/i,
          include: (modulePath) => {
            return cyberpunkImagePaths.some(imagePath => 
              modulePath.includes(path.resolve(imagePath))
            );
          },
          use: [
            {
              loader: 'image-webpack-loader',
              options: {
                mozjpeg: {
                  progressive: true,
                  quality: 80,
                },
                optipng: {
                  enabled: !dev,
                },
                pngquant: {
                  quality: [0.65, 0.90],
                  speed: 4,
                },
                gifsicle: {
                  interlaced: false,
                },
                webp: {
                  quality: 80,
                },
              },
            },
          ],
        });
      }
      
      // Font optimization
      if (cyberpunkConfig.optimization.optimizeFonts) {
        const fontPaths = cyberpunkConfig.assets.fontPaths || [];
        
        config.module.rules.push({
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          include: (modulePath) => {
            return fontPaths.some(fontPath => 
              modulePath.includes(path.resolve(fontPath))
            );
          },
          type: 'asset',
          generator: {
            filename: 'static/fonts/[name]-[hash][ext]',
          },
        });
      }
      
      // Bundle analyzer integration
      if (cyberpunkConfig.optimization.bundleAnalyzer && !isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
      
      // Define plugin for feature flags
      const { DefinePlugin } = require('webpack');
      config.plugins.push(
        new DefinePlugin({
          'process.env.CYBERPUNK_THEME_ENABLED': JSON.stringify(cyberpunkConfig.enabled),
          'process.env.CYBERPUNK_ENABLE_ANIMATIONS': JSON.stringify(cyberpunkConfig.features.enableAnimations),
          'process.env.CYBERPUNK_ENABLE_INTENSIVE_EFFECTS': JSON.stringify(cyberpunkConfig.features.enableIntensiveEffects),
          'process.env.CYBERPUNK_ENABLE_CRT_EFFECTS': JSON.stringify(cyberpunkConfig.features.enableCrtEffects),
          'process.env.CYBERPUNK_ENABLE_GLITCH_EFFECTS': JSON.stringify(cyberpunkConfig.features.enableGlitchEffects),
          'process.env.CYBERPUNK_ENABLE_NEON_EFFECTS': JSON.stringify(cyberpunkConfig.features.enableNeonEffects),
          'process.env.CYBERPUNK_ANIMATION_INTENSITY': JSON.stringify(cyberpunkConfig.performance.animationIntensity),
        })
      );
      
      return config;
    },
    
    // Add environment-specific build hooks
    onDemandEntries: {
      ...nextConfig.onDemandEntries,
      // Keep pages in memory longer for faster development
      maxInactiveAge: dev ? 60 * 1000 : 25 * 1000,
      // More concurrent pages in development
      pagesBufferLength: dev ? 5 : 2,
    },
  };
};

module.exports = { withCyberpunk };