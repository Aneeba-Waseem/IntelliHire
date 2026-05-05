import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js"
import jobDescriptionRoutes from "./routes/jobDescriptionRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import jobCacheRoutes from "./routes/jobCache.js";
import flowRoutes from "./routes/flowRoutes.js";
import { sendInterviewEmails } from "./routes/interviewEmail.js";
import  finalizeHiring  from "./routes/finalizeHiring.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js"
import userRoutes from "./routes/userRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js"
import interviewTimeRoutes from "./routes/interviewTimeRoutes.js";
import clearCacheRoutes from "./routes/clearCacheRoutes.js"
const app = express();

app.use(cors({
    origin: "https://intelli-hire-5k2g.vercel.app",
    credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
app.use("/api/evaluation", evaluationRoutes)
app.use("/api/cache" , clearCacheRoutes )
app.use("/api/interview-time", interviewTimeRoutes);
export default app;
