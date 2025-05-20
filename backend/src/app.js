const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const { sequelize } = require("../models");
const { initializeSocketIO } = require("./socketHandlers");

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Import routes
const authRoutes = require("./api/routes/authRoutes");
const friendshipRoutes = require("./api/routes/friendshipRoutes"); // Import friendship routes

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize Socket.IO handlers
initializeSocketIO(io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/friendships", friendshipRoutes); // Use friendship routes

app.get("/", (req, res) => {
  res.send("Gyul! Hap! Backend is running!");
});

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // Pass io to req object so controllers can use it for emitting events
    app.use((req, res, next) => {
        req.io = io;
        next();
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.IO is listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database or start server:", error);
  }
};

startServer();

module.exports = { app, server, io };
