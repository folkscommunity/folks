import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://folkscommunity.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: "https://folkscommunity.com/manifesto",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: "https://folkscommunity.com/release-notes",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: "https://folkscommunity.com/roadmap",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: "https://folkscommunity.com/guidelines",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5
    },
    {
      url: "https://folkscommunity.com/privacy-policy",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    },
    {
      url: "https://folkscommunity.com/support",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];
}
