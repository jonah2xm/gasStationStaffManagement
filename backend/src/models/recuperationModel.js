// models/Recuperation.js
const mongoose = require("mongoose");

const RecuperationSchema = new mongoose.Schema(
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
    typeRecuperation: {
      type: String,
      enum: ["jour", "heure"],
      default: "jour",
    },
    dureeRecuperation: {
      type: Number,
      required: true, // number of days or hours, depending on typeRecuperation
    },
    dateDebut: {
      type: Date,
      required: true,
    },
    dateRetour: {
      type: Date,
      required: true,
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

module.exports = mongoose.model("Recuperation", RecuperationSchema);
