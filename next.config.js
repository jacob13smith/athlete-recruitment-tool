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

// Only wrap with Sentry if DSN is provided
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || "",
      project: process.env.SENTRY_PROJECT || "",
      silent: !process.env.CI,
    })
  : nextConfig;
