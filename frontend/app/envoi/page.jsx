"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";
import { DESTINATION, DESTINATION_CBR, EXPEDITEUR_CBR } from "@/lib/bordereau";
import { estGestion } from "@/lib/suivi";
import { useCurrentUser } from "@/lib/use-current-user";
import { EnvoiCbr } from "@/components/envoi/envoi-cbr";
import { EnvoiStations } from "@/components/envoi/envoi-stations";

const CIRCUITS = [
  { value: "cbr", label: `${EXPEDITEUR_CBR} → ${DESTINATION_CBR}` },
  { value: "stations", label: `Stations → ${DESTINATION}` },
];

const DESCRIPTIONS = {
  cbr: `Transmettez au ${DESTINATION_CBR} les documents reçus des stations : chaque envoi génère un bordereau d’envoi numéroté.`,
  stations: `Transmettez à l’${DESTINATION} les documents imprimés : chaque envoi génère un bordereau d’envoi et marque les documents comme envoyés.`,
};

/**
 * Envois. Le chef de station transmet ses documents à l'Agence COM Oran ; le
 * gestionnaire et l'administrateur transmettent au District CBR les documents
 * reçus, et gardent l'accès au circuit des stations.
 */
export default function EnvoiPage() {
  const user = useCurrentUser();
  const gestion = Boolean(user && estGestion(user.role));
  const [circuit, setCircuit] = useState(null);

  // ?circuit=cbr|stations ; ?onglet=historique seul vient du bandeau des
  // documents verrouillés, qui concerne le circuit des stations.
  useEffect(() => {
    if (user === undefined) return;
    if (!user || !estGestion(user.role)) {
      setCircuit("stations");
      return;
    }
    let demande = null;
    try {
      const q = new URLSearchParams(window.location.search);
      demande = q.get("circuit") || (q.get("onglet") === "historique" ? "stations" : null);
    } catch {}
    setCircuit(demande === "stations" ? "stations" : "cbr");
  }, [user]);

  const changerCircuit = (value) => {
    setCircuit(value);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("circuit", value);
      url.searchParams.delete("onglet");
      window.history.replaceState(null, "", url);
    } catch {}
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 text-foreground lg:p-8">
      <PageHeader title="Envois" description={DESCRIPTIONS[circuit || "stations"]} />

      {gestion && circuit && (
        <div
          role="radiogroup"
          aria-label="Circuit d’envoi"
          className="inline-flex flex-wrap rounded-md border border-border bg-card p-1"
        >
          {CIRCUITS.map((c) => (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={circuit === c.value}
              onClick={() => changerCircuit(c.value)}
              className={cn(
                "inline-flex h-8 items-center rounded px-3 text-[13px] font-medium transition-colors",
                circuit === c.value
                  ? "bg-bleu text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {circuit === null ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="p-0">
            <TableSkeleton />
          </CardContent>
        </Card>
      ) : circuit === "cbr" ? (
        <EnvoiCbr />
      ) : (
        <EnvoiStations />
      )}

      <Toaster position="bottom-left" />
    </div>
  );
}
