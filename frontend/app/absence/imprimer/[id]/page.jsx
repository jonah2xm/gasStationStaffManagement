"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import AvisDocument, { avisFromAbsence } from "@/components/avis-document";

/**
 * Vue d'impression de l'avis d'absence.
 *
 * La page est rendue hors du gabarit applicatif (voir le test /imprimer dans
 * app/layout.jsx) : seule la feuille A4 part à l'imprimante, la barre d'outils
 * porte la classe avis-no-print.
 */
export default function ImprimerAbsencePage() {
  const router = useRouter();
  const { id } = useParams();

  const [absence, setAbsence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoPrinted = useRef(false);

  useEffect(() => {
    if (!id) return;

    const fetchAbsence = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erreur lors du chargement de l'absence");
        }
        setAbsence(await response.json());
        setError(null);
      } catch (err) {
        console.error("Error fetching absence for printing:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAbsence();
  }, [id, router]);

  // Ouvre la boîte d'impression une seule fois, après le rendu du logo.
  useEffect(() => {
    if (!absence || autoPrinted.current) return;
    autoPrinted.current = true;

    let cancelled = false;
    const launch = () => {
      if (!cancelled) window.print();
    };

    const ready = document.fonts?.ready
      ? Promise.all([document.fonts.ready, waitForImages()])
      : waitForImages();
    ready.then(launch);

    return () => {
      cancelled = true;
    };
  }, [absence]);

  const handlePrint = useCallback(() => window.print(), []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Préparation du document…
      </div>
    );
  }

  if (error || !absence) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-[13.5px] text-destructive-text">
          {error || "Absence introuvable."}
        </p>
        <Button variant="outline" onClick={() => router.push("/absence")}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux absences
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="avis-no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/absence/details/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <p className="truncate text-[13px] text-muted-foreground">
          Avis d’absence — {absence.personnel?.lastName}{" "}
          {absence.personnel?.firstName}
        </p>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div className="avis-preview">
        <AvisDocument avis={avisFromAbsence(absence)} />
      </div>
    </div>
  );
}

/** Attend le chargement des images de la feuille (le logo d'en-tête). */
function waitForImages() {
  return Promise.all(
    Array.from(document.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
    )
  );
}
