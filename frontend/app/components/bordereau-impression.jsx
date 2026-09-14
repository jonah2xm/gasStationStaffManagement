"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import BordereauDocument from "@/components/bordereau-document";

/**
 * Vue d'impression d'un bordereau d'envoi : stations → Agence COM Oran, ou
 * Agence COM Oran → District CBR.
 *
 * La page est rendue hors du gabarit applicatif (voir isBarePage dans
 * app/layout.jsx) : seule la feuille A4 part à l'imprimante, la barre d'outils
 * porte la classe bd-no-print.
 *
 * `url` : adresse de l'API du bordereau ; `retour` : page de retour ;
 * `titre(bordereau)` : texte de la barre d'outils.
 */
export default function BordereauImpression({ url, retour, titre }) {
  const router = useRouter();

  const [bordereau, setBordereau] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const autoPrinted = useRef(false);

  useEffect(() => {
    if (!url) return;

    const fetchBordereau = async () => {
      setLoading(true);
      try {
        const response = await fetch(url, { credentials: "include" });
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            response.status === 404
              ? "Bordereau introuvable."
              : data.message || "Erreur lors du chargement du bordereau"
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
  }, [url, router]);

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
        <Button variant="outline" onClick={() => router.push(retour)}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux envois
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bd-no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-3">
        <Button variant="outline" onClick={() => router.push(retour)}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <p className="truncate text-[13px] text-muted-foreground">{titre(bordereau)}</p>
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
