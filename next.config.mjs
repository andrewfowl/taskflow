/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep builds resilient: lint is run separately in CI, not during `next build`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Server Actions are enabled by default in Next 15; allow large uploads.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  // Allow the standalone output so the app can be self-hosted via Docker
  // without pulling the whole node_modules tree into the image.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default nextConfig;
