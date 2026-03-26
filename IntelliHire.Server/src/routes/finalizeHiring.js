import express from "express";
import { finalizeHiring } from "../controllers/finalizeHiringController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, finalizeHiring);

export default router;