// models/Conge.js
const mongoose = require("mongoose");

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
      enum: ["ordinaire", "anticipe"],
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
  },
  {
    timestamps: true,
  }
);

// Demandes restant à envoyer, pour la page Envois.
CongeSchema.index({ bordereau: 1, stationName: 1 });

module.exports = mongoose.model("Conge", CongeSchema);
