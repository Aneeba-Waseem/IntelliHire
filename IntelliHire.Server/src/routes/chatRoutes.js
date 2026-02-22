import express from "express";
import interviewController from "./container.js";

const router = express.Router();

router.post(
  "/generate-context",
  interviewController.generateContext
);

router.post(
  "/convert-question",
  interviewController.convertQuestion
);

export default router;