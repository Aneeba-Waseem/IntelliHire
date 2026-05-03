// redisClient.js (using ioredis)
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || {
  host: "localhost",
  port: 6379,
  password: undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redis.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("ready", () => {
  console.log("✅ Redis ready");
});

export default redis;