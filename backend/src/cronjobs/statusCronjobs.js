const cron = require("node-cron");
const mongoose = require("mongoose");
const AbsenceAA = require("../models/absenceAAModel");
const AbsenceAI = require("../models/absenceAIModel");
const AffectationTemporaire = require("../models/affectationTemporaire");
const Conge = require("../models/congeModel");
const Personnel = require("../models/personnelModel");

// Run every day at 12:05 AM
cron.schedule("5 0 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ignore time part

  // Helper to update Personnel status
  const markPersonnelActif = async (personnelId) => {
    await Personnel.findByIdAndUpdate(personnelId, { status: "Actif" });
  };

  // 1. AbsenceAA
  const absAA = await AbsenceAA.find({ endDate: { $lt: today } }).select(
    "personnel"
  );
  for (let a of absAA) {
    await markPersonnelActif(a.personnel);
  }

  // 2. AbsenceAI
  // Only for avisAbsence with endDate (ignore avisReprise and without endDate)
  const absAI = await AbsenceAI.find({
    operationType: "avisAbsence",
    endDate: { $exists: true, $lt: today },
  }).select("personnel");
  for (let a of absAI) {
    await markPersonnelActif(a.personnel);
  }

  // 3. AffectationTemporaire
  const affectations = await AffectationTemporaire.find({
    endDate: { $lt: today },
  }).select("personnel");
  for (let aff of affectations) {
    await markPersonnelActif(aff.personnel);
    const originDoc = await Station.findById(aff.originStation).lean();
    if (originDoc) {
      // 4) Update the Personnel doc with its origin station
      await Personnel.findByIdAndUpdate(
        aff.personnel,
        {
          station: originDoc._id,
          stationName: originDoc.name,
        },
        { new: true, runValidators: true }
      );
    }
  }

  // 4. Conge
  const conges = await Conge.find({ dateRetour: { $lt: today } }).select(
    "personnelId"
  );
  for (let c of conges) {
    await markPersonnelActif(c.personnelId);
  }

  console.log(`[CRON] Status reset completed at ${new Date().toISOString()}`);
});
