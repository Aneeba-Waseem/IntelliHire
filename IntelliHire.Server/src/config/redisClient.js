import Redis from "ioredis";

// Only load dotenv locally
if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

const redisClient = new Redis(process.env.REDIS_URL, {
  tls: {}, // 👈 REQUIRED for public Railway Redis
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

export default redisClient;