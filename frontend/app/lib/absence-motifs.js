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
