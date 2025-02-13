"use server";

import { redis } from "./redis";

export async function ServerRibbon() {
  try {
    const ribbon_cache = await redis.get("cache:ribbon");

    if (ribbon_cache) {
      return ribbon_cache;
    }

    return "";
  } catch (e) {
    return "";
  }
}
