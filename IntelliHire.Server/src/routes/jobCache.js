import express from "express";
import { getRedisClient } from "../config/redisClient.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const redisClient = getRedisClient();

// Save/update Step1 data in Redis
router.post("/cacheStep1", authMiddleware, async (req, res) => {
  const userId = req.user.AutoId; // user id from JWT
  const step1Data = req.body;

  try {
    await redisClient.set(`job:${userId}:step1`, JSON.stringify(step1Data));
    res.status(200).json({ message: "Step 1 cached successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Redis error" });
  }
});

// Get Step1 data from Redis
router.get("/cacheStep1", authMiddleware, async (req, res) => {
  const userId = req.user.AutoId;

  try {
    const data = await redisClient.get(`job:${userId}:step1`);
    res.status(200).json(data ? JSON.parse(data) : {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Redis error" });
  }
});

// Save Step2 to Redis// Save Step2 batchId
router.post("/cacheStep2Batch", authMiddleware, async (req, res) => {
  const userId = req.user.AutoId;
  const { batchId } = req.body;
  await redisClient.set(`job:${userId}:step2:batchId`, batchId);
  res.json({ message: "batchId saved" });
});

// Get Step2 batchId
router.get("/cacheStep2Batch", authMiddleware, async (req, res) => {
  const userId = req.user.AutoId;
  const batchId = await redisClient.get(`job:${userId}:step2:batchId`);
  res.json({ batchId: batchId || null });
});


export default router;
