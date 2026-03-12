const AffectationTemporaire = require("../models/affectationTemporaire");
const Personnel = require("../models/personnelModel");
const Station = require("../models/stationModel");
const Users = require("../models/userModel");
const Notification = require("../models/notificationModel");
const fs = require("fs");
const path = require("path");

/**
 * Helper: insert notifications and emit them via Socket.IO (per-user rooms)
 * - req is used to get req.app.get('io')
 * - notifications: array of objects matching Notification schema
 */
async function createAndEmitNotifications(req, notifications) {
  if (!notifications || !notifications.length) return [];

  const inserted = await Notification.insertMany(notifications);

  try {
    const io = req.app.get("io");
    if (!io) return inserted;

    inserted.forEach((n) => {
      try {
        const userRoom = `user:${String(n.personnel)}`;
        io.to(userRoom).emit("notification:new", {
          _id: n._id,
          type: n.type,
          reference: n.reference,
          title: n.title || "Notification",
          message: n.message,
          detailsUrl: n.detailsUrl,
          countIncrement: 1,
          createdAt: n.date || n.createdAt || new Date(),
        });
      } catch (emitErr) {
        console.warn("Emit for notification failed:", emitErr);
      }
    });
  } catch (err) {
    console.warn("Socket emit failed:", err);
  }

  return inserted;
}

exports.createAffectation = async (req, res) => {
  try {
    const {
      personnelId,
      startDate,
      endDate,
      originStation,
      affectedStation,
      description,
    } = req.body;

    if (
      !personnelId ||
      !startDate ||
      !endDate ||
      !originStation ||
      !affectedStation
    ) {
      return res
        .status(400)
        .json({ message: "Champs requis manquants pour l’affectation." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }

    if (today >= start && today <= end && personnel.status !== "Actif") {
      return res
        .status(400)
        .json({ message: "L'employé n'est pas actif pendant cette période." });
    }

    const last = await AffectationTemporaire.findOne({ personnel: personnelId })
      .sort({ startDate: -1 })
      .lean();
    if (last) {
      const lastStart = new Date(last.startDate);
      const lastEnd = new Date(last.endDate);
      const overlaps =
        (start >= lastStart && start <= lastEnd) ||
        (end >= lastStart && end <= lastEnd) ||
        (start <= lastStart && end >= lastEnd);
      if (overlaps) {
        return res.status(409).json({
          message:
            "Cet employé a déjà une affectation temporaire qui chevauche ces dates.",
        });
      }
    }

    const [originDoc, affectedDoc] = await Promise.all([
      Station.findById(originStation),
      Station.findById(affectedStation),
    ]);
    if (!originDoc || !affectedDoc) {
      return res
        .status(404)
        .json({ message: "Origine ou destination introuvable." });
    }

    const assignData = {
      personnel: personnelId,
      startDate: start,
      endDate: end,
      originStation: originDoc._id,
      affectedStation: affectedDoc._id,
      description: description || "",
    };
    if (req.file) {
      assignData.document = req.file.path.replace(/\\/g, "/");
    }

    const newAssign = new AffectationTemporaire(assignData);
    const savedAssign = await newAssign.save();

    await Personnel.findByIdAndUpdate(personnelId, {
      station: affectedDoc._id,
      stationName: affectedDoc.name,
    });

    const allUsers = await Users.find().select("_id").lean();
    const msg = `Affectation temporaire: ${personnel.firstName} ${personnel.lastName
      } déplacé de "${originDoc.name}" à "${affectedDoc.name
      }" du ${start.toLocaleDateString()} au ${end.toLocaleDateString()}.`;

    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "AffectationTemporaire",
      reference: savedAssign._id,
      title: "Affectation temporaire",
      message: msg,
      detailsUrl: `/affectations/temporaire/details/${savedAssign._id}`,
      date: new Date(),
    }));

    if (notifs.length) {
      try {
        await createAndEmitNotifications(req, notifs);
        console.log("Affectation temp notifications created & emitted:", notifs.length);
      } catch (err) {
        console.error("Error creating/emitting affectation temp notifs:", err);
      }
    }

    return res.status(201).json({
      message: "Affectation temporaire créée avec succès",
      data: savedAssign,
    });
  } catch (err) {
    console.error("Erreur création affectation :", err);
    return res.status(500).json({
      message:
        err.message || "Erreur interne lors de la création de l’affectation.",
    });
  }
};

exports.getAbsenceTemp = async (req, res) => {
  try {
    const { role, id } = req.session.user || {};
    let query = {};

    if (role === "chef station") {
      const user = await Users.findById(id);
      if (user && user.occupiedStation) {
        const station = await Station.findOne({ name: user.occupiedStation });
        if (station) {
          query = {
            $or: [
              { originStation: station._id },
              { affectedStation: station._id },
            ],
          };
        }
      }
    }

    const affectations = await AffectationTemporaire.find(query)
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "_id name")
      .populate("affectedStation", "_id name")
      .sort({ startDate: -1 });

    res.status(200).json(affectations);
  } catch (error) {
    console.error("Error fetching temporary affectations:", error);
    res.status(500).json({
      message: "Erreur lors de la récupération des affectations temporaires.",
    });
  }
};

