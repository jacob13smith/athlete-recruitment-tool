/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Skip API route analysis during build if DATABASE_URL is not available
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
