"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TONS_COMPTEUR = {
  neutre: "bg-muted text-ink-750",
  danger: "bg-destructive text-white",
  warning: "bg-warning text-white",
  bleu: "bg-bleu text-white",
};

/**
 * Onglets des pages de suivi. Un onglet peut porter un compteur (masqué à 0)
 * et un numéro d'étape quand les onglets suivent le circuit d'un document.
 */
export function Onglets({ onglets, valeur, onChange, label }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border">
      {onglets.map((o) => {
        const actif = o.value === valeur;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={actif}
            onClick={() => onChange(o.value)}
            className={cn(
              "-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-[13.5px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              actif ? "border-bleu text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {o.etape && (
              <span
                aria-hidden
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  actif ? "bg-bleu text-white" : "bg-muted text-ink-750"
                )}
              >
                {o.etape}
              </span>
            )}
            {o.label}
            {o.compteur > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[11px] font-semibold leading-5 tabular-nums",
                  TONS_COMPTEUR[o.ton || "neutre"]
                )}
              >
                {o.compteur}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Onglet actif, conservé dans l'URL (?param=valeur) sans recharger la page. */
export function useOngletUrl(param, valeurs, defaut) {
  const [valeur, setValeur] = useState(defaut);

  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get(param);
      if (v && valeurs.includes(v)) setValeur(v);
    } catch {}
    // Lecture unique au montage : `valeurs` est une liste constante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);

  const changer = useCallback(
    (v) => {
      setValeur(v);
      try {
        const url = new URL(window.location.href);
        if (v === defaut) url.searchParams.delete(param);
        else url.searchParams.set(param, v);
        window.history.replaceState(null, "", url);
      } catch {}
    },
    [param, defaut]
  );

  return [valeur, changer];
}
