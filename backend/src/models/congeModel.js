// models/Conge.js
const mongoose = require("mongoose");
const { STATUTS_GESTION } = require("../utils/suivi");

// « recuperation » remplace l'ancienne section Récupérations : un congé de
// récupération ne consomme pas le solde de congés (holidaysLeft).
const TYPES_CONGE = ["ordinaire", "anticipe", "recuperation"];
const TYPES_HORS_SOLDE = ["recuperation"];

/** Jours retirés du solde de congés par un congé de ce type et de cette durée. */
function joursDecomptes(typeConge, duree) {
  return TYPES_HORS_SOLDE.includes(typeConge) ? 0 : Number(duree) || 0;
}

const CongeSchema = new mongoose.Schema(
  {
    personnelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: true,
    },
    stationName: {
      type: String,
      required: true,
    },
    typeConge: {
      type: String,
      enum: { values: TYPES_CONGE, message: "Type de congé invalide" },
      default: "ordinaire",
    },
    dureeConge: {
      type: Number,
      required: true,
    },
    dateDebut: {
      type: Date,
      required: true,
    },
    dateRetour: {
      type: Date,
      required: true,
    },
    lieuSejour: {
      type: String,
    },
    // "Nom et qualité de l'agent intérimaire (2)" sur la demande imprimée
    agentInterimaire: {
      type: String,
      default: "",
    },
    nombreJourRestant: {
      type: Number,
      default: 0,
    },
    // Optionnel : la demande est desormais generee puis imprimee depuis l'application.
    // Reste renseigne pour les conges enregistres avant, avec un justificatif televerse.
    documentPath: {
      type: String,
    },
    // Bordereau d'envoi ayant transmis cette demande à l'Agence COM Oran.
    // Tant qu'il est null, la demande reste « à envoyer ».
    bordereau: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bordereau",
      default: null,
    },
    // Suivi côté gestionnaire (voir utils/suivi.js) : non reçu → reçu →
    // non délivré → délivré à la direction CBR. Absent : « non reçu ».
    statutGestion: {
      type: String,
      enum: STATUTS_GESTION,
      default: "non_recu",
    },
    statutGestionLe: {
      type: Date,
      default: null,
    },
    statutGestionPar: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Bordereau d'envoi au District CBR (bordereauCbrModel.js). Tant qu'il est
    // renseigné, le statut ne revient ni à « reçu » ni à « non reçu ».
    bordereauCbr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BordereauCbr",
      default: null,
    },
    // Statut avant l'inclusion dans le bordereau CBR, rétabli à son annulation.
    statutAvantCbr: {
      type: String,
      enum: [...STATUTS_GESTION, null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Demandes restant à envoyer, pour la page Envois.
CongeSchema.index({ bordereau: 1, stationName: 1 });
// Documents d'un bordereau CBR.
CongeSchema.index({ bordereauCbr: 1 });

module.exports = mongoose.model("Conge", CongeSchema);
module.exports.TYPES_CONGE = TYPES_CONGE;
module.exports.TYPES_HORS_SOLDE = TYPES_HORS_SOLDE;
module.exports.joursDecomptes = joursDecomptes;
