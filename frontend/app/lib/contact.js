// Coordonnées d'assistance du portail, saisies par l'administrateur dans
// Paramètres → Contact et affichées sur la page de connexion.

export const CONTACT_VIDE = { nom: "", service: "", telephone: "", email: "", horaires: "" };

export function contactRenseigne(contact) {
  return Boolean(contact && (contact.telephone || contact.email));
}

export async function chargerContact() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ""}/api/settings/contact`);
  if (!res.ok) throw new Error("Contact indisponible");
  return { ...CONTACT_VIDE, ...(await res.json()) };
}
