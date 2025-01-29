"use server";

import { redis } from "./redis";

async function getURLMetadataFromCache(url: string): Promise<any> {
  const url_as_base64 = Buffer.from(url).toString("base64");
  const cached_metadata = await redis.get(`url_metadata:${url_as_base64}`);

  if (cached_metadata) {
    return JSON.parse(cached_metadata);
  }

  return {
    url: url,
    hostname: new URL(url).hostname,
    title: new URL(url).hostname,
    description: url,
    image: undefined,
    favicon: `https://www.google.com/s2/favicons?domain=https://${
      new URL(url).hostname
    }&sz=256`,
    fetching: true
  };
}

export async function getURLFromText(text: string): Promise<any[]> {
  const urls = text.match(/https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*/gi);

  if (!urls) {
    return [];
  }

  let processed_urls: any[] = [];

  for await (const url of urls) {
    processed_urls = [...processed_urls, await getURLMetadataFromCache(url)];
  }

  return processed_urls;
}

function imageProxy(url: string) {
  const base64 = Buffer.from(url).toString("base64");

  return `https://imgproxy.folkscommunity.com/plain/mb:500000/${base64}.webp`;
}
