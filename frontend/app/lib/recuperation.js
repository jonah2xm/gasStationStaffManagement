/**
 * Récupération : jours travaillés qui la justifient, un par jour récupéré
 * (voir lireJoursTravailles dans backend/src/models/congeModel.js). Ils sont
 * consultés dans l'application mais ne figurent pas sur la demande imprimée.
 */

export const MOTIFS_RECUPERATION = {
  jour_ferie: "Travail un jour férié",
  double_poste: "Double poste (deux shifts consécutifs)",
  jour_repos: "Travail un jour de repos",
};

// Au-delà, la saisie jour par jour n'a plus de sens : la durée est sûrement erronée.
export const MAX_JOURS_TRAVAILLES = 60;

export const motifRecuperationLabel = (motif) => MOTIFS_RECUPERATION[motif] || motif || "—";

/** Aujourd'hui au format des champs date (AAAA-MM-JJ), en heure locale. */
export function aujourdhuiISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const jj = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${jj}`;
}

/** Autant de lignes que de jours récupérés : complète ou retire les dernières. */
export function ajusterJours(jours, duree) {
  const n = Math.min(Math.max(Number.parseInt(duree, 10) || 0, 0), MAX_JOURS_TRAVAILLES);
  if (jours.length === n) return jours;
  if (jours.length > n) return jours.slice(0, n);
  return [...jours, ...Array.from({ length: n - jours.length }, () => ({ date: "", motif: "" }))];
}

/** Jours reçus de l'API (dates ISO) → valeurs du formulaire. */
export const joursDepuisApi = (jours) =>
  (jours || []).map((j) => ({ date: j.date ? String(j.date).slice(0, 10) : "", motif: j.motif || "" }));

/**
 * Erreurs par ligne ({ date?, motif? }) et message global, ou null si tout est
 * valide. Mêmes règles que le serveur.
 */
export function erreursJours(jours, duree) {
  const n = Number.parseInt(duree, 10) || 0;
  if (n > MAX_JOURS_TRAVAILLES) {
    return { global: `Une récupération ne peut pas dépasser ${MAX_JOURS_TRAVAILLES} jours.`, lignes: [] };
  }
  const today = aujourdhuiISO();
  const vus = new Set();
  let invalide = false;
  const lignes = jours.map((j) => {
    const e = {};
    if (!j.date) e.date = "Date requise";
    else if (j.date > today) e.date = "Date dans le futur";
    else if (vus.has(j.date)) e.date = "Jour déjà indiqué";
    if (j.date) vus.add(j.date);
    if (!j.motif) e.motif = "Motif requis";
    if (e.date || e.motif) invalide = true;
    return e;
  });
  if (jours.length !== n) {
    return { global: `Indiquez ${n} jour${n > 1 ? "s" : ""} travaillé${n > 1 ? "s" : ""}.`, lignes };
  }
  return invalide ? { global: "Complétez les jours travaillés.", lignes } : null;
}
