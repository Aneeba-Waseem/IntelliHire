import Redis from "ioredis";

let redisClient;

export function initRedis() {
  if (redisClient) return redisClient;

  redisClient = new Redis(process.env.REDIS_URL, {
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
    enableOfflineQueue: false,
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  return redisClient;
}

export default () => redisClient;