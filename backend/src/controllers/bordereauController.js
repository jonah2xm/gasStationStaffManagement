// controllers/bordereauController.js
const mongoose = require("mongoose");
const Bordereau = require("../models/bordereauModel");
const { DESTINATION } = require("../models/bordereauModel");
const Conge = require("../models/congeModel");
const Absence = require("../models/absenceModel");
const Reprise = require("../models/repriseModel");
const Personnel = require("../models/personnelModel");
const Users = require("../models/userModel");

const PERSONNEL_FIELDS = "firstName lastName matricule stationName";

/**
 * Station du chef de station connecté ; null pour les autres rôles
 * (administrateur, gestionnaire), qui voient toutes les stations.
 */
async function stationDuChef(req) {
  const { role, id } = req.session.user || {};
  if (role !== "chef station") return null;
  const user = await Users.findById(id).select("occupiedStation").lean();
  return (user && user.occupiedStation) || null;
}

/** Restreint une requête Absence / Reprise aux agents d'une station. */
async function filtrePersonnel(station) {
  if (!station) return {};
  const ids = await Personnel.find({ stationName: station }).select("_id").lean();
  return { personnel: { $in: ids.map((p) => p._id) } };
}

/** Identifiants dédoublonnés et valides d'une liste reçue du client. */
function idsValides(value) {
  const list = Array.isArray(value) ? value.map(String) : [];
  return [...new Set(list)].filter((id) => mongoose.isValidObjectId(id));
}

// Forme commune des documents, quel que soit leur type.
const formeAbsence = (a) => ({
  _id: a._id,
  type: "absence",
  personnel: a.personnel || null,
  stationName: (a.personnel && a.personnel.stationName) || "",
  date: a.date,
  motif: a.motif,
  createdAt: a.createdAt,
});

const formeReprise = (r) => ({
  _id: r._id,
  type: "reprise",
  personnel: r.personnel || null,
  stationName: (r.personnel && r.personnel.stationName) || "",
  date: r.dateReprise,
  createdAt: r.createdAt,
});

const formeConge = (c) => ({
  _id: c._id,
  type: "conge",
  personnel: c.personnelId || null,
  stationName: c.stationName || "",
  date: c.dateDebut,
  dateRetour: c.dateRetour,
  dureeConge: c.dureeConge,
  typeConge: c.typeConge,
  createdAt: c.createdAt,
});

/** Bordereau complet, documents peuplés, prêt à imprimer. */
async function chargerBordereau(filter) {
  const b = await Bordereau.findOne(filter)
    .populate("createdBy", "username")
    .populate({
      path: "absences",
      select: "personnel date motif createdAt",
      populate: { path: "personnel", select: PERSONNEL_FIELDS },
    })
    .populate({
      path: "reprises",
      select: "personnel dateReprise createdAt",
      populate: { path: "personnel", select: PERSONNEL_FIELDS },
    })
    .populate({
      path: "conges",
      select: "personnelId stationName dateDebut dateRetour dureeConge typeConge createdAt",
      populate: { path: "personnelId", select: PERSONNEL_FIELDS },
    })
    .lean();

  if (!b) return null;

  // Un document supprimé depuis l'envoi disparaît du peuplement.
  return {
    _id: b._id,
    stationName: b.stationName,
    destination: b.destination || DESTINATION,
    createdBy: b.createdBy
      ? { _id: b.createdBy._id, username: b.createdBy.username }
      : null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    absences: (b.absences || []).map(formeAbsence),
    reprises: (b.reprises || []).map(formeReprise),
    conges: (b.conges || []).map(formeConge),
  };
}

