"use client";

import { useParams } from "next/navigation";
import BordereauImpression from "@/components/bordereau-impression";

/** Vue d'impression d'un bordereau d'envoi au District CBR. */
export default function ImprimerBordereauCbrPage() {
  const { id } = useParams();

  return (
    <BordereauImpression
      url={id ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bordereaux-cbr/${id}` : null}
      retour="/envoi?circuit=cbr&onglet=historique"
      titre={(b) => `Bordereau d’envoi N° ${b.reference} — ${b.expediteur} → ${b.destination}`}
    />
  );
}
