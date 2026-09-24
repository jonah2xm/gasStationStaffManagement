"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Demandes d'annulation : le chef de station ne supprime plus ses documents,
 * il en demande l'annulation (voir backend/src/controllers/demandeController.js).
 */

export const CHEF_STATION = "chef station";
export const ROLES_DECIDEURS = ["gestionnaire", "administrateur"];
export const MOTIF_MAX = 500;

export const TYPES_DEMANDE = {
  Absence: { label: "Avis d’absence", details: (id) => `/absence/details/${id}` },
  Reprise: { label: "Avis de reprise", details: (id) => `/reprise/details/${id}` },
  Conge: { label: "Demande de congé", details: (id) => `/conges/details/${id}` },
};

const API = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/demandes`;

/** Événement émis quand une demande change, pour rafraîchir la pastille du menu. */
export const EVENEMENT_DEMANDES = "demandes:maj";

export function signalerDemandes() {
  window.dispatchEvent(new Event(EVENEMENT_DEMANDES));
}

/**
 * Documents d'un type ayant une demande d'annulation en attente, pour les
 * listes : `enAttente` est un Set d'identifiants de documents.
 */
export function useDemandesEnAttente(typeDocument, user) {
  const [enAttente, setEnAttente] = useState(() => new Set());
  const role = user?.role;

  useEffect(() => {
    if (!role || role === "personnel") return;
    let actif = true;
    fetch(`${API()}?statut=en_attente&typeDocument=${typeDocument}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((demandes) => {
        if (actif) setEnAttente(new Set(demandes.map((d) => String(d.document))));
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [typeDocument, role]);

  const ajouter = useCallback((id) => {
    setEnAttente((prev) => new Set(prev).add(String(id)));
  }, []);

  return { enAttente, ajouter };
}

/** Envoie une demande d'annulation ; lève une erreur avec le message du serveur. */
export async function demanderAnnulation(typeDocument, documentId, motif) {
  const res = await fetch(API(), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ typeDocument, documentId, motif }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "La demande n'a pas pu être envoyée.");
  return data;
}
