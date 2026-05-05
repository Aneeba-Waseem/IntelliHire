import { redisClient } from "../config/redisClient.js";
import User from "../models/User.js";

export const clearAllCache = async (req, res) => {
    try {
        const { batchId, userId } = req.body;

        console.log("batchId:", batchId);
        console.log("userId:", userId);

        const user = await User.findOne({
            where: { UserId: userId },
            attributes: ["AutoId"]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const id = user.AutoId;

        const step1Key = `job:${id}:step1`;
        const step2Key = `job:${id}:step2:batchId`;
        const batchKey = batchId;
        const statusKey = `${batchId}_status`;

        await redisClient.del(step1Key);
        await redisClient.del(step2Key);
        await redisClient.del(batchKey);
        await redisClient.del(statusKey);

        console.log("🧹 Cache cleared");

        return res.json({ success: true });
    } catch (err) {
        console.error("❌ Cache clear error:", err);
        return res.status(500).json({ message: "Failed to clear cache" });
    }
};