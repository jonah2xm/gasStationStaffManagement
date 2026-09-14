// controllers/absenceController.js
const fs = require("fs");
const path = require("path");
const Absence = require("../models/absenceModel");
const { MOTIFS, MOTIF_NON_AUTORISE, DUREE_MAX } = require("../models/absenceModel");
const Reprise = require("../models/repriseModel");
const Personnel = require("../models/personnelModel");
const Users = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { refuserAbsenceEnvoyee } = require("../utils/verrouEnvoi");

// Statut porté par un agent absent, quel que soit le motif.
const STATUT_ABSENT = "Absent";

/** Insère les notifications puis les émet via Socket.IO (rooms par utilisateur). */
async function createAndEmitNotifications(req, notifications) {
  if (!notifications || !notifications.length) return [];

  const inserted = await Notification.insertMany(notifications);

  try {
    const io = req.app.get("io");
    if (!io) return inserted;

    inserted.forEach((n) => {
      try {
        io.to(`user:${String(n.personnel)}`).emit("notification:new", {
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

/** Diffuse un message à tous les utilisateurs. */
async function broadcast(req, { reference, title, message, detailsUrl }) {
  const allUsers = await Users.find().select("_id").lean();
  if (!allUsers.length) return;

  await createAndEmitNotifications(
    req,
    allUsers.map((u) => ({
      personnel: u._id,
      type: "Absence",
      reference,
      title,
      message,
      date: new Date(),
      detailsUrl,
    }))
  );
}

/** Restreint une requête à la station du chef de station connecté. */
async function scopeToStation(req, query) {
  const { role, id } = req.session.user || {};
  if (role !== "chef station") return query;

  const user = await Users.findById(id);
  if (!user || !user.occupiedStation) return query;

  const personnelIds = await Personnel.find({
    stationName: user.occupiedStation,
  })
    .select("_id")
    .lean();

  query.personnel = { $in: personnelIds.map((p) => p._id) };
  return query;
}

/**
 * Durée d'absence facultative : vide → null, sinon un entier de 1 à DUREE_MAX.
 * Renvoie { duree } ou { erreur }.
 */
function lireDuree(valeur) {
  if (valeur === undefined || valeur === null || String(valeur).trim() === "") {
    return { duree: null };
  }
  const duree = Number(valeur);
  if (!Number.isInteger(duree) || duree < 1 || duree > DUREE_MAX) {
    return { erreur: `La durée doit être un nombre entier de jours, de 1 à ${DUREE_MAX}` };
  }
  return { duree };
}

/** Début du jour, pour comparer des dates sans tenir compte de l'heure. */
function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

// POST /api/absences
exports.createAbsence = async (req, res) => {
  try {
    const { personnelId, date, motif, description } = req.body;

    if (!personnelId || !date || !motif) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    if (!MOTIFS.includes(motif)) {
      return res.status(400).json({ message: "Motif d'absence invalide" });
    }
    const { duree, erreur: erreurDuree } = lireDuree(req.body.duree);
    if (erreurDuree) {
      return res.status(400).json({ message: erreurDuree });
    }

    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    const absenceDate = startOfDay(date);

    // Une seule absence par agent et par jour.
    const nextDay = new Date(absenceDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const duplicate = await Absence.findOne({
      personnel: personnelId,
      date: { $gte: absenceDate, $lt: nextDay },
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        message: "Une absence est déjà enregistrée pour cet agent à cette date.",
      });
    }

    const created = await Absence.create({
      personnel: personnelId,
      date: absenceDate,
      duree,
      motif,
      description: description || "",
      document: req.file ? req.file.path.replace(/\\/g, "/") : "",
    });

    // L'agent passe absent dès que la date est arrivée. Le retour à "Actif"
    // relève de l'avis de reprise, traité séparément.
    if (absenceDate <= startOfDay(new Date()) && personnel.status === "Actif") {
      await Personnel.findByIdAndUpdate(personnelId, {
        status: STATUT_ABSENT,
      });
    }

    const autorisee = motif !== MOTIF_NON_AUTORISE;
    await broadcast(req, {
      reference: created._id,
      title: autorisee ? "Nouvelle absence" : "Absence non autorisée",
      message: `Absence ${autorisee ? "autorisée" : "non autorisée"
        } de ${personnel.firstName} ${personnel.lastName
        } le ${absenceDate.toLocaleDateString("fr-FR")}.`,
      detailsUrl: `/absence/details/${created._id}`,
    });

    const populated = await created.populate(
      "personnel",
      "firstName lastName matricule stationName"
    );
    return res.status(201).json(populated);
  } catch (err) {
    console.error("Erreur lors de la création de l'absence :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la création de l'absence",
    });
  }
};

// GET /api/absences
exports.getAbsences = async (req, res) => {
  try {
    // ?motif=nonAutorisee filtre sur un motif précis.
    const query = await scopeToStation(req, {});
    if (req.query.motif && MOTIFS.includes(req.query.motif)) {
      query.motif = req.query.motif;
    }

    // ?ouvertes=1 ne renvoie que les absences sans avis de reprise.
    if (req.query.ouvertes === "1") {
      query.reprise = null;
    }

    const absences = await Absence.find(query)
      .populate("personnel", "firstName lastName matricule stationName")
      .populate("reprise", "dateReprise bordereau")
      .sort({ date: -1 });

    return res.status(200).json(absences);
  } catch (error) {
    console.error("Erreur lors de la récupération des absences :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des absences" });
  }
};

// GET /api/absences/non-autorisees-48h
// Absences non autorisées encore ouvertes datant de plus de 48 h. Une absence
// clôturée par un avis de reprise n'est plus en attente : elle sort du signal.
exports.getNonAutoriseesAfter48h = async (req, res) => {
  try {
    const limit = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const query = await scopeToStation(req, {
      motif: MOTIF_NON_AUTORISE,
      reprise: null,
      date: { $lt: limit },
    });

    const results = await Absence.find(query)
      .populate("personnel", "firstName lastName matricule stationName")
      .sort({ date: -1 });

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Erreur absences non autorisées 48h :", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// GET /api/absences/:id
exports.getAbsenceById = async (req, res) => {
  try {
    const absence = await Absence.findById(req.params.id)
      .populate("personnel", "firstName lastName matricule stationName poste")
      .populate("bordereau", "createdAt stationName")
      // L'avis de reprise envoyé verrouille aussi les absences qu'il clôture.
      .populate({
        path: "reprise",
        select: "dateReprise bordereau",
        populate: { path: "bordereau", select: "createdAt stationName" },
      });

    if (!absence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    return res.status(200).json(absence);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'absence :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'absence" });
  }
};

// PUT /api/absences/:id
exports.updateAbsence = async (req, res) => {
  try {
    const { personnelId, date, motif, description } = req.body;

    if (!personnelId || !date || !motif) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }
    if (!MOTIFS.includes(motif)) {
      return res.status(400).json({ message: "Motif d'absence invalide" });
    }
    const { duree, erreur: erreurDuree } = lireDuree(req.body.duree);
    if (erreurDuree) {
      return res.status(400).json({ message: erreurDuree });
    }

    const absence = await Absence.findById(req.params.id);
    if (!absence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    // Envoyée sur un bordereau, ou reprise dans un avis envoyé : verrouillée.
    if (await refuserAbsenceEnvoyee(req, res, absence)) return;

    const absenceDate = startOfDay(date);

    // Une seule absence par agent et par jour, en excluant celle-ci.
    const nextDay = new Date(absenceDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const duplicate = await Absence.findOne({
      _id: { $ne: absence._id },
      personnel: personnelId,
      date: { $gte: absenceDate, $lt: nextDay },
    }).lean();

    if (duplicate) {
      return res.status(409).json({
        message: "Une absence est déjà enregistrée pour cet agent à cette date.",
      });
    }

    absence.personnel = personnelId;
    absence.date = absenceDate;
    absence.duree = duree;
    absence.motif = motif;
    absence.description = description || "";

    if (req.file) {
      // Remplace le justificatif : l'ancien fichier n'est plus référencé.
      if (absence.document && fs.existsSync(absence.document)) {
        fs.unlink(path.resolve(absence.document), (err) => {
          if (err) console.warn("Échec suppression de l'ancien document :", err);
        });
      }
      absence.document = req.file.path.replace(/\\/g, "/");
    }

    await absence.save();

    const populated = await absence.populate(
      "personnel",
      "firstName lastName matricule stationName"
    );
    return res.status(200).json(populated);
  } catch (err) {
    console.error("Erreur lors de la modification de l'absence :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la modification de l'absence",
    });
  }
};

// DELETE /api/absences/:id
exports.deleteAbsence = async (req, res) => {
  try {
    const absence = await Absence.findById(req.params.id).populate(
      "personnel",
      "firstName lastName status"
    );
    if (!absence) {
      return res.status(404).json({ message: "Absence non trouvée" });
    }

    if (await refuserAbsenceEnvoyee(req, res, absence)) return;

    if (absence.document && fs.existsSync(absence.document)) {
      fs.unlink(path.resolve(absence.document), (err) => {
        if (err) console.warn("Échec suppression du justificatif :", err);
      });
    }

    const personnel = absence.personnel;
    await Absence.findByIdAndDelete(absence._id);

    // L'avis de reprise qui la clôturait ne doit plus la référencer.
    if (absence.reprise) {
      await Reprise.findByIdAndUpdate(absence.reprise, {
        $pull: { absences: absence._id },
      });
    }

    // L'agent redevient actif s'il ne lui reste aucune autre absence.
    let statusReset = false;
    if (personnel && personnel.status === STATUT_ABSENT) {
      const remaining = await Absence.countDocuments({
        personnel: personnel._id,
      });
      if (!remaining) {
        await Personnel.findByIdAndUpdate(personnel._id, { status: "Actif" });
        statusReset = true;
      }
    }

    const who = personnel
      ? `${personnel.firstName} ${personnel.lastName}`
      : "un agent";
    await broadcast(req, {
      reference: absence._id,
      title: "Suppression d'absence",
      message: statusReset
        ? `L'absence de ${who} a été supprimée et son statut est repassé à Actif.`
        : `L'absence de ${who} a été supprimée.`,
      detailsUrl: "/absence",
    });

    return res.status(200).json({ message: "Absence supprimée avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression de l'absence :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la suppression de l'absence",
    });
  }
};

// GET /api/absences/document/:id
exports.streamAbsenceDocument = async (req, res, next) => {
  try {
    const absence = await Absence.findById(req.params.id).lean();
    if (!absence || !absence.document) {
      return res.status(404).json({ message: "Document introuvable" });
    }

    const filePath = path.resolve(absence.document);
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ message: "Fichier manquant sur le serveur" });
    }

    res.type("application/pdf");
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    next(err);
  }
};
