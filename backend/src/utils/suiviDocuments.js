// utils/suiviDocuments.js
/**
 * Accès base du suivi des documents : chargement des avis et demandes avec
 * leur échéance (voir utils/suivi.js) et notifications d'alerte.
 */
const Absence = require("../models/absenceModel");
const Reprise = require("../models/repriseModel");
const Conge = require("../models/congeModel");
const Personnel = require("../models/personnelModel");
const Bordereau = require("../models/bordereauModel");
const BordereauCbr = require("../models/bordereauCbrModel");
const { referenceBordereauCbr } = require("../models/bordereauCbrModel");
const Notification = require("../models/notificationModel");
const Users = require("../models/userModel");
const {
  FUSEAU,
  JOUR,
  ROLES_GESTION,
  ROLE_CHEF,
  statutGestion,
  suiviDocument,
} = require("./suivi");

const PERSONNEL_FIELDS = "firstName lastName matricule stationName contractType";
const SUIVI_FIELDS = "bordereau bordereauCbr statutGestion statutGestionLe createdAt";

// Les échéances dépassées depuis plus longtemps ne déclenchent plus de
// notification : l'historique d'avant le suivi reste visible sur la page
// sans remplir la cloche.
const RETARD_MAX_NOTIFICATION = 7 * JOUR;
// Intervalle minimal entre deux synchronisations déclenchées par les pages.
const INTERVALLE_SYNCHRO = 5 * 60 * 1000;

/** Normalise un document de n'importe quel type et calcule son suivi. */
function normaliser(type, doc, bordereaux, bordereauxCbr, maintenant) {
  const brut = type === "conge" ? doc.personnelId : doc.personnel;
  const p = brut && typeof brut === "object" && brut._id ? brut : null;
  const info = doc.bordereau ? bordereaux.get(String(doc.bordereau)) : null;
  const infoCbr = doc.bordereauCbr ? bordereauxCbr.get(String(doc.bordereauCbr)) : null;

  const base = {
    _id: doc._id,
    type,
    cle: `${type}:${doc._id}`,
    personnel: p
      ? {
          _id: p._id,
          firstName: p.firstName || "",
          lastName: p.lastName || "",
          matricule: p.matricule || "",
          contractType: p.contractType || "",
        }
      : null,
    stationName:
      (type === "conge" ? doc.stationName : null) || (p && p.stationName) || "",
    date: type === "absence" ? doc.date : type === "reprise" ? doc.dateReprise : doc.dateDebut,
    contractType: (p && p.contractType) || "",
    envoye: Boolean(doc.bordereau),
    bordereau: doc.bordereau
      ? { _id: doc.bordereau, createdAt: (info && info.createdAt) || null }
      : null,
    statutChef: doc.bordereau ? "delivre" : "non_delivre",
    statutGestion: statutGestion(doc),
    statutGestionLe: doc.statutGestionLe || null,
    bordereauCbr: doc.bordereauCbr
      ? {
          _id: doc.bordereauCbr,
          reference: infoCbr ? referenceBordereauCbr(infoCbr) : "",
          createdAt: (infoCbr && infoCbr.createdAt) || null,
        }
      : null,
    createdAt: doc.createdAt || null,
  };

  if (type === "absence") base.motif = doc.motif;
  if (type === "conge") {
    base.typeConge = doc.typeConge;
    base.dureeConge = doc.dureeConge;
    base.dateRetour = doc.dateRetour;
  }

  return { ...base, ...suiviDocument(base, maintenant) };
}

/**
 * Documents suivis, toutes stations ou une seule.
 * Le statut côté gestionnaire est inclus ; au contrôleur de le retirer pour un
 * chef de station.
 */
