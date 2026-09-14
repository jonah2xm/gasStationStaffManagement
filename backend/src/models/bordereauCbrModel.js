// models/bordereauCbrModel.js
const mongoose = require("mongoose");

// L'agence transmet au District CBR les documents reçus des stations.
const EXPEDITEUR = "Agence COM Oran";
const DESTINATION = "District CBR";

/**
 * Bordereau d'envoi au District CBR — transmet les avis d'absence, avis de
 * reprise et demandes de congé réceptionnés des stations (statut « non
 * délivré »). Un même bordereau peut regrouper plusieurs stations.
 *
 * Numéroté par année (« 001/2026 »). Chaque document inclus pointe vers lui
 * par son champ `bordereauCbr` et garde son statut précédent dans
 * `statutAvantCbr`, rétabli si le bordereau est annulé.
 */
const BordereauCbrSchema = new mongoose.Schema(
  {
    annee: {
      type: Number,
      required: true,
    },
    numero: {
      type: Number,
      required: true,
    },
    expediteur: {
      type: String,
      default: EXPEDITEUR,
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

// Un numéro n'est attribué qu'une fois par année.
BordereauCbrSchema.index({ annee: 1, numero: 1 }, { unique: true });
BordereauCbrSchema.index({ createdAt: -1 });

/** « 007/2026 » */
function referenceBordereauCbr(b) {
  if (!b || !b.numero) return "";
  return `${String(b.numero).padStart(3, "0")}/${b.annee}`;
}

module.exports = mongoose.model("BordereauCbr", BordereauCbrSchema);
module.exports.EXPEDITEUR = EXPEDITEUR;
module.exports.DESTINATION = DESTINATION;
module.exports.referenceBordereauCbr = referenceBordereauCbr;
