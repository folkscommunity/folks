import GhostContentAPI from "@tryghost/content-api";

export const ghost = new GhostContentAPI({
  url: process.env.GHOST_URL || "https://folkscommunity.com",
  key: process.env.GHOST_KEY || "build_fix",
  version: "v5.0"
});
