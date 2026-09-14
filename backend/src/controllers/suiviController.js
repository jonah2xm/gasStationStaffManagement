// controllers/suiviController.js
const mongoose = require("mongoose");
const Absence = require("../models/absenceModel");
const Reprise = require("../models/repriseModel");
const Conge = require("../models/congeModel");
const Bordereau = require("../models/bordereauModel");
const Users = require("../models/userModel");
const {
  ROLES_GESTION,
  ROLE_CHEF,
  STATUTS_GESTION,
  construireAlertes,
} = require("../utils/suivi");
const {
  chargerDocumentsSuivi,
  synchroniserAlertesSuivi,
} = require("../utils/suiviDocuments");

/**
 * Qui consulte le suivi : un gestionnaire ou un administrateur (toutes les
 * stations, statuts modifiables) ou un chef de station (sa station, lecture).
 * Répond 403 et renvoie null pour les autres rôles.
 */
async function contexte(req, res) {
  const u = (req.session && req.session.user) || {};
  if (ROLES_GESTION.includes(u.role)) {
    return { role: u.role, gestion: true, station: null, userId: u.id };
  }
  if (u.role === ROLE_CHEF) {
    const user = await Users.findById(u.id).select("occupiedStation").lean();
    return {
      role: u.role,
      gestion: false,
      station: (user && user.occupiedStation) || null,
      userId: u.id,
    };
  }
  res
    .status(403)
    .json({ message: "Le suivi des documents n'est pas disponible pour votre rôle." });
  return null;
}

function refuserSiPasGestion(ctx, res) {
  if (ctx.gestion) return false;
  res.status(403).json({
    message: "Seuls le gestionnaire et l'administrateur peuvent changer ce statut.",
  });
  return true;
}

/**
 * Statuts permis selon le circuit :
 *   - « non délivré » s'obtient en réceptionnant le bordereau de la station
 *     (receptionnerBordereau) ; à l'unité, seulement pour un document déjà
 *     réceptionné (retour depuis « délivré ») ;
 *   - « délivré » exige l'inclusion dans un bordereau CBR ;
 *   - un document d'un bordereau CBR ne revient pas à « non reçu » tant que ce
 *     bordereau n'est pas annulé.
 */
const CONDITIONS_STATUT = {
  non_recu: { bordereauCbr: null },
  non_delivre: {
    bordereau: { $ne: null },
    statutGestion: { $in: ["non_delivre", "delivre", "recu"] },
  },
  delivre: { bordereauCbr: { $ne: null } },
};

const REFUS_STATUT = {
  non_recu:
    "Ces documents sont inclus dans un bordereau CBR : annulez-le pour revenir à « Non reçu ».",
  non_delivre:
    "Ces documents n'ont pas encore été réceptionnés : utilisez « Marquer reçu » sur leur bordereau d'envoi.",
  delivre:
    "Seuls les documents transmis par un bordereau d'envoi au District CBR peuvent être marqués « Délivré ».",
};

/** Synchronise les alertes en arrière-plan, sans retarder la réponse. */
function synchroniserEnFond(req) {
  const io = req.app && typeof req.app.get === "function" ? req.app.get("io") : null;
  synchroniserAlertesSuivi({ io }).catch((err) =>
    console.error("Erreur lors de la synchronisation des alertes de suivi :", err)
  );
}

/** Identifiants dédoublonnés et valides d'une liste reçue du client. */
function idsValides(value) {
  const list = Array.isArray(value) ? value.map(String) : [];
  return [...new Set(list)].filter((id) => mongoose.isValidObjectId(id));
}

