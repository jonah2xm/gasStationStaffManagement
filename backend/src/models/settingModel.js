const mongoose = require("mongoose");

/**
 * Réglages globaux du portail, un document par clé (ex. "contact").
 * La valeur est libre : chaque contrôleur en valide la forme.
 */
const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", SettingSchema);