// GET /api/bordereaux/en-attente
// Documents pas encore envoyés, groupés par type.
exports.getEnAttente = async (req, res) => {
  try {
    const station = await stationDuChef(req);
    const parPersonnel = await filtrePersonnel(station);

    const [absences, reprises, conges] = await Promise.all([
      Absence.find({ bordereau: null, ...parPersonnel })
        .populate("personnel", PERSONNEL_FIELDS)
        .sort({ date: -1 })
        .lean(),
      Reprise.find({ bordereau: null, ...parPersonnel })
        .populate("personnel", PERSONNEL_FIELDS)
        .sort({ dateReprise: -1 })
        .lean(),
      Conge.find({
        bordereau: null,
        ...(station ? { stationName: station } : {}),
      })
        .populate("personnelId", PERSONNEL_FIELDS)
        .sort({ dateDebut: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      absences: absences.map(formeAbsence),
      reprises: reprises.map(formeReprise),
      conges: conges.map(formeConge),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des documents à envoyer :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des documents à envoyer" });
  }
};

// POST /api/bordereaux
// Corps : { absences: [id], reprises: [id], conges: [id] }
exports.createBordereau = async (req, res) => {
  try {
    const body = req.body || {};
    const absenceIds = idsValides(body.absences);
    const repriseIds = idsValides(body.reprises);
    const congeIds = idsValides(body.conges);
    const total = absenceIds.length + repriseIds.length + congeIds.length;

    if (!total) {
      return res
        .status(400)
        .json({ message: "Sélectionnez au moins un document à envoyer." });
    }

    const [absences, reprises, conges] = await Promise.all([
      Absence.find({ _id: { $in: absenceIds } })
        .select("personnel bordereau")
        .populate("personnel", "stationName")
        .lean(),
      Reprise.find({ _id: { $in: repriseIds } })
        .select("personnel bordereau")
        .populate("personnel", "stationName")
        .lean(),
      Conge.find({ _id: { $in: congeIds } }).select("stationName bordereau").lean(),
    ]);

    if (absences.length + reprises.length + conges.length !== total) {
      return res
        .status(404)
        .json({ message: "Certains documents sélectionnés sont introuvables." });
    }

    const documents = [
      ...absences.map((a) => ({
        station: a.personnel && a.personnel.stationName,
        bordereau: a.bordereau,
      })),
      ...reprises.map((r) => ({
        station: r.personnel && r.personnel.stationName,
        bordereau: r.bordereau,
      })),
      ...conges.map((c) => ({ station: c.stationName, bordereau: c.bordereau })),
    ];

    if (documents.some((d) => d.bordereau)) {
      return res.status(409).json({
        message: "Certains documents ont déjà été envoyés. Actualisez la page.",
      });
    }

    // Le bordereau porte le nom de la station en en-tête : une seule station.
    const stations = new Set(documents.map((d) => d.station || ""));
    if (stations.size !== 1 || stations.has("")) {
      return res.status(400).json({
        message: "Un bordereau ne regroupe que les documents d'une seule station.",
      });
    }
    const [stationName] = [...stations];

    const stationChef = await stationDuChef(req);
    if (stationChef && stationChef !== stationName) {
      return res
        .status(403)
        .json({ message: "Ces documents n'appartiennent pas à votre station." });
    }

    const bordereau = await Bordereau.create({
      stationName,
      destination: DESTINATION,
      createdBy: (req.session.user && req.session.user.id) || null,
      absences: absenceIds,
      reprises: repriseIds,
      conges: congeIds,
    });

    // Marquage conditionnel : un document envoyé entre-temps par une autre
    // session n'est pas réattribué. Si l'un d'eux a été pris, on défait tout.
    const marques = await Promise.all([
      Absence.updateMany(
        { _id: { $in: absenceIds }, bordereau: null },
        { bordereau: bordereau._id }
      ),
      Reprise.updateMany(
        { _id: { $in: repriseIds }, bordereau: null },
        { bordereau: bordereau._id }
      ),
      Conge.updateMany(
        { _id: { $in: congeIds }, bordereau: null },
        { bordereau: bordereau._id }
      ),
    ]);
    const nbMarques = marques.reduce((n, r) => n + r.modifiedCount, 0);

    if (nbMarques !== total) {
      await Promise.all([
        Absence.updateMany({ bordereau: bordereau._id }, { bordereau: null }),
        Reprise.updateMany({ bordereau: bordereau._id }, { bordereau: null }),
        Conge.updateMany({ bordereau: bordereau._id }, { bordereau: null }),
      ]);
      await Bordereau.deleteOne({ _id: bordereau._id });
      return res.status(409).json({
        message: "Certains documents ont été envoyés entre-temps. Actualisez la page.",
      });
    }

    return res.status(201).json(await chargerBordereau({ _id: bordereau._id }));
  } catch (error) {
    console.error("Erreur lors de la création du bordereau :", error);
    return res
      .status(500)
      .json({ message: error.message || "Erreur lors de la création du bordereau" });
  }
};

// GET /api/bordereaux
exports.getBordereaux = async (req, res) => {
  try {
    const station = await stationDuChef(req);
    const list = await Bordereau.find(station ? { stationName: station } : {})
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .lean();

    // Bordereaux dont au moins un document a été réceptionné : plus annulables.
    const ids = list.map((b) => b._id);
    const recu = { bordereau: { $in: ids }, statutGestion: { $nin: [null, "non_recu"] } };
    const recus = new Set(
      (
        await Promise.all([
          Absence.distinct("bordereau", recu),
          Reprise.distinct("bordereau", recu),
          Conge.distinct("bordereau", recu),
        ])
      )
        .flat()
        .map(String)
    );

    return res.status(200).json(
      list.map((b) => ({
        _id: b._id,
        stationName: b.stationName,
        destination: b.destination || DESTINATION,
        createdBy: (b.createdBy && b.createdBy.username) || "",
        createdAt: b.createdAt,
        nbAbsences: (b.absences || []).length,
        nbReprises: (b.reprises || []).length,
        nbConges: (b.conges || []).length,
        recu: recus.has(String(b._id)),
      }))
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des bordereaux :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération des bordereaux" });
  }
};

// GET /api/bordereaux/:id
exports.getBordereauById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    const station = await stationDuChef(req);
    const bordereau = await chargerBordereau({
      _id: req.params.id,
      ...(station ? { stationName: station } : {}),
    });
    if (!bordereau) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    return res.status(200).json(bordereau);
  } catch (error) {
    console.error("Erreur lors de la récupération du bordereau :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération du bordereau" });
  }
};

// DELETE /api/bordereaux/:id
// Annule l'envoi : les documents redeviennent « à envoyer ».
exports.annulerBordereau = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    const station = await stationDuChef(req);
    const bordereau = await Bordereau.findOne({
      _id: req.params.id,
      ...(station ? { stationName: station } : {}),
    })
      .select("_id")
      .lean();

    if (!bordereau) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }

    // Déjà réceptionné par le gestionnaire : la station ne peut plus l'annuler.
    const recu = { bordereau: bordereau._id, statutGestion: { $nin: [null, "non_recu"] } };
    const dejaRecus = await Promise.all([
      Absence.exists(recu),
      Reprise.exists(recu),
      Conge.exists(recu),
    ]);
    if (dejaRecus.some(Boolean)) {
      return res.status(409).json({
        message:
          "Ce bordereau a déjà été réceptionné par le gestionnaire : il ne peut plus être annulé.",
      });
    }

    const liberes = await Promise.all([
      Absence.updateMany({ bordereau: bordereau._id }, { bordereau: null }),
      Reprise.updateMany({ bordereau: bordereau._id }, { bordereau: null }),
      Conge.updateMany({ bordereau: bordereau._id }, { bordereau: null }),
    ]);
    await Bordereau.deleteOne({ _id: bordereau._id });

    return res.status(200).json({
      message: "Bordereau annulé",
      liberes: liberes.reduce((n, r) => n + r.modifiedCount, 0),
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation du bordereau :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'annulation du bordereau" });
  }
};
