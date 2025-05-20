// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/api/routes/dailyChallengeRoutes.js (Corrigido)

const express = require("express");
const router = express.Router();
const dailyChallengeController = require("../controllers/dailyChallengeController");
const { isAuthenticated } = require("../middleware/authMiddleware"); // Importar diretamente a função isAuthenticated
const { validateScoreSubmission } = require("../middleware/validators"); // Assuming score submission for daily challenge uses similar validation

// @route   GET api/daily-challenge/today
// @desc    Get today's daily challenge (e.g., seed or card set)
// @access  Public (or Private if user must be logged in to see it)
router.get("/today", dailyChallengeController.getTodaysChallenge);

// @route   POST api/daily-challenge/submit
// @desc    Submit score for today's daily challenge
// @access  Private (requires authentication)
router.post("/submit", isAuthenticated, validateScoreSubmission, dailyChallengeController.submitDailyChallengeScore);

module.exports = router;

