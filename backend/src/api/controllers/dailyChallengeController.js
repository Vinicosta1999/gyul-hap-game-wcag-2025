// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/api/controllers/dailyChallengeController.js

const { DailyChallenge, DailyChallengeSubmission, Score, User } = require("../../models");
const { Op } = require("sequelize");
const crypto = require("crypto"); // For generating a seed if needed

// Helper function to get today's date in YYYY-MM-DD format (UTC)
const getTodayDateUTC = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// @desc    Get today's daily challenge (e.g., seed or card set)
// @route   GET /api/daily-challenge/today
// @access  Public (or Private depending on requirements)
exports.getTodaysChallenge = async (req, res) => {
  const todayStr = getTodayDateUTC();

  try {
    let challenge = await DailyChallenge.findOne({ where: { challenge_date: todayStr } });

    if (!challenge) {
      // Generate a new seed for today if it doesn't exist
      // This is a simple seed generation; a more robust one might be needed
      const seed = crypto.randomBytes(16).toString("hex");
      challenge = await DailyChallenge.create({
        challenge_date: todayStr,
        seed: seed,
      });
    }

    // Optionally, if the user is logged in, check if they've already submitted for today
    let submission = null;
    if (req.user && req.user.id) { // Assuming authMiddleware might be optional or used
        submission = await DailyChallengeSubmission.findOne({
            where: {
                dailyChallengeId: challenge.id,
                userId: req.user.id
            }
        });
    }

    res.json({
      id: challenge.id,
      challenge_date: challenge.challenge_date,
      seed: challenge.seed,
      // card_set: challenge.card_set, // If you store pre-generated cards
      already_submitted: !!submission // True if a submission exists for this user today
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error while fetching daily challenge");
  }
};

// @desc    Submit score for today's daily challenge
// @route   POST /api/daily-challenge/submit
// @access  Private
exports.submitDailyChallengeScore = async (req, res) => {
  const { score, game_duration_seconds, details } = req.body;
  const userId = req.user.id; // From authMiddleware
  const todayStr = getTodayDateUTC();

  try {
    const dailyChallenge = await DailyChallenge.findOne({ where: { challenge_date: todayStr } });

    if (!dailyChallenge) {
      return res.status(404).json({ msg: "No daily challenge found for today. Cannot submit score." });
    }

    // Check if user has already submitted for this challenge
    const existingSubmission = await DailyChallengeSubmission.findOne({
      where: {
        dailyChallengeId: dailyChallenge.id,
        userId: userId,
      },
    });

    if (existingSubmission) {
      return res.status(400).json({ msg: "You have already submitted a score for today's challenge." });
    }

    // Create a new score entry
    const newScoreEntry = await Score.create({
      userId,
      game_mode: `daily_challenge_${todayStr}`,
      score,
      game_duration_seconds,
      details: { ...(details || {}), seed: dailyChallenge.seed }, // Include seed in details
    });

    // Create a new daily challenge submission entry
    await DailyChallengeSubmission.create({
      dailyChallengeId: dailyChallenge.id,
      userId: userId,
      scoreId: newScoreEntry.id,
    });

    res.status(201).json({ 
        message: "Daily challenge score submitted successfully", 
        score: newScoreEntry 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error while submitting daily challenge score");
  }
};

