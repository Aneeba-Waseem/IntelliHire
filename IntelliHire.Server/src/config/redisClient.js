import Redis from "ioredis";

let redisClient;

if (!global.redisClient) {
  redisClient = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,              // 🔥 DO NOT auto-connect
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 5) {
        console.error("❌ Redis: stopped retrying");
        return null; // stop reconnect loop
      }
      return Math.min(times * 200, 2000);
    },
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  redisClient.on("close", () => {
    console.warn("⚠️ Redis connection closed");
  });

  global.redisClient = redisClient;
} else {
  redisClient = global.redisClient;
}

export { redisClient };