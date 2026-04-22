import express from "express";
import { saveEvaluation , getEvaluationReport } from "../controllers/evaluationController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/save", authMiddleware,saveEvaluation);
router.get(
  "/report/:candidateId/:jobId",
  authMiddleware,
  getEvaluationReport
);

export default router;