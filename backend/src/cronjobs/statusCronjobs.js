const cron = require("node-cron");
const mongoose = require("mongoose");
const AbsenceAA = require("../models/absenceAAModel");
const AbsenceAI = require("../models/absenceAIModel");
const AffectationTemporaire = require("../models/affectationTemporaire");
const Conge = require("../models/congeModel");
const Personnel = require("../models/personnelModel");
const Station = require("../models/stationModel");
const Notification = require("../models/notificationModel");
const Users = require("../models/userModel");

// Run every day at 12:05 AM
cron.schedule("5 0 * * *", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 0. Monthly holiday accrual on the 1st
  if (today.getDate() === 1) {
    await Personnel.updateMany({}, { $inc: { holidaysLeft: 2.5 } });
    const allUsers = await Users.find().select("_id").lean();
    const accrualNotifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "MonthlyAccrual",
      reference: null,
      message: "Vous avez reçu 2,5 jours de congés supplémentaires ce mois-ci.",
      detailsUrl: "/conges",
    }));
    if (accrualNotifs.length) await Notification.insertMany(accrualNotifs);
  }

  // collect IDs to mark active
  const toActivate = new Set();

  // fetch all users once (for broadcasting notifications)
  const allUsers = await Users.find().select("_id").lean();

  //
  // 1. AbsenceAA
  //
  const absAA = await AbsenceAA.aggregate([
    { $match: { endDate: { $lt: today } } },
    {
      $lookup: {
        from: "personnels",
        localField: "personnel",
        foreignField: "_id",
        as: "personnel",
      },
    },
    { $unwind: "$personnel" },
    { $match: { "personnel.status": { $eq: "Actif" } } },
    {
      $project: {
        _id: 1,
        personnel: {
          _id: 1,
          firstName: 1,
          lastName: 1,
        },
      },
    },
  ]);

  if (absAA.length) {
    const inserts = [];
    for (let a of absAA) {
      const msg = `L'absence AA de ${a.personnel.firstName} ${a.personnel.lastName} est terminée. Statut remis à Actif.`;
      const url = `/absences/aa/details/${a._id}`;

      for (let u of allUsers) {
        inserts.push({
          personnel: u._id,
          type: "AbsenceAA",
          reference: a._id,
          message: msg,
          detailsUrl: url,
        });
      }

      toActivate.add(a.personnel._id);
    }
    if (inserts.length) await Notification.insertMany(inserts);
  }

  //
  // 2. AbsenceAI
  //
  const absAI = await AbsenceAI.aggregate([
    {
      $match: {
        endDate: { $exists: true, $lt: today },
      },
    },
    {
      $lookup: {
        from: "personnels",
        localField: "personnel",
        foreignField: "_id",
        as: "personnel",
      },
    },
    { $unwind: "$personnel" },
    { $match: { "personnel.status": { $eq: "Actif" } } },
    {
      $project: {
        _id: 1,
        personnel: {
          _id: 1,
          firstName: 1,
          lastName: 1,
        },
      },
    },
  ]);

  if (absAI.length) {
    const inserts = [];
    for (let a of absAI) {
      const msg = `L'avis d'absence AI de ${a.personnel.firstName} ${a.personnel.lastName} est terminé. Statut remis à Actif.`;
      const url = `/absences/ai/details/${a._id}`;

      for (let u of allUsers) {
        inserts.push({
          personnel: u._id,
          type: "AbsenceAI",
          reference: a._id,
          message: msg,
          detailsUrl: url,
        });
      }

      toActivate.add(a.personnel._id);
    }
    if (inserts.length) await Notification.insertMany(inserts);
  }

  //
  // 3. AffectationTemporaire
  //
  const affs = await AffectationTemporaire.aggregate([
    { $match: { endDate: { $lt: today } } },
    {
      $lookup: {
        from: "personnels",
        localField: "personnel",
        foreignField: "_id",
        as: "personnel",
      },
    },
    { $unwind: "$personnel" },
    { $match: { "personnel.status": { $eq: "Actif" } } },
    {
      $project: {
        _id: 1,
        originStation: 1,
        personnel: {
          _id: 1,
          firstName: 1,
          lastName: 1,
        },
      },
    },
  ]);

  if (affs.length) {
    const inserts = [];
    for (let aff of affs) {
      const msg = `L'affectation temporaire de ${aff.personnel.firstName} ${aff.personnel.lastName} est terminée. Statut remis à Actif.`;
      const url = `/affectations/temporaire/details/${aff._id}`;

      for (let u of allUsers) {
        inserts.push({
          personnel: u._id,
          type: "AffectationTemporaire",
          reference: aff._id,
          message: msg,
          detailsUrl: url,
        });
      }

      toActivate.add(aff.personnel._id);

      // restore origin station now
      const origin = await Station.findById(aff.originStation).lean();
      if (origin) {
        await Personnel.findByIdAndUpdate(aff.personnel._id, {
          station: origin._id,
          stationName: origin.name,
        });
      }
    }
    if (inserts.length) await Notification.insertMany(inserts);
  }

  //
  // 4. Conge
  //
  const conges = await Conge.aggregate([
    { $match: { dateRetour: { $lt: today } } },
    {
      $lookup: {
        from: "personnels",
        localField: "personnelId",
        foreignField: "_id",
        as: "personnel",
      },
    },
    { $unwind: "$personnel" },
    { $match: { "personnel.status": { $eq: "Actif" } } },
    {
      $project: {
        _id: 1,
        personnel: {
          _id: 1,
          firstName: 1,
          lastName: 1,
        },
      },
    },
  ]);

  if (conges.length) {
    const inserts = [];
    for (let c of conges) {
      const msg = `Le congé de ${c.personnel.firstName} ${c.personnel.lastName} est terminé. Statut remis à Actif.`;
      const url = `/conges/details/${c._id}`;

      for (let u of allUsers) {
        inserts.push({
          personnel: u._id,
          type: "Conge",
          reference: c._id,
          message: msg,
          detailsUrl: url,
        });
      }

      toActivate.add(c.personnel._id);
    }
    if (inserts.length) await Notification.insertMany(inserts);
  }

  // 5. Finally, mark everyone collected above as Actif
  if (toActivate.size) {
    await Personnel.updateMany(
      { _id: { $in: Array.from(toActivate) } },
      { status: "Actif" }
    );
  }

  console.log(
    `[CRON] Completed at ${new Date().toISOString()} – ${
      toActivate.size
    } personnels activated.`
  );
});
