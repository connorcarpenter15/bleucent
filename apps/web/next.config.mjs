/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bleucent/ui', '@bleucent/shared-protocol', '@bleucent/db'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  webpack: (config) => {
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  },
};

export default nextConfig;
