// models/index.js
import UserModel from "./User.js";
import TaskModel from "./Task.js";

// Define associations
TaskModel.belongsTo(UserModel, { foreignKey: "assignedTo", as: "assignee" });
UserModel.hasMany(TaskModel, { foreignKey: "assignedTo", as: "tasks" });

export const User = UserModel;
export const Task = TaskModel;
