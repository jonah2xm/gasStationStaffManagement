// absenceAA.controller.js
const AbsenceAA = require("../models/absenceAAModel");
const Notification = require("../models/notificationModel");
const fs = require("fs");
const path = require("path");
const Users = require("../models/userModel");
/**
 * Create a new absence record.
 * Expects form-data with fields: personnelId, startDate, endDate, absenceType, description,
 * and optionally a file named "document" (should be a PDF file).
 */

const Personnel = require("../models/personnelModel"); // make sure the path is correct

exports.createAbsenceAA = async (req, res) => {
  console.log("→ [createAbsenceAA] handler entered", { body: req.body });
  try {
    const { personnelId, startDate, endDate, absenceType, description } =
      req.body;

    // 1) Required fields
    if (!personnelId || !startDate || !endDate || !absenceType) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // 2) Load personnel
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 3) Parse dates
    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);
    const today = new Date();
    const isInPeriod = today >= newStart && today <= newEnd;

    // 4) Check overlap AGAINST THE LAST absence (before insert)
    const lastAbs = await AbsenceAA.findOne({ personnel: personnelId })
      .sort({ startDate: -1 })
      .lean();

    if (lastAbs) {
      const lastStart = new Date(lastAbs.startDate);
      const lastEnd = new Date(lastAbs.endDate);
      const overlaps =
        (newStart <= lastEnd && newStart >= lastStart) ||
        (newEnd <= lastEnd && newEnd >= lastStart) ||
        (newStart <= lastStart && newEnd >= lastEnd);

      if (overlaps) {
        return res.status(409).json({
          message:
            "Une absence pour cet employé existe déjà pour cette période.",
        });
      }
    }

    // 5a) If NOT in period → create without touching status
    if (!isInPeriod) {
      const absenceData = {
        personnel: personnelId,
        startDate: newStart,
        endDate: newEnd,
        absenceType,
        description: description || "",
      };
      if (req.file) absenceData.document = req.file.path.replace(/\\/g, "/");

      const created = await AbsenceAA.create(absenceData);
      const allUsers = await Users.find().select("_id").lean();

      const accrualNotifs = allUsers.map((u) => ({
        personnel: u._id,
        type: "AbsenceAA",
        reference: created._id,
        message: `Nouvelle absence AA pour ${personnel.firstName} ${personnel.lastName
          } du ${newStart.toLocaleDateString()} au ${newEnd.toLocaleDateString()}.`,
        detailsUrl: "/conges",
      }));

      try {
        if (accrualNotifs.length) {
          await Notification.insertMany(accrualNotifs);
          console.log("Notifications inserted:", accrualNotifs.length);
        }
      } catch (notifErr) {
        console.error("Error inserting notifications:", notifErr);
      }

      return res.status(201).json(created);
    }

    // 5b) If IN period → personnel must be Actif
    if (personnel.status !== "Actif") {
      return res.status(400).json({ message: "L'employé n'est pas actif." });
    }

    // 6) Create AND update status
    const absenceData = {
      personnel: personnelId,
      startDate: newStart,
      endDate: newEnd,
      absenceType,
      description: description || "",
    };
    if (req.file) absenceData.document = req.file.path.replace(/\\/g, "/");
    const created = await AbsenceAA.create(absenceData);
    try {
      await Personnel.findByIdAndUpdate(personnelId, {
        status: absenceType,
      });
    } catch (updateErr) {
      console.error("Error updating personnel status:", updateErr);
    }

    const allUsers = await Users.find().select("_id").lean();

    const accrualNotifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "AbsenceAA",
      reference: created._id,
      message: `Nouvelle absence AA pour ${personnel.firstName} ${personnel.lastName
        } du ${newStart.toLocaleDateString()} au ${newEnd.toLocaleDateString()}.`,
      detailsUrl: "/conges",
    }));

    try {
      if (accrualNotifs.length) {
        await Notification.insertMany(accrualNotifs);
        console.log("Notifications inserted:", accrualNotifs.length);
      }
    } catch (notifErr) {
      console.error("Error inserting notifications:", notifErr);
    }

    return res.status(201).json(created);
  } catch (err) {
    console.error("Erreur lors de la création d'absence AA:", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la création de l'absence",
    });
  }
};

