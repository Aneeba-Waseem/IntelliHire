import Redis from "ioredis";

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

let redisClient;

if (!global.redisClient) {
  redisClient = new Redis(process.env.REDIS_URL, {
    retryStrategy(times) {
      return Math.min(times * 50, 2000);
    },
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
  });

  global.redisClient = redisClient;
} else {
  redisClient = global.redisClient;
}

export default redisClient;
export { redisClient };