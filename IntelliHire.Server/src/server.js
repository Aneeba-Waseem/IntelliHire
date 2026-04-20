// server.js
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });


import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// App, DB & Redis
import app from "./app.js";
import sequelize from "./config/db.js";
import { redisClient } from "./config/redisClient.js";

// Models (register associations)
import "./index.js";

// Repositories
import InterviewSessionRepository from "./repositories/InterviewSessionRepository.js";
import InterviewTurnRepository from "./repositories/InterviewTurnRepository.js";

// Sequelize Models
import  InterviewSession  from "./cacheModels/InterviewSession.js";
import  InterviewTurn  from "./cacheModels/InterviewTurn.js";

// AI & Service Layer
import AIClient from "./AI/AIClient.js";
import FlowService from "./services/FlowService.js";
import InterviewController from "./controllers/InterviewController.js";
import FlowController from "./controllers/flowController.js";
import createFlowRoutes from "./routes/flowRoutes.js";

// --------------------
// Config & Middleware
// --------------------
dotenv.config();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

redisClient.on("error", (err) =>
  console.error("Redis Client Error:", err)
);

// --------------------
// Repositories
// --------------------
const sessionRepo = new InterviewSessionRepository(InterviewSession);
const turnRepo = new InterviewTurnRepository(InterviewTurn);

// --------------------
// AI & Service Layer
// --------------------
const aiClient = new AIClient(process.env.AI_SERVICE_URL);
const flowService = new FlowService({
  aiClient,
  sessionRepo,
  turnRepo,
});
const interviewController = new InterviewController({ flowService });
const flowController = new FlowController({ flowService });
app.use("/api/flow", createFlowRoutes(flowController));
export default interviewController;
export { flowController };

// --------------------
// HTTP & Socket.IO Setup
// --------------------
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

export { io };

// --------------------
// PDF Generation Route (Puppeteer)
// --------------------
app.post("/generate-pdf", async (req, res) => {
  try {
    const { report } = req.body;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Open your frontend print route
    await page.goto("http://localhost:5173/print-report", {
      waitUntil: "networkidle0",
    });

    // Inject report data into window
    await page.evaluate((reportData) => {
      window.__REPORT_DATA__ = reportData;
    }, report);

    // Wait until your React page renders
    await page.waitForSelector("#pdf-ready", {
      timeout: 10000,
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=report.pdf",
    });

    res.send(pdf);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  }
});

// --------------------
// Boot Server
// --------------------
(async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected...");

    await sequelize.sync({ alter: true });
    console.log("Database synced...");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection failed:", err);
  }
})();