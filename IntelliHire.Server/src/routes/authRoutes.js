import express from "express";
import {
    register,
    login,
    refreshAccessToken,
    logout,
    getCurrentUser,
} from "../controllers/authController.js";
import User from "../models/User.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------- AUTH ROUTES ----------------
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token missing" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(payload.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "Email already verified" });

    user.isVerified = true;
    user.verifyToken = null;
    await user.save();

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error(err);
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Token expired. Please register again." });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Something went wrong" });
  }
});




// Register a new user
router.post("/register", register);

// Login
router.post("/login", login);

// Refresh access token
router.post("/refresh", refreshAccessToken);

// Logout (invalidate refresh token)
router.post("/logout", logout);

// Get current logged-in user (protected)
router.get("/me", authMiddleware, getCurrentUser);

export default router;