async function chargerDocumentsSuivi({ station = null, maintenant = new Date() } = {}) {
  let parPersonnel = {};
  if (station) {
    const ids = await Personnel.find({ stationName: station }).select("_id").lean();
    parPersonnel = { personnel: { $in: ids.map((p) => p._id) } };
  }

  const [absences, reprises, conges] = await Promise.all([
    Absence.find(parPersonnel)
      .select(`personnel date motif ${SUIVI_FIELDS}`)
      .populate("personnel", PERSONNEL_FIELDS)
      .lean(),
    Reprise.find(parPersonnel)
      .select(`personnel dateReprise ${SUIVI_FIELDS}`)
      .populate("personnel", PERSONNEL_FIELDS)
      .lean(),
    Conge.find(station ? { stationName: station } : {})
      .select(`personnelId stationName typeConge dureeConge dateDebut dateRetour ${SUIVI_FIELDS}`)
      .populate("personnelId", PERSONNEL_FIELDS)
      .lean(),
  ]);

  const idsBordereaux = [...absences, ...reprises, ...conges]
    .map((d) => d.bordereau)
    .filter(Boolean);
  const bordereaux = new Map();
  if (idsBordereaux.length) {
    const liste = await Bordereau.find({ _id: { $in: idsBordereaux } })
      .select("createdAt")
      .lean();
    liste.forEach((b) => bordereaux.set(String(b._id), b));
  }

  const idsCbr = [...absences, ...reprises, ...conges].map((d) => d.bordereauCbr).filter(Boolean);
  const bordereauxCbr = new Map();
  if (idsCbr.length) {
    const liste = await BordereauCbr.find({ _id: { $in: idsCbr } })
      .select("annee numero createdAt")
      .lean();
    liste.forEach((b) => bordereauxCbr.set(String(b._id), b));
  }

  return [
    ...absences.map((d) => normaliser("absence", d, bordereaux, bordereauxCbr, maintenant)),
    ...reprises.map((d) => normaliser("reprise", d, bordereaux, bordereauxCbr, maintenant)),
    ...conges.map((d) => normaliser("conge", d, bordereaux, bordereauxCbr, maintenant)),
  ];
}

/* ------------------------------------------------------------ notifications */

const formatJour = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const formatHeure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  hour: "2-digit",
  minute: "2-digit",
});
const jour = (d) => formatJour.format(new Date(d));
const jourHeure = (d) => `${jour(d)} à ${formatHeure.format(new Date(d))}`;
const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

const LIBELLES_TYPE = {
  absence: "Avis d'absence",
  reprise: "Avis de reprise",
  conge: "Demande de congé",
};

const nomAgent = (p) =>
  p ? [p.lastName, p.firstName].filter(Boolean).join(" ") : "agent supprimé";

const lienStation = (station) =>
  station ? `/suivi/station/${encodeURIComponent(station)}` : "/suivi";

function messageDocument(d, gestion) {
  const qui = `${nomAgent(d.personnel)}${gestion && d.stationName ? ` (${d.stationName})` : ""}`;
  const quand =
    d.urgence === "en_retard"
      ? `échéance dépassée depuis le ${jourHeure(d.echeance)}`
      : `à délivrer avant le ${jourHeure(d.echeance)}`;
  return `${LIBELLES_TYPE[d.type]} de ${qui} non délivré : ${quand}.`;
}

function messageConges({ groupe, retard, docs }, gestion) {
  const d = docs[0];
  const contrat = groupe === "conge_cdd" ? "temporaires (CDD)" : "permanents (CDI)";
  const nbStations = new Set(docs.map((x) => x.stationName)).size;
  const combien = pluriel(docs.length, "demande non délivrée", "demandes non délivrées");
  const ou = gestion ? ` dans ${pluriel(nbStations, "station", "stations")}` : "";
  const periode = d.periode ? `, départs du ${jour(d.periode.debut)} au ${jour(d.periode.fin)}` : "";
  const quand = retard
    ? `échéance du ${jour(d.dernierJour)} dépassée`
    : `échéance le ${jour(d.dernierJour)}`;
  return `Congés des agents ${contrat} : ${combien}${ou}${periode} — ${quand}.`;
}

