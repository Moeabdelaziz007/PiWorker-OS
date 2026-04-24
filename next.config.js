/** @type {import('next').NextConfig} */
const nextConfig = {
  // Config for Next.js 15
  experimental: {
    // any experimental features can be added here
  },
  images: {
    unoptimized: true, // For local-first / static export if needed
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `crypto` and other Node modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
