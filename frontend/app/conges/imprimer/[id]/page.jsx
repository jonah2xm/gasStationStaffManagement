"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import CongeDocument from "@/components/conge-document";

/**
 * Vue d'impression de la demande de congé annuel.
 *
 * La page est rendue hors du gabarit applicatif (voir PUBLIC_PATHS dans
 * app/layout.jsx) : seule la feuille A4 part à l'imprimante, la barre d'outils
 * porte la classe cd-no-print.
 */
export default function ImprimerCongePage() {
  const router = useRouter();
  const { id } = useParams();

  const [conge, setConge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoPrinted = useRef(false);

  useEffect(() => {
    if (!id) return;

    const fetchConge = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erreur lors du chargement du congé");
        }
        setConge(await response.json());
        setError(null);
      } catch (err) {
        console.error("Error fetching conge for printing:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConge();
  }, [id, router]);

  // Ouvre la boîte d'impression une seule fois, après le rendu du logo :
  // sans cela Chrome capture la feuille avant que l'image ne soit décodée.
  useEffect(() => {
    if (!conge || autoPrinted.current) return;
    autoPrinted.current = true;

    let cancelled = false;
    const launch = () => {
      if (!cancelled) window.print();
    };

    if (document.fonts?.ready) {
      Promise.all([document.fonts.ready, waitForImages()]).then(launch);
    } else {
      waitForImages().then(launch);
    }

    return () => {
      cancelled = true;
    };
  }, [conge]);

  const handlePrint = useCallback(() => window.print(), []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Préparation du document…
      </div>
    );
  }

  if (error || !conge) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-[13.5px] text-destructive-text">
          {error || "Congé introuvable."}
        </p>
        <Button variant="outline" onClick={() => router.push("/conges")}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux congés
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="cd-no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
        <Button variant="outline" onClick={() => router.push(`/conges/details/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <p className="truncate text-[13px] text-muted-foreground">
          Demande de congé annuel — {conge.personnel?.lastName}{" "}
          {conge.personnel?.firstName}
        </p>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div className="cd-preview">
        <CongeDocument conge={conge} />
      </div>
    </div>
  );
}

/** Attend le chargement des images de la feuille (le logo du cartouche). */
function waitForImages() {
  const images = Array.from(document.images);
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
    )
  );
}