/** Notifications à créer pour un destinataire, chacune avec une clé unique. */
function notificationsPour(user, documents) {
  const gestion = user.role !== ROLE_CHEF;
  const visibles = gestion
    ? documents
    : documents.filter((d) => user.occupiedStation && d.stationName === user.occupiedStation);

  const resultat = [];
  const groupesConges = new Map();

  for (const d of visibles) {
    const retard = d.urgence === "en_retard";
    if (d.groupe === "absence_reprise") {
      resultat.push({
        personnel: user._id,
        type: "SuiviAbsence",
        reference: d._id,
        cle: `suivi:${d.type}:${d._id}:${retard ? "retard" : "proche"}`,
        message: messageDocument(d, gestion),
        detailsUrl: gestion ? lienStation(d.stationName) : "/suivi",
      });
      continue;
    }
    const cle = `suivi:${d.groupe}:${new Date(d.dernierJour).toISOString().slice(0, 10)}:${
      retard ? "retard" : "ouverture"
    }`;
    const groupe = groupesConges.get(cle) || { cle, groupe: d.groupe, retard, docs: [] };
    groupe.docs.push(d);
    groupesConges.set(cle, groupe);
  }

  for (const g of groupesConges.values()) {
    resultat.push({
      personnel: user._id,
      type: "SuiviConge",
      reference: null,
      cle: g.cle,
      message: messageConges(g, gestion),
      detailsUrl: "/suivi",
    });
  }
  return resultat;
}

async function executerSynchronisation(io, maintenant) {
  const documents = (await chargerDocumentsSuivi({ maintenant })).filter(
    (d) =>
      d.enAlerte &&
      d.echeance &&
      new Date(d.echeance).getTime() >= maintenant.getTime() - RETARD_MAX_NOTIFICATION
  );
  if (!documents.length) return { crees: 0 };

  const users = await Users.find({ role: { $in: [...ROLES_GESTION, ROLE_CHEF] } })
    .select("_id role occupiedStation")
    .lean();
  const candidats = users.flatMap((u) => notificationsPour(u, documents));
  if (!candidats.length) return { crees: 0 };

  const existantes = await Notification.find({
    personnel: { $in: [...new Set(candidats.map((n) => String(n.personnel)))] },
    cle: { $in: [...new Set(candidats.map((n) => n.cle))] },
  })
    .select("personnel cle")
    .lean();
  const dejaCreees = new Set(existantes.map((n) => `${n.personnel}|${n.cle}`));
  const nouvelles = candidats.filter((n) => !dejaCreees.has(`${n.personnel}|${n.cle}`));
  if (!nouvelles.length) return { crees: 0 };

  let inserees = [];
  try {
    inserees = await Notification.insertMany(nouvelles, { ordered: false });
  } catch (err) {
    // Une autre synchronisation a créé les mêmes entre-temps (index unique).
    if (err && err.code !== 11000 && !(err.writeErrors || []).length) throw err;
    return { crees: (err.insertedDocs || []).length };
  }

  if (io) {
    for (const n of inserees) {
      try {
        io.to(`user:${String(n.personnel)}`).emit("notification:new", {
          _id: n._id,
          title: n.type === "SuiviConge" ? "Suivi des congés" : "Suivi des absences et reprises",
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
          detailsUrl: n.detailsUrl,
          reference: n.reference,
        });
      } catch (emitErr) {
        console.warn("Emit for suivi notification failed:", emitErr);
      }
    }
  }
  return { crees: inserees.length };
}

let enCours = null;
let derniere = 0;

/**
 * Crée les notifications d'alerte manquantes. Idempotent : chaque alerte a une
 * clé unique par destinataire. Appelée par la tâche planifiée et, faute de
 * tâche planifiée en hébergement serverless, par les pages (au plus toutes les
 * 5 minutes par instance, sauf `force`).
 */
function synchroniserAlertesSuivi({ io = null, maintenant = new Date(), force = false } = {}) {
  if (enCours) return enCours;
  if (!force && Date.now() - derniere < INTERVALLE_SYNCHRO) {
    return Promise.resolve({ crees: 0, ignoree: true });
  }
  enCours = executerSynchronisation(io, maintenant).finally(() => {
    derniere = Date.now();
    enCours = null;
  });
  return enCours;
}

module.exports = {
  chargerDocumentsSuivi,
  synchroniserAlertesSuivi,
  notificationsPour,
};
