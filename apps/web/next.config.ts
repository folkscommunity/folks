import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3002/api/:path*"
      },
      {
        source: "/ws/:path*",
        destination: "http://localhost:3002/ws/:path*"
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/discord",
        destination: "https://discord.gg/BmWznBhHzk",
        permanent: false
      },
      {
        source: "/about",
        destination: "https://folkscommunity.com/manifesto",
        permanent: false
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  org: "folks",
  project: "folks-web",
  silent: true,

  widenClientFileUpload: false,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true
  },
  telemetry: false,

  reactComponentAnnotation: {
    enabled: true
  }
});
