// controllers/affectationDefinitif.js
const AffectationDefinitif = require("../models/affectatoinDefinitifModel");
const Personnel = require("../models/personnelModel");
const Station = require("../models/stationModel");

exports.createAffectationDefinitif = async (req, res) => {
  console.log("description", req.body);
  try {
    const {
      personnelId,
      startDate,
      originStation, // ID string
      affectedStation, // ID string
      description,
    } = req.body;

    // 1. Validation
    if (!personnelId || !startDate || !originStation || !affectedStation) {
      return res.status(400).json({
        message: "Champs requis manquants pour l’affectation définitive.",
      });
    }

    // 2. Vérifier l’existence des stations
    const [originDoc, affectedDoc] = await Promise.all([
      Station.findById(originStation),
      Station.findById(affectedStation),
    ]);
    if (!originDoc || !affectedDoc) {
      return res
        .status(404)
        .json({ message: "Origine ou station cible introuvable." });
    }

    // 3. Construire assignData (sans endDate)
    const assignData = {
      personnel: personnelId,
      startDate: new Date(startDate),
      originStation: originDoc._id,
      affectedStation: affectedDoc._id,
      description: description || "",
    };
    if (req.file) {
      assignData.document = req.file.path.replace(/\\/g, "/");
    }

    // 4. Créer et enregistrer en base
    const newAssign = new AffectationDefinitif(assignData);
    const savedAssign = await newAssign.save();

    // 5. Mettre à jour la station courante du personnel
    await Personnel.findByIdAndUpdate(personnelId, {
      station: affectedDoc._id,
      stationName: affectedDoc.name,
    });

    // 6. Retourner la réponse
    return res.status(201).json({
      message: "Affectation définitive créée avec succès.",
      data: savedAssign,
    });
  } catch (err) {
    console.error("Erreur création affectation définitive :", err);
    return res.status(500).json({
      message:
        err.message ||
        "Erreur interne lors de la création de l'affectation définitive.",
    });
  }
};

exports.getAllAffectationsDefinitif = async (req, res) => {
  try {
    const affectations = await AffectationDefinitif.find()
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "_id name")
      .populate("affectedStation", "_id name")
      .sort({ startDate: -1 });

    return res.status(200).json(affectations);
  } catch (error) {
    console.error("Erreur récupération des affectations définitives :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des affectations définitives.",
    });
  }
};

exports.getAffectationDefinitifById = async (req, res) => {
  console.log("req.params", req.params);
  try {
    const { id } = req.params;
    const affectation = await AffectationDefinitif.findById(id)
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "name")
      .populate("affectedStation", "name");

    if (!affectation) {
      return res
        .status(404)
        .json({ message: "Affectation définitive introuvable." });
    }

    return res.status(200).json(affectation);
  } catch (err) {
    console.error("Erreur récupération affectation définitive par ID :", err);
    return res.status(500).json({
      message: "Erreur lors de la récupération de l'affectation définitive.",
    });
  }
};

exports.updateAffectationDefinitif = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      personnelId,
      startDate,
      originStation,
      affectedStation,
      description,
    } = req.body;

    const updates = {};

    // Normaliser personnel
    if (personnelId) {
      updates.personnel =
        typeof personnelId === "object"
          ? personnelId._id || personnelId.id
          : personnelId;
    }

    // Date de début
    if (startDate) updates.startDate = new Date(startDate);

    // Normaliser stations
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

    // Fichier optionnel
    if (req.file) {
      updates.document = req.file.path.replace(/\\/g, "/");
    }

    // Appliquer la mise à jour
    const updated = await AffectationDefinitif.findByIdAndUpdate(
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
        .json({ message: "Affectation définitive introuvable." });
    }

    // Si affectedStation a changé, mettre à jour la station du personnel
    if (updates.affectedStation) {
      await Personnel.findByIdAndUpdate(updated.personnel._id, {
        station: updates.affectedStation,
        stationName: updated.affectedStation.name || updated.affectedStation,
      });
    }

    return res.status(200).json({
      message: "Affectation définitive mise à jour avec succès.",
      data: updated,
    });
  } catch (error) {
    console.error("Erreur mise à jour affectation définitive :", error);
    return res.status(500).json({
      message: "Erreur lors de la mise à jour de l'affectation définitive.",
    });
  }
};

exports.deleteAffectationDefinitif = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AffectationDefinitif.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Affectation définitive introuvable." });
    }

    return res
      .status(200)
      .json({ message: "Affectation définitive supprimée avec succès." });
  } catch (err) {
    console.error("Erreur suppression affectation définitive :", err);
    return res.status(500).json({
      message: "Erreur lors de la suppression de l'affectation définitive.",
    });
  }
};
