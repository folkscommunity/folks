import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dateRelativeTiny(date: Date, ago?: boolean) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 1000 * 60) {
    const seconds = Math.floor(diff / 1000);
    return seconds + "s" + (ago ? " ago" : "");
  }

  if (diff < 1000 * 60 * 60) {
    return Math.floor(diff / 1000 / 60) + "m" + (ago ? " ago" : "");
  }

  if (diff < 1000 * 60 * 60 * 24) {
    return Math.floor(diff / 1000 / 60 / 60) + "h" + (ago ? " ago" : "");
  }

  return date.toISOString().split("T")[0];
}

export function optimizedImageUrl(
  url: string,
  width?: number,
  height?: number
) {
  const url_as_base64 = Buffer.from(url).toString("base64");

  if (!width || !height) {
    return `https://imgproxy.folkscommunity.com/plain/${url_as_base64}.png`;
  } else {
    return `https://imgproxy.folkscommunity.com/plain/${width && height ? `rs:fill:${width}:${height}:0/` : ""}${url_as_base64}.png`;
  }
}
