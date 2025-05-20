// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/api/routes/roomRoutes.js

const express = require("express");
const router = express.Router();
// const roomController = require("../controllers/roomController"); // To be created
const authMiddleware = require("../middleware/authMiddleware");

// Note: Most real-time room interactions will be handled via WebSockets, not REST APIs.
// These REST endpoints could be for initiating or listing rooms, if needed.

// @route   POST api/rooms
// @desc    Create a new game room (might be handled by WebSocket connection event instead)
// @access  Private
// router.post("/", authMiddleware, roomController.createRoom);

// @route   GET api/rooms
// @desc    Get a list of available game rooms (optional, depends on design)
// @access  Public or Private
// router.get("/", roomController.listRooms);

// @route   POST api/rooms/:room_code/join
// @desc    Join a game room (might be handled by WebSocket connection event instead)
// @access  Private
// router.post("/:room_code/join", authMiddleware, roomController.joinRoom);

module.exports = router;

