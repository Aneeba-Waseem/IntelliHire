// redisClient.js (using ioredis)
import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing");
}
const redisClient = new Redis(process.env.REDIS_URL, {
  tls: {}, // 👈 REQUIRED for Railway
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 50, 2000),
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