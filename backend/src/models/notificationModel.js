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
      "AbsenceAA",
      "AbsenceAI",
      "AffectationTemporaire",
      "Conge",
      "CongeDays",
    ],
    required: true,
  },
  reference: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // _id of the source document
  },
  message: {
    type: String,
    required: true,
  },
  detailsUrl: {
    type: String,
    required: true, // URL or relative path where the UI can show details
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

module.exports = mongoose.model("Notification", notificationSchema);
