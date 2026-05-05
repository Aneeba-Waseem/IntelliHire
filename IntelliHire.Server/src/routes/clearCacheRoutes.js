import express from "express";
import { clearAllCache } from "../controllers/clearCacheController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.delete("/clearAll", clearAllCache);

export default router;