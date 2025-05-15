"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  // hostname does not contain localhost
  if (window.location.hostname.includes("folkscommunity.com")) {
    posthog.init(
      process.env.NEXT_PUBLIC_POSTHOG_KEY ||
        "phc_NLlEYiM5V2F5GSArgUp1E30hgLmevdCzKr7v5nTjHxn",
      {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST ||
          "https://e.folkscommunity.com",
        ui_host: "https://us.posthog.com",
        person_profiles: "identified_only"
      }
    );
  }
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
