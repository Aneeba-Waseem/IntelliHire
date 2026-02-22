import jwt from "jsonwebtoken";  // ✅ import jwt
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "No token provided" });

        const token = authHeader.split(" ")[1];
        if (!token) return res.status(401).json({ error: "No token provided" });

        console.log("Token received:", token);

        const payload = jwt.verify(token, process.env.JWT_SECRET || "accesssecret");
        console.log("JWT payload:", payload);

        const refreshToken = await RefreshToken.findByPk(payload.refreshTokenId);
        if (!refreshToken || refreshToken.isExpired) return res.status(401).json({ error: "Session expired or invalid" });

        const user = await User.findByPk(payload.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        req.user = user;
        req.refreshToken = refreshToken;

        next();
    } catch (err) {
        console.error("JWT error:", err);
        res.status(401).json({ error: "Unauthorized" });
    }
};
