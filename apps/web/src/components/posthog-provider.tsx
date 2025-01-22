"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  // hostname does not contain localhost
  if (!window.location.hostname.includes("localhost")) {
    posthog.init(
      process.env.NEXT_PUBLIC_POSTHOG_KEY ||
        "phc_5ZLKrqFjOwUgBuAp2IuPgyfcaRGKfAEGyWLygD2mZ1K",
      {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ||
          "https://hog.folkscommunity.com",
        person_profiles: "identified_only"
      }
    );
  }
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
