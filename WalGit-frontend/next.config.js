// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['walgit.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.sui.io',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK || 'devnet',
    NEXT_PUBLIC_WALGIT_PACKAGE_ID: process.env.NEXT_PUBLIC_WALGIT_PACKAGE_ID || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    NEXT_PUBLIC_WALRUS_API_KEY: process.env.NEXT_PUBLIC_WALRUS_API_KEY || "walgit-demo-key-123456",
    NEXT_PUBLIC_SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK || "devnet",
    NEXT_PUBLIC_SUI_DEVNET_URL: process.env.NEXT_PUBLIC_SUI_DEVNET_URL || "https://fullnode.devnet.sui.io",
    NEXT_PUBLIC_SUI_TESTNET_URL: process.env.NEXT_PUBLIC_SUI_TESTNET_URL || "https://fullnode.testnet.sui.io",
    NEXT_PUBLIC_SUI_MAINNET_URL: process.env.NEXT_PUBLIC_SUI_MAINNET_URL || "https://fullnode.mainnet.sui.io",
    NEXT_PUBLIC_THEME_VARIANT: process.env.NEXT_PUBLIC_THEME_VARIANT || 'cyberpunk',
    NEXT_PUBLIC_ENABLE_ANIMATIONS: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS || "true",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    largePageDataBytes: 512000,
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      path: false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
      };
    }

    return config;
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;