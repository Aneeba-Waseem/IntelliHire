import express from "express";
import { saveEvaluation } from "../controllers/evaluationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/save", authMiddleware,saveEvaluation);

export default router;