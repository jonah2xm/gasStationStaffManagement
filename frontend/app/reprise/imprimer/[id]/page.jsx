"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import AvisDocument, { avisFromReprise } from "@/components/avis-document";

/**
 * Vue d'impression de l'avis de reprise.
 *
 * Le motif, la date d'absence et l'observation sont repris de l'avis d'absence
 * clôturé ; seule la case « AVIS DE REPRISE » est cochée et la date de reprise
 * est renseignée.
 */
export default function ImprimerReprisePage() {
  const router = useRouter();
  const { id } = useParams();

  const [reprise, setReprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoPrinted = useRef(false);

  useEffect(() => {
    if (!id) return;

    const fetchReprise = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erreur lors du chargement de l'avis de reprise");
        }
        setReprise(await response.json());
        setError(null);
      } catch (err) {
        console.error("Error fetching reprise for printing:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReprise();
  }, [id, router]);

  // Ouvre la boîte d'impression une seule fois, après le rendu du logo.
  useEffect(() => {
    if (!reprise || autoPrinted.current) return;
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
  }, [reprise]);

  const handlePrint = useCallback(() => window.print(), []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Préparation du document…
      </div>
    );
  }

  if (error || !reprise) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-[13.5px] text-destructive-text">
          {error || "Avis de reprise introuvable."}
        </p>
        <Button variant="outline" onClick={() => router.push("/reprise")}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux avis de reprise
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="avis-no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
        <Button
          variant="outline"
          onClick={() => router.push(`/reprise/details/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <p className="truncate text-[13px] text-muted-foreground">
          Avis de reprise — {reprise.personnel?.lastName}{" "}
          {reprise.personnel?.firstName}
        </p>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div className="avis-preview">
        <AvisDocument avis={avisFromReprise(reprise)} />
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
