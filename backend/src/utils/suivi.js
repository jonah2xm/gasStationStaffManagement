// utils/suivi.js
/**
 * Suivi des documents (avis d'absence, avis de reprise, demandes de congé) :
 * statuts, échéances d'envoi et alertes. Fonctions pures, sans base de données.
 *
 * Statuts
 *   - Chef de station : « délivré » dès que le document figure dans un
 *     bordereau d'envoi, « non délivré » sinon. Rien n'est saisi à la main.
 *   - Gestionnaire (et administrateur) : non reçu → non délivré → délivré
 *     (transmis au District CBR). Réceptionner un bordereau fait passer ses
 *     documents de « non reçu » à « non délivré » ;
 *     « délivré » exige un bordereau CBR (voir bordereauCbrController.js).
 *
 * Échéances (envoi par la station)
 *   - Absence / reprise : date d'absence ou de reprise + 48 h ; alerte quand il
 *     reste moins de 24 h.
 *   - Congé d'un agent temporaire (CDD) : départ du 21 du mois M-1 au 20 du
 *     mois M → échéance le 24 du mois M ; alerte à partir du 17.
 *   - Congé d'un agent permanent (CDI) : départ au mois M → échéance le 14 du
 *     mois M+2 ; alerte à partir du 7.
 *   Une échéance « le 24 » couvre toute la journée du 24 (heure d'Alger).
 */

const FUSEAU = "Africa/Algiers";
// L'Algérie est à UTC+1 toute l'année (pas d'heure d'été).
const DECALAGE_ALGER_MS = 60 * 60 * 1000;

const HEURE = 60 * 60 * 1000;
const JOUR = 24 * HEURE;

const DELAI_ABSENCE_REPRISE = 48 * HEURE;
const SEUIL_PROCHE_ABSENCE_REPRISE = 24 * HEURE;
const SEUIL_PROCHE_CONGE = 3 * JOUR;
const JOURS_ALERTE_CONGE = 7;

// « Reçu » n'est pas un statut : réceptionner un bordereau fait passer ses
// documents directement à « non délivré ».
const STATUTS_GESTION = ["non_recu", "non_delivre", "delivre"];
const STATUTS_CHEF = ["non_delivre", "delivre"];
const ROLES_GESTION = ["administrateur", "gestionnaire"];
const ROLE_CHEF = "chef station";

const GROUPES = {
  conge_cdd: {
    titre: "Congés des agents temporaires (CDD)",
    jourEcheance: 24,
  },
  conge_cdi: {
    titre: "Congés des agents permanents (CDI)",
    jourEcheance: 14,
  },
  absence_reprise: {
    titre: "Avis d'absence et de reprise",
  },
};

const ORDRE_URGENCE = { en_retard: 0, proche: 1, dans_les_delais: 2, delivre: 3 };

const formatParties = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** Année, mois (1-12) et jour d'une date, lus à l'heure d'Alger. */
function partiesAlger(date) {
  const parts = {};
  for (const p of formatParties.formatToParts(date)) parts[p.type] = Number(p.value);
  return { annee: parts.year, mois: parts.month, jour: parts.day };
}

/** Minuit (heure d'Alger) du jour donné ; le mois peut déborder (13 → janvier). */
function minuitAlger(annee, mois, jour) {
  return new Date(Date.UTC(annee, mois - 1, jour) - DECALAGE_ALGER_MS);
}

/** Groupe d'échéance d'un document. Tout contrat autre que CDD compte comme CDI. */
function groupeDocument(type, contractType) {
  if (type !== "conge") return "absence_reprise";
  return String(contractType || "").trim().toUpperCase() === "CDD" ? "conge_cdd" : "conge_cdi";
}

/**
 * Échéance d'envoi d'un document.
 * `echeance` est exclusive (le document est en retard à partir de cet instant),
 * `dernierJour` est le dernier jour autorisé, pour l'affichage.
 * Renvoie null si le document n'a pas de date.
 */
function echeanceDocument({ type, date, contractType }) {
  if (!date) return null;
  const depart = new Date(date);
  if (Number.isNaN(depart.getTime())) return null;

  const groupe = groupeDocument(type, contractType);

  if (groupe === "absence_reprise") {
    const echeance = new Date(depart.getTime() + DELAI_ABSENCE_REPRISE);
    return {
      groupe,
      echeance,
      dernierJour: echeance,
      ouvertureAlerte: new Date(echeance.getTime() - SEUIL_PROCHE_ABSENCE_REPRISE),
      periode: null,
    };
  }

  const { annee, mois, jour } = partiesAlger(depart);
  const { jourEcheance } = GROUPES[groupe];

  let moisEcheance;
  let periode;
  if (groupe === "conge_cdd") {
    // 21 du mois précédent → 20 du mois de l'échéance.
    moisEcheance = jour >= 21 ? mois + 1 : mois;
    periode = {
      debut: minuitAlger(annee, moisEcheance - 1, 21),
      fin: minuitAlger(annee, moisEcheance, 20),
    };
  } else {
    // Mois civil du départ → échéance deux mois plus tard.
    moisEcheance = mois + 2;
    periode = {
      debut: minuitAlger(annee, mois, 1),
      fin: minuitAlger(annee, mois + 1, 0),
    };
  }

  return {
    groupe,
    echeance: minuitAlger(annee, moisEcheance, jourEcheance + 1),
    dernierJour: minuitAlger(annee, moisEcheance, jourEcheance),
    ouvertureAlerte: minuitAlger(annee, moisEcheance, jourEcheance - JOURS_ALERTE_CONGE),
    periode,
  };
}

