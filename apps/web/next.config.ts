import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "folks-static-development.s3.eu-central-1.amazonaws.com"
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3002/api/:path*"
      },
      {
        source: "/js/s.js",
        destination: "https://p.lum.is/js/script.outbound-links.js"
      }
    ];
  }
};

export default nextConfig;
