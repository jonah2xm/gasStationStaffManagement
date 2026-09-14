const Conge = require("../models/congeModel");
const { TYPES_CONGE, joursDecomptes } = require("../models/congeModel");
const Personnel = require("../models/personnelModel");
const fs = require("fs");
const path = require("path");
const Users = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { refuserCongeEnvoye } = require("../utils/verrouEnvoi");

// Helper: insert notifications and emit them via Socket.IO (per-user rooms)
async function createAndEmitNotifications(req, notifications) {
  if (!notifications || !notifications.length) return [];

  // Insert into DB first
  const inserted = await Notification.insertMany(notifications);

  // Emit via Socket.IO (per-user rooms)
  try {
    const io = req.app.get("io");
    if (!io) return inserted;

    inserted.forEach((n) => {
      try {
        // Use string cast to be safe with ObjectId
        const userRoom = `user:${String(n.personnel)}`;
        io.to(userRoom).emit("notification:new", {
          _id: n._id,
          type: n.type,
          reference: n.reference,
          title: n.title,
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
      agentInterimaire,
      nombreJourRestant,
    } = req.body;

    // 1) Champs obligatoires (le justificatif n'est plus televerse :
    //    la demande est generee puis imprimee depuis l'application)
    if (!personnelId || !stationName) {
      return res.status(400).json({ message: "Champs requis manquants." });
    }
    if (typeConge !== undefined && !TYPES_CONGE.includes(typeConge)) {
      return res.status(400).json({ message: "Type de congé invalide." });
    }

    // 2) Charge le personnel
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 3) Vérifie holidaysLeft (une récupération ne le consomme pas)
    const joursDuSolde = joursDecomptes(typeConge, dureeConge);
    if (
      typeof personnel.holidaysLeft === "number" &&
      personnel.holidaysLeft < joursDuSolde
    ) {
      return res
        .status(400)
        .json({ message: "Le congé demandé dépasse le congé restant." });
    }

    // 4) Parse les dates & chevauchement
    const today = new Date();
    const start = new Date(dateDebut);
    const end = new Date(dateRetour);
    const isInPeriod = today >= start && today <= end;

    // Tous les congés de l'agent, pas seulement le plus récent : un congé
    // antérieur au dernier enregistré peut aussi chevaucher (bornes incluses).
    const chevauchement = await Conge.exists({
      personnelId,
      dateDebut: { $lte: end },
      dateRetour: { $gte: start },
    });
    if (chevauchement) {
      return res.status(400).json({
        message: "L'employé a déjà un congé entre ces dates.",
      });
    }

    // 5) Création du congé
    const conge = new Conge({
      personnelId,
      stationName,
      typeConge,
      dureeConge,
      dateDebut,
      dateRetour,
      lieuSejour,
      agentInterimaire: agentInterimaire || "",
      nombreJourRestant,
      ...(req.file ? { documentPath: req.file.path } : {}),
    });
    const savedConge = await conge.save();

    // 6) Mise à jour holidaysLeft et status si nécessaire
    const newHolidaysLeft =
      typeof personnel.holidaysLeft === "number"
        ? personnel.holidaysLeft - joursDuSolde
        : undefined;
    const shouldChangeStatus = isInPeriod && personnel.status === "Actif";

    await Personnel.findByIdAndUpdate(personnelId, {
      ...(shouldChangeStatus ? { status: "Conge" } : {}),
      ...(newHolidaysLeft !== undefined && { holidaysLeft: newHolidaysLeft }),
    });

    // 7) Notification au salarié concerné
    // (optional: create a direct notification only for the employee)
    const personalNotif = {
      personnel: personnelId,
      type: "Conge",
      reference: savedConge._id,
      title: "Votre congé a été enregistré",
      message: `Votre congé (${typeConge}) du ${start.toLocaleDateString()} au ${end.toLocaleDateString()} a été enregistré.`,
      date: new Date(),
      detailsUrl: `/conges/details/${savedConge._id}`,
    };
    // create personal notification and emit
    await createAndEmitNotifications(req, [personalNotif]);

    // 8) Broadcast notification à tous les utilisateurs
    const allUsers = await Users.find().select("_id").lean();
    const broadcastMessage = `Congé de ${personnel.firstName} ${personnel.lastName
      } (${typeConge}) du ${start.toLocaleDateString()} au ${end.toLocaleDateString()}. pour ${dureeConge} jour(s).`;

    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "Conge",
      reference: savedConge._id,
      title: "Congé enregistré pour un employé",
      message: broadcastMessage,
      date: new Date(),
      detailsUrl: `/conges/details/${savedConge._id}`,
    }));

    if (notifs.length) {
      await createAndEmitNotifications(req, notifs);
    }

    // 9) Réponse
    const pop = await savedConge.populate(
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
      agentInterimaire: pop.agentInterimaire,
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
    const { role, id } = req.session.user || {};
    let query = {};

    if (role === "chef station") {
      const user = await Users.findById(id);
      if (user && user.occupiedStation) {
        query.stationName = user.occupiedStation;
      }
    }

    const list = await Conge.find(query)
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
      agentInterimaire: c.agentInterimaire,
      nombreJourRestant: c.nombreJourRestant,
      // Un congé envoyé sur un bordereau est verrouillé.
      bordereau: c.bordereau || null,
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
    // poste / hireDate / contractType alimentent la demande de congé imprimable
    const c = await Conge.findById(req.params.id)
      .populate(
        "personnelId",
        "firstName lastName matricule poste hireDate contractType holidaysLeft"
      )
      .populate("bordereau", "createdAt stationName")
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
      agentInterimaire: c.agentInterimaire,
      nombreJourRestant: c.nombreJourRestant,
      documentPath: c.documentPath,
      bordereau: c.bordereau || null,
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
    // 0) Un congé envoyé sur un bordereau ne peut pas être supprimé.
    const existant = await Conge.findById(req.params.id).select("bordereau").lean();
    if (!existant) {
      return res.status(404).json({ message: "Congé non trouvé" });
    }
    if (await refuserCongeEnvoye(req, res, existant)) return;

    // 1) Supprimer et récupérer l’ancien document
    const conge = await Conge.findByIdAndDelete(req.params.id).lean();
    if (!conge) {
      return res.status(404).json({ message: "Congé non trouvé" });
    }

    // 2) Supprimer le fichier PDF
    if (conge.documentPath && fs.existsSync(conge.documentPath)) {
      fs.unlink(path.resolve(conge.documentPath), (err) => {
        if (err) console.warn("Échec suppression du PDF :", err);
      });
    }

    // 3) Mettre à jour le personnel : status = Actif + holidaysLeft
    if (conge.personnelId) {
      const personnel = await Personnel.findById(conge.personnelId);
      // Une récupération n'avait rien décompté : rien à rendre.
      const addedDays =
        typeof personnel.holidaysLeft === "number"
          ? joursDecomptes(conge.typeConge, conge.dureeConge)
          : 0;
      const newHolidaysLeft =
        typeof personnel.holidaysLeft === "number"
          ? personnel.holidaysLeft + addedDays
          : personnel.holidaysLeft;

      await Personnel.findByIdAndUpdate(conge.personnelId, {
        status: "Actif",
        holidaysLeft: newHolidaysLeft,
      });

      // 4) Notification privée à l’employé
      const personalCancelNotif = {
        personnel: conge.personnelId,
        type: "Conge",
        reference: conge._id,
        title: "Votre congé a été annulé",
        message: `Votre congé du ${new Date(conge.dateDebut).toLocaleDateString()} au ${new Date(conge.dateRetour).toLocaleDateString()} a été annulé.`,
        date: new Date(),
        detailsUrl: `/conges/archives/${conge._id}`,
      };
      await createAndEmitNotifications(req, [personalCancelNotif]);
    }

    // 5) Notification broadcast à TOUS les utilisateurs
    //    pour informer de l’annulation de ce congé
    const allUsers = await Users.find().select("_id").lean();
    const personnel = await Personnel.findById(conge.personnelId).lean();
    const broadcastMessage = personnel
      ? `Le congé de ${personnel.firstName} ${personnel.lastName} du ${new Date(
        conge.dateDebut
      ).toLocaleDateString()} au ${new Date(
        conge.dateRetour
      ).toLocaleDateString()} a été annulé.`
      : `Un congé a été annulé (ID: ${conge._id}).`;

    const notifs = allUsers.map((u) => ({
      personnel: u._id,
      type: "Conge",
      reference: conge._id,
      title: "Annulation de congé",
      message: broadcastMessage,
      date: new Date(),
      detailsUrl: `/conges/archives/${conge._id}`,
    }));

    if (notifs.length) {
      await createAndEmitNotifications(req, notifs);
    }

    return res.json({ message: "Congé supprimé avec succès" });
  } catch (err) {
    console.error("Error deleting conge:", err);
    return res.status(500).json({ message: err.message });
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
      agentInterimaire,
      nombreJourRestant,
    } = req.body;

    if (typeConge !== undefined && !TYPES_CONGE.includes(typeConge)) {
      return res.status(400).json({ message: "Type de congé invalide." });
    }

    // 1) Charge l'ancien congé
    const conge = await Conge.findById(req.params.id);
    if (!conge) {
      return res.status(404).json({ message: "Congé non trouvé" });
    }

    // Un congé envoyé sur un bordereau ne peut plus être modifié.
    if (await refuserCongeEnvoye(req, res, conge)) return;

    // 2) Charge le personnel
    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 3) Vérifie statut initial
    if (personnel.status !== "Actif" && personnel.status !== "conge") {
      return res.status(400).json({ message: "L'employé n'est pas actif." });
    }

    // 4) Recalcul holidaysLeft : rend les jours décomptés par l'ancien congé,
    //    retire ceux du nouveau (0 pour une récupération).
    const oldDuree = joursDecomptes(conge.typeConge, conge.dureeConge);
    const newDuree = joursDecomptes(typeConge ?? conge.typeConge, dureeConge);
    const recalculatedHolidaysLeft =
      (typeof personnel.holidaysLeft === "number"
        ? personnel.holidaysLeft
        : 0) +
      oldDuree -
      newDuree;

    if (newDuree > 0 && recalculatedHolidaysLeft < 0) {
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
    const chevauchement = await Conge.exists({
      personnelId,
      _id: { $ne: req.params.id },
      dateDebut: { $lte: end },
      dateRetour: { $gte: start },
    });

    if (chevauchement) {
      return res.status(400).json({
        message: "L'employé a déjà un congé entre ces dates.",
      });
    }

    // 7) Applique la mise à jour
    conge.personnelId = personnelId;
    conge.stationName = stationName;
    conge.typeConge = typeConge;
    conge.dureeConge = dureeConge;
    conge.dateDebut = dateDebut;
    conge.dateRetour = dateRetour;
    conge.lieuSejour = lieuSejour;
    conge.agentInterimaire = agentInterimaire || "";
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
      agentInterimaire: pop.agentInterimaire,
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
