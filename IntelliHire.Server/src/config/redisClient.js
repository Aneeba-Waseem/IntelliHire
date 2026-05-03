// redisClient.js (using ioredis)
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL || {
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

redisClient.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("ready", () => {
  console.log("✅ Redis ready");
});

// ✅ Export both ways so it works with either import style
export default redisClient;
export { redisClient };