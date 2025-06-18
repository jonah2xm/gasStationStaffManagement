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
    nombreJourRestant: {
      type: Number,
      default: 0,
    },
    documentPath: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conge", CongeSchema);
