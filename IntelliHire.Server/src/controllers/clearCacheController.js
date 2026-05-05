import { redisClient } from "../config/redisClient.js";
export const clearAllCache = async (req, res) => {
  try {
    const { batchId } = req.body;

    const userId = req.user.AutoId; // from auth middleware

    const step1Key = `job:${userId}:step1`;
    const step2Key = `job:${userId}:step2:batchId`;
    const batchKey = batchId;
    const statusKey = `${batchId}_status`;

    await redis.del(step1Key);
    await redis.del(step2Key);
    await redis.del(batchKey);
    await redis.del(statusKey);

    console.log("🧹 Cache cleared");

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Cache clear error:", err);
    return res.status(500).json({ message: "Failed to clear cache" });
  }
};