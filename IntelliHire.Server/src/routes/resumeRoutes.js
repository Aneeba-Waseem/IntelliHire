import express from "express";
import { getCandidateProfileById } from "../controllers/resumeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:resumeId",authMiddleware, getCandidateProfileById);

export default router;