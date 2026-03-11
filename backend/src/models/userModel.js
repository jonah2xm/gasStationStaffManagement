const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["administrateur", "gestionnaire", "chef station", "personnel"],
    },
    occupiedStation: {
      type: String,
      enum: [
        "GD R3120", "GD R3121", "GD R3122", "GD R3124", "GD R3125",
        "GD R3126", "GD R3127", "GD R3128", "GD R3130", "GD R3132",
        "GD R3133", "GD R3134", "GD R3135", "GD R3136", "GD R3137",
        "GD R3138"
      ]
    },
    createdAt: {

    }
  },
  { timestamps: true }
);

// Avant de sauvegarder, hacher le mot de passe
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer le mot de passe
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
