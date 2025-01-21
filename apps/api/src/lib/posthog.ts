import { PostHog } from "posthog-node";

export const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    "phc_5ZLKrqFjOwUgBuAp2IuPgyfcaRGKfAEGyWLygD2mZ1K",
  {
    disabled: process.env.NODE_ENV !== "production",
    host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://hog.folkscommunity.com"
  }
);
