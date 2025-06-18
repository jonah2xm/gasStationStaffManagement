const AffectationTemporaire = require("../models/affectationTemporaire");
const Personnel = require("../models/personnelModel");

const Station = require("../models/stationModel");

exports.createAffectation = async (req, res) => {
  try {
    const {
      personnelId,
      startDate,
      endDate,
      originStation, // now an ID string
      affectedStation, // now an ID string
      description,
    } = req.body;

    // 1. Validate
    if (
      !personnelId ||
      !startDate ||
      !endDate ||
      !originStation ||
      !affectedStation
    ) {
      return res
        .status(400)
        .json({ message: "Champs requis manquants pour l’affectation" });
    }

    // 2. Ensure stations exist
    const [originDoc, affectedDoc] = await Promise.all([
      Station.findById(originStation),
      Station.findById(affectedStation),
    ]);
    if (!originDoc || !affectedDoc) {
      return res
        .status(404)
        .json({ message: "Origine ou destination de station introuvable" });
    }

    // 3. Build assignData
    const assignData = {
      personnel: personnelId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      originStation: originDoc._id,
      affectedStation: affectedDoc._id,
      description: description || "",
    };
    if (req.file) {
      assignData.document = req.file.path.replace(/\\/g, "/");
    }

    // 4. Create & save
    const newAssign = new AffectationTemporaire(assignData);
    const savedAssign = await newAssign.save();

    // 5. Update Personnel’s current station
    await Personnel.findByIdAndUpdate(personnelId, {
      station: affectedDoc._id,
      stationName: affectedDoc.name,
    });

    // 6. Return
    return res.status(201).json({
      message: "Affectation temporaire créée avec succès",
      data: savedAssign,
    });
  } catch (err) {
    console.error("Erreur création affectation :", err);
    return res.status(500).json({
      message:
        err.message || "Erreur interne lors de la création de l’affectation",
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

    const updates = {};

    // Normalize personnel
    if (personnelId) {
      updates.personnel =
        typeof personnelId === "object"
          ? personnelId._id || personnelId.id
          : personnelId;
    }

    // Dates
    if (startDate) updates.startDate = new Date(startDate);
    if (endDate) updates.endDate = new Date(endDate);

    // Normalize stations
    if (originStation) {
      updates.originStation =
        typeof originStation === "object"
          ? originStation._id || originStation.id
          : originStation;
    }
    if (affectedStation) {
      updates.affectedStation =
        typeof affectedStation === "object"
          ? affectedStation._id || affectedStation.id
          : affectedStation;
    }

    // Description
    if (description !== undefined) updates.description = description;

    // Optional file upload
    if (req.file) {
      updates.document = req.file.path.replace(/\\/g, "/");
    }

    // Perform update
    const updated = await AffectationTemporaire.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "name")
      .populate("affectedStation", "name");

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Affectation temporaire introuvable." });
    }

    // If affectedStation changed, update personnel’s current station
    if (updates.affectedStation) {
      await Personnel.findByIdAndUpdate(updated.personnel._id, {
        station: updates.affectedStation,
        stationName: updated.affectedStation.name || updated.affectedStation,
      });
    }

    res.status(200).json({
      message: "Affectation temporaire mise à jour avec succès.",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating affectation temporaire:", error);
    res.status(500).json({
      message: "Erreur lors de la mise à jour de l'affectation temporaire.",
    });
  }
};
