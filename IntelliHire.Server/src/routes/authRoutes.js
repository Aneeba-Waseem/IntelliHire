import express from "express";
import {
    register,
    login,
    refreshAccessToken,
    logout,
    getCurrentUser,
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------- AUTH ROUTES ----------------

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id);

    if (!user) return res.status(404).send("User not found");
    if (user.isVerified) return res.send("Email already verified");

    user.isVerified = true;
    user.verifyToken = null;
    await user.save();

    // Optionally auto-login: generate access + refresh token here
    res.redirect(`${process.env.CLIENT_URL}/userDashboard`);
  } catch (err) {
    console.error(err);
    res.status(400).send("Invalid or expired token");
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
