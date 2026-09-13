// models/absenceModel.js
const mongoose = require("mongoose");

/**
 * Avis d'absence — modèle unique remplaçant AbsenceAA et AbsenceAI.
 *
 * La seule différence entre une absence autorisée et une absence irrégulière
 * est le motif : "nonAutorisee" est la seule valeur non autorisée, tous les
 * autres motifs sont autorisés (voir MOTIFS_AUTORISES / isAutorisee).
 *
 * Une absence porte une seule date (la date d'absence). La date de reprise
 * fera l'objet d'un avis de reprise distinct, traité séparément.
 */

// Les libellés reprennent les valeurs déjà stockées dans AbsenceAA
// ("decés", "marriage") pour que la migration soit une simple copie.
const MOTIFS = [
  "maladie",
  "decés",
  "marriage",
  "naissance",
  "examen",
  "autre",
  "nonAutorisee",
];

const MOTIF_NON_AUTORISE = "nonAutorisee";

const AbsenceSchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: [true, "Le personnel est requis"],
    },
    date: {
      type: Date,
      required: [true, "La date d'absence est requise"],
    },
    motif: {
      type: String,
      enum: {
        values: MOTIFS,
        message: "Motif d'absence invalide",
      },
      required: [true, "Le motif est requis"],
    },
    description: {
      type: String,
      default: "",
    },
    // Chemin du justificatif téléversé, le cas échéant.
    document: {
      type: String,
      default: "",
    },
    // Avis de reprise ayant clôturé cette absence. Tant qu'il est null,
    // l'absence est "ouverte" : l'agent n'a pas repris le travail.
    reprise: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reprise",
      default: null,
    },
    // Bordereau d'envoi ayant transmis cet avis à l'Agence COM Oran.
    // Tant qu'il est null, l'avis reste « à envoyer ».
    bordereau: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bordereau",
      default: null,
    },
  },
  { timestamps: true }
);

// Une absence non autorisée encore ouverte est signalée passé 48 h.
AbsenceSchema.index({ motif: 1, reprise: 1, date: -1 });
// Recherche des absences ouvertes d'un agent, au moment de saisir sa reprise.
AbsenceSchema.index({ personnel: 1, reprise: 1 });
// Avis restant à envoyer, pour la page Envois.
AbsenceSchema.index({ bordereau: 1, personnel: 1 });

AbsenceSchema.virtual("autorisee").get(function () {
  return this.motif !== MOTIF_NON_AUTORISE;
});

AbsenceSchema.virtual("cloturee").get(function () {
  return Boolean(this.reprise);
});

AbsenceSchema.set("toJSON", { virtuals: true });
AbsenceSchema.set("toObject", { virtuals: true });

const Absence = mongoose.model("Absence", AbsenceSchema);

module.exports = Absence;
module.exports.MOTIFS = MOTIFS;
module.exports.MOTIF_NON_AUTORISE = MOTIF_NON_AUTORISE;
