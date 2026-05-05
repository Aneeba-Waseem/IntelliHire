import Redis from "ioredis";

let client = null;

export function getRedisClient() {
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    client.on("connect", () => {
      console.log("✅ Redis connected");
    });

    client.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
    });
  }

  return client;
}
// Local

// import { createClient } from "redis";

// export const redisClient = createClient({ url: "redis://127.0.0.1:6379" });

// redisClient.on("error", (err) => console.log("Redis Client Error", err));

// (async () => {
//   await redisClient.connect();
//   console.log("✅ Redis connected");
// })();
