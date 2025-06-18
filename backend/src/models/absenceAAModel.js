// absenceAA.model.js
const mongoose = require("mongoose");

const AbsenceAASchema = new mongoose.Schema(
  {
    personnel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Personnel",
      required: [true, "Le personnel est requis"],
    },
    startDate: {
      type: Date,
      required: [true, "La date de début est requise"],
    },
    endDate: {
      type: Date,
      required: [true, "La date de fin est requise"],
      validate: {
        validator: function (value) {
          // Ensure endDate is after startDate
          return this.startDate ? value >= this.startDate : true;
        },
        message:
          "La date de fin doit être postérieure ou égale à la date de début",
      },
    },
    absenceType: {
      type: String,
      enum: ["maladie", "decés", "marriage", "naissance", "examen", "autre"],
      required: [true, "Le type d'absence est requis"],
    },
    description: {
      type: String,
      default: "",
    },
    // Store document path if a file was uploaded
    document: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("AbsenceAA", AbsenceAASchema);
