import express from "express";
import { createJobDescription } from "../controllers/jobDescriptionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/createJob", authMiddleware,createJobDescription);

export default router;
