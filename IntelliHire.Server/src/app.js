import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js"
import jobDescriptionRoutes from "./routes/jobDescriptionRoutes.js";
import listRoutes from "./routes/listRoutes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/job-description", jobDescriptionRoutes);

export default app;
