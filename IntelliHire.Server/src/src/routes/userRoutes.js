import express from "express";
import upload from "../middleware/upload.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { getUsers, getUserById, updateUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// All routes below require authentication
router.use(authenticate);

// Get all users (any authenticated user)
router.get("/", getUsers);

// Get single user (any authenticated user)
router.get("/:id", getUserById);

// Update user (authenticated user only, can add role check if needed)
router.put(
  "/:id",
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "cv", maxCount: 1 }
  ]),
  updateUser
);

// Delete user (only admin)
router.delete("/:id", authorize("Admin"), deleteUser);

export default router;
