import Redis from "ioredis";

export const redis_sub = new Redis(process.env.REDIS_URL!);

export const redis_pub = new Redis(process.env.REDIS_URL!);

export const redis = new Redis(process.env.REDIS_URL!);
