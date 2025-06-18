// absenceAA.controller.js
const AbsenceAA = require("../models/absenceAAModel");

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

    // Basic required fields check
    if (!personnelId || !startDate || !endDate || !absenceType) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // Convert dates to Date objects for comparison
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(endDate);

    // Query for existing absences for the same employee that overlap the new date range
    const overlappingAbsences = await AbsenceAA.find({
      personnel: personnelId,
      $or: [
        {
          startDate: { $lte: newEndDate },
          endDate: { $gte: newStartDate },
        },
      ],
    });

    if (overlappingAbsences.length > 0) {
      return res.status(409).json({
        message:
          "Une absence pour cet employé existe déjà pour la période spécifiée.",
      });
    }

    // Build absence record data
    const absenceData = {
      personnel: personnelId,
      startDate: newStartDate,
      endDate: newEndDate,
      absenceType,
      description: description || "",
    };

    // If file uploaded, attach its normalized path.
    if (req.file) {
      absenceData.document = req.file.path.replace(/\\/g, "/");
    }

    // Create and save the absence record.
    const newAbsence = new AbsenceAA(absenceData);
    const savedAbsence = await newAbsence.save();

    // Update personnel status to reflect current absence type
    await Personnel.findByIdAndUpdate(personnelId, {
      status: absenceType,
    });

    return res.status(201).json(savedAbsence);
  } catch (err) {
    console.error("Erreur lors de l'enregistrement de l'absence :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de l'enregistrement de l'absence",
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
    const { id } = req.params; // Extract ID from URL params (e.g., `/absencesAA/:id`)

    // Optional: Validate if ID is a valid MongoDB ObjectId
    /*if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }*/

    // Find and delete the absence
    const deletedAbsence = await AbsenceAA.findByIdAndDelete(id);

    if (!deletedAbsence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    return res.status(200).json({
      message: "Absence supprimée avec succès",
      deletedAbsence,
    });
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
