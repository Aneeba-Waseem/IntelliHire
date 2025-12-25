import dotenv from "dotenv";
import app from "./app.js";
import sequelize from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Import models AFTER db connection to define associations
import "./models/index.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

// Wrap app in HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Global socket instance export kareinge
export { io };

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Database connected...");

        await sequelize.sync({ alter: true });
        console.log("Database synced...");

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("DB connection failed:", err);
    }
})();
