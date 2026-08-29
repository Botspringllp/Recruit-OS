/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.recruitos.com', '*.vercel.app'],
    },
  },
};

export default nextConfig;
