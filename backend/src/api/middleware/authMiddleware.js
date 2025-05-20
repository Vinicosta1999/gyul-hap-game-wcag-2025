const jwt = require("jsonwebtoken");
const { User } = require("../../models");
require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (token == null) {
    return res.sendStatus(401); // No token, unauthorized
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id, { attributes: ["id", "username"] });
    if (!user) {
      return res.status(403).json({ error: "User not found for token." }); // Token valid, but user doesn't exist
    }
    req.user = user; // Add user to request object
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token." }); // Token is not valid
  }
};

module.exports = { authenticateToken };
