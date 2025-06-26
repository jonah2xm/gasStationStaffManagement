const AffectationTemporaire = require("../models/affectationTemporaire");
const Personnel = require("../models/personnelModel");

const Station = require("../models/stationModel");

// controllers/affectationController.js

const fs = require("fs");
const path = require("path");

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

    // 1) Validate required fields
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

    // 2) Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    // 3) Load personnel and check existence
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }

    // 4) If today ∈ [start, end], ensure personnel.status is "Actif"
    if (today >= start && today <= end && personnel.status !== "Actif") {
      return res
        .status(400)
        .json({ message: "L'employé n'est pas actif pendant cette période." });
    }

    // 5) Check overlap with the *last* assignment of this person
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

    // 6) Verify stations exist
    const [originDoc, affectedDoc] = await Promise.all([
      Station.findById(originStation),
      Station.findById(affectedStation),
    ]);
    if (!originDoc || !affectedDoc) {
      return res
        .status(404)
        .json({ message: "Origine ou destination introuvable." });
    }

    // 7) Build and save the assignment
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

    // 8) Update Personnel’s current station (but never touch status)
    await Personnel.findByIdAndUpdate(personnelId, {
      station: affectedDoc._id,
      stationName: affectedDoc.name,
    });

    // 9) Return
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
    const affectations = await AffectationTemporaire.find()

      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "_id name")
      .populate("affectedStation", "_id name") // optional
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

    // 1) Fetch the existing assignment
    const existing = await AffectationTemporaire.findById(id).lean();
    if (!existing) {
      return res
        .status(404)
        .json({ message: "Affectation temporaire introuvable." });
    }

    // 2) Parse new dates (or fall back to old ones)
    const newStart = startDate
      ? new Date(startDate)
      : new Date(existing.startDate);
    const newEnd = endDate ? new Date(endDate) : new Date(existing.endDate);
    const today = new Date();

    // 3) If today ∈ [newStart, newEnd], ensure personnel is Actif
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

    // 4) Overlap check against *other* assignments for this person
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

    // 5) Build update object
    const updates = {};
    if (startDate) updates.startDate = newStart;
    if (endDate) updates.endDate = newEnd;
    if (originStation) updates.originStation = originStation;
    if (affectedStation) updates.affectedStation = affectedStation;
    if (description !== undefined) updates.description = description;
    if (req.file) {
      updates.document = req.file.path.replace(/\\/g, "/");
      // (optional) unlink existing.document file here
    }

    // 6) Perform the update
    const updated = await AffectationTemporaire.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "name")
      .populate("affectedStation", "name");

    // 7) If affectedStation changed, update Personnel.station
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

    // 1) Find the assignment
    const assign = await AffectationTemporaire.findById(id).lean();
    if (!assign) {
      return res
        .status(404)
        .json({ message: "Affectation temporaire non trouvée." });
    }

    // 2) Delete the PDF file if present
    if (assign.document) {
      const fullPath = path.resolve(assign.document);
      fs.unlink(fullPath, (err) => {
        if (err && err.code !== "ENOENT") {
          console.warn("Impossible de supprimer le fichier PDF :", err);
        }
      });
    }

    // 3) Remove the DB record
    await AffectationTemporaire.findByIdAndDelete(id);

    // 4) Load the origin station document to get its name
    const originDoc = await Station.findById(assign.originStation).lean();
    if (originDoc) {
      // 5) Update Personnel back to originStation
      await Personnel.findByIdAndUpdate(assign.personnel, {
        station: originDoc._id,
        stationName: originDoc.name,
      });
    }

    // 6) Respond
    return res.status(200).json({
      message: "Affectation temporaire supprimée, station remise à l'origine.",
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
