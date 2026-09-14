/**
 * Suivi des documents : libellés, filtres, tris et regroupements.
 * Les échéances et l'urgence sont calculées par le serveur (utils/suivi.js).
 */
import { nomAgent } from "@/lib/bordereau";

export { nomAgent };

export const ROLES_GESTION = ["administrateur", "gestionnaire"];
export const estGestion = (role) => ROLES_GESTION.includes(role);

const FUSEAU = "Africa/Algiers";

export const STATUTS_CHEF = [
  { value: "non_delivre", label: "Non délivré" },
  { value: "delivre", label: "Délivré" },
];

// Dans l'ordre du circuit : réception de la station, puis transmission à la CBR.
export const STATUTS_GESTION = [
  { value: "non_recu", label: "Non reçu" },
  { value: "non_delivre", label: "Non délivré" },
  { value: "delivre", label: "Délivré" },
];

export const URGENCES = [
  { value: "en_retard", label: "En retard" },
  { value: "proche", label: "Proche de l’échéance" },
  { value: "dans_les_delais", label: "Dans les délais" },
  { value: "delivre", label: "Délivré" },
];

export const ORDRE_URGENCE = { en_retard: 0, proche: 1, dans_les_delais: 2, delivre: 3 };

export const GROUPES = {
  conge_cdd: {
    titre: "Congés des agents temporaires (CDD)",
    court: "Congés CDD",
    regle: "Départs du 21 du mois précédent au 20 du mois, à délivrer au plus tard le 24.",
  },
  conge_cdi: {
    titre: "Congés des agents permanents (CDI)",
    court: "Congés CDI",
    regle: "Départs d’un mois donné, à délivrer au plus tard le 14 du deuxième mois suivant.",
  },
  absence_reprise: {
    titre: "Avis d’absence et de reprise",
    court: "Absences et reprises",
    regle: "À délivrer dans les 48 h qui suivent la date d’absence ou de reprise.",
  },
};

export const TYPES = {
  absence: {
    label: "Avis d’absence",
    court: "Absence",
    libelleDate: "Absence",
    details: (id) => `/absence/details/${id}`,
  },
  reprise: {
    label: "Avis de reprise",
    court: "Reprise",
    libelleDate: "Reprise",
    details: (id) => `/reprise/details/${id}`,
  },
  conge: {
    label: "Demande de congé",
    court: "Congé",
    libelleDate: "Départ",
    details: (id) => `/conges/details/${id}`,
  },
};

export const FILTRES_TYPE = [
  { value: "tous", label: "Tous" },
  { value: "absence", label: "Absences" },
  { value: "reprise", label: "Reprises" },
  { value: "conge", label: "Congés" },
];

export const TRIS = [
  { value: "urgence", label: "Échéance la plus urgente" },
  { value: "date_recente", label: "Date la plus récente" },
  { value: "date_ancienne", label: "Date la plus ancienne" },
  { value: "employe", label: "Employé (A → Z)" },
];

export const FILTRES_VIDES = {
  recherche: "",
  // Groupe d’échéance (bouton « Voir les documents » d’une alerte).
  groupe: "tous",
  type: "tous",
  statut: "tous",
  urgence: "tous",
  contrat: "tous",
  du: "",
  au: "",
};

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        timeZone: FUSEAU,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

