const AbsenceAI = require("../models/absenceAIModel");
// make sure the path is correct
const Personnel = require("../models/personnelModel");
exports.createAbsenceAI = async (req, res) => {
  console.log(req.body);
  try {
    const { operationType, personnelId, startDate, endDate } = req.body;

    // File upload handled by multer middleware (if exists)
    const pdfUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Validate operationType
    if (!["avisAbsence", "avisReprise"].includes(operationType)) {
      return res.status(400).json({
        message: "Invalid operationType. Use 'avis absence' or 'avis reprise'.",
      });
    }

    if (!startDate) {
      return res.status(400).json({ message: "Start date is required." });
    }

    if (!personnelId) {
      return res.status(400).json({ message: "Personnel ID is required." });
    }

    const newEntry = new AbsenceAI({
      operationType,
      startDate,
      endDate: endDate || null,
      pdfUrl,
      personnel: personnelId,
    });

    await newEntry.save();

    res.status(201).json({
      message: "Absence/Reprise saved successfully.",
      data: newEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error saving absence/reprise.",
      error: error.message,
    });
  }
};

// Get all absence/reprise records
exports.getAllAbsenceAI = async (req, res) => {
  try {
    const entries = await AbsenceAI.find()
      .populate("personnel", "firstName lastName matricule stationName")
      .sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching records.", error: error.message });
  }
};

// Get one record by ID
exports.getAbsenceAIById = async (req, res) => {
  try {
    const entry = await AbsenceAI.findById(req.params.id).populate(
      "personnel",
      "firstName lastName matricule"
    );
    if (!entry) return res.status(404).json({ message: "Record not found." });
    res.status(200).json(entry);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching record.", error: error.message });
  }
};

// Delete a record
exports.deleteAbsenceAI = async (req, res) => {
  try {
    const deleted = await AbsenceAI.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting record.", error: error.message });
  }
};

exports.updateEndDate = async (req, res) => {
  try {
    const { id } = req.params; // ID of the absence document to update
    const { endDate } = req.body;

    if (!endDate) {
      return res.status(400).json({ message: "End date is required." });
    }

    const updatedEntry = await AbsenceAI.findByIdAndUpdate(
      id,
      {
        operationType: "avisReprise",
        endDate: new Date(endDate),
      },
      { new: true }
    ).populate("personnel", "firstName lastName matricule stationName");

    if (!updatedEntry) {
      return res.status(404).json({ message: "Absence entry not found." });
    }

    res.status(200).json({
      message: "End date updated and operationType changed to 'avisReprise'.",
      data: updatedEntry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating end date.",
      error: error.message,
    });
  }
};
