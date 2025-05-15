import { PostHog } from "posthog-node";

export const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    "phc_NLlEYiM5V2F5GSArgUp1E30hgLmevdCzKr7v5nTjHxn",
  {
    disabled: process.env.NODE_ENV !== "production",
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com"
  }
);
