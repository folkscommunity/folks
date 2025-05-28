import GhostContentAPI from "@tryghost/content-api";

export const ghost = new GhostContentAPI({
  url: process.env.GHOST_URL || "https://folkscommunity.com",
  key: process.env.GHOST_KEY || "1a3f5b7d9c2e4f6a8b0d1e3c5f", // PLACEHOLDER TO GET NEXT TO BUILD
  version: "v5.0"
});
