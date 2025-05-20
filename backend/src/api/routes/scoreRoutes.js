// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/api/routes/scoreRoutes.js (Corrigido)

const express = require("express");
const router = express.Router();
const scoreController = require("../controllers/scoreController");
const { isAuthenticated } = require("../middleware/authMiddleware"); // Importar diretamente a função isAuthenticated
const { validateScoreSubmission } = require("../middleware/validators");

// @route   POST api/scores
// @desc    Submit a new score
// @access  Private (requires authentication)
router.post("/", isAuthenticated, validateScoreSubmission, scoreController.submitScore);

// @route   GET api/scores/leaderboard
// @desc    Get leaderboard for a specific game mode
// @access  Public
router.get("/leaderboard", scoreController.getLeaderboard);

module.exports = router;

