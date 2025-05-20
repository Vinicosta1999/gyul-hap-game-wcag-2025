// /home/ubuntu/gyul_hap_full_stack_wcag_project/backend/src/api/middleware/validators.js

const { check, validationResult } = require("express-validator");

exports.validateRegistration = [
  check("username", "Username is required").not().isEmpty(),
  check("username", "Username must be at least 3 characters long").isLength({ min: 3 }),
  check("password", "Password is required").not().isEmpty(),
  check("password", "Password must be at least 6 characters long").isLength({ min: 6 }),
  check("email", "Please include a valid email").optional().isEmail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

exports.validateLogin = [
  check("username", "Username is required").not().isEmpty(),
  check("password", "Password is required").exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

exports.validateScoreSubmission = [
    check("game_mode", "Game mode is required").not().isEmpty(),
    check("score", "Score is required and must be an integer").isInt(),
    check("game_duration_seconds", "Game duration must be an integer if provided").optional().isInt(),
    check("details", "Details must be an object if provided").optional().isObject(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

