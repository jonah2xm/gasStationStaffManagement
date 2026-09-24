// models/demandeAnnulationModel.js
const mongoose = require("mongoose");

/**
 * Demande d'annulation d'un document (avis d'absence, avis de reprise,
 * demande de congé — récupérations comprises).
 *
 * Le chef de station ne supprime plus lui-même ses documents : il en demande
 * l'annulation avec un motif, et un gestionnaire ou un administrateur
 * l'accepte (le document est alors supprimé) ou la refuse.
 *
 * `apercu` garde une copie lisible du document au moment de la demande : une
 * fois la demande acceptée, le document n'existe plus mais l'historique reste
 * compréhensible.
 */

const TYPES_DOCUMENT = ["Absence", "Reprise", "Conge"];
const STATUTS = ["en_attente", "acceptee", "refusee"];
const MOTIF_MAX = 500;

const DemandeAnnulationSchema = new mongoose.Schema(
  {
    typeDocument: {
      type: String,
      enum: { values: TYPES_DOCUMENT, message: "Type de document invalide" },
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "typeDocument",
      required: true,
    },
    // Station de l'agent concerné : un chef de station ne voit que la sienne.
    stationName: {
      type: String,
      required: true,
    },
    apercu: {
      agent: { type: String, default: "" },
      matricule: { type: String, default: "" },
      titre: { type: String, default: "" },
      detail: { type: String, default: "" },
    },
    motif: {
      type: String,
      trim: true,
      required: [true, "Le motif de l'annulation est requis"],
      maxlength: [MOTIF_MAX, `Le motif ne peut pas dépasser ${MOTIF_MAX} caractères`],
    },
    demandeur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    statut: {
      type: String,
      enum: STATUTS,
      default: "en_attente",
    },
    decisionPar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decisionLe: {
      type: Date,
      default: null,
    },
    // Observation du gestionnaire, facultative (motif du refus notamment).
    commentaire: {
      type: String,
      trim: true,
      default: "",
      maxlength: [MOTIF_MAX, `Le commentaire ne peut pas dépasser ${MOTIF_MAX} caractères`],
    },
  },
  { timestamps: true }
);

// Une seule demande en attente par document.
DemandeAnnulationSchema.index(
  { typeDocument: 1, document: 1 },
  { unique: true, partialFilterExpression: { statut: "en_attente" } }
);

module.exports = mongoose.model("DemandeAnnulation", DemandeAnnulationSchema);
module.exports.TYPES_DOCUMENT = TYPES_DOCUMENT;
module.exports.STATUTS = STATUTS;
module.exports.MOTIF_MAX = MOTIF_MAX;
