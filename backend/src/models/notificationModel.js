// models/notificationModel.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  personnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Personnel",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "Absence",
      // AbsenceAA / AbsenceAI : conservés pour les notifications déjà en base,
      // émises avant la fusion des deux sections en une seule.
      "AbsenceAA",
      "AbsenceAI",
      "AffectationTemporaire",
      "Conge",
      "CongeDays",
      "AffectationDefinitive",
      "MonthlyAccrual",
      // Alertes du suivi des documents (utils/suiviDocuments.js).
      "SuiviConge",
      "SuiviAbsence",
    ],
    required: true,
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
   
  },
  message: {
    type: String,
    required: true,
  },
  detailsUrl: {
    type: String,
    required: true, // URL or relative path where the UI can show details
  },
  // Clé d'une alerte de suivi : une même alerte n'est notifiée qu'une fois
  // par destinataire.
  cle: {
    type: String,
  },
  seen: {
    type: Boolean,
    default: false,
  },
  seenAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index(
  { personnel: 1, cle: 1 },
  { unique: true, partialFilterExpression: { cle: { $type: "string" } } }
);

module.exports = mongoose.model("Notification", notificationSchema);
