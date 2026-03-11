// controllers/authController.js
const jwt = require("jsonwebtoken");

// Example: a function to fetch the user from DB by ID (adjust as needed)
const User = require("../models/userModel"); // Replace with your actual User model

exports.getMe = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(404).json({ message: "Not authenticated" });
    }

    // Refresh user from DB to ensure session stays up to date with changes (e.g. station change)
    const user = await User.findById(req.session.user.id).select("-password");
    if (!user) {
      req.session.destroy();
      return res.status(404).json({ message: "User no longer exists" });
    }

    // Update session with latest DB data
    req.session.user = {
      id: user._id,
      username: user.username,
      role: user.role,
      email: user.email,
      occupiedStation: user.occupiedStation,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({ user: req.session.user });
  } catch (err) {
    console.error("Error in /auth/me:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
