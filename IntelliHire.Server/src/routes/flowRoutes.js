import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

export default function createFlowRoutes(controller) {
  router.post("/start", authMiddleware,controller.startInterview);
  router.post("/answer", authMiddleware, controller.submitAnswer);
  router.get("/report/:sessionId", authMiddleware, controller.getReport);
  router.get("/:jobId/topics", authMiddleware, controller.getTopicsForJob);
  
  router.get("/remaining-time/:candidateUserId", authMiddleware, controller.getTopicsForJob);

  return router;
}