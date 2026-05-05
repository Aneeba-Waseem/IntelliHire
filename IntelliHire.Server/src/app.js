import express from "express";
import cors from "cors";

// ============================================
// CRITICAL: CORS MUST BE FIRST
// ============================================
const app = express();

// ✅ CORS middleware - MUST be before all routes
app.use(cors({
  origin: "https://intelli-hire-5k2g.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,  // ✅ ADD THIS - for older browsers/clients
}));

// ✅ Body parsing middleware - MUST be before routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ============================================
// NOW import and register all routes
// ============================================
import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import jobDescriptionRoutes from "./routes/jobDescriptionRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import jobCacheRoutes from "./routes/jobCache.js";
import flowRoutes from "./routes/flowRoutes.js";
import { sendInterviewEmails } from "./routes/interviewEmail.js";
import finalizeHiring from "./routes/finalizeHiring.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";
import interviewTimeRoutes from "./routes/interviewTimeRoutes.js";
import clearCacheRoutes from "./routes/clearCacheRoutes.js";

// ============================================
// Register routes (CORS already applied)
// ============================================
app.use("/api/jobCache", jobCacheRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/job-description", jobDescriptionRoutes);
app.use("/api/interview-email", sendInterviewEmails);
app.use("/api/finalizeHiring", finalizeHiring);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/user", userRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/evaluation", evaluationRoutes);
app.use("/api/cache", clearCacheRoutes);
app.use("/api/interview-time", interviewTimeRoutes);

export default app;