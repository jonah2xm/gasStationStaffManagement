"use client";

import { useParams } from "next/navigation";
import BordereauImpression from "@/components/bordereau-impression";

/** Vue d'impression du bordereau d'envoi d'une station à l'Agence COM Oran. */
export default function ImprimerBordereauPage() {
  const { id } = useParams();

  return (
    <BordereauImpression
      url={id ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bordereaux/${id}` : null}
      retour="/envoi?circuit=stations"
      titre={(b) => `Bordereau d’envoi — ${b.stationName} → ${b.destination}`}
    />
  );
}
