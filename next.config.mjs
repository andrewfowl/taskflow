// Server Actions reject requests whose Origin differs from the (forwarded) Host.
// Dev previews are served through proxies (v0 / Vercel preview domains), so those
// origins must be trusted explicitly. Extra origins can be supplied via
// SERVER_ACTIONS_ALLOWED_ORIGINS (comma-separated) for self-hosted proxies.
const serverActionAllowedOrigins = [
  ...(process.env.NODE_ENV === "development"
    ? ["localhost:3000", "*.v0.build", "*.vusercontent.net", "*.v0.app"]
    : []),
  ...(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

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
      allowedOrigins: serverActionAllowedOrigins,
    },
  },
  // Allow the standalone output so the app can be self-hosted via Docker
  // without pulling the whole node_modules tree into the image.
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default nextConfig;
