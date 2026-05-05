// server.js
import dotenv from "dotenv";
dotenv.config({
  path: process.env.NODE_ENV === "production" ? undefined : ".env",
});



import puppeteer from "puppeteer";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// App, DB & Redis
import app from "./app.js";
import sequelize from "./config/db.js";
import { getRedisClient } from "./config/redisClient.js";

const redisClient = getRedisClient();

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

const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: "https://intelli-hire-5k2g.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type" , "Authorization"],
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
    origin: "https://intelli-hire-5k2g.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

export { io };

// --------------------
// PDF Generation Route (Puppeteer)
// --------------------
app.post("/generate-pdf", async (req, res) => {
  try {
    const { report, includeDetails } = req.body;

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Step 1: Open page FIRST
    await page.goto("https://intelli-hire-5k2g.vercel.app/print-report", {
      waitUntil: "domcontentloaded",
    });

    // Step 2: Inject data BEFORE render
    await page.evaluate((data, includeDetails) => {
  localStorage.setItem("report", JSON.stringify(data));
  localStorage.setItem("includeDetails", JSON.stringify(includeDetails));
}, report, includeDetails);

    // Step 3: Reload so React picks data
    await page.reload({ waitUntil: "networkidle0" });

    // Step 4: Wait until UI is ready
    await page.waitForSelector("#pdf-ready", {
      timeout: 15000,
    });

    // Step 5: Ensure correct CSS rendering
    await page.emulateMediaType("screen");

    // Step 6: Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
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

    if (!global._serverStarted) {
      global._serverStarted = true;

      server.listen(PORT, async () => {
        console.log(`Server running on port ${PORT}`);

        try {
          if (redisClient.status === "wait") {
            await redisClient.connect();
          }
        } catch (err) {
          console.error("❌ Redis connection failed:", err.message);
        }
      });
    }

  } catch (err) {
    console.error("Database connection failed:", err);
  }
})();

// Local
// import dotenv from "dotenv";
// dotenv.config({ path: "./src/.env" });


// import puppeteer from "puppeteer";
// import express from "express";
// import cors from "cors";
// import { createServer } from "http";
// import { Server } from "socket.io";

// // App, DB & Redis
// import app from "./app.js";
// import sequelize from "./config/db.js";
// import { redisClient } from "./config/redisClient.js";

// // Models (register associations)
// import "./index.js";

// // Repositories
// import InterviewSessionRepository from "./repositories/InterviewSessionRepository.js";
// import InterviewTurnRepository from "./repositories/InterviewTurnRepository.js";

// // Sequelize Models
// import  InterviewSession  from "./cacheModels/InterviewSession.js";
// import  InterviewTurn  from "./cacheModels/InterviewTurn.js";

// // AI & Service Layer
// import AIClient from "./AI/AIClient.js";
// import FlowService from "./services/FlowService.js";
// import InterviewController from "./controllers/InterviewController.js";
// import FlowController from "./controllers/flowController.js";
// import createFlowRoutes from "./routes/flowRoutes.js";

// // --------------------
// // Config & Middleware
// // --------------------
// dotenv.config();
// const PORT = process.env.PORT || 8000;

// app.use(
//   cors({
//     origin: "https://intelli-hire-5k2g.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type"],
//   })
// );

// app.use(express.json());

// redisClient.on("error", (err) =>
//   console.error("Redis Client Error:", err)
// );

// // --------------------
// // Repositories
// // --------------------
// const sessionRepo = new InterviewSessionRepository(InterviewSession);
// const turnRepo = new InterviewTurnRepository(InterviewTurn);

// // --------------------
// // AI & Service Layer
// // --------------------
// const aiClient = new AIClient(process.env.AI_SERVICE_URL);
// const flowService = new FlowService({
//   aiClient,
//   sessionRepo,
//   turnRepo,
// });
// const interviewController = new InterviewController({ flowService });
// const flowController = new FlowController({ flowService });
// app.use("/api/flow", createFlowRoutes(flowController));
// export default interviewController;
// export { flowController };

// // --------------------
// // HTTP & Socket.IO Setup
// // --------------------
// const server = createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: "https://intelli-hire-5k2g.vercel.app",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   },
// });

// export { io };

// // --------------------
// // PDF Generation Route (Puppeteer)
// // --------------------
// app.post("/generate-pdf", async (req, res) => {
//   try {
//     const { report, includeDetails } = req.body;

//     const browser = await puppeteer.launch({
//       headless: "new",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     const page = await browser.newPage();

//     // Step 1: Open page FIRST
//     await page.goto("https://intelli-hire-5k2g.vercel.app/print-report", {
//       waitUntil: "domcontentloaded",
//     });

//     // Step 2: Inject data BEFORE render
//     await page.evaluate((data, includeDetails) => {
//   localStorage.setItem("report", JSON.stringify(data));
//   localStorage.setItem("includeDetails", JSON.stringify(includeDetails));
// }, report, includeDetails);

//     // Step 3: Reload so React picks data
//     await page.reload({ waitUntil: "networkidle0" });

//     // Step 4: Wait until UI is ready
//     await page.waitForSelector("#pdf-ready", {
//       timeout: 15000,
//     });

//     // Step 5: Ensure correct CSS rendering
//     await page.emulateMediaType("screen");

//     // Step 6: Generate PDF
//     const pdf = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: {
//         top: "20px",
//         bottom: "20px",
//         left: "20px",
//         right: "20px",
//       },
//     });

//     await browser.close();

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": "attachment; filename=report.pdf",
//     });

//     res.send(pdf);
//   } catch (err) {
//     console.error("PDF generation error:", err);
//     res.status(500).send("Failed to generate PDF");
//   }
// });

// // --------------------
// // Boot Server
// // --------------------
// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("PostgreSQL connected...");

//     await sequelize.sync({ alter: true });
//     console.log("Database synced...");

//     server.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   } catch (err) {
//     console.error("Database connection failed:", err);
//   }
// })();
