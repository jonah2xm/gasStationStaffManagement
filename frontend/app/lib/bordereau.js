/**
 * Bordereau d'envoi : types de documents transmis à l'Agence COM Oran et
 * construction des lignes du tableau « DESIGNATION ».
 */

export const DESTINATION = "Agence COM Oran";

// Circuit de l'agence vers le District CBR (bordereaux CBR).
export const EXPEDITEUR_CBR = "Agence COM Oran";
export const DESTINATION_CBR = "District CBR";

export const TYPES_DOCUMENT = {
  absence: {
    label: "Avis d’absence",
    champ: "absences",
    libelleDate: "Absence",
    imprimer: (id) => `/absence/imprimer/${id}`,
  },
  reprise: {
    label: "Avis de reprise",
    champ: "reprises",
    libelleDate: "Reprise",
    imprimer: (id) => `/reprise/imprimer/${id}`,
  },
  conge: {
    label: "Demande de congé",
    champ: "conges",
    libelleDate: "Départ",
    imprimer: (id) => `/conges/imprimer/${id}`,
  },
};

const capitaliser = (mot) =>
  mot
    ? mot.charAt(0).toLocaleUpperCase("fr-FR") + mot.slice(1).toLocaleLowerCase("fr-FR")
    : "";

// « OUADJENIA BOUZIANE » -> « Ouadjenia Bouziane », comme sur l'exemple papier.
const casseNom = (value) =>
  String(value || "")
    .trim()
    .split(/(\s+|-)/)
    .map((part) => (/^(\s+|-)$/.test(part) ? part : capitaliser(part)))
    .join("");

/** Nom affiché d'un agent : nom puis prénom. */
export function nomAgent(personnel) {
  if (!personnel) return "Agent supprimé";
  return [personnel.lastName, personnel.firstName]
    .filter(Boolean)
    .map(casseNom)
    .join(" ");
}

/**
 * Un agent par ligne, avec le nombre de pièces qui le concernent. Sur un
 * bordereau CBR, qui regroupe plusieurs stations, la station suit le nom.
 */
function agentsDe(documents, avecStation = false) {
  const parAgent = new Map();
  for (const doc of documents) {
    const station = avecStation ? doc.stationName || "" : "";
    const agent = doc.personnel?._id
      ? String(doc.personnel._id)
      : `sans-agent-${doc._id}`;
    const key = `${agent}|${station}`;
    // Espaces insécables : « GD R3120 » ne se coupe jamais en fin de ligne.
    const nom = station
      ? `${nomAgent(doc.personnel)} — ${station.replace(/ /g, " ")}`
      : nomAgent(doc.personnel);
    const entry = parAgent.get(key);
    if (entry) entry.nombre += 1;
    else parAgent.set(key, { key, nom, nombre: 1 });
  }
  return [...parAgent.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

/**
 * Catégories numérotées du bordereau. Seules les catégories non vides sont
 * listées, numérotées dans l'ordre : absences, reprises, congés.
 */
export function categoriesBordereau(bordereau) {
  if (!bordereau) return [];
  return [
    { designation: "Avis d’absence", documents: bordereau.absences },
    { designation: "Avis de reprise", documents: bordereau.reprises },
    { designation: "Demandes de congé", documents: bordereau.conges },
  ]
    .filter((c) => c.documents?.length)
    .map((c, index) => ({
      numero: index + 1,
      designation: c.designation,
      nb: c.documents.length,
      agents: agentsDe(c.documents, bordereau.circuit === "cbr"),
    }));
}

/**
 * Verrou d'envoi d'un document : son propre bordereau ou, pour une absence,
 * celui de l'avis de reprise qui la clôture. null si le document est modifiable.
 */
export function bordereauVerrou(doc) {
  if (!doc) return null;
  if (doc.bordereau) return { bordereau: doc.bordereau, parReprise: false };
  const reprise = doc.reprise;
  if (reprise && typeof reprise === "object" && reprise.bordereau) {
    return { bordereau: reprise.bordereau, parReprise: true };
  }
  return null;
}
