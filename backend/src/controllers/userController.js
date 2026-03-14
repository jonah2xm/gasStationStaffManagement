const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Personnel = require("../models/personnelModel");
const mongoose = require("mongoose");

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "None" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
};

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
    const { username, email, password, role, occupiedStation } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({
      $or: [{ email: email }, { username: username }],
    });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
      role: role || "user",
      occupiedStation,
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      occupiedStation: user.occupiedStation,
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
  console.log("is production", isProduction);
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      if (user.role === "personnel") {
        return res.status(403).json({
          message:
            "Accès refusé : ce compte est réservé au pointage uniquement.",
        });
      }

      const token = generateToken(
        user._id,
        user.username,
        user.email,
        user.role,
      );

      // Store JWT in cookie
      res.cookie("token", token, cookieOptions);

      res.json({
        message: "Login successful",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          occupiedStation: user.occupiedStation,
        },
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
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    console.log("resetPassword - params:", req.params, "body:", req.body);

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!id)
      return res.status(400).json({ message: "Missing user id in params" });
    if (!newPassword)
      return res.status(400).json({ message: "Missing newPassword in body" });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id format" });
    }

    const user = await User.findById(id);
    if (!user) {
      console.log("resetPassword - user not found for id:", id);
      return res.status(404).json({ message: "User not found" });
    }

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
 * @access  Private
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

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

    const user = await User.findById(userSession.id);
    if (!user) {
      console.error("Utilisateur introuvable:", userSession.id);
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect" });
    }

    user.password = newPassword;
    await user.save();

    req.session.destroy((err) => {
      if (err) console.error("Error destroying session:", err);
      res.clearCookie("connect.sid", cookieOptions);
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
    const users = await User.find().select("-password -__v");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get personnel who don't have a user account yet
 * @route   GET /api/users/available-personnel
 * @access  Private (Admin or Chef Station)
 */
exports.getAvailablePersonnel = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    let userStation = req.session.user.occupiedStation;

    const users = await User.find({}, "username");
    const existingMatricules = users.map((u) => u.username);

    let query = { matricule: { $nin: existingMatricules } };

    if (userRole === "chef station") {
      if (!userStation) {
        const fullUser = await User.findById(req.session.user.id);
        userStation = fullUser?.occupiedStation;
      }

      if (!userStation) {
        return res
          .status(400)
          .json({ message: "Station non assignée pour ce chef" });
      }
      query.stationName = userStation;
    }

    const personnel = await Personnel.find(query);
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Create a restricted account for personnel (pointage)
 * @route   POST /api/users/create-personnel-account
 * @access  Private (Admin or Chef Station)
 */
exports.createPersonnelAccount = async (req, res) => {
  try {
    const { matricule, password, email } = req.body;

    if (!matricule || !password) {
      return res
        .status(400)
        .json({ message: "Matricule et mot de passe requis" });
    }

    const personnel = await Personnel.findOne({ matricule });
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    const existingUser = await User.findOne({ username: matricule });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Un compte existe déjà pour ce matricule" });
    }

    const newUser = await User.create({
      username: matricule,
      email: email || `${matricule}@placeholder.com`,
      password,
      role: "personnel",
      occupiedStation: personnel.stationName,
    });

    res.status(201).json({
      message: "Compte personnel créé avec succès",
      user: {
        username: newUser.username,
        role: newUser.role,
        occupiedStation: newUser.occupiedStation,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update a user
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role, occupiedStation } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.role = role || user.role;
    user.occupiedStation =
      occupiedStation !== undefined ? occupiedStation : user.occupiedStation;

    const updatedUser = await user.save();

    if (
      req.session.user &&
      req.session.user.id === updatedUser._id.toString()
    ) {
      req.session.user.username = updatedUser.username;
      req.session.user.email = updatedUser.email;
      req.session.user.role = updatedUser.role;
      req.session.user.occupiedStation = updatedUser.occupiedStation;
    }

    res.json({
      message: "Utilisateur mis à jour avec succès",
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        occupiedStation: updatedUser.occupiedStation,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res
          .status(500)
          .json({ message: "Erreur lors de la déconnexion" });
      }

      res.clearCookie("connect.sid", cookieOptions);
      res.status(200).json({ message: "Déconnexion réussie" });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