/** Bordereaux d'envoi avec le nombre de documents restant à réceptionner. */
async function bordereauxReception(station) {
  const liste = await Bordereau.find(station ? { stationName: station } : {})
    .populate("createdBy", "username")
    .sort({ createdAt: -1 })
    .lean();
  if (!liste.length) return [];

  const ids = liste.map((b) => b._id);
  const compter = (Model) =>
    Model.aggregate([
      { $match: { bordereau: { $in: ids } } },
      {
        $group: {
          _id: "$bordereau",
          total: { $sum: 1 },
          nonRecus: {
            $sum: {
              $cond: [{ $eq: [{ $ifNull: ["$statutGestion", "non_recu"] }, "non_recu"] }, 1, 0],
            },
          },
          // Documents déjà inclus dans un bordereau CBR : réception non annulable.
          dansCbr: { $sum: { $cond: [{ $ifNull: ["$bordereauCbr", false] }, 1, 0] } },
        },
      },
    ]);
  const [absences, reprises, conges] = await Promise.all([
    compter(Absence),
    compter(Reprise),
    compter(Conge),
  ]);

  const comptes = new Map();
  const ajouter = (lignes, champ) =>
    lignes.forEach((l) => {
      const c = comptes.get(String(l._id)) || {
        nbAbsences: 0,
        nbReprises: 0,
        nbConges: 0,
        nbNonRecus: 0,
        nbDansCbr: 0,
      };
      c[champ] += l.total;
      c.nbNonRecus += l.nonRecus;
      c.nbDansCbr += l.dansCbr;
      comptes.set(String(l._id), c);
    });
  ajouter(absences, "nbAbsences");
  ajouter(reprises, "nbReprises");
  ajouter(conges, "nbConges");

  return liste.map((b) => {
    const c = comptes.get(String(b._id)) || {
      nbAbsences: 0,
      nbReprises: 0,
      nbConges: 0,
      nbNonRecus: 0,
      nbDansCbr: 0,
    };
    return {
      _id: b._id,
      stationName: b.stationName,
      createdAt: b.createdAt,
      createdBy: (b.createdBy && b.createdBy.username) || "",
      ...c,
      nbDocuments: c.nbAbsences + c.nbReprises + c.nbConges,
    };
  });
}

// GET /api/suivi[?station=GD R3120]
exports.getSuivi = async (req, res) => {
  try {
    const ctx = await contexte(req, res);
    if (!ctx) return;
    synchroniserEnFond(req);

    const maintenant = new Date();
    const station = ctx.gestion
      ? (typeof req.query.station === "string" && req.query.station.trim()) || null
      : ctx.station;

    // Un chef de station sans station affectée ne voit rien (et pas tout).
    if (!ctx.gestion && !station) {
      return res.status(200).json({
        role: ctx.role,
        gestion: false,
        station: null,
        maintenant,
        documents: [],
        alertes: [],
        bordereaux: [],
      });
    }

    let documents = await chargerDocumentsSuivi({ station, maintenant });
    if (!ctx.gestion) {
      // Le chef de station ne suit que « délivré / non délivré ».
      documents = documents.map(({ statutGestion, statutGestionLe, bordereauCbr, ...doc }) => doc);
    }

    return res.status(200).json({
      role: ctx.role,
      gestion: ctx.gestion,
      station,
      maintenant,
      documents,
      alertes: construireAlertes(documents),
      bordereaux: ctx.gestion ? await bordereauxReception(station) : [],
    });
  } catch (error) {
    console.error("Erreur lors du chargement du suivi :", error);
    return res.status(500).json({ message: "Erreur lors du chargement du suivi des documents" });
  }
};

// GET /api/suivi/resume — pastille du menu.
exports.getResume = async (req, res) => {
  try {
    const role = req.session && req.session.user && req.session.user.role;
    if (!ROLES_GESTION.includes(role) && role !== ROLE_CHEF) {
      return res.status(200).json({ nbAlertes: 0, nbEnRetard: 0 });
    }
    const ctx = await contexte(req, res);
    if (!ctx) return;
    synchroniserEnFond(req);

    if (!ctx.gestion && !ctx.station) {
      return res.status(200).json({ nbAlertes: 0, nbEnRetard: 0 });
    }
    const documents = await chargerDocumentsSuivi({ station: ctx.station });
    const enAlerte = documents.filter((d) => d.enAlerte);
    return res.status(200).json({
      nbAlertes: enAlerte.length,
      nbEnRetard: enAlerte.filter((d) => d.urgence === "en_retard").length,
    });
  } catch (error) {
    console.error("Erreur lors du résumé du suivi :", error);
    return res.status(500).json({ message: "Erreur lors du résumé du suivi" });
  }
};

