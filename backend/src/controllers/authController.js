// controllers/authController.js
const jwt = require("jsonwebtoken");

// Example: a function to fetch the user from DB by ID (adjust as needed)
const User = require("../models/userModel"); // Replace with your actual User model

exports.getMe = async (req, res) => {
  console.log("req.cookies:", req.session); // Debugging line to check cookies
  try {
    const user = req.session.user;
    console.log('user',user)
    if (!user) {
      return res.status(404).json({ message: "Not authentificated" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Error in /auth/me:", err);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
