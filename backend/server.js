// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/server.js

require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./src/models"); // Sequelize models and connection

// Import routes
const authRoutes = require("./src/api/routes/authRoutes");
const scoreRoutes = require("./src/api/routes/scoreRoutes");
const dailyChallengeRoutes = require("./src/api/routes/dailyChallengeRoutes");
const roomRoutes = require("./src/api/routes/roomRoutes");

// Initialize Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/daily-challenge", dailyChallengeRoutes);
app.use("/api/rooms", roomRoutes);

// Basic route for testing server
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Gyul Hap Backend API." });
});

// Create HTTP server and integrate Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow frontend origin
    methods: ["GET", "POST"]
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("create_room", (data, callback) => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    console.log(`Room created with code: ${roomCode} by ${socket.id}`);
    socket.join(roomCode);
    callback({ status: "ok", roomCode });
  });

  socket.on("join_room", (roomCode, callback) => {
    const room = io.sockets.adapter.rooms.get(roomCode);
    if (room && room.size < 2) {
      socket.join(roomCode);
      console.log(`${socket.id} joined room ${roomCode}`);
      socket.to(roomCode).emit("player_joined", { playerId: socket.id, roomSize: room.size });
      callback({ status: "ok", message: `Joined room ${roomCode}` });
    } else if (room && room.size >= 2) {
      callback({ status: "error", message: "Room is full" });
    } else {
      callback({ status: "error", message: "Room not found" });
    }
  });

  socket.on("player_action", (data) => {
    console.log(`Player action in room ${data.roomCode}:`, data.action);
    socket.to(data.roomCode).emit("action_broadcast", { playerId: socket.id, action: data.action });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Database synchronization and server start
const PORT = process.env.PORT || 8080;

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  db.sequelize.sync()
    .then(() => {
      console.log("Database synchronized.");
      httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}.`);
        console.log(`Socket.IO listening on port ${PORT}.`);
      });
    })
    .catch((err) => {
      console.error("Failed to sync database: ", err);
    });
}

module.exports = { app, httpServer, io }; // Export app and httpServer for testing

