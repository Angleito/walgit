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
    NEXT_PUBLIC_WALGIT_PACKAGE_ID: process.env.NEXT_PUBLIC_WALGIT_PACKAGE_ID,
    NEXT_PUBLIC_WALRUS_API_KEY: process.env.NEXT_PUBLIC_WALRUS_API_KEY,
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