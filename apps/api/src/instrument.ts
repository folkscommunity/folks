import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://1df3329db4bbf18f8187644d6598737e@o4508756308459520.ingest.us.sentry.io/4508756372094976",
  enabled: process.env.NODE_ENV === "production",
  environment:
    process.env.NODE_ENV === "production" ? "production" : "development"
});

export { Sentry };
