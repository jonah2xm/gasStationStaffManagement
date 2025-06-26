const AbsenceAI = require("../models/absenceAIModel");
const Personnel = require("../models/personnelModel");

exports.createAbsenceAI = async (req, res) => {
  try {
    const { operationType, personnelId, startDate, endDate } = req.body;

    // 1) Validate operationType
    if (!["avisAbsence", "avisReprise"].includes(operationType)) {
      return res.status(400).json({
        message:
          "operationType invalide. Utiliser 'avisAbsence' ou 'avisReprise'.",
      });
    }

    // 2) Required fields
    if (!personnelId || !startDate) {
      return res.status(400).json({ message: "Champs requis manquants." });
    }

    // 3) Load personnel
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 4) Parse dates
    const newStart = new Date(startDate);
    const newEnd = endDate ? new Date(endDate) : null;
    const today = new Date();
    const isInPeriod = newEnd ? today >= newStart && today <= newEnd : false;

    // 5) Overlap check against last AI
    const lastAI = await AbsenceAI.findOne({ personnel: personnelId })
      .sort({ startDate: -1 })
      .lean();

    if (lastAI && newEnd) {
      const lastStart = new Date(lastAI.startDate);
      const lastEnd = lastAI.endDate ? new Date(lastAI.endDate) : null;
      const overlaps =
        lastEnd &&
        ((newStart <= lastEnd && newStart >= lastStart) ||
          (newEnd <= lastEnd && newEnd >= lastStart) ||
          (newStart <= lastStart && newEnd >= lastEnd));
      if (overlaps) {
        return res.status(409).json({
          message: "Un avis existe déjà pour cette période.",
        });
      }
    }

    // 6a) If not in period → create only
    if (!isInPeriod) {
      const aiData = {
        operationType,
        startDate: newStart,
        endDate: newEnd,
        personnel: personnelId,
        document: req.file ? req.file.path : undefined,
      };
      const created = await AbsenceAI.create(aiData);
      return res.status(201).json(created);
    }

    // 6b) If in period → must be Actif
    if (personnel.status !== "Actif") {
      return res.status(400).json({ message: "L'employé n'est pas actif." });
    }

    // 7) Create & set status = "AI"
    const aiData = {
      operationType,
      startDate: newStart,
      endDate: newEnd,
      personnel: personnelId,
      document: req.file ? req.file.path : undefined,
    };
    const created = await AbsenceAI.create(aiData);

    await Personnel.findByIdAndUpdate(personnelId, { status: "AI" });

    return res.status(201).json(created);
  } catch (err) {
    console.error("Erreur createAbsenceAI:", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la création de l'avis.",
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
    const { id } = req.params;

    // 1) Load the entry to get its dates and personnel
    const entry = await AbsenceAI.findById(id);
    if (!entry) {
      return res.status(404).json({ message: "Entrée introuvable." });
    }

    // 2) Delete the database record
    await AbsenceAI.findByIdAndDelete(id);

    // 3) If today ∈ [startDate, endDate], reset personnel to "Actif"
    const today = new Date();
    const start = new Date(entry.startDate);
    const end = entry.endDate ? new Date(entry.endDate) : null;

    if (end && today >= start && today <= end) {
      await Personnel.findByIdAndUpdate(entry.personnel, { status: "Actif" });
    }

    return res.status(200).json({ message: "Suppression réussie." });
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
    return res
      .status(500)
      .json({ message: "Erreur interne.", error: error.message });
  }
};

exports.updateEndDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate } = req.body;

    // 1) Validate
    if (!endDate) {
      return res.status(400).json({ message: "La date de fin est requise." });
    }

    // 2) Load and update the absence entry
    const updated = await AbsenceAI.findByIdAndUpdate(
      id,
      {
        operationType: "avisReprise",
        endDate: new Date(endDate),
      },
      { new: true, runValidators: true }
    ).populate("personnel", "firstName lastName matricule stationName");

    if (!updated) {
      return res.status(404).json({ message: "Entrée non trouvée." });
    }

    // 3) Adjust personnel status based on the new period
    const personnel = await Personnel.findById(updated.personnel._id);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }

    const today = new Date();
    const start = new Date(updated.startDate);
    const end = new Date(updated.endDate);
    const inPeriod = today >= start && today <= end;

    await Personnel.findByIdAndUpdate(personnel._id, {
      status: inPeriod ? "AI" : "Actif",
    });

    return res.status(200).json({
      message:
        "Date de fin mise à jour et operationType défini sur 'avisReprise'.",
      data: updated,
    });
  } catch (error) {
    console.error("Erreur updateEndDate :", error);
    return res.status(500).json({
      message: "Erreur lors de la mise à jour de la date de fin.",
      error: error.message,
    });
  }
};
