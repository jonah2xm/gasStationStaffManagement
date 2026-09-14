"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Données du suivi (GET /api/suivi). `station` restreint aux documents d'une
 * station (gestionnaire) ; le chef de station reçoit toujours la sienne.
 * `pret` à false retarde le chargement (rôle encore inconnu, par exemple).
 */
export function useSuivi({ station = null, pret = true } = {}) {
  const router = useRouter();
  const [donnees, setDonnees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  const recharger = useCallback(
    async ({ silencieux = false } = {}) => {
      if (!silencieux) setLoading(true);
      try {
        const query = station ? `?station=${encodeURIComponent(station)}` : "";
        const res = await fetch(`${API}/api/suivi${query}`, { credentials: "include" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErreur({ code: res.status, message: data.message || "Impossible de charger le suivi." });
          return;
        }
        setDonnees(data);
        setErreur(null);
      } catch (err) {
        console.error("Error fetching suivi:", err);
        setErreur({ code: 0, message: "Impossible de charger le suivi." });
      } finally {
        setLoading(false);
      }
    },
    [station, router]
  );

  useEffect(() => {
    if (pret) recharger();
  }, [pret, recharger]);

  return { donnees, loading, erreur, recharger };
}

/** Appel d'écriture du suivi ; lève une erreur avec le message du serveur. */
export async function appelSuivi(chemin, { method = "POST", body } = {}) {
  const res = await fetch(`${API}/api/suivi${chemin}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "L’opération a échoué.");
  return data;
}
