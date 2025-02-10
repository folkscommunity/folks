import Queue from "bull";
import sharp from "sharp";
import { unfurl } from "unfurl.js";

import { redis } from "./redis";

interface URLMetadata {
  url: string;
  hostname: string;
  title: string;
  description?: string;
  image?: {
    url: string;
    width?: number;
    height?: number;
    image_square?: boolean;
  };
  favicon?: string;
  fetching?: boolean;
}

interface Resolution {
  width?: number;
  height?: number;
}

async function getImageResolution(url: string): Promise<Resolution> {
  const image_data = await fetch(url).then((res) => res.arrayBuffer());
  const image = await sharp(image_data);
  const metadata = await image.metadata();
  return {
    width: metadata.width,
    height: metadata.height
  };
}

export async function getURLMetadataFromCache(
  url: string
): Promise<URLMetadata> {
  const url_as_base64 = Buffer.from(url).toString("base64");
  const cached_metadata = await redis.get(`url_metadata:${url_as_base64}`);

  if (cached_metadata) {
    return JSON.parse(cached_metadata);
  }

  const queue_fetch_url_metadata = new Queue(
    "queue_fetch_url_metadata",
    process.env.REDIS_URL!
  );

  await queue_fetch_url_metadata.add({ url: url });

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

export async function getURLMetadata(url: string): Promise<URLMetadata> {
  const url_as_base64 = Buffer.from(url).toString("base64");
  const cached_metadata = await redis.get(`url_metadata:${url_as_base64}`);

  if (cached_metadata) {
    return JSON.parse(cached_metadata);
  }

  const metadata = await unfurl(url, {
    timeout: 5000
  });

  if (!metadata) {
    return {
      url: url,
      hostname: new URL(url).hostname,
      title: new URL(url).hostname,
      description: url,
      image: undefined,
      favicon: imageProxy(
        `https://www.google.com/s2/favicons?domain=https://${
          new URL(url).hostname
        }&sz=256`
      )
    };
  }

  let image_resolution: Resolution | undefined;

  let image_url = metadata.open_graph?.images[0].url;

  try {
    if (
      metadata?.open_graph?.images &&
      metadata.open_graph.images.length > 0 &&
      metadata.open_graph.images[0].url &&
      (!metadata.open_graph.images[0].width ||
        !metadata.open_graph.images[0].height)
    ) {
      image_resolution = await getImageResolution(image_url);
    }
  } catch (e) {
    if (
      metadata?.open_graph?.images &&
      metadata.open_graph.images.length > 0 &&
      metadata.open_graph.images[0].url &&
      (!metadata.open_graph.images[0].width ||
        !metadata.open_graph.images[0].height)
    ) {
      image_url = metadata.open_graph?.images[0].url
        .match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/)[0]
        .match(/https?:\/\/[^\s)]+/)[0];
      image_resolution = await getImageResolution(image_url);
    }
  }

  const final_object: URLMetadata = {
    url: url,
    hostname: new URL(url).hostname,
    title:
      metadata?.open_graph?.title || metadata.title || new URL(url).hostname,
    description:
      metadata?.open_graph?.description || metadata.description || url,
    image: metadata?.open_graph?.images
      ? {
          url: imageProxy(image_url),
          width: metadata.open_graph.images[0].width || image_resolution?.width,
          height:
            metadata.open_graph.images[0].height || image_resolution?.height,
          image_square:
            (metadata.open_graph.images[0].width || image_resolution?.width) ===
            (metadata.open_graph.images[0].height || image_resolution?.height)
        }
      : undefined,
    favicon: imageProxy(
      metadata.favicon ||
        `https://www.google.com/s2/favicons?domain=https://${
          new URL(url).hostname
        }&sz=256`
    )
  };

  await redis.set(
    `url_metadata:${url_as_base64}`,
    JSON.stringify(final_object)
  );

  return final_object;
}

export async function getURLFromText(text: string): Promise<URLMetadata[]> {
  const urls = text.match(/https?:\/\/(?:www\.)?[^\s/$.?#].[^\s]*/gi);

  if (!urls) {
    return [];
  }

  let processed_urls: URLMetadata[] = [];

  for await (const url of urls) {
    processed_urls = [...processed_urls, await getURLMetadataFromCache(url)];
  }

  return processed_urls;
}

function imageProxy(url: string) {
  const base64 = Buffer.from(url).toString("base64");

  return `https://imgproxy.folkscommunity.com/plain/mb:500000/${base64}.webp`;
}
