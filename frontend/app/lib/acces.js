/**
 * Sections de l'application retirées selon le rôle.
 *
 * Le chef de station gère les agents de sa station : les stations, les
 * pointages et les affectations ne lui sont pas proposés (menu masqué, pages
 * bloquées). La borne de pointage publique (/pointage) n'est pas concernée.
 */
const SECTIONS_RETIREES = {
  "chef station": ["/stations", "/pointage-list", "/affectation"],
};

const couvre = (section, pathname) =>
  pathname === section || pathname.startsWith(`${section}/`);

/** Vrai si `pathname` fait partie d'une section retirée à ce rôle. */
export function sectionRetiree(role, pathname) {
  return (SECTIONS_RETIREES[role] || []).some((s) => couvre(s, pathname));
}

/** Vrai si `pathname` est retiré à au moins un rôle (rôle encore inconnu). */
export function sectionRestreinte(pathname) {
  return Object.values(SECTIONS_RETIREES).some((sections) =>
    sections.some((s) => couvre(s, pathname))
  );
}
