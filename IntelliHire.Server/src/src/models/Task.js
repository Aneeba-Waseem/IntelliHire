import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Task = db.define("Task", {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  url: { type: DataTypes.STRING },
  assignedTo: { type: DataTypes.INTEGER, allowNull: false }, // User ID
  status: { type: DataTypes.STRING, defaultValue: "Pending" }, // Pending, In Progress, Completed
});

export default Task;