/** Urgence d'un document : délivré, en retard, proche ou dans les délais. */
function urgenceDocument({ envoye, groupe, echeance }, maintenant = new Date()) {
  if (envoye) return "delivre";
  if (!echeance) return "dans_les_delais";
  const reste = new Date(echeance).getTime() - maintenant.getTime();
  if (reste <= 0) return "en_retard";
  const seuil = groupe === "absence_reprise" ? SEUIL_PROCHE_ABSENCE_REPRISE : SEUIL_PROCHE_CONGE;
  return reste < seuil ? "proche" : "dans_les_delais";
}

/** Vrai si le document non envoyé doit figurer dans une alerte. */
function estEnAlerte({ envoye, ouvertureAlerte }, maintenant = new Date()) {
  if (envoye || !ouvertureAlerte) return false;
  return maintenant.getTime() >= new Date(ouvertureAlerte).getTime();
}

/** Statut côté gestionnaire ; les documents antérieurs au suivi sont « non reçus ». */
function statutGestion(doc) {
  const statut = doc && doc.statutGestion;
  // Ancien statut « reçu », antérieur à sa suppression : équivaut à « non délivré ».
  if (statut === "recu") return "non_delivre";
  return STATUTS_GESTION.includes(statut) ? statut : "non_recu";
}

/** Complète un document normalisé ({ type, date, contractType, envoye }) avec son suivi. */
function suiviDocument(doc, maintenant = new Date()) {
  const e = echeanceDocument(doc);
  const base = {
    groupe: e ? e.groupe : groupeDocument(doc.type, doc.contractType),
    echeance: e ? e.echeance : null,
    dernierJour: e ? e.dernierJour : null,
    ouvertureAlerte: e ? e.ouvertureAlerte : null,
    periode: e ? e.periode : null,
  };
  return {
    ...base,
    urgence: urgenceDocument({ envoye: doc.envoye, ...base }, maintenant),
    enAlerte: estEnAlerte({ envoye: doc.envoye, ...base }, maintenant),
  };
}

/**
 * Alertes à partir de documents déjà complétés par suiviDocument.
 * Une alerte par groupe (CDD, CDI, absences et reprises), avec le détail par
 * échéance, par station et par agent. Seuls les groupes non vides sont renvoyés.
 */
function construireAlertes(documents) {
  const alertes = [];
  for (const groupe of Object.keys(GROUPES)) {
    const docs = documents.filter((d) => d.enAlerte && d.groupe === groupe);
    if (!docs.length) continue;

    const parEcheance = new Map();
    const parStation = new Map();
    const parAgent = new Map();
    for (const d of docs) {
      const cleEcheance = new Date(d.dernierJour).toISOString();
      const e = parEcheance.get(cleEcheance) || {
        dernierJour: d.dernierJour,
        echeance: d.echeance,
        periode: d.periode,
        nb: 0,
        enRetard: d.urgence === "en_retard",
      };
      e.nb += 1;
      parEcheance.set(cleEcheance, e);

      const station = d.stationName || "";
      const s = parStation.get(station) || { stationName: station, nb: 0, nbEnRetard: 0 };
      s.nb += 1;
      if (d.urgence === "en_retard") s.nbEnRetard += 1;
      parStation.set(station, s);

      const p = d.personnel || {};
      const cleAgent = p._id ? String(p._id) : `sans-agent-${d._id}`;
      const a = parAgent.get(cleAgent) || {
        _id: p._id || null,
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        matricule: p.matricule || "",
        stationName: station,
        nb: 0,
      };
      a.nb += 1;
      parAgent.set(cleAgent, a);
    }

    const echeances = [...parEcheance.values()].sort(
      (a, b) => new Date(a.echeance) - new Date(b.echeance)
    );
    // Échéance mise en avant : la prochaine à venir, sinon la plus récente passée.
    const aVenir = echeances.filter((e) => !e.enRetard);
    const principale = aVenir.length ? aVenir[0] : echeances[echeances.length - 1];

    alertes.push({
      groupe,
      titre: GROUPES[groupe].titre,
      nb: docs.length,
      nbEnRetard: docs.filter((d) => d.urgence === "en_retard").length,
      nbProches: docs.filter((d) => d.urgence === "proche").length,
      echeance: principale,
      echeances,
      stations: [...parStation.values()].sort(
        (a, b) => b.nbEnRetard - a.nbEnRetard || b.nb - a.nb || a.stationName.localeCompare(b.stationName)
      ),
      agents: [...parAgent.values()].sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr")
      ),
      documents: docs.map((d) => `${d.type}:${d._id}`),
    });
  }
  return alertes;
}

module.exports = {
  FUSEAU,
  HEURE,
  JOUR,
  GROUPES,
  ORDRE_URGENCE,
  STATUTS_GESTION,
  STATUTS_CHEF,
  ROLES_GESTION,
  ROLE_CHEF,
  partiesAlger,
  minuitAlger,
  groupeDocument,
  echeanceDocument,
  urgenceDocument,
  estEnAlerte,
  statutGestion,
  suiviDocument,
  construireAlertes,
};
