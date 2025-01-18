import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com"
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3002/api/:path*"
      }
    ];
  }
};

export default nextConfig;
