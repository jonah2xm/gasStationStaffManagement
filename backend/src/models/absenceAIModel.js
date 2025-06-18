const mongoose = require("mongoose");

const abesnceAIShcema = new mongoose.Schema({
  personnel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Personnel",
    required: [true, "Le personnel est requis"],
  },
  operationType: {
    type: String,
    enum: ["avisAbsence", "avisReprise"],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
  document: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AbsenceAI", abesnceAIShcema);