// PATCH /api/suivi/statut
// Corps : { statut, absences: [id], reprises: [id], conges: [id] }
exports.changerStatut = async (req, res) => {
  try {
    const ctx = await contexte(req, res);
    if (!ctx || refuserSiPasGestion(ctx, res)) return;

    const body = req.body || {};
    const statut = body.statut;
    if (!STATUTS_GESTION.includes(statut)) {
      return res.status(400).json({ message: "Statut inconnu." });
    }

    const absenceIds = idsValides(body.absences);
    const repriseIds = idsValides(body.reprises);
    const congeIds = idsValides(body.conges);
    const total = absenceIds.length + repriseIds.length + congeIds.length;
    if (!total) {
      return res.status(400).json({ message: "Sélectionnez au moins un document." });
    }

    // Seuls les documents dont le circuit permet ce statut sont modifiés.
    const envoyes = CONDITIONS_STATUT[statut];
    const maj = {
      $set: {
        statutGestion: statut,
        statutGestionLe: new Date(),
        statutGestionPar: ctx.userId || null,
      },
    };

    const resultats = await Promise.all([
      absenceIds.length
        ? Absence.updateMany({ _id: { $in: absenceIds }, ...envoyes }, maj)
        : { matchedCount: 0 },
      repriseIds.length
        ? Reprise.updateMany({ _id: { $in: repriseIds }, ...envoyes }, maj)
        : { matchedCount: 0 },
      congeIds.length
        ? Conge.updateMany({ _id: { $in: congeIds }, ...envoyes }, maj)
        : { matchedCount: 0 },
    ]);
    const modifies = resultats.reduce((n, r) => n + (r.matchedCount || 0), 0);

    if (!modifies) {
      return res.status(409).json({ message: REFUS_STATUT[statut] });
    }
    return res.status(200).json({ statut, modifies, ignores: total - modifies });
  } catch (error) {
    console.error("Erreur lors du changement de statut :", error);
    return res.status(500).json({ message: "Erreur lors du changement de statut" });
  }
};

// POST /api/suivi/bordereaux/:id/reception
// Tous les documents non reçus du bordereau passent directement à « non délivré ».
exports.receptionnerBordereau = async (req, res) => {
  try {
    const ctx = await contexte(req, res);
    if (!ctx || refuserSiPasGestion(ctx, res)) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    const bordereau = await Bordereau.findById(req.params.id).select("_id").lean();
    if (!bordereau) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }

    const filtre = { bordereau: bordereau._id, statutGestion: { $in: [null, "non_recu"] } };
    const maj = {
      $set: {
        statutGestion: "non_delivre",
        statutGestionLe: new Date(),
        statutGestionPar: ctx.userId || null,
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
    console.error("Erreur lors de la réception du bordereau :", error);
    return res.status(500).json({ message: "Erreur lors de la réception du bordereau" });
  }
};

// POST /api/suivi/bordereaux/:id/annulation-reception
// Les documents réceptionnés du bordereau reviennent à « non reçu ».
exports.annulerReception = async (req, res) => {
  try {
    const ctx = await contexte(req, res);
    if (!ctx || refuserSiPasGestion(ctx, res)) return;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }
    const bordereau = await Bordereau.findById(req.params.id).select("_id").lean();
    if (!bordereau) {
      return res.status(404).json({ message: "Bordereau non trouvé" });
    }

    // Un document déjà transmis au District CBR ne revient pas à « non reçu ».
    const dansCbr = { bordereau: bordereau._id, bordereauCbr: { $ne: null } };
    const transmis = await Promise.all([
      Absence.exists(dansCbr),
      Reprise.exists(dansCbr),
      Conge.exists(dansCbr),
    ]);
    if (transmis.some(Boolean)) {
      return res.status(409).json({
        message:
          "Des documents de ce bordereau sont inclus dans un bordereau CBR : annulez d'abord ce bordereau CBR.",
      });
    }

    const filtre = { bordereau: bordereau._id, statutGestion: { $nin: [null, "non_recu"] } };
    const maj = {
      $set: {
        statutGestion: "non_recu",
        statutGestionLe: new Date(),
        statutGestionPar: ctx.userId || null,
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
    console.error("Erreur lors de l'annulation de la réception :", error);
    return res.status(500).json({ message: "Erreur lors de l'annulation de la réception" });
  }
};
