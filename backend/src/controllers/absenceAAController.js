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

    await Personnel.findByIdAndUpdate(personnelId, {
      status: absenceType,
    });
    const allUsers = await Users.find().select("_id").lean();
    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "AbsenceAA",
      reference: created._id, // point at the new absence
      message: `Nouvelle absence AA pour ${personnel.firstName} ${
        personnel.lastName
      } du ${newStart.toLocaleDateString()} au ${newEnd.toLocaleDateString()}.`,
      detailsUrl: `/absences/aa/details/${created._id}`,
    }));

    if (notifs.length) {
      await Notification.insertMany(notifs);
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
    // Fetch all absences. You can add .populate() if you have ref fields.
    const absences = await AbsenceAA.find().populate(
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

    // 1) Charger l'absence pour récupérer le chemin du document et les dates
    const absence = await AbsenceAA.findById(id);
    if (!absence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    // 2) Supprimer le PDF s'il existe
    if (absence.document && fs.existsSync(absence.document)) {
      fs.unlink(path.resolve(absence.document), (err) => {
        if (err) console.warn("Échec de suppression du document PDF :", err);
      });
    }

    // 3) Supprimer l'entrée en base
    await AbsenceAA.findByIdAndDelete(id);

    // 4) Si on est toujours dans la période de l'absence, repasser le personnel à "Actif"
    const today = new Date();
    const start = new Date(absence.startDate);
    const end = new Date(absence.endDate);
    if (today >= start && today <= end) {
      await Personnel.findByIdAndUpdate(absence.personnel, { status: "Actif" });
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
