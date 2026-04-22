import express from "express";
import { updateProfile } from "../controllers/userController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js"; // multer config
import { getCurrentUser } from "../controllers/userController.js";

const router = express.Router();

router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"), // matches frontend key
  updateProfile
);


router.get("/me", authMiddleware, getCurrentUser);

export default router;

