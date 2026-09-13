"use client";

import { useEffect, useState } from "react";

/**
 * Utilisateur connecté (GET /api/auth/me), partagé entre la barre latérale, le
 * garde d'accès et les pages : une seule requête tant que la session dure.
 *
 * Renvoie `undefined` pendant le chargement et `null` hors connexion.
 */

let requete = null; // Promise en cours ou résolue
let dernier; // dernier utilisateur connu, pour un rendu immédiat au remontage

function charger() {
  if (!requete) {
    requete = fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => (data && data.user) || null)
      .catch(() => null)
      .then((user) => {
        dernier = user;
        return user;
      });
  }
  return requete;
}

/** Oublie l'utilisateur en cache : à appeler à la déconnexion. */
export function oublierUtilisateur() {
  requete = null;
  dernier = undefined;
}

export function useCurrentUser() {
  const [user, setUser] = useState(dernier);

  useEffect(() => {
    let actif = true;
    charger().then((u) => {
      if (actif) setUser(u);
    });
    return () => {
      actif = false;
    };
  }, []);

  return user;
}
