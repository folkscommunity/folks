// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://4aadf94b89f6b8ca2caa46e7326c3fe0@o4508756308459520.ingest.us.sentry.io/4508756314161152",

  tracesSampleRate: 1,
  enabled: process.env.NODE_ENV === "production",
  environment:
    process.env.NODE_ENV === "production" ? "production" : "development",
  debug: false
});
