/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true
  },
  images: {
    domains: ["images.unsplash.com", "cdn.openai.com", "files.stripe.com"],
  },
  webpack: (config) => {
    // Fixes npm packages that depend on fs/module module
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
};

module.exports = nextConfig;