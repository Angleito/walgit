/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure App Router settings
  experimental: {
    // App Router is enabled by default in Next.js 15+
    largePageDataBytes: 512 * 1000, // 512KB
    // Disable features that might cause issues during build
    isrMemoryCacheSize: 0,
    serverMinification: false,
    serverActions: false,
  },
  // Note: Redirects in static exports need to be handled differently
  // These redirects won't work with "output: export"
  // Using a client-side redirect in the page component instead
  // Server components external packages configuration
  serverExternalPackages: [],
  images: {
    domains: ["walgit.io"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.sui.io",
      },
    ],
  },
  // Static file serving configurations
  distDir: '.next',
  assetPrefix: undefined,
  // Environment variables
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK || "devnet",
    NEXT_PUBLIC_WALGIT_PACKAGE_ID: process.env.NEXT_PUBLIC_WALGIT_PACKAGE_ID || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    NEXT_PUBLIC_WALRUS_API_KEY: process.env.NEXT_PUBLIC_WALRUS_API_KEY || "walgit-demo-key-123456",
    // Add required SUI related environment variables with fallbacks
    NEXT_PUBLIC_SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK || "devnet",
    NEXT_PUBLIC_SUI_DEVNET_URL: process.env.NEXT_PUBLIC_SUI_DEVNET_URL || "https://fullnode.devnet.sui.io",
    NEXT_PUBLIC_SUI_TESTNET_URL: process.env.NEXT_PUBLIC_SUI_TESTNET_URL || "https://fullnode.testnet.sui.io",
    NEXT_PUBLIC_SUI_MAINNET_URL: process.env.NEXT_PUBLIC_SUI_MAINNET_URL || "https://fullnode.mainnet.sui.io",
    // Cyberpunk theme settings
    NEXT_PUBLIC_THEME_VARIANT: process.env.NEXT_PUBLIC_THEME_VARIANT || 'cyberpunk',
    NEXT_PUBLIC_ENABLE_ANIMATIONS: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS || "true",
    NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_INTENSIVE_EFFECTS || "true",
    NEXT_PUBLIC_ENABLE_CRT_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_CRT_EFFECTS || "true",
    NEXT_PUBLIC_ENABLE_GLITCH_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_GLITCH_EFFECTS || "true",
    NEXT_PUBLIC_ENABLE_NEON_EFFECTS: process.env.NEXT_PUBLIC_ENABLE_NEON_EFFECTS || "true",
    NEXT_PUBLIC_ANIMATION_INTENSITY: process.env.NEXT_PUBLIC_ANIMATION_INTENSITY || "high",
  },
  // Skip validation during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Let's use standalone mode instead of export to avoid dynamic route issues
  output: 'standalone',
  // Ensure server-side rendering works properly
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname,
  },
  // Improve caching behavior
  onDemandEntries: {
    // Keep pages in memory longer for development
    maxInactiveAge: 60 * 60 * 1000,
    // More concurrent pages in development
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;