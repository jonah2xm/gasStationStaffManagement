// controllers/bordereauCbrController.js
const mongoose = require("mongoose");
const BordereauCbr = require("../models/bordereauCbrModel");
const { EXPEDITEUR, DESTINATION, referenceBordereauCbr } = require("../models/bordereauCbrModel");
const Absence = require("../models/absenceModel");
const Reprise = require("../models/repriseModel");
const Conge = require("../models/congeModel");
const { ROLES_GESTION, partiesAlger } = require("../utils/suivi");

const PERSONNEL_FIELDS = "firstName lastName matricule stationName";

// Seuls les documents réceptionnés et pas encore délivrés sont transmis
// (« recu » : ancien statut, équivalent à « non délivré »).
const STATUTS_TRANSMISSIBLES = ["non_delivre", "recu"];

/** Réservé au gestionnaire et à l'administrateur ; répond 403 sinon. */
function refuserSiPasGestion(req, res) {
  const role = req.session && req.session.user && req.session.user.role;
  if (ROLES_GESTION.includes(role)) return false;
  res.status(403).json({
    message: "Les bordereaux CBR sont réservés au gestionnaire et à l'administrateur.",
  });
  return true;
}

/** Identifiants dédoublonnés et valides d'une liste reçue du client. */
function idsValides(value) {
  const list = Array.isArray(value) ? value.map(String) : [];
  return [...new Set(list)].filter((id) => mongoose.isValidObjectId(id));
}

const idUtilisateur = (req) => {
  const id = req.session && req.session.user && req.session.user.id;
  return id && mongoose.isValidObjectId(String(id)) ? new mongoose.Types.ObjectId(String(id)) : null;
};

// Forme commune des documents, quel que soit leur type.
const formeAbsence = (a) => ({
  _id: a._id,
  type: "absence",
  personnel: a.personnel || null,
  stationName: (a.personnel && a.personnel.stationName) || "",
  date: a.date,
  motif: a.motif,
  statutGestion: a.statutGestion,
  statutGestionLe: a.statutGestionLe || null,
  createdAt: a.createdAt,
});

const formeReprise = (r) => ({
  _id: r._id,
  type: "reprise",
  personnel: r.personnel || null,
  stationName: (r.personnel && r.personnel.stationName) || "",
  date: r.dateReprise,
  statutGestion: r.statutGestion,
  statutGestionLe: r.statutGestionLe || null,
  createdAt: r.createdAt,
});

const formeConge = (c) => ({
  _id: c._id,
  type: "conge",
  personnel: c.personnelId || null,
  stationName: c.stationName || (c.personnelId && c.personnelId.stationName) || "",
  date: c.dateDebut,
  dateRetour: c.dateRetour,
  dureeConge: c.dureeConge,
  typeConge: c.typeConge,
  statutGestion: c.statutGestion,
  statutGestionLe: c.statutGestionLe || null,
  createdAt: c.createdAt,
});

const CHAMPS_ABSENCE = "personnel date motif statutGestion statutGestionLe createdAt";
const CHAMPS_REPRISE = "personnel dateReprise statutGestion statutGestionLe createdAt";
const CHAMPS_CONGE =
  "personnelId stationName dateDebut dateRetour dureeConge typeConge statutGestion statutGestionLe createdAt";

/** Bordereau complet, documents peuplés, prêt à imprimer. */
async function chargerBordereauCbr(id) {
  const b = await BordereauCbr.findById(id).populate("createdBy", "username").lean();
  if (!b) return null;

  const [absences, reprises, conges] = await Promise.all([
    Absence.find({ bordereauCbr: b._id })
      .select(CHAMPS_ABSENCE)
      .populate("personnel", PERSONNEL_FIELDS)
      .lean(),
    Reprise.find({ bordereauCbr: b._id })
      .select(CHAMPS_REPRISE)
      .populate("personnel", PERSONNEL_FIELDS)
      .lean(),
    Conge.find({ bordereauCbr: b._id })
      .select(CHAMPS_CONGE)
      .populate("personnelId", PERSONNEL_FIELDS)
      .lean(),
  ]);

  return {
    _id: b._id,
    circuit: "cbr",
    numero: b.numero,
    annee: b.annee,
    reference: referenceBordereauCbr(b),
    expediteur: b.expediteur || EXPEDITEUR,
    destination: b.destination || DESTINATION,
    createdBy: b.createdBy ? { _id: b.createdBy._id, username: b.createdBy.username } : null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    absences: absences.map(formeAbsence),
    reprises: reprises.map(formeReprise),
    conges: conges.map(formeConge),
  };
}

/**
 * Crée le bordereau avec le numéro suivant de l'année (heure d'Alger).
 * Deux créations simultanées se départagent par l'index unique.
 */
async function creerAvecNumero(data) {
  const { annee } = partiesAlger(new Date());
  for (let essai = 0; essai < 5; essai += 1) {
    const dernier = await BordereauCbr.findOne({ annee }).sort({ numero: -1 }).select("numero").lean();
    try {
      return await BordereauCbr.create({ ...data, annee, numero: (dernier ? dernier.numero : 0) + 1 });
    } catch (err) {
      if (err && err.code === 11000) continue;
      throw err;
    }
  }
  throw new Error("Impossible d'attribuer un numéro au bordereau. Réessayez.");
}

// GET /api/bordereaux-cbr/en-attente
// Documents reçus des stations, pas encore inclus dans un bordereau CBR.
exports.getEnAttente = async (req, res) => {
  try {
    if (refuserSiPasGestion(req, res)) return;
    const filtre = {
      bordereau: { $ne: null },
      bordereauCbr: null,
      statutGestion: { $in: STATUTS_TRANSMISSIBLES },
    };

    const [absences, reprises, conges] = await Promise.all([
      Absence.find(filtre).select(CHAMPS_ABSENCE).populate("personnel", PERSONNEL_FIELDS).sort({ date: -1 }).lean(),
      Reprise.find(filtre).select(CHAMPS_REPRISE).populate("personnel", PERSONNEL_FIELDS).sort({ dateReprise: -1 }).lean(),
      Conge.find(filtre).select(CHAMPS_CONGE).populate("personnelId", PERSONNEL_FIELDS).sort({ dateDebut: -1 }).lean(),
    ]);

    return res.status(200).json({
      absences: absences.map(formeAbsence),
      reprises: reprises.map(formeReprise),
      conges: conges.map(formeConge),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des documents à transmettre :", error);
    return res.status(500).json({ message: "Erreur lors de la récupération des documents à transmettre" });
  }
};

// POST /api/bordereaux-cbr
// Corps : { absences: [id], reprises: [id], conges: [id] }
exports.createBordereauCbr = async (req, res) => {
  try {
    if (refuserSiPasGestion(req, res)) return;

    const body = req.body || {};
    const ids = {
      absences: idsValides(body.absences),
      reprises: idsValides(body.reprises),
      conges: idsValides(body.conges),
    };
    const total = ids.absences.length + ids.reprises.length + ids.conges.length;
    if (!total) {
      return res.status(400).json({ message: "Sélectionnez au moins un document à transmettre." });
    }

    const champs = "bordereau bordereauCbr statutGestion";
    const documents = (
      await Promise.all([
        Absence.find({ _id: { $in: ids.absences } }).select(champs).lean(),
        Reprise.find({ _id: { $in: ids.reprises } }).select(champs).lean(),
        Conge.find({ _id: { $in: ids.conges } }).select(champs).lean(),
      ])
    ).flat();

    if (documents.length !== total) {
      return res.status(404).json({ message: "Certains documents sélectionnés sont introuvables." });
    }
    if (documents.some((d) => d.bordereauCbr)) {
      return res.status(409).json({
        message: "Certains documents sont déjà dans un bordereau CBR. Actualisez la page.",
      });
    }
    if (documents.some((d) => !d.bordereau || !STATUTS_TRANSMISSIBLES.includes(d.statutGestion))) {
      return res.status(409).json({
        message: "Seuls les documents réceptionnés « Non délivré » peuvent être transmis. Actualisez la page.",
      });
    }

    const par = idUtilisateur(req);
    const bordereau = await creerAvecNumero({
      createdBy: par,
      absences: ids.absences,
      reprises: ids.reprises,
      conges: ids.conges,
    });

    // Marquage conditionnel : un document pris entre-temps par un autre
    // bordereau n'est pas réattribué. Si l'un d'eux manque, on défait tout.
    const maintenant = new Date();
    const marquer = (Model, liste) =>
      liste.length
        ? Model.updateMany(
            {
              _id: { $in: liste },
              bordereau: { $ne: null },
              bordereauCbr: null,
              statutGestion: { $in: STATUTS_TRANSMISSIBLES },
            },
            [
              {
                $set: {
                  statutAvantCbr: "$statutGestion",
                  statutGestion: "non_delivre",
                  bordereauCbr: bordereau._id,
                  statutGestionLe: maintenant,
                  statutGestionPar: par,
                },
              },
            ]
          )
        : Promise.resolve({ matchedCount: 0 });

    const marques = await Promise.all([
      marquer(Absence, ids.absences),
      marquer(Reprise, ids.reprises),
      marquer(Conge, ids.conges),
    ]);
    const nbMarques = marques.reduce((n, r) => n + (r.matchedCount || 0), 0);

    if (nbMarques !== total) {
      await Promise.all(
        [Absence, Reprise, Conge].map((Model) =>
          Model.updateMany({ bordereauCbr: bordereau._id }, [
            {
              $set: {
                statutGestion: { $ifNull: ["$statutAvantCbr", "non_delivre"] },
                statutAvantCbr: null,
                bordereauCbr: null,
              },
            },
          ])
        )
      );
      await BordereauCbr.deleteOne({ _id: bordereau._id });
      return res.status(409).json({
        message: "Certains documents ont été transmis entre-temps. Actualisez la page.",
      });
    }

    return res.status(201).json(await chargerBordereauCbr(bordereau._id));
  } catch (error) {
    console.error("Erreur lors de la création du bordereau CBR :", error);
    return res.status(500).json({ message: error.message || "Erreur lors de la création du bordereau CBR" });
  }
};

// GET /api/bordereaux-cbr
exports.getBordereauxCbr = async (req, res) => {
  try {
    if (refuserSiPasGestion(req, res)) return;

    const liste = await BordereauCbr.find({})
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .lean();
    const ids = liste.map((b) => b._id);

    const comptes = new Map(
      ids.map((id) => [
        String(id),
        { nbAbsences: 0, nbReprises: 0, nbConges: 0, nbDelivres: 0, stations: new Set() },
      ])
    );
    if (ids.length) {
      const filtre = { bordereauCbr: { $in: ids } };
      const [absences, reprises, conges] = await Promise.all([
        Absence.find(filtre).select("bordereauCbr statutGestion personnel").populate("personnel", "stationName").lean(),
        Reprise.find(filtre).select("bordereauCbr statutGestion personnel").populate("personnel", "stationName").lean(),
        Conge.find(filtre).select("bordereauCbr statutGestion stationName").lean(),
      ]);
      const ajouter = (docs, champ, station) =>
        docs.forEach((d) => {
          const c = comptes.get(String(d.bordereauCbr));
          if (!c) return;
          c[champ] += 1;
          if (d.statutGestion === "delivre") c.nbDelivres += 1;
          const s = station(d);
          if (s) c.stations.add(s);
        });
      ajouter(absences, "nbAbsences", (d) => d.personnel && d.personnel.stationName);
      ajouter(reprises, "nbReprises", (d) => d.personnel && d.personnel.stationName);
      ajouter(conges, "nbConges", (d) => d.stationName);
    }

    return res.status(200).json(
      liste.map((b) => {
        const c = comptes.get(String(b._id));
        return {
          _id: b._id,
          numero: b.numero,
          annee: b.annee,
          reference: referenceBordereauCbr(b),
          expediteur: b.expediteur || EXPEDITEUR,
          destination: b.destination || DESTINATION,
          createdBy: (b.createdBy && b.createdBy.username) || "",
          createdAt: b.createdAt,
          nbAbsences: c.nbAbsences,
          nbReprises: c.nbReprises,
          nbConges: c.nbConges,
          nbDocuments: c.nbAbsences + c.nbReprises + c.nbConges,
          nbDelivres: c.nbDelivres,
          stations: [...c.stations].sort((x, y) => x.localeCompare(y, "fr", { numeric: true })),
        };
      })
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des bordereaux CBR :", error);
    return res.status(500).json({ message: "Erreur lors de la récupération des bordereaux CBR" });
  }
};

// GET /api/bordereaux-cbr/:id
exports.getBordereauCbrById = async (req, res) => {
  try {
    if (refuserSiPasGestion(req, res)) return;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    const bordereau = await chargerBordereauCbr(req.params.id);
    if (!bordereau) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    return res.status(200).json(bordereau);
  } catch (error) {
    console.error("Erreur lors de la récupération du bordereau CBR :", error);
    return res.status(500).json({ message: "Erreur lors de la récupération du bordereau CBR" });
  }
};

// POST /api/bordereaux-cbr/:id/delivrer
// Tous les documents du bordereau passent à « délivré » (remis au District CBR).
exports.delivrerBordereauCbr = async (req, res) => {
  try {
    if (refuserSiPasGestion(req, res)) return;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    const bordereau = await BordereauCbr.findById(req.params.id).select("_id").lean();
    if (!bordereau) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }

    const filtre = { bordereauCbr: bordereau._id, statutGestion: { $ne: "delivre" } };
    const maj = {
      $set: {
        statutGestion: "delivre",
        statutGestionLe: new Date(),
        statutGestionPar: idUtilisateur(req),
      },
    };
    const resultats = await Promise.all([
      Absence.updateMany(filtre, maj),
      Reprise.updateMany(filtre, maj),
      Conge.updateMany(filtre, maj),
    ]);

    return res.status(200).json({
      modifies: resultats.reduce((n, r) => n + (r.modifiedCount || 0), 0),
    });
  } catch (error) {
    console.error("Erreur lors de la remise du bordereau CBR :", error);
    return res.status(500).json({ message: "Erreur lors de la remise du bordereau CBR" });
  }
};

// DELETE /api/bordereaux-cbr/:id
// Annule la transmission : chaque document retrouve son statut précédent.
exports.annulerBordereauCbr = async (req, res) => {
  try {
    if (refuserSiPasGestion(req, res)) return;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    const bordereau = await BordereauCbr.findById(req.params.id).select("_id").lean();
    if (!bordereau) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }

    const delivre = { bordereauCbr: bordereau._id, statutGestion: "delivre" };
    const dejaDelivres = await Promise.all([
      Absence.exists(delivre),
      Reprise.exists(delivre),
      Conge.exists(delivre),
    ]);
    if (dejaDelivres.some(Boolean)) {
      return res.status(409).json({
        message:
          "Des documents de ce bordereau sont déjà « Délivré » : repassez-les à « Non délivré » avant d'annuler.",
      });
    }

    const maintenant = new Date();
    const par = idUtilisateur(req);
    const liberes = await Promise.all(
      [Absence, Reprise, Conge].map((Model) =>
        Model.updateMany({ bordereauCbr: bordereau._id }, [
          {
            $set: {
              statutGestion: { $ifNull: ["$statutAvantCbr", "non_delivre"] },
              statutAvantCbr: null,
              bordereauCbr: null,
              statutGestionLe: maintenant,
              statutGestionPar: par,
            },
          },
        ])
      )
    );
    await BordereauCbr.deleteOne({ _id: bordereau._id });

    return res.status(200).json({
      message: "Bordereau CBR annulé",
      liberes: liberes.reduce((n, r) => n + (r.modifiedCount || 0), 0),
    });
  } catch (error) {
    console.error("Erreur lors de l'annulation du bordereau CBR :", error);
    return res.status(500).json({ message: "Erreur lors de l'annulation du bordereau CBR" });
  }
};
