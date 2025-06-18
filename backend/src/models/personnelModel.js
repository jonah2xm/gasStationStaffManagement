const mongoose = require("mongoose");

const PersonnelSchema = new mongoose.Schema(
  {
    matricule: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    hireDate: { type: Date, required: true },
    poste: { type: String, required: true },
    contractType: { type: String, required: true },
    decision: { type: String, required: true },
    station: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "station",
    },
    stationName: { type: String, required: true },
    status: { type: String, default: "Actif" },
    holidaysLeft: { type: Number },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Personnel", PersonnelSchema);
