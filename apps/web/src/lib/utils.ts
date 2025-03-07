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

  if (diff < 1000 * 60 * 60 * 24 * 7) {
    return Math.floor(diff / 1000 / 60 / 60 / 24) + "d" + (ago ? " ago" : "");
  }

  return date.toISOString().split("T")[0];
}

export function optimizedImageUrl(
  url: string,
  width?: number,
  height?: number
) {
  const url_as_base64 = Buffer.from(url).toString("base64");

  if (!width && !height) {
    return `https://imgproxy.folkscommunity.com/plain/${url_as_base64}.png`;
  } else if (width && !height) {
    return `https://imgproxy.folkscommunity.com/plain/w:${width}/${url_as_base64}.webp`;
  } else {
    return `https://imgproxy.folkscommunity.com/plain/${width && height ? `rs:fill:${width}:${height}:0/` : ""}${url_as_base64}.png`;
  }
}

export function getRelativeDate(date: Date): string {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30); // Approximation
  const diffInYears = Math.floor(diffInDays / 365); // Approximation

  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

  if (diffInDays === 0) {
    return "today";
  } else if (diffInDays === 1) {
    return rtf.format(-1, "day");
  } else if (diffInDays < 7) {
    return rtf.format(-diffInDays, "day");
  } else if (diffInWeeks === 1) {
    return rtf.format(-1, "week");
  } else if (diffInWeeks < 4) {
    return rtf.format(-diffInWeeks, "week");
  } else if (diffInMonths === 1) {
    return rtf.format(-1, "month");
  } else if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, "month");
  } else if (diffInYears === 1) {
    return rtf.format(-1, "year");
  } else {
    return rtf.format(-diffInYears, "year");
  }
}

export function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  return months[month - 1];
}

export function formatArticleDate(date: any) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();

  return `${getMonthName(Number(month))} ${day}, ${year} (${getRelativeDate(
    d
  )})`;
}