exports.getAffectationTemporaireById = async (req, res) => {
  try {
    const { id } = req.params;
    const affectation = await AffectationTemporaire.findById(id)
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "name")
      .populate("affectedStation", "name");

    if (!affectation) {
      return res
        .status(404)
        .json({ message: "Affectation temporaire introuvable." });
    }

    res.status(200).json(affectation);
  } catch (err) {
    console.error("Error fetching affectation by ID:", err);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'affectation." });
  }
};

exports.updateAffectationTemporaire = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      personnelId,
      startDate,
      endDate,
      originStation,
      affectedStation,
      description,
    } = req.body;

    const existing = await AffectationTemporaire.findById(id).lean();
    if (!existing) {
      return res
        .status(404)
        .json({ message: "Affectation temporaire introuvable." });
    }

    const newStart = startDate
      ? new Date(startDate)
      : new Date(existing.startDate);
    const newEnd = endDate ? new Date(endDate) : new Date(existing.endDate);
    const today = new Date();

    const personnel = await Personnel.findById(
      personnelId || existing.personnel
    );
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }
    if (today >= newStart && today <= newEnd && personnel.status !== "Actif") {
      return res.status(400).json({
        message: "L'employé n'est pas actif durant cette période.",
      });
    }

    const lastOther = await AffectationTemporaire.findOne({
      personnel: personnel._id,
      _id: { $ne: id },
    })
      .sort({ startDate: -1 })
      .lean();
    if (lastOther) {
      const oStart = new Date(lastOther.startDate);
      const oEnd = new Date(lastOther.endDate);
      const overlap =
        (newStart >= oStart && newStart <= oEnd) ||
        (newEnd >= oStart && newEnd <= oEnd) ||
        (newStart <= oStart && newEnd >= oEnd);
      if (overlap) {
        return res.status(409).json({
          message:
            "Cet employé a déjà une affectation temporaire qui chevauche ces dates.",
        });
      }
    }

    const updates = {};
    if (startDate) updates.startDate = newStart;
    if (endDate) updates.endDate = newEnd;
    if (originStation) updates.originStation = originStation;
    if (affectedStation) updates.affectedStation = affectedStation;
    if (description !== undefined) updates.description = description;
    if (req.file) {
      updates.document = req.file.path.replace(/\\/g, "/");
    }

    const updated = await AffectationTemporaire.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "name")
      .populate("affectedStation", "name");

    if (updates.affectedStation) {
      await Personnel.findByIdAndUpdate(personnel._id, {
        station: updated.affectedStation._id,
        stationName: updated.affectedStation.name,
      });
    }

    return res.status(200).json({
      message: "Affectation temporaire mise à jour avec succès.",
      data: updated,
    });
  } catch (err) {
    console.error("Erreur updateAffectationTemporaire:", err);
    return res.status(500).json({
      message:
        err.message ||
        "Erreur interne lors de la modification de l’affectation.",
    });
  }
};

exports.deleteAffectationTemporaire = async (req, res) => {
  try {
    const { id } = req.params;

    const assign = await AffectationTemporaire.findById(id)
      .lean()
      .populate("personnel", "firstName lastName");
    if (!assign) {
      return res
        .status(404)
        .json({ message: "Affectation temporaire non trouvée." });
    }

    if (assign.document) {
      const fullPath = path.resolve(assign.document);
      fs.unlink(fullPath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.warn("Impossible de supprimer le fichier PDF :", err);
        }
      });
    }

    await AffectationTemporaire.findByIdAndDelete(id);

    const originDoc = await Station.findById(assign.originStation).lean();
    let stationResetMsg = "";
    if (originDoc) {
      await Personnel.findByIdAndUpdate(assign.personnel, {
        station: originDoc._id,
        stationName: originDoc.name,
      });
      stationResetMsg = `Station remise à "${originDoc.name}"`;
    }

    const allUsers = await Users.find().select("_id").lean();
    const msg = `Affectation temporaire pour le personnel ${assign.personnel.firstName + " " + assign.personnel.lastName
      } a ete supprimée. ${stationResetMsg}.`;

    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "AffectationTemporaire",
      reference: assign._id,
      title: "Suppression affectation temporaire",
      message: msg,
      detailsUrl: "/affectations/temporaire",
      date: new Date(),
    }));

    if (notifs.length) {
      try {
        await createAndEmitNotifications(req, notifs);
      } catch (err) {
        console.error("Error creating/emitting deletion notifications:", err);
      }
    }

    return res.status(200).json({
      message: "Affectation temporaire supprimée et notifications envoyées.",
    });
  } catch (err) {
    console.error("Erreur deleteAffectationTemporaire:", err);
    return res.status(500).json({
      message:
        err.message ||
        "Erreur interne lors de la suppression de l’affectation temporaire.",
    });
  }
};
