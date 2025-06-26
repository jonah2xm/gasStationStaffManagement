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
    } = req.body;

    // 1) Champs obligatoires
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

    // 2) Charge le personnel
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 3) Vérifie holidaysLeft
    if (
      typeof personnel.holidaysLeft === "number" &&
      personnel.holidaysLeft < Number(dureeConge)
    ) {
      return res
        .status(400)
        .json({ message: "Le congé demandé dépasse le congé restant." });
    }

    // 4) Parse les dates
    const today = new Date();
    const start = new Date(dateDebut);
    const end = new Date(dateRetour);
    const isInPeriod = today >= start && today <= end;

    // 5) Si dans la période, il doit être Actif
    if (isInPeriod && personnel.status !== "Actif") {
      return res.status(400).json({
        message: "Le personnel n'est pas actif durant la période du congé.",
      });
    }

    // 6) **Chevauchement** : on récupère la dernière entrée pour ce personnel
    const lastConge = await Conge.findOne({ personnelId })
      .sort({ dateDebut: -1 })
      .lean();

    if (lastConge) {
      const lastStart = new Date(lastConge.dateDebut);
      const lastEnd = new Date(lastConge.dateRetour);

      const overlaps =
        (start >= lastStart && start <= lastEnd) ||
        (end >= lastStart && end <= lastEnd) ||
        (start <= lastStart && end >= lastEnd);

      if (overlaps) {
        return res.status(400).json({
          message: "L'employé a déjà un congé entre ces dates.",
        });
      }
    }

    // 7) Création du congé
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

    // 8) Mise à jour holidaysLeft et status si nécessaire
    let newHolidaysLeft =
      typeof personnel.holidaysLeft === "number"
        ? personnel.holidaysLeft - Number(dureeConge)
        : undefined;

    const shouldChangeStatus = isInPeriod && personnel.status === "Actif";

    await Personnel.findByIdAndUpdate(personnelId, {
      ...(shouldChangeStatus ? { status: "conge" } : {}),
      ...(newHolidaysLeft !== undefined && { holidaysLeft: newHolidaysLeft }),
    });

    const pop = await conge.populate(
      "personnelId",
      "firstName lastName matricule"
    );

    return res.status(201).json({
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
    return res.status(500).json({ message: err.message });
  }
};

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
      stationName: c.stationName,
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
    console.log("error", err);
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
    if (conge.personnelId) {
      // Récupérer le personnel pour mettre à jour holidaysLeft
      const personnel = await Personnel.findById(conge.personnelId);
      let newHolidaysLeft =
        personnel && typeof personnel.holidaysLeft === "number"
          ? personnel.holidaysLeft + Number(conge.dureeConge)
          : personnel.holidaysLeft;

      await Personnel.findByIdAndUpdate(conge.personnelId, {
        status: "Actif",
        holidaysLeft: newHolidaysLeft,
      });
    }

    res.json({ message: "Congé supprimé avec succès" });
  } catch (err) {
    console.error("Error deleting conge:", err);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/conges/:id
exports.updateConge = async (req, res) => {
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
    } = req.body;

    // 1) Charge l'ancien congé
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
      return res.status(404).json({ message: "Congé non trouvé" });
    }

    // 2) Charge le personnel
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 3) Vérifie statut initial
    if (personnel.status !== "Actif" && personnel.status !== "conge") {
      return res.status(400).json({ message: "L'employé n'est pas actif." });
    }

    // 4) Recalcul holidaysLeft
    const oldDuree = Number(conge.dureeConge);
    const newDuree = Number(dureeConge);
    const recalculatedHolidaysLeft =
      (typeof personnel.holidaysLeft === "number"
        ? personnel.holidaysLeft
        : 0) +
      oldDuree -
      newDuree;

    if (recalculatedHolidaysLeft < 0) {
      return res
        .status(400)
        .json({ message: "Le congé demandé dépasse le congé restant." });
    }

    // 5) Parse les nouvelles dates, calcule isInPeriod
    const today = new Date();
    const start = new Date(dateDebut);
    const end = new Date(dateRetour);
    const isInPeriod = today >= start && today <= end;

    // 6) **Chevauchement** hors ce congé‐ci
    const lastConge = await Conge.findOne({
      personnelId,
      _id: { $ne: req.params.id },
    })
      .sort({ dateDebut: -1 })
      .lean();

    if (lastConge) {
      const lastStart = new Date(lastConge.dateDebut);
      const lastEnd = new Date(lastConge.dateRetour);

      const overlaps =
        (start >= lastStart && start <= lastEnd) ||
        (end >= lastStart && end <= lastEnd) ||
        (start <= lastStart && end >= lastEnd);

      if (overlaps) {
        return res.status(400).json({
          message: "L'employé a déjà un congé entre ces dates.",
        });
      }
    }

    // 7) Applique la mise à jour
    conge.personnelId = personnelId;
    conge.stationName = stationName;
    conge.typeConge = typeConge;
    conge.dureeConge = dureeConge;
    conge.dateDebut = dateDebut;
    conge.dateRetour = dateRetour;
    conge.lieuSejour = lieuSejour;
    conge.nombreJourRestant = nombreJourRestant;
    let documentPath = conge.documentPath;

    if (req.file) {
      // Delete the old PDF
      if (documentPath && fs.existsSync(documentPath)) {
        fs.unlink(path.resolve(documentPath), (err) => {
          if (err)
            console.warn("Échec de la suppression de l'ancien PDF:", err);
        });
      }
      // Point to the newly uploaded file
      documentPath = req.file.path;
    }

    // Then later:
    conge.documentPath = documentPath;
    await conge.save();

    // 8) Met à jour holidaysLeft et status
    const newStatus = isInPeriod ? "conge" : "Actif";
    await Personnel.findByIdAndUpdate(personnelId, {
      holidaysLeft: recalculatedHolidaysLeft,
      status: newStatus,
    });

    const pop = await conge.populate(
      "personnelId",
      "firstName lastName matricule"
    );

    return res.json({
      _id: pop._id,
      personnel: pop.personnelId,
      station: { name: pop.stationName },
      typeConge: pop.typeConge,
      dureeConge: pop.dureeConge,
      dateDebut: pop.dateDebut,
      dateRetour: pop.dateRetour,
      lieuSejour: pop.lieuSejour,
      nombreJourRestant: pop.nombreJourRestant,
      documentPath: pop.documentPath,
      createdAt: pop.createdAt,
      updatedAt: pop.updatedAt,
    });
  } catch (err) {
    console.error("Error updating conge:", err);
    return res.status(500).json({ message: err.message });
  }
};
