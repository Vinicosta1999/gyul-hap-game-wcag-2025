const express = require("express");
const router = express.Router();
const friendshipController = require("../controllers/friendshipController");
const authMiddleware = require("../middleware/authMiddleware");

// All friendship routes are protected
router.use(authMiddleware);

// Search for users
// GET /api/friendships/search?username=...
router.get("/search", friendshipController.searchUsers);

// Send a friend request
// POST /api/friendships/request
router.post("/request", friendshipController.sendFriendRequest);

// Respond to a friend request (accept or reject)
// PUT /api/friendships/request/:requestId
router.put("/request/:requestId", friendshipController.respondToFriendRequest);

// List all friends (accepted friendships)
// GET /api/friendships
router.get("/", friendshipController.listFriends);

// List pending friend requests (requests sent to the current user)
// GET /api/friendships/pending
router.get("/pending", friendshipController.listPendingRequests);

// Remove a friend or cancel a sent request
// DELETE /api/friendships/:friendshipId
router.delete("/:friendshipId", friendshipController.removeFriendship);

// Optional: Block a user
// POST /api/friendships/block/:userId
// router.post("/block/:userId", friendshipController.blockUser);

// Optional: Unblock a user
// DELETE /api/friendships/block/:userId
// router.delete("/block/:userId", friendshipController.unblockUser);

module.exports = router;

