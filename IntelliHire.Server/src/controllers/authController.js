import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { v4 as uuidv4 } from "uuid";
import MagicLink from "../models/magicLink.js";

// ================= HELPERS =================

// Generate access token
const generateAccessToken = (user, refreshToken) => {
    return jwt.sign(
        {
            userId: user.UserId,
            email: user.email,
            refreshTokenId: refreshToken.RefreshTokenId,
        },
        process.env.JWT_SECRET || "accesssecret",
        { expiresIn: "15m" }
    );
};

// Generate refresh token
const generateRefreshToken = async (user) => {
    const token = uuidv4();
  
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const refreshToken = await RefreshToken.create({
        token,
        userId: user.UserId,
        expiresAt,
        isExpired: false,
    });

    return refreshToken;
};

// ================= REGISTER =================

export const register = async (req, res) => {
    try {
        const { fullName, email, company, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser)
            return res.status(400).json({ error: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            email,
            company,
            password: hashedPassword,
            Role: "Recruiter", // ✅ ADD THIS
        });

        res.status(201).json({
            user: {
                userId: user.UserId,
                fullName: user.fullName,
                email: user.email,
                company: user.company,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// ================= LOGIN =================

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ error: "Invalid credentials" });

        const refreshToken = await generateRefreshToken(user);
        const accessToken = generateAccessToken(user, refreshToken);

        res.json({
            accessToken,
            user: {
                userId: user.UserId,
                fullName: user.fullName,
                email: user.email,
                company: user.company,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// ================= REFRESH =================

export const refreshAccessToken = async (req, res) => {
    try {
        const { accessToken: oldAccessToken } = req.body;
        if (!oldAccessToken)
            return res.status(400).json({ error: "Access token required" });

        const payload = jwt.verify(
            oldAccessToken,
            process.env.JWT_SECRET || "accesssecret"
        );

        const refreshToken = await RefreshToken.findOne({
            where: { RefreshTokenId: payload.refreshTokenId },
        });

        if (!refreshToken || refreshToken.isExpired)
            return res.status(403).json({ error: "Invalid session" });

        const user = await User.findOne({
            where: { UserId: payload.userId },
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        const newAccessToken = generateAccessToken(user, refreshToken);

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(403).json({ error: "Invalid or expired access token" });
    }
};

// ================= LOGOUT =================

export const logout = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.sendStatus(204);

        const payload = jwt.verify(
            accessToken,
            process.env.JWT_SECRET || "accesssecret"
        );

        const refreshToken = await RefreshToken.findOne({
            where: { RefreshTokenId: payload.refreshTokenId },
        });

        if (refreshToken) {
            refreshToken.isExpired = true;
            await refreshToken.save();
        }

        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

// ================= CURRENT USER =================

export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;

        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            userId: user.UserId,
            fullName: user.fullName,
            email: user.email,
            company: user.company,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};


export const magicLogin = async (req, res) => {
  try {
    const { token } = req.body;
    // console.log("LOGIN TOKEN:", ?req.body.token);
    const record = await MagicLink.findOne({ where: { token } });

    if (!record || record.isUsed || new Date() > record.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired link" });
    }

    const user = await User.findOne({
         where: { UserId: record.FK_userId }, // ✅ FIX
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    const refreshToken = await generateRefreshToken(user);
    const accessToken = generateAccessToken(user, refreshToken);

    record.isUsed = true;
    await record.save();

    res.json({
      accessToken,
      user: {
        userId: user.UserId,
        email: user.email,
        fullName: user.fullName,
        role: user.Role,
      },
    });
    console.log("Magic login successful for user:", {
      userId: user.UserId,
      email: user.email,        
      fullName: user.fullName,
      role: user.Role,
    });
  } catch (err) {
    res.status(500).json({ error: "Magic login failed" });
  }
};

// GET candidate info from token (NO LOGIN YET)
export const getMagicUser = async (req, res) => {
  try {
    const { token } = req.query;
    console.log("TOKEN RECEIVED:", req.query.token);
    const record = await MagicLink.findOne({ where: { token } });

    if (!record || record.isUsed || new Date() > record.expiresAt) {
      return res.status(400).json({ error: "Invalid or expired link" });
    }

    const user = await User.findOne({
         where: { UserId: record.FK_userId }, // ✅ FIX
    });
    
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      fullName: user.fullName,
      email: user.email,
    });
    console.log("Fetched user for magic link:", {
      fullName: user.fullName,
      email: user.email,
    });

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};