/**
 * Motifs d'absence — source unique pour la section Absences.
 *
 * Depuis la fusion des sections AA et AI, la seule chose qui distingue une
 * absence autorisée d'une absence irrégulière est le motif : "nonAutorisee"
 * est le seul motif non autorisé, tous les autres sont autorisés.
 *
 * Les valeurs reprennent celles déjà stockées en base ("decés", "marriage")
 * pour que la migration reste une simple copie. Les libellés affichés, eux,
 * sont correctement orthographiés.
 */

export const MOTIF_NON_AUTORISE = "nonAutorisee";

export const ABSENCE_MOTIFS = [
  { value: "maladie", label: "Maladie" },
  { value: "decés", label: "Décès" },
  { value: "marriage", label: "Mariage" },
  { value: "naissance", label: "Naissance" },
  { value: "examen", label: "Examen" },
  { value: "autre", label: "Autre" },
  { value: MOTIF_NON_AUTORISE, label: "Non autorisée" },
];

export const MOTIF_LABELS = ABSENCE_MOTIFS.reduce((acc, m) => {
  acc[m.value] = m.label;
  return acc;
}, {});

export function motifLabel(motif) {
  return MOTIF_LABELS[motif] || motif || "—";
}

export function isAutorisee(motif) {
  return motif !== MOTIF_NON_AUTORISE;
}

/** Une absence est ouverte tant qu'aucun avis de reprise ne l'a clôturée. */
export function isOuverte(absence) {
  return Boolean(absence) && !absence.reprise;
}

// Durée d'absence facultative, en jours calendaires entiers.
export const DUREE_MAX = 365;

/** "" (non renseignée) ou un entier de 1 à DUREE_MAX. */
export function dureeValide(valeur) {
  if (valeur === "" || valeur === null || valeur === undefined) return true;
  const n = Number(valeur);
  return Number.isInteger(n) && n >= 1 && n <= DUREE_MAX;
}

export function libelleDuree(duree) {
  return duree ? `${duree} jour${duree > 1 ? "s" : ""}` : "—";
}

/** Date locale depuis une date d'API ou la valeur "AAAA-MM-JJ" d'un champ date. */
function dateLocale(valeur) {
  if (!valeur) return null;
  const m = typeof valeur === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(valeur);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Valeur "AAAA-MM-JJ" d'un <input type="date">, dans le fuseau local. */
export function valeurChampDate(valeur) {
  const d = dateLocale(valeur);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Date de retour estimée : le lendemain du dernier jour d'absence, soit la
 * date d'absence + la durée (3 jours à partir du 14 → retour le 17).
 * null sans durée valide.
 */
export function dateRetourEstimee({ date, duree } = {}) {
  const d = dateLocale(date);
  if (!d || !duree || !dureeValide(duree)) return null;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Number(duree));
  return d;
}

/** Absence toujours ouverte alors que sa date de retour estimée est arrivée. */
export function isRetourDepasse(absence) {
  if (!isOuverte(absence)) return false;
  const retour = dateRetourEstimee(absence);
  return Boolean(retour) && Date.now() >= retour.getTime();
}

/**
 * Une absence non autorisée devient signalable passé 48 h, tant qu'elle est
 * ouverte : un avis de reprise la fait sortir du signalement.
 */
export function isSignaled48h(absence) {
  if (!absence || isAutorisee(absence.motif)) return false;
  if (!isOuverte(absence)) return false;
  const date = new Date(absence.date);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > 48 * 60 * 60 * 1000;
}
