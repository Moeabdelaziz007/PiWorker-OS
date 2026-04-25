/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config for Next.js 15

  experimental: {
    // any experimental features can be added here
  },
  images: {
    unoptimized: true, // For local-first / static export if needed
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "node:crypto": false,
      "node:fs": false,
      "node:path": false,
      "node:child_process": false,
      "node:util": false,
      crypto: false,
      fs: false,
      path: false,
      net: false,
      tls: false,
      http2: false,
      dns: false,
      os: false,
      stream: false,
      "@grpc/grpc-js": false,
      "@grpc/proto-loader": false,
      "@vercel/kv": false,
    };
    return config;
  },

};

export default nextConfig;
