import Redis from "ioredis";

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

const redis = new Redis(process.env.REDIS_URL);

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export default redis;

// ✅ Export both ways so it works with either import style
export default redisClient;
export { redisClient };