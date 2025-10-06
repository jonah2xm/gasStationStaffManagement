const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const mongoose = require("mongoose");
// Helper function to generate a JWT token
const generateToken = (id, username, email, role) => {
  return jwt.sign({ id, username, email, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/**
 * @desc    Create a new user (simple)
 * @route   POST /api/users
 * @access  Public (make private/admin if needed)
 */
exports.registerNewUser = async (req, res) => {
  
  try {
    const { username, email, password, role } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Prevent duplicates by email or username
    const existing = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user (password will be hashed by model pre-save hook)
    const user = await User.create({
      username,
      email,
      password,
      role: role || "user",
    });

    // Return created user (exclude password)
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Login user and return token
 * @route   POST /api/users/login
 * @access  Public
 */
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ username: username });
    if (user && (await user.matchPassword(password))) {
      req.session.user = {
        id: user._id,
        username: user.username,
        role: user.role,
        email:user.email,
        createdAt:user.createdAt,
        updatedAt:user.updatedAt
      };
      console.log(req.session.user, "req req");
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        district:user.discrict,
        structure:user.structure,
      
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "email ou mot de passe invalide" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Reset user's password
 * @route   POST /api/users/reset-password
 * @access  Public (Should be protected in a real app)
 *
 * Expected body: { email, oldPassword, newPassword }
 */

exports.resetPassword = async (req, res) => {
  try {
    // Log both params and body for debugging
    console.log("resetPassword - params:", req.params, "body:", req.body);

    const { id } = req.params;
    const { newPassword } = req.body;

    // Basic validation
    if (!id) return res.status(400).json({ message: "Missing user id in params" });
    if (!newPassword) return res.status(400).json({ message: "Missing newPassword in body" });

    // Validate id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id format" });
    }

    // Find by _id (use findById to ensure correct lookup)
    const user = await User.findById(id);
    if (!user) {
      console.log("resetPassword - user not found for id:", id);
      return res.status(404).json({ message: "User not found" });
    }

    // Update password (pre("save") hook on the model will hash it)
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a user
 * @route   DELETE /api/users/:id
 * @access  Private (should be protected with proper auth in a real app)
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.remove();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    // Fetch the user
    const user = await User.findById(userSession.id);
    if (!user) {
      console.error("Utilisateur introuvable:", userSession.id);
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }

    // Update to new password
    user.password = newPassword;
    await user.save();

    // Destroy session & clear cookie
    req.session.destroy((err) => {
      if (err) console.error("Error destroying session:", err);
      // Default cookie name is 'connect.sid'
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: false, // true if your site is served over HTTPS
      });

      // Respond only after session is cleared
      res.status(200).json({
        message:
          "Mot de passe mis à jour avec succès. Vous avez été déconnecté.",
      });
    });
  } catch (err) {
    console.error("Erreur updatePassword:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    // Fetch all users, exclude password and mongoose __v field
    const users = await User.find().select("-password -__v");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};