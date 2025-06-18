// models/AffectationDefinitif.js
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const AffectationDefinitifSchema = new mongoose.Schema(
  {
    personnel: {
      type: ObjectId,
      ref: "Personnel",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    originStation: {
      type: ObjectId,
      ref: "Station",
      required: true,
    },
    affectedStation: {
      type: ObjectId,
      ref: "Station",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    document: {
      type: String, // file URL or base64 string
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AffectationDefinitif",
  AffectationDefinitifSchema
);