exports.getAbsencesAA = async (req, res) => {
  try {
    const { role, id } = req.session.user || {};
    let query = {};

    if (role === "chef station") {
      const user = await Users.findById(id);
      if (user && user.occupiedStation) {
        const personnelIds = await Personnel.find({
          stationName: user.occupiedStation,
        })
          .select("_id")
          .lean();
        query.personnel = { $in: personnelIds.map((p) => p._id) };
      }
    }

    // Fetch all absences. You can add .populate() if you have ref fields.
    const absences = await AbsenceAA.find(query).populate(
      "personnel",
      "firstName lastName matricule stationName"
    );

    return res.status(200).json(absences);
  } catch (error) {
    console.error("Erreur lors de la récupération des absences :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des absences" });
  }
};

exports.getAbsenceAAById = async (req, res) => {
  try {
    const { id } = req.params; // Extract the ID from URL params (e.g., `/api/absencesAA/:id`)

    // Fetch the absence by ID and populate the "personnel" field
    const absence = await AbsenceAA.findById(id).populate(
      "personnel",
      "firstName lastName matricule"
    );

    if (!absence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    return res.status(200).json(absence);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'absence :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'absence" });
  }
};
exports.deleteAbsenceAA = async (req, res) => {
  try {
    const { id } = req.params;

    // 1) Load the absence so we have its dates & personnel
    const absence = await AbsenceAA.findById(id).populate(
      "personnel",
      "firstName lastName status"
    );
    if (!absence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    // 2) Delete the PDF file if it exists
    if (absence.document && fs.existsSync(absence.document)) {
      fs.unlink(path.resolve(absence.document), (err) => {
        if (err) console.warn("Échec suppression document PDF :", err);
      });
    }

    // 3) Delete the DB record
    await AbsenceAA.findByIdAndDelete(id);

    // 4) If we are still within the absence period, reset status to "Actif"
    const today = new Date();
    const start = new Date(absence.startDate);
    const end = new Date(absence.endDate);
    let statusReset = false;

    if (today >= start && today <= end) {
      await Personnel.findByIdAndUpdate(absence.personnel, { status: "Actif" });
      statusReset = true;
    }
    console.log("absenceAA", absence.personnel);
    // 5) Broadcast a notification to all users
    const allUsers = await Users.find().select("_id").lean();
    const msg = statusReset
      ? `L'absence AA du ${absence.personnel.firstName + " " + absence.personnel.lastName
      } a été supprimée et le statut du personnel est repassé à Actif.`
      : `L'absence AA (${absence._id}) a été supprimée.`;

    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "AbsenceAA",
      reference: absence._id,
      message: msg,
      detailsUrl: "/absences/aa", // link back to your list or overview page
    }));

    if (notifs.length) {
      await Notification.insertMany(notifs);
    }

    return res.status(200).json({ message: "Absence supprimée avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression de l'absence :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la suppression de l'absence",
    });
  }
};

exports.updateAbsenceAA = async (req, res) => {
  try {
    const { id } = req.params;
    const { personnelId, startDate, endDate, absenceType, description } =
      req.body;

    // Validate required fields
    if (!personnelId || !startDate || !endDate || !absenceType) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // Build update object
    const updateData = {
      personnel: personnelId,
      startDate,
      endDate,
      absenceType,
      description: description || "",
    };

    // If a new file was uploaded, attach its path.
    if (req.file) {
      // Optionally, you could normalize the file path:
      updateData.document = req.file.path.replace(/\\/g, "/");
    }

    // Find record by ID and update it (optionally using new: true to return updated document)
    const updatedAbsence = await AbsenceAA.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedAbsence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    return res.status(200).json(updatedAbsence);
  } catch (err) {
    console.error("Erreur lors de la modification de l'absence :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la modification de l'absence",
    });
  }
};

exports.streamAbsenceAADocument = async (req, res, next) => {
  try {
    // 1) Load the absence to get its document path
    const absence = await AbsenceAA.findById(req.params.id).lean();
    if (!absence || !absence.document) {
      return res.status(404).json({ message: "Document introuvable" });
    }

    // 2) Resolve filesystem path
    const filePath = path.resolve(absence.document);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ message: "Fichier manquant sur le serveur" });
    }

    // 3) Stream as PDF
    res.type("application/pdf");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};
