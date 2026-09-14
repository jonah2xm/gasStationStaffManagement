// models/repriseModel.js
const mongoose = require("mongoose");
const { STATUTS_GESTION } = require("../utils/suivi");

/**
 * Avis de reprise — clôture les absences ouvertes d'un agent.
 *
 * Une absence ne portant qu'une date, un agent absent plusieurs jours a
 * plusieurs enregistrements d'absence. Un même avis de reprise les clôture
 * donc toutes en une fois (`absences`), même si en pratique un agent n'a
 * qu'une absence ouverte sur une période donnée.
 *
 * L'agent repasse "Actif" à l'enregistrement de l'avis, et ses absences
 * clôturées sortent du signalement des 48 h.
 */
const RepriseSchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: [true, "Le personnel est requis"],
    },
    dateReprise: {
      type: Date,
      required: [true, "La date de reprise est requise"],
    },
    // Absences clôturées par cet avis, dans l'ordre chronologique.
    absences: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Absence",
      },
    ],
    // Bordereau d'envoi ayant transmis cet avis à l'Agence COM Oran.
    // Tant qu'il est null, l'avis reste « à envoyer ».
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
  { timestamps: true }
);

RepriseSchema.index({ personnel: 1, dateReprise: -1 });
// Avis restant à envoyer, pour la page Envois.
RepriseSchema.index({ bordereau: 1, personnel: 1 });
// Documents d'un bordereau CBR.
RepriseSchema.index({ bordereauCbr: 1 });

RepriseSchema.set("toJSON", { virtuals: true });
RepriseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Reprise", RepriseSchema);