export const formatDateHeure = (value) =>
  value
    ? new Date(value).toLocaleString("fr-FR", {
        timeZone: FUSEAU,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const pluriel = (n, un, plusieurs = `${un}s`) => `${n} ${n > 1 ? plusieurs : un}`;

/** Échéance affichée : jour et heure pour les avis (48 h), jour pour les congés. */
export function libelleEcheance(doc) {
  if (!doc?.dernierJour) return "—";
  return doc.groupe === "absence_reprise" ? formatDateHeure(doc.echeance) : formatDate(doc.dernierJour);
}

/** « Reste 3 j », « Reste 5 h », « En retard de 2 j ». */
export function tempsRestant(echeance, maintenant = new Date()) {
  if (!echeance) return "";
  const ms = new Date(echeance).getTime() - new Date(maintenant).getTime();
  const abs = Math.abs(ms);
  const heures = Math.floor(abs / 3600000);
  const jours = Math.floor(heures / 24);
  const duree = jours >= 1 ? `${jours} j` : heures >= 1 ? `${heures} h` : "moins d’1 h";
  return ms > 0 ? `Reste ${duree}` : `En retard de ${duree}`;
}

/**
 * Statut permis pour un document (mêmes règles que le serveur, voir
 * CONDITIONS_STATUT dans suiviController.js).
 */
export function statutPossible(doc, statut) {
  switch (statut) {
    case "non_recu":
      return !doc.bordereauCbr;
    // « Non délivré » s'obtient en réceptionnant le bordereau ; à l'unité,
    // seulement pour un document déjà réceptionné.
    case "non_delivre":
      return Boolean(doc.envoye) && doc.statutGestion !== "non_recu";
    case "delivre":
      return Boolean(doc.bordereauCbr);
    default:
      return false;
  }
}

/** Pourquoi certains statuts sont indisponibles. */
export function noteStatut(doc) {
  if (!doc.envoye) return "Pas encore envoyé par la station.";
  if (doc.statutGestion === "non_recu") {
    return "Pas encore réceptionné : utilisez « Marquer reçu » sur son bordereau d’envoi.";
  }
  if (doc.bordereauCbr) {
    return `Inclus dans le bordereau CBR N° ${doc.bordereauCbr.reference} : annulez-le pour revenir à « Non reçu ».`;
  }
  return "« Délivré » nécessite un bordereau d’envoi au District CBR.";
}

/** Statut affiché selon le rôle. */
export const statutDe = (doc, gestion) => (gestion ? doc.statutGestion : doc.statutChef);

const estCdd = (doc) => String(doc.contractType || "").trim().toUpperCase() === "CDD";
export const libelleContrat = (doc) => (estCdd(doc) ? "CDD" : "CDI");

// Bornes du filtre de dates, à l'heure locale du navigateur.
const debutJour = (iso) => new Date(`${iso}T00:00:00`);
const finJour = (iso) => new Date(`${iso}T23:59:59.999`);

/** Documents correspondant aux filtres de la barre d'outils. */
export function filtrerDocuments(documents, filtres, gestion) {
  const terme = (filtres.recherche || "").trim().toLowerCase();
  return documents.filter((doc) => {
    if (filtres.groupe !== "tous" && doc.groupe !== filtres.groupe) return false;
    if (filtres.type !== "tous" && doc.type !== filtres.type) return false;
    if (filtres.statut !== "tous" && statutDe(doc, gestion) !== filtres.statut) return false;
    if (filtres.urgence === "en_alerte" && !doc.enAlerte) return false;
    if (!["tous", "en_alerte"].includes(filtres.urgence) && doc.urgence !== filtres.urgence) return false;
    if (filtres.contrat !== "tous" && libelleContrat(doc) !== filtres.contrat) return false;
    if (filtres.du && (!doc.date || new Date(doc.date) < debutJour(filtres.du))) return false;
    if (filtres.au && (!doc.date || new Date(doc.date) > finJour(filtres.au))) return false;
    if (!terme) return true;
    const p = doc.personnel || {};
    return `${p.lastName || ""} ${p.firstName || ""} ${p.matricule || ""} ${doc.stationName || ""}`
      .toLowerCase()
      .includes(terme);
  });
}

export const filtresActifs = (filtres) =>
  Object.keys(FILTRES_VIDES).filter((k) => filtres[k] !== FILTRES_VIDES[k]).length;

const temps = (d) => (d ? new Date(d).getTime() : Number.POSITIVE_INFINITY);

function comparerUrgence(a, b) {
  return (
    ORDRE_URGENCE[a.urgence] - ORDRE_URGENCE[b.urgence] ||
    temps(a.echeance) - temps(b.echeance)
  );
}

export function comparerDocuments(tri) {
  switch (tri) {
    case "date_recente":
      return (a, b) => temps(b.date) - temps(a.date);
    case "date_ancienne":
      return (a, b) => temps(a.date) - temps(b.date);
    case "employe":
      return (a, b) =>
        nomAgent(a.personnel).localeCompare(nomAgent(b.personnel), "fr") || comparerUrgence(a, b);
    default:
      return comparerUrgence;
  }
}

/** Compteurs d'un ensemble de documents. */
export function compter(documents) {
  const c = {
    total: documents.length,
    nonDelivres: 0,
    enAlerte: 0,
    enRetard: 0,
    proches: 0,
    aReceptionner: 0,
    nonDelivresCbr: 0,
    delivresCbr: 0,
  };
  for (const d of documents) {
    if (!d.envoye) c.nonDelivres += 1;
    if (d.enAlerte) c.enAlerte += 1;
    if (d.urgence === "en_retard") c.enRetard += 1;
    if (d.urgence === "proche") c.proches += 1;
    if (d.envoye && d.statutGestion === "non_recu") c.aReceptionner += 1;
    if (d.statutGestion === "non_delivre") c.nonDelivresCbr += 1;
    if (d.statutGestion === "delivre") c.delivresCbr += 1;
  }
  return c;
}

/** Urgence la plus forte et prochaine échéance non délivrée d'un ensemble. */
function synthese(documents) {
  const pire = documents.reduce(
    (min, d) => (ORDRE_URGENCE[d.urgence] < ORDRE_URGENCE[min] ? d.urgence : min),
    "delivre"
  );
  const aVenir = documents
    .filter((d) => !d.envoye && d.echeance)
    .sort((a, b) => temps(a.echeance) - temps(b.echeance));
  return { pireUrgence: pire, prochain: aVenir[0] || null };
}

/** Un groupe par agent, trié selon le tri choisi. */
export function grouperParAgent(documents, tri = "urgence") {
  const groupes = new Map();
  for (const doc of documents) {
    const cle = doc.personnel?._id ? String(doc.personnel._id) : `sans-agent-${doc._id}`;
    const g = groupes.get(cle) || {
      cle,
      personnel: doc.personnel,
      stationName: doc.stationName,
      contrat: libelleContrat(doc),
      documents: [],
    };
    g.documents.push(doc);
    groupes.set(cle, g);
  }

  const comparer = comparerDocuments(tri);
  const liste = [...groupes.values()].map((g) => ({
    ...g,
    documents: g.documents.sort(comparer),
    comptes: compter(g.documents),
    ...synthese(g.documents),
  }));

  const nom = (g) => nomAgent(g.personnel);
  const plusRecent = (g) => Math.max(...g.documents.map((d) => (d.date ? new Date(d.date).getTime() : 0)));
  const plusAncien = (g) => Math.min(...g.documents.map((d) => temps(d.date)));
  switch (tri) {
    case "employe":
      return liste.sort((a, b) => nom(a).localeCompare(nom(b), "fr"));
    case "date_recente":
      return liste.sort((a, b) => plusRecent(b) - plusRecent(a));
    case "date_ancienne":
      return liste.sort((a, b) => plusAncien(a) - plusAncien(b));
    default:
      return liste.sort(
        (a, b) =>
          ORDRE_URGENCE[a.pireUrgence] - ORDRE_URGENCE[b.pireUrgence] ||
          temps(a.prochain?.echeance) - temps(b.prochain?.echeance) ||
          nom(a).localeCompare(nom(b), "fr")
      );
  }
}

/** Un groupe par station, avec ses agents. */
export function grouperParStation(documents) {
  const groupes = new Map();
  for (const doc of documents) {
    const station = doc.stationName || "Sans station";
    const g = groupes.get(station) || { stationName: station, documents: [] };
    g.documents.push(doc);
    groupes.set(station, g);
  }
  return [...groupes.values()].map((g) => ({
    ...g,
    comptes: compter(g.documents),
    agents: grouperParAgent(g.documents),
    ...synthese(g.documents),
  }));
}

export const TRIS_STATIONS = [
  { value: "urgence", label: "Les plus urgentes d’abord" },
  { value: "retards", label: "Plus de retards" },
  { value: "reception", label: "Plus de documents à réceptionner" },
  { value: "nom", label: "Nom de la station" },
];

export function trierStations(stations, tri) {
  const nom = (a, b) => a.stationName.localeCompare(b.stationName, "fr", { numeric: true });
  switch (tri) {
    case "retards":
      return [...stations].sort((a, b) => b.comptes.enRetard - a.comptes.enRetard || nom(a, b));
    case "reception":
      return [...stations].sort((a, b) => b.comptes.aReceptionner - a.comptes.aReceptionner || nom(a, b));
    case "nom":
      return [...stations].sort(nom);
    default:
      return [...stations].sort(
        (a, b) =>
          ORDRE_URGENCE[a.pireUrgence] - ORDRE_URGENCE[b.pireUrgence] ||
          temps(a.prochain?.echeance) - temps(b.prochain?.echeance) ||
          nom(a, b)
      );
  }
}

export const lienStation = (station) => `/suivi/station/${encodeURIComponent(station)}`;
