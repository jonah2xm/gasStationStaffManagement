// controllers/repriseController.js
const Reprise = require("../models/repriseModel");
const Absence = require("../models/absenceModel");
const Personnel = require("../models/personnelModel");
const Users = require("../models/userModel");
const { refuserRepriseEnvoyee } = require("../utils/verrouEnvoi");

const STATUT_ACTIF = "Actif";
const STATUT_ABSENT = "Absent";

/** Début du jour, pour comparer des dates sans tenir compte de l'heure. */
function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
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

// GET /api/reprises/eligibles
// Agents ayant au moins une absence ouverte, avec ces absences : c'est la
// source du formulaire, qui reprend les données de l'avis d'absence.
exports.getEligibles = async (req, res) => {
  try {
    const query = await scopeToStation(req, { reprise: null });

    const absences = await Absence.find(query)
      .populate("personnel", "firstName lastName matricule stationName poste")
      .sort({ date: 1 })
      .lean();

    // Regroupe les absences ouvertes par agent.
    const byPersonnel = new Map();
    for (const absence of absences) {
      if (!absence.personnel) continue;
      const key = String(absence.personnel._id);

      if (!byPersonnel.has(key)) {
        byPersonnel.set(key, {
          ...absence.personnel,
          absencesOuvertes: [],
        });
      }
      byPersonnel.get(key).absencesOuvertes.push({
        _id: absence._id,
        date: absence.date,
        duree: absence.duree ?? null,
        motif: absence.motif,
        description: absence.description,
        document: absence.document,
      });
    }

    return res.status(200).json([...byPersonnel.values()]);
  } catch (error) {
    console.error("Erreur lors de la récupération des agents éligibles :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des agents éligibles" });
  }
};

// POST /api/reprises
exports.createReprise = async (req, res) => {
  try {
    const { personnelId, dateReprise } = req.body;

    if (!personnelId || !dateReprise) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const personnel = await Personnel.findById(personnelId);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    const reprise = startOfDay(dateReprise);

    // Absences ouvertes de l'agent, antérieures ou égales à la reprise :
    // une absence postérieure n'a pas à être clôturée par cet avis.
    const openAbsences = await Absence.find({
      personnel: personnelId,
      reprise: null,
      date: { $lte: reprise },
    })
      .sort({ date: 1 })
      .lean();

    if (!openAbsences.length) {
      const anyOpen = await Absence.exists({
        personnel: personnelId,
        reprise: null,
      });
      return res.status(400).json({
        message: anyOpen
          ? "Les absences ouvertes de cet agent sont postérieures à la date de reprise."
          : "Cet agent n'a aucune absence en attente de reprise.",
      });
    }

    const created = await Reprise.create({
      personnel: personnelId,
      dateReprise: reprise,
      absences: openAbsences.map((a) => a._id),
    });

    // Clôture les absences et remet l'agent en service.
    await Absence.updateMany(
      { _id: { $in: openAbsences.map((a) => a._id) } },
      { reprise: created._id }
    );
    await Personnel.findByIdAndUpdate(personnelId, { status: STATUT_ACTIF });

    const populated = await Reprise.findById(created._id)
      .populate("personnel", "firstName lastName matricule stationName poste")
      .populate("absences");

    return res.status(201).json(populated);
  } catch (err) {
    console.error("Erreur lors de la création de l'avis de reprise :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la création de l'avis de reprise",
    });
  }
};

// GET /api/reprises
exports.getReprises = async (req, res) => {
  try {
    const query = await scopeToStation(req, {});

    const reprises = await Reprise.find(query)
      .populate("personnel", "firstName lastName matricule stationName")
      .populate("absences")
      .sort({ dateReprise: -1 });

    return res.status(200).json(reprises);
  } catch (error) {
    console.error("Erreur lors de la récupération des reprises :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des reprises" });
  }
};

// GET /api/reprises/:id
exports.getRepriseById = async (req, res) => {
  try {
    const reprise = await Reprise.findById(req.params.id)
      .populate("personnel", "firstName lastName matricule stationName poste")
      .populate("absences")
      .populate("bordereau", "createdAt stationName");

    if (!reprise) {
      return res.status(404).json({ message: "Avis de reprise non trouvé" });
    }

    return res.status(200).json(reprise);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'avis :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération de l'avis" });
  }
};

// PUT /api/reprises/:id — seule la date de reprise est modifiable.
exports.updateReprise = async (req, res) => {
  try {
    const { dateReprise } = req.body;
    if (!dateReprise) {
      return res.status(400).json({ message: "La date de reprise est requise" });
    }

    const reprise = await Reprise.findById(req.params.id).populate("absences");
    if (!reprise) {
      return res.status(404).json({ message: "Avis de reprise non trouvé" });
    }

    // Un avis envoyé sur un bordereau ne peut plus être modifié.
    if (await refuserRepriseEnvoyee(req, res, reprise)) return;

    const newDate = startOfDay(dateReprise);

    // La reprise ne peut pas précéder les absences qu'elle clôture.
    const latest = reprise.absences.reduce(
      (max, a) => (new Date(a.date) > max ? new Date(a.date) : max),
      new Date(0)
    );
    if (newDate < startOfDay(latest)) {
      return res.status(400).json({
        message:
          "La date de reprise ne peut pas être antérieure aux absences clôturées.",
      });
    }

    reprise.dateReprise = newDate;
    await reprise.save();

    const populated = await Reprise.findById(reprise._id)
      .populate("personnel", "firstName lastName matricule stationName poste")
      .populate("absences");

    return res.status(200).json(populated);
  } catch (err) {
    console.error("Erreur lors de la modification de l'avis :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la modification de l'avis",
    });
  }
};

// DELETE /api/reprises/:id
exports.deleteReprise = async (req, res) => {
  try {
    const reprise = await Reprise.findById(req.params.id);
    if (!reprise) {
      return res.status(404).json({ message: "Avis de reprise non trouvé" });
    }

    if (await refuserRepriseEnvoyee(req, res, reprise)) return;

    await Reprise.findByIdAndDelete(reprise._id);

    // Les absences redeviennent ouvertes : l'agent repasse absent.
    await Absence.updateMany({ reprise: reprise._id }, { reprise: null });

    const stillOpen = await Absence.exists({
      personnel: reprise.personnel,
      reprise: null,
    });
    if (stillOpen) {
      await Personnel.findByIdAndUpdate(reprise.personnel, {
        status: STATUT_ABSENT,
      });
    }

    return res
      .status(200)
      .json({ message: "Avis de reprise supprimé avec succès" });
  } catch (err) {
    console.error("Erreur lors de la suppression de l'avis :", err);
    return res.status(500).json({
      message: err.message || "Erreur lors de la suppression de l'avis",
    });
  }
};
