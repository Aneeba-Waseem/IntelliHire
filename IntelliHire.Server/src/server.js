// server.js
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });

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

// --------------------
// Config & Middleware
// --------------------
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

export default interviewController;

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