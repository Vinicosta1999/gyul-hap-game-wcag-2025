const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../../models"); // Assuming models/index.js exports all models
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key"; // Store this securely!

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUserByUsername = await User.findOne({ where: { username } });
    if (existingUserByUsername) {
      return res.status(400).json({ message: "Username already exists." });
    }
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Password will be hashed by the model's hook beforeCreate
    const newUser = await User.create({
      username,
      email,
      password, // Raw password, will be hashed by hook
    });

    // Create a token
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, {
      expiresIn: "1h", // Token expires in 1 hour
    });

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
};

// Login an existing user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check password
    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Create a token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        lastLoginAt: user.lastLoginAt
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

