// controllers/congeController.js

const Conge = require("../models/congeModel");
const Personnel = require("../models/personnelModel");
const fs = require("fs");
const path = require("path");

// POST /api/conges
exports.addConge = async (req, res) => {
  try {
    const {
      personnelId,
      stationName,
      typeConge,
      dureeConge,
      dateDebut,
      dateRetour,
      lieuSejour,
      nombreJourRestant,
      holidaysLeft,
    } = req.body;

    if (!personnelId) {
      return res
        .status(400)
        .json({ message: "Le champ personnelId est requis" });
    }
    if (!stationName) {
      return res
        .status(400)
        .json({ message: "Le champ stationName est requis" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Document PDF manquant" });
    }

    const conge = new Conge({
      personnelId,
      stationName,
      typeConge,
      dureeConge,
      dateDebut,
      dateRetour,
      lieuSejour,
      nombreJourRestant,
      documentPath: req.file.path,
    });

    await conge.save();
    // send back the newly created document, reshaped:
    const pop = await conge.populate(
      "personnelId",
      "firstName lastName matricule"
    );

    await Personnel.findByIdAndUpdate(personnelId, {
      status: "conge",
    });
    res.status(201).json({
      _id: pop._id,
      personnel: pop.personnelId,
      station: { name: pop.stationName },
      typeConge: pop.typeConge,
      dureeConge: pop.dureeConge,
      dateDebut: pop.dateDebut,
      dateRetour: pop.dateRetour,
      lieuSejour: pop.lieuSejour,
      nombreJourRestant: pop.nombreJourRestant,
      createdAt: pop.createdAt,
      updatedAt: pop.updatedAt,
    });
  } catch (err) {
    console.error("Error adding conge:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conges
exports.getAllConges = async (req, res) => {
  try {
    const list = await Conge.find()
      .populate("personnelId", "firstName lastName matricule")
      .lean();

    // reshape to match frontend expectations
    const shaped = list.map((c) => ({
      _id: c._id,
      personnel: c.personnelId,
      station: { name: c.stationName },
      typeConge: c.typeConge,
      dureeConge: c.dureeConge,
      dateDebut: c.dateDebut,
      dateRetour: c.dateRetour,
      lieuSejour: c.lieuSejour,
      nombreJourRestant: c.nombreJourRestant,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.json(shaped);
  } catch (err) {
    console.error("Error fetching congés:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conges/:id
exports.getCongeById = async (req, res) => {
  try {
    const c = await Conge.findById(req.params.id)
      .populate("personnelId", "firstName lastName matricule")
      .lean();

    if (!c) {
      return res.status(404).json({ message: "Congé non trouvé" });
    }

    res.json({
      _id: c._id,
      personnel: c.personnelId,
      station: { name: c.stationName },
      typeConge: c.typeConge,
      dureeConge: c.dureeConge,
      dateDebut: c.dateDebut,
      dateRetour: c.dateRetour,
      lieuSejour: c.lieuSejour,
      nombreJourRestant: c.nombreJourRestant,
      documentPath: c.documentPath,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  } catch (err) {
    console.error("Error fetching conge by id:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/conges/:id
exports.deleteConge = async (req, res) => {
  try {
    const conge = await Conge.findByIdAndDelete(req.params.id).lean();
    if (!conge) {
      return res.status(404).json({ message: "Congé non trouvé" });
    }

    // optionally delete the PDF file on disk
    fs.unlink(path.resolve(conge.documentPath), (err) => {
      if (err) console.warn("Failed to delete file:", err);
    });

    res.json({ message: "Congé supprimé avec succès" });
  } catch (err) {
    console.error("Error deleting conge:", err);
    res.status(500).json({ message: err.message });
  }
};
