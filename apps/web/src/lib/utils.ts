import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dateRelativeTiny(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 1000 * 60) {
    const seconds = Math.floor(diff / 1000);
    return seconds + "s";
  }

  if (diff < 1000 * 60 * 60) {
    return Math.floor(diff / 1000 / 60) + "m";
  }

  if (diff < 1000 * 60 * 60 * 24) {
    return Math.floor(diff / 1000 / 60 / 60) + "h";
  }

  return date.toISOString().split("T")[0];
}
