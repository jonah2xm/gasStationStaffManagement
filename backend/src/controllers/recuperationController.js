// controllers/recuperationController.js
const Recuperation = require("../models/recuperationModel");
const Personnel = require("../models/personnelModel");
const fs = require("fs");
const path = require("path");
// Create a new recuperation record
const Notification = require("../models/notificationModel");
const Users = require("../models/userModel");

exports.createRecuperation = async (req, res) => {
  const { personnelId, stationName, dureeRecuperation, dateDebut, dateRetour } =
    req.body;

  try {
    // 1) PDF obligatoire
    if (!req.file) {
      return res.status(400).json({ message: "Document PDF manquant" });
    }

    // 2) Le personnel doit exister
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 3) Parser les dates
    const start = new Date(dateDebut);
    const end = new Date(dateRetour);
    const today = new Date();
    const isInPeriod = today >= start && today <= end;

    // 4) Vérifier chevauchement AVANT tout .save()
    const lastRecup = await Recuperation.findOne({ personnelId })
      .sort({ dateDebut: -1 })
      .lean();

    if (lastRecup) {
      const lastStart = new Date(lastRecup.dateDebut);
      const lastEnd = new Date(lastRecup.dateRetour);

      const overlaps =
        (start >= lastStart && start <= lastEnd) ||
        (end >= lastStart && end <= lastEnd) ||
        (start <= lastStart && end >= lastEnd);

      if (overlaps) {
        return res.status(400).json({
          message: "L'employé a déjà une récupération entre ces dates.",
        });
      }
    }

    // 5) Création de l'objet Recuperation
    const recup = new Recuperation({
      personnelId,
      stationName,
      dureeRecuperation,
      dateDebut,
      dateRetour,
      documentPath: req.file.path,
    });
    const saved = await recup.save();

    // 6) Mise à jour du statut si on est dans la période
    if (isInPeriod && personnel.status === "Actif") {
      await Personnel.findByIdAndUpdate(personnelId, {
        status: "Recuperation",
      });
    }

    // 7) Envoi des notifications à tous les utilisateurs
    const allUsers = await Users.find().select("_id").lean();
    const message = `Récupération de ${personnel.firstName} ${
      personnel.lastName
    } du ${start.toLocaleDateString()} au ${end.toLocaleDateString()}.`;
    const notifs = allUsers.map((user) => ({
      personnel: user._id,
      type: "Recuperation",
      reference: saved._id,
      title: "Nouvelle récupération",
      message,
      date: new Date(),
      detailsUrl: "/recuperations/" + saved._id,
    }));

    if (notifs.length) {
      await Notification.insertMany(notifs);
    }

    return res.status(201).json({
      message: "Récupération créée avec succès.",
      data: saved,
    });
  } catch (err) {
    console.error("Erreur createRecuperation:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Get all recuperations
exports.getAllRecuperations = async (req, res) => {
  try {
    const list = await Recuperation.find().populate("personnelId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get one by ID
exports.getRecuperationById = async (req, res) => {
  try {
    const recup = await Recuperation.findById(req.params.id).populate(
      "personnelId"
    );
    if (!recup) return res.status(404).json({ error: "Not found" });
    res.json(recup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a record
exports.updateRecuperation = async (req, res) => {
  try {
    const { dateDebut, dateRetour, personnelId } = req.body;
    const start = new Date(dateDebut);
    const end = new Date(dateRetour);
    const today = new Date();
    const isInPeriod = today >= start && today <= end;

    // 1) Charger la récupération existante
    const recup = await Recuperation.findById(req.params.id);
    if (!recup) {
      return res.status(404).json({ error: "Récupération non trouvée" });
    }

    // 2) Vérifier chevauchement (hors ce doc)
    const lastRecup = await Recuperation.findOne({
      personnelId,
      _id: { $ne: req.params.id },
    })
      .sort({ dateDebut: -1 })
      .lean();

    if (lastRecup) {
      const lastStart = new Date(lastRecup.dateDebut);
      const lastEnd = new Date(lastRecup.dateRetour);
      const overlaps =
        (start >= lastStart && start <= lastEnd) ||
        (end >= lastStart && end <= lastEnd) ||
        (start <= lastStart && end >= lastEnd);

      if (overlaps) {
        return res.status(400).json({
          message: "L'employé a déjà une récupération entre ces dates.",
        });
      }
    }

    // 3) Si un nouveau fichier arrive, supprimer l'ancien
    if (req.file) {
      const oldPath = recup.documentPath;
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlink(path.resolve(oldPath), (err) => {
          if (err) console.warn("Échec suppression ancien PDF:", err);
        });
      }
      recup.documentPath = req.file.path;
    }

    // 4) Mettre à jour les champs
    recup.personnelId = personnelId;
    recup.dateDebut = dateDebut;
    recup.dateRetour = dateRetour;
    recup.dureeRecuperation = req.body.dureeRecuperation;
    // … ajoutez tout autre champ modifiable ici …

    // 5) Sauvegarder
    await recup.save();

    // 6) Mettre à jour le statut du personnel
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ error: "Personnel non trouvé" });
    }

    if (isInPeriod) {
      if (personnel.status !== "Actif") {
        return res.status(400).json({ message: "L'employé n'est pas actif." });
      }
      await Personnel.findByIdAndUpdate(personnelId, {
        status: "Recuperation",
      });
    } else {
      await Personnel.findByIdAndUpdate(personnelId, { status: "Actif" });
    }

    return res.json(recup);
  } catch (err) {
    console.error("Erreur updateRecuperation:", err);
    return res.status(400).json({ error: err.message });
  }
};
// Delete a record
exports.deleteRecuperation = async (req, res) => {
  console.log("deleteRecuperation called with id:", req.params.id);

  try {
    // 1) Charger la récupération
    const recup = await Recuperation.findById(req.params.id);
    if (!recup) {
      return res.status(404).json({ error: "Récupération non trouvée" });
    }

    // 2) Supprimer le fichier PDF associé
    if (recup.documentPath && fs.existsSync(recup.documentPath)) {
      fs.unlink(path.resolve(recup.documentPath), (err) => {
        if (err) console.warn("Échec de suppression du PDF :", err);
      });
    }

    // 3) Supprimer la récupération
    await Recuperation.findByIdAndDelete(req.params.id);

    // 4) Mise à jour du statut si nécessaire
    const today = new Date();
    const start = new Date(recup.dateDebut);
    const end = new Date(recup.dateRetour);
    if (today >= start && today <= end) {
      await Personnel.findByIdAndUpdate(recup.personnelId, { status: "Actif" });
    }

    // 5) Notification à tous les utilisateurs
    const personnel = await Personnel.findById(recup.personnelId).lean();
    if (personnel) {
      const allUsers = await Users.find().select("_id").lean();
      const message = `La récupération de ${personnel.firstName} ${
        personnel.lastName
      } du ${start.toLocaleDateString()} au ${end.toLocaleDateString()} a été annulée.`;

      const notifs = allUsers.map((user) => ({
        personnel: user._id,
        type: "Recuperation",
        reference: recup._id,
        title: "Récupération annulée",
        message,
        date: new Date(),
        detailsUrl: "/recuperations/", // à adapter
      }));

      if (notifs.length) {
        await Notification.insertMany(notifs);
      }
    }

    return res.json({ message: "Suppression réussie" });
  } catch (err) {
    console.error("Erreur deleteRecuperation:", err);
    return res.status(500).json({ error: err.message });
  }
};
