import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import { v4 as uuidv4 } from 'uuid';
import sendEmail from "../utils/sendEmail.js"

// ---------------- HELPERS ----------------

// Generate access token with refreshTokenId claim
const generateAccessToken = (user, refreshTokenInstance) => {
    return jwt.sign(
        {
            userId: user.AutoId,
            userUuid: user.UserId,
            email: user.email,
            refreshTokenId: refreshTokenInstance.AutoId,
        },
        process.env.JWT_SECRET || "accesssecret",
        { expiresIn: "24h" }
    );
};

// Generate refresh token (stored only in DB)
const generateRefreshToken = async (user) => {
    const count = await RefreshToken.count({
        where: { userId: user.AutoId }
    });
    console.log("Existing tokens:", count);
    await RefreshToken.update(
        { isExpired: true },
        { where: { userId: user.AutoId } }
    );

    const token = uuidv4(); // generate a random UUID token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const refreshTokenInstance = await RefreshToken.create({
        token,
        userId: user.AutoId, // <-- Use AutoId instead of id
        isExpired: false,
        expiresAt
    });
    return refreshTokenInstance;
};

// ---------------- REGISTER ----------------
export const register = async (req, res) => {
    try {
        const { fullName, email, company, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            email,
            company,
            password: hashedPassword,
            isVerified: false,
        });

        // Generate email verification token (JWT)
        const verifyToken = jwt.sign({ userId: user.AutoId }, process.env.JWT_SECRET, { expiresIn: "24h" });
        user.verifyToken = verifyToken;
        await user.save();
        console.log("Sending email to:", user.email);

        // Send verification email
        const verifyLink = `${process.env.CLIENT_URL}/verify-notice?token=${verifyToken}`;
        await sendEmail(user.email, "Verify your email", `Click here to verify your email: ${verifyLink}`);

        res.status(201).json({ message: "Verification email sent. Check your inbox!" });

    } catch (err) {
        console.error(err);

        // Handle unique email error cleanly
        if (err.name === "SequelizeUniqueConstraintError") {
            return res.status(400).json({ error: "Email already exists" });
        }

        res.status(500).json({ error: "Something went wrong" });
    }
};


// ---------------- email verification ----------------

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const refreshTokenInstance = await generateRefreshToken(user);
        const accessToken = generateAccessToken(user, refreshTokenInstance);

        res.json({
            accessToken,
            refreshToken: refreshTokenInstance.token,
            user: {
                id: user.AutoId,
                uuid: user.UserId,     // send the UUID as well
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

export const refreshAccessToken = async (req, res) => {
    try {
        console.log("coming in the refresh acess token")
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

        const refreshTokenInstance = await RefreshToken.findOne({ where: { token: refreshToken, isExpired: false } });
        if (!refreshTokenInstance) return res.status(403).json({ error: "Invalid refresh token" });

        const user = await User.findByPk(refreshTokenInstance.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const newAccessToken = generateAccessToken(user, refreshTokenInstance);
        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};


// ---------------- LOGOUT ----------------
export const logout = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.sendStatus(204);

        const payload = jwt.verify(accessToken, process.env.JWT_SECRET || "accesssecret");

        const refreshToken = await RefreshToken.findByPk(payload.refreshTokenId);
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

// ---------------- GET CURRENT USER ----------------
export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json({
            id: user.AutoId,
            uuid: user.UserId,
            fullName: user.fullName,
            email: user.email,
            company: user.company,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};
