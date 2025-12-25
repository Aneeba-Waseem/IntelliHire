import express from "express";
import { createTask, getTasks, updateTask, getTaskById, getOtherTasks } from "../controllers/taskController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

// Only admin can create tasks
router.post("/", authenticate, authorize("Admin"), createTask);

// Authenticated users can view tasks assigned to them
router.get("/", authenticate, getTasks);

// Get all tasks
router.get("/others", authenticate, authorize("Admin"), getOtherTasks);

// Get single task
router.get("/:id", getTaskById);

// Authenticated users can update task status
router.put("/:id", authenticate, updateTask);

export default router;
