// controllers/absenceAIController.js
const AbsenceAI = require("../models/absenceAIModel");
const Personnel = require("../models/personnelModel");
const Users = require("../models/userModel");
const Notification = require("../models/notificationModel");

/**
 * Helper: insert notifications and emit them via Socket.IO (per-user rooms)
 * - req is used to get req.app.get('io')
 * - notifications: array of objects matching Notification schema
 */
async function createAndEmitNotifications(req, notifications) {
  if (!notifications || !notifications.length) return [];

  // Insert into DB
  const inserted = await Notification.insertMany(notifications);

  // Emit via Socket.IO (per-user rooms)
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

    // Prepare broadcast fn (uses helper)
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
        title:
          operationType === "avisAbsence"
            ? "Nouvel avis d'absence"
            : "Avis de reprise",
        message: msg,
        date: new Date(),
        detailsUrl: `/absences/ai/details/${createdId}`,
      }));

      await createAndEmitNotifications(req, notifs);
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

      await broadcastNotification(created._id);

      if (operationType === "avisAbsence") {
        console.log("new absence", created);
        // always set to Actif, except future start → "AI"
        const newStatus = newStart > today ? "AI" : "Actif";
        await Personnel.findByIdAndUpdate(personnelId, { status: newStatus });
        return res.status(201).json(created);
      }

      // if avisReprise and not in period, just return created (already notified)
      return res.status(201).json(created);
    }

    // 6b) If IN period → must be Actif
    if (personnel.status !== "Actif") {
      return res.status(400).json({ message: "L'employé n'est pas actif." });
    }

    // 7) Create & then update status
    const aiData = {
      operationType,
      startDate: newStart,
      endDate: newEnd,
      personnel: personnelId,
      document: req.file ? req.file.path : undefined,
    };
    const created = await AbsenceAI.create(aiData);
    console.log("created", created);

    // UPDATED STATUS LOGIC
    if (operationType === "avisAbsence") {
      console.log("new absence", created);
      // always set to Actif, except future start → "AI"
      const newStatus = newStart > today ? "AI" : "Actif";
      await Personnel.findByIdAndUpdate(personnelId, { status: newStatus });
    } else {
      // avisReprise
      await Personnel.findByIdAndUpdate(personnelId, { status: "AI" });
    }

    await broadcastNotification(created._1d ?? created._id);

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
      title: "Suppression d'avis AI",
      message: baseMsg,
      date: new Date(),
      detailsUrl: `/absences/ai`,
    }));

    if (notifs.length) {
      await createAndEmitNotifications(req, notifs);
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
      title: "Mise à jour avis AI",
      message: baseMsg,
      date: new Date(),
      detailsUrl: `/absences/ai/details/${updated._id}`,
    }));

    await createAndEmitNotifications(req, notifs);

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

exports.getAIAfter48h = async (req, res) => {
  try {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime());

    const results = await AbsenceAI.find({
      operationType: "avisAbsence",
      createdAt: { $lt: fortyEightHoursAgo },
    }).populate("personnel"); // remove .populate() if not needed

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.log("errorr", error);
    console.error("Error fetching AI absences after 48h:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// Get only avisAbsence records (with optional pagination)
exports.getAvisAbsence = async (req, res) => {
  try {
    // filter for avisAbsence
    const filter = { operationType: "avisAbsence" };

    // pagination (limit=0 means no limit)
    const page = Math.max(parseInt(req.query.page ?? "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit ?? "0", 10), 0);

    const total = await AbsenceAI.countDocuments(filter);

    let query = await AbsenceAI.find({
      operationType: "avisAbsence",
    }).populate("personnel").sort({ createdAt: -1 }); // remove .populate() if not needed

    if (limit > 0) {
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    return res.status(200).json({
      success: true,
      total,
      page: limit > 0 ? page : 1,
      pages: limit > 0 ? Math.max(Math.ceil(total / limit), 1) : 1,
      data: query,
    });
  } catch (error) {
    console.error("Error getAvisAbsence:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des avis d'absence.",
      error: error.message,
    });
  }
};
