"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import BordereauDocument from "@/components/bordereau-document";

/**
 * Vue d'impression du bordereau d'envoi.
 *
 * La page est rendue hors du gabarit applicatif (voir isBarePage dans
 * app/layout.jsx) : seule la feuille A4 part à l'imprimante, la barre d'outils
 * porte la classe bd-no-print.
 */
export default function ImprimerBordereauPage() {
  const router = useRouter();
  const { id } = useParams();

  const [bordereau, setBordereau] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoPrinted = useRef(false);

  useEffect(() => {
    if (!id) return;

    const fetchBordereau = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/bordereaux/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Bordereau introuvable."
              : "Erreur lors du chargement du bordereau"
          );
        }
        setBordereau(await response.json());
        setError(null);
      } catch (err) {
        console.error("Error fetching bordereau for printing:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBordereau();
  }, [id, router]);

  // Ouvre la boîte d'impression une seule fois, après le rendu du logo :
  // sans cela Chrome capture la feuille avant que l'image ne soit décodée.
  useEffect(() => {
    if (!bordereau || autoPrinted.current) return;
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
  }, [bordereau]);

  const handlePrint = useCallback(() => window.print(), []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Préparation du bordereau…
      </div>
    );
  }

  if (error || !bordereau) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-[13.5px] text-destructive-text">
          {error || "Bordereau introuvable."}
        </p>
        <Button variant="outline" onClick={() => router.push("/envoi")}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux envois
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bd-no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
        <Button variant="outline" onClick={() => router.push("/envoi")}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <p className="truncate text-[13px] text-muted-foreground">
          Bordereau d’envoi — {bordereau.stationName} →{" "}
          {bordereau.destination}
        </p>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <div className="bd-preview">
        <BordereauDocument bordereau={bordereau} />
      </div>
    </div>
  );
}

/** Attend le chargement des images de la feuille (le logo de l'en-tête). */
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
