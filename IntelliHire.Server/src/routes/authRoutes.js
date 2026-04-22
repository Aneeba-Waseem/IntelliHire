import express from "express";
import {
    register,
    login,
    refreshAccessToken,
    logout,
    getCurrentUser,
    magicLogin,
    getMagicUser,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------- AUTH ROUTES ----------------

// Register a new user
router.post("/register", register);

// Login
router.post("/login", login);

//candidate login with magic link
router.post("/magic-login", magicLogin);

//get user info from magic link token
router.get("/magic-user", getMagicUser);
// Refresh access token
router.post("/refresh", refreshAccessToken);

// Logout (invalidate refresh token)
router.post("/logout", logout);

// Get current logged-in user (protected)
router.get("/me", authMiddleware, getCurrentUser);

export default router;
