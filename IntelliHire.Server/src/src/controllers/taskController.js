import { User, Task } from "../models/index.js";
import { io } from "../server.js"; 
import { Op } from "sequelize";

// Get all tasks (Admin)
export const getOtherTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.findAll({
      where: {
        assignedTo: { [Op.ne]: userId }, 
        status: { [Op.in]: ["Pending", "In Progress"] } 
      },
      include: [
        { model: User, as: "assignee", attributes: ["id", "fullName", "role"] }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error in getOtherTasks:", error);
    res.status(500).json({ error: "Error fetching other users' tasks" });
  }
};

// Create task
export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo } = req.body;

    const user = await User.findByPk(assignedTo);
    if (!user) return res.status(404).json({ error: "User not found" });

    const task = await Task.create({ title, description, assignedTo });
    // Notify all clients real-time
    io.emit("taskCreated", task);
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating task" });
  }
};

// Get all tasks assigned to current user
export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id; // current logged-in user
    const tasks = await Task.findAll({
      where: { assignedTo: userId, 
        status: { [Op.in]: ["Pending", "In Progress"] }  },
      include: [
        { model: User, as: "assignee", attributes: ["id", "fullName", "role"] }
      ]
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching tasks" });
  }
};

// Get single task
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Tasknot found" });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching task" });
  }
};

// Update task status
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const userId = req.user.id;
    const isAdmin = req.user.role === "Admin";

    if (!isAdmin && task.assignedTo !== userId) {
      return res.status(403).json({ error: "You cannot edit this task" });
    }

    // Allowed fields
    const allowedFields = isAdmin
      ? ["title", "description", "status", "url", "assignedTo"]
      : ["status", "url"];

    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    await task.update(updates);

    // Real-time notify
    io.emit("taskUpdated", task);
    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Error updating task" });
  }
};

