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

// Pourquoi une récupération est due : un jour travaillé par jour récupéré.
const MOTIFS_RECUPERATION = ["jour_ferie", "double_poste", "jour_repos"];

/**
 * Jours travaillés d'un congé, lus depuis la requête (tableau ou JSON, le
 * formulaire étant envoyé en multipart). Seule une récupération en porte :
 * autant de jours que sa durée, dates distinctes et passées, motif connu.
 * Renvoie { jours } ou { erreur }.
 */
function lireJoursTravailles(typeConge, duree, valeur) {
  if (typeConge !== "recuperation") return { jours: [] };

  let liste = valeur;
  if (typeof liste === "string") {
    try {
      liste = JSON.parse(liste || "[]");
    } catch {
      return { erreur: "Jours travaillés illisibles." };
    }
  }
  if (!Array.isArray(liste)) liste = [];

  const nb = Number(duree) || 0;
  if (liste.length !== nb) {
    return {
      erreur: `Une récupération de ${nb} jour${nb > 1 ? "s" : ""} doit indiquer ${nb} jour${nb > 1 ? "s" : ""} travaillé${nb > 1 ? "s" : ""} (${liste.length} renseigné${liste.length > 1 ? "s" : ""}).`,
    };
  }

  const finAujourdhui = new Date();
  finAujourdhui.setHours(23, 59, 59, 999);
  const vus = new Set();
  const jours = [];
  for (const item of liste) {
    const date = new Date(item && item.date);
    if (!item || !item.date || Number.isNaN(date.getTime())) {
      return { erreur: "Chaque jour travaillé doit avoir une date." };
    }
    if (date > finAujourdhui) {
      return { erreur: "Un jour travaillé ne peut pas être dans le futur." };
    }
    if (!MOTIFS_RECUPERATION.includes(item.motif)) {
      return { erreur: "Chaque jour travaillé doit avoir un motif valide." };
    }
    const cle = date.toISOString().slice(0, 10);
    if (vus.has(cle)) {
      return { erreur: "Le même jour travaillé est indiqué deux fois." };
    }
    vus.add(cle);
    jours.push({ date, motif: item.motif });
  }
  jours.sort((a, b) => a.date - b.date);
  return { jours };
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
    // Récupération : jours travaillés qui la justifient (voir
    // lireJoursTravailles). Consultés dans l'application, jamais imprimés.
    joursTravailles: {
      type: [
        {
          _id: false,
          date: { type: Date, required: true },
          motif: { type: String, enum: MOTIFS_RECUPERATION, required: true },
        },
      ],
      default: [],
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
module.exports.MOTIFS_RECUPERATION = MOTIFS_RECUPERATION;
module.exports.lireJoursTravailles = lireJoursTravailles;
