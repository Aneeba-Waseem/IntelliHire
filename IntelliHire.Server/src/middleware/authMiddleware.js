import jwt from "jsonwebtoken";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader)
            return res.status(401).json({ error: "No token provided" });

        const token = authHeader.split(" ")[1];

        if (!token)
            return res.status(401).json({ error: "No token provided" });

        // Verify access token
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET || "accesssecret"
        );

        // 🔑 Find refresh token by UUID (NOT PK)
        const refreshToken = await RefreshToken.findOne({
            where: { RefreshTokenId: payload.refreshTokenId },
        });

        if (!refreshToken || refreshToken.isExpired) {
            return res.status(401).json({ error: "Session expired or invalid" });
        }

        // 🔑 Find user by UUID (NOT PK)
        const user = await User.findOne({
            where: { UserId: payload.userId },
        });

        if (!user)
            return res.status(404).json({ error: "User not found" });

        // Attach to request
        req.user = user;
        req.refreshToken = refreshToken;

        next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: "Unauthorized" });
    }
};
