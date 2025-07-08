// controllers/absenceAIController.js
const AbsenceAI = require("../models/absenceAIModel");
const Personnel = require("../models/personnelModel");
const Users = require("../models/userModel");
const Notification = require("../models/notificationModel");

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

    // Prepare the notification payload function
    const broadcastNotification = async (createdId) => {
      const allUsers = await Users.find().select("_id").lean();
      const baseMsg =
        operationType === "avisAbsence"
          ? `Nouvel avis d'absence pour ${personnel.firstName} ${personnel.lastName}`
          : `Avis de reprise pour ${personnel.firstName} ${personnel.lastName}`;

      const dateRange = newEnd
        ? ` du ${newStart.toLocaleDateString()} au ${newEnd.toLocaleDateString()}`
        : ` à partir du ${newStart.toLocaleDateString()}`;

      const msg = baseMsg + dateRange + ".";

      const notifs = allUsers.map((u) => ({
        personnel: u._id,
        type: "AbsenceAI",
        reference: createdId,
        message: msg,
        detailsUrl: `/absences/ai/details/${createdId}`,
      }));

      await Notification.insertMany(notifs);
    };

    // 6a) If not in period → create only, then notify
    if (!isInPeriod) {
      const aiData = {
        operationType,
        startDate: newStart,
        endDate: newEnd,
        personnel: personnelId,
        document: req.file ? req.file.path : undefined,
      };
      const created = await AbsenceAI.create(aiData);

      // broadcast even out‑of‑period
      await broadcastNotification(created._id);

      return res.status(201).json(created);
    }

    // 6b) If in period → must be Actif
    if (personnel.status !== "Actif") {
      return res.status(400).json({ message: "L'employé n'est pas actif." });
    }

    // 7) Create & set status = "AI", then notify
    const aiData = {
      operationType,
      startDate: newStart,
      endDate: newEnd,
      personnel: personnelId,
      document: req.file ? req.file.path : undefined,
    };
    const created = await AbsenceAI.create(aiData);

    // update personnel status
    await Personnel.findByIdAndUpdate(personnelId, { status: "AI" });

    // broadcast in‑period notification
    await broadcastNotification(created._id);

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

    // 1) Load the entry to get dates and personnel
    const entry = await AbsenceAI.findById(id).populate(
      "personnel",
      "firstName lastName"
    );
    if (!entry) {
      return res.status(404).json({ message: "Entrée introuvable." });
    }

    // 2) Delete the database record
    await AbsenceAI.findByIdAndDelete(id);

    // 3) Determine if the personnel status should be reset
    const today = new Date();
    const start = new Date(entry.startDate);
    const end = entry.endDate ? new Date(entry.endDate) : null;

    let statusReset = false;
    if (end && today >= start && today <= end) {
      await Personnel.findByIdAndUpdate(entry.personnel._id, {
        status: "Actif",
      });
      statusReset = true;
    }

    // 4) Broadcast a notification to all users
    const allUsers = await Users.find().select("_id").lean();
    const baseMsg = statusReset
      ? `L'avis AI de ${entry.personnel.firstName} ${entry.personnel.lastName} a été supprimé et son statut est repassé à Actif.`
      : `L'avis AI  de ${entry.personnel.firstName} ${entry.personnel.lastName} a été supprimé.`;

    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "AbsenceAI",
      reference: entry._id,
      message: baseMsg,
      detailsUrl: `/absences/ai`,
    }));

    if (notifs.length) {
      await Notification.insertMany(notifs);
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
    const today = new Date();
    const start = new Date(updated.startDate);
    const end = new Date(updated.endDate);
    const inPeriod = today >= start && today <= end;

    const newStatus = inPeriod ? "AI" : "Actif";
    await Personnel.findByIdAndUpdate(updated.personnel._id, {
      status: newStatus,
    });

    // 4) Broadcast notification to all users
    const allUsers = await Users.find().select("_id").lean();
    const baseMsg = inPeriod
      ? `L'avis de reprise de ${updated.personnel.firstName} ${
          updated.personnel.lastName
        } démarre aujourd'hui jusqu'au ${end.toLocaleDateString()}.`
      : `L'avis de reprise de ${updated.personnel.firstName} ${
          updated.personnel.lastName
        } est terminé le ${end.toLocaleDateString()}.`;

    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "AbsenceAI",
      reference: updated._id,
      message: baseMsg,
      detailsUrl: `/absences/ai/details/${updated._id}`,
    }));

    await Notification.insertMany(notifs);

    return res.status(200).json({
      message:
        "Date de fin mise à jour, operationType défini sur 'avisReprise', et notifications envoyées.",
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
