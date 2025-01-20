// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://2232f5314c1841eeb5aa3f7874313253@sentry.folkscommunity.com/1",

  tracesSampleRate: 1,
  enabled: process.env.NODE_ENV === "production",
  environment:
    process.env.NODE_ENV === "production" ? "production" : "development",
  debug: false
});
