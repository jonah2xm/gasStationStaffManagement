const mongoose = require("mongoose");

const PointageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        matricule: {
            type: String,
            required: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        stationName: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true, // Normalized to start of day
        },
        entryTime: {
            type: Date,
        },
        exitTime: {
            type: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Pointage", PointageSchema);
