/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static optimization for chart components that need client-side rendering
  experimental: {
    optimizePackageImports: ['lightweight-charts'],
  },
  // Next.js 15 compatibility
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Hide Next.js watermark/logo
  poweredByHeader: false,
};

module.exports = nextConfig;

