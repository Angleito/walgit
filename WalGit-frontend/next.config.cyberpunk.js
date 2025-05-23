// @ts-check

/** @type {import('next').NextConfig} */
const cyberpunkConfig = require('./cyberpunk.config');
const { withCyberpunk } = require('./scripts/with-cyberpunk');

/**
 * Cyberpunk-themed Next.js configuration
 * This configuration extends the base Next.js config with cyberpunk-specific optimizations
 */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
    domains: ['walgit.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.sui.io',
      },
    ],
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK || 'devnet',
    NEXT_PUBLIC_WALGIT_PACKAGE_ID: process.env.NEXT_PUBLIC_WALGIT_PACKAGE_ID,
    NEXT_PUBLIC_WALRUS_API_KEY: process.env.NEXT_PUBLIC_WALRUS_API_KEY,
    NEXT_PUBLIC_THEME_VARIANT: process.env.NEXT_PUBLIC_THEME_VARIANT || 'cyberpunk',
    NEXT_PUBLIC_ENABLE_ANIMATIONS: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS,
    NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS,
    NEXT_PUBLIC_ENABLE_CRT_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_CRT_EFFECTS,
    NEXT_PUBLIC_ENABLE_GLITCH_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_GLITCH_EFFECTS,
    NEXT_PUBLIC_ENABLE_NEON_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_NEON_EFFECTS,
    NEXT_PUBLIC_ANIMATION_INTENSITY: process.env.NEXT_PUBLIC_ANIMATION_INTENSITY,
    NEXT_PUBLIC_PRELOAD_FONTS: process.env.NEXT_PUBLIC_PRELOAD_FONTS,
    NEXT_PUBLIC_PRELOAD_HEAVY_ASSETS: process.env.NEXT_PUBLIC_PRELOAD_HEAVY_ASSETS,
    NEXT_PUBLIC_LAZY_LOAD_ANIMATIONS: process.env.NEXT_PUBLIC_LAZY_LOAD_ANIMATIONS,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
    NEXT_PUBLIC_CSP_ENABLED: process.env.NEXT_PUBLIC_CSP_ENABLED,
  },
  // Base path and asset prefix
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ? `${process.env.NEXT_PUBLIC_BASE_PATH}/` : '',
  // Development vs production optimizations
  eslint: {
    ignoreDuringBuilds: process.env.CI === 'true',
  },
  // Enhanced experimental features
  experimental: {
    // Enable optimizations for code splitting
    optimizeCss: true,
    // Module transpilation
    transpilePackages: [
      '@mysten/dapp-kit',
      '@mysten/sui.js',
    ],
    // Modern JavaScript optimizations
    serverMinification: true,
    serverSourceMaps: process.env.NODE_ENV !== 'production',
  },
  // Production-specific compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Security headers for all environments
  headers: async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const cspEnabled = process.env.NEXT_PUBLIC_CSP_ENABLED === 'true';
    
    // More restrictive CSP in production
    const headers = [];
    
    if (isProduction && cspEnabled) {
      headers.push({
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
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
            `.replace(/\s+/g, ' ').trim(),
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      });
    }
    
    return headers;
  },
  // Enhanced webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Node polyfills for Sui.js compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      path: false,
    };

    // Production optimizations
    if (!dev) {
      // Tree shaking
      config.optimization.usedExports = true;
      
      // Minification
      config.optimization.minimize = true;
      
      // Client-side optimizations
      if (!isServer) {
        // Custom chunking for production builds
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for third-party libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for code shared between routes
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'async',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate React and related packages
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            // Cyberpunk theme assets
            cyberpunk: {
              name: 'cyberpunk-theme',
              test: /[\\/]cyberpunk[\\/]/,
              chunks: 'all',
              priority: 15,
            },
            // Animations and effects
            animations: {
              name: 'animations',
              test: (module) => {
                return module.resource &&
                  (module.resource.includes('animation') ||
                   module.resource.includes('effect') ||
                   module.resource.includes('transition'));
              },
              chunks: 'all',
              priority: 5,
            },
          },
        };
        
        // Module concatenation
        config.optimization.concatenateModules = true;
      }
    }

    return config;
  },
};

// Apply cyberpunk configuration wrapper
// Note: This is a placeholder - you would need to create the withCyberpunk plugin
module.exports = withCyberpunk(cyberpunkConfig)(nextConfig);