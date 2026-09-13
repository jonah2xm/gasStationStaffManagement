// models/bordereauModel.js
const mongoose = require("mongoose");

// Tous les bordereaux partent des stations vers l'agence.
const DESTINATION = "Agence COM Oran";

/**
 * Bordereau d'envoi — transmet à l'Agence COM Oran les documents imprimés
 * d'une station : avis d'absence, avis de reprise et demandes de congé.
 *
 * Un bordereau ne couvre qu'une station (son nom figure en en-tête). Chaque
 * document envoyé pointe vers son bordereau par son champ `bordereau` ;
 * annuler le bordereau remet ce champ à null et le document redevient
 * « à envoyer ».
 */
const BordereauSchema = new mongoose.Schema(
  {
    stationName: {
      type: String,
      required: [true, "La station est requise"],
    },
    destination: {
      type: String,
      default: DESTINATION,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    absences: [{ type: mongoose.Schema.Types.ObjectId, ref: "Absence" }],
    reprises: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reprise" }],
    conges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conge" }],
  },
  { timestamps: true }
);

// Historique d'une station, du plus récent au plus ancien.
BordereauSchema.index({ stationName: 1, createdAt: -1 });

module.exports = mongoose.model("Bordereau", BordereauSchema);
module.exports.DESTINATION = DESTINATION;
