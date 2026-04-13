import express from "express";
import { createJobDescription, getJobDescriptionById, getJobInterviewStats } from "../controllers/jobDescriptionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/createJob", authMiddleware,createJobDescription);
router.get("/:id",authMiddleware, getJobDescriptionById);
router.get("/job/:jobId/interviews", authMiddleware, getJobInterviewStats);

export default router;
