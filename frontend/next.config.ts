import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://queen-app.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
