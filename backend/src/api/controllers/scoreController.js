// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/api/controllers/scoreController.js

const { Score, User } = require("../../models");

// @desc    Submit a new score
// @route   POST /api/scores
// @access  Private
exports.submitScore = async (req, res) => {
  const { game_mode, score, game_duration_seconds, details } = req.body;
  const userId = req.user.id; // Extracted from authMiddleware

  try {
    const newScore = await Score.create({
      userId,
      game_mode,
      score,
      game_duration_seconds,
      details,
    });

    res.status(201).json(newScore);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @desc    Get leaderboard for a specific game mode
// @route   GET /api/scores/leaderboard?game_mode=<mode>&limit=<N>
// @access  Public
exports.getLeaderboard = async (req, res) => {
  const { game_mode } = req.query;
  const limit = parseInt(req.query.limit) || 10; // Default to Top 10

  if (!game_mode) {
    return res.status(400).json({ msg: "Game mode query parameter is required" });
  }

  try {
    const leaderboard = await Score.findAll({
      where: { game_mode },
      order: [["score", "DESC"]],
      limit: limit,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username"],
        },
      ],
      attributes: { exclude: ["userId", "updated_at"] }, // Exclude userId as user object is included
    });

    res.json(leaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

