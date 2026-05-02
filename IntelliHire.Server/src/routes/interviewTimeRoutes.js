import express from "express";
import { getRemainingTime } from "../controllers/interviewTimeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/remaining-time/:candidateUserId",
  authMiddleware,
  getRemainingTime
);

export default router;