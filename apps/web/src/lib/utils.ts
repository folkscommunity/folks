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
