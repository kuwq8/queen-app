import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/:path*'
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:3001/socket.io/:path*'
      }
    ]
  }
};

export default nextConfig;
