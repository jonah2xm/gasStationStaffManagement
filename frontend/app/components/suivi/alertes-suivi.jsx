"use client";

import Link from "next/link";
import { CalendarClock, Plane } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GROUPES, formatDate, lienStation, nomAgent, pluriel } from "@/lib/suivi";

const ICONES = { conge_cdd: Plane, conge_cdi: Plane, absence_reprise: CalendarClock };

const TONS = {
  danger: {
    carte: "border-destructive-border bg-destructive-subtle",
    icone: "text-destructive-text",
    texte: "text-destructive-text",
  },
  warning: {
    carte: "border-warning-border bg-warning-subtle",
    icone: "text-warning-text",
    texte: "text-warning-text",
  },
  info: {
    carte: "border-bleu-border bg-bleu-subtle",
    icone: "text-bleu",
    texte: "text-bleu",
  },
};

const tonAlerte = (a) => (a.nbEnRetard ? "danger" : a.nbProches ? "warning" : "info");

const MAX_ELEMENTS = 6;

function AlerteCarte({ alerte, parStation, onVoir }) {
  const ton = TONS[tonAlerte(alerte)];
  const Icone = ICONES[alerte.groupe];
  const groupe = GROUPES[alerte.groupe];
  const estConge = alerte.groupe !== "absence_reprise";
  const e = alerte.echeance;
  const autres = (alerte.echeances?.length || 1) - 1;
  const elements = parStation ? alerte.stations : alerte.agents;

  return (
    <div role="alert" className={cn("flex flex-col gap-3 rounded-lg border p-4", ton.carte)}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-card">
          <Icone aria-hidden className={cn("h-[18px] w-[18px]", ton.icone)} strokeWidth={1.9} />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-semibold text-foreground">{groupe.titre}</p>
          <p className={cn("text-[13px] font-medium", ton.texte)}>
            {pluriel(alerte.nb, "document non délivré", "documents non délivrés")}
            {alerte.nbEnRetard ? ` · ${alerte.nbEnRetard} en retard` : ""}
          </p>
        </div>
      </div>

      <div className="space-y-0.5 text-[13px] text-ink-800">
        {estConge && e ? (
          <>
            <p className="font-medium">
              {e.enRetard ? "Échéance dépassée le " : "À délivrer au plus tard le "}
              <span className="tabular-nums">{formatDate(e.dernierJour)}</span>
            </p>
            {e.periode && (
              <p className="text-muted-foreground">
                Départs du <span className="tabular-nums">{formatDate(e.periode.debut)}</span> au{" "}
                <span className="tabular-nums">{formatDate(e.periode.fin)}</span>
              </p>
            )}
            {autres > 0 && (
              <p className="text-muted-foreground">
                + {pluriel(autres, "autre échéance", "autres échéances")} non soldée{autres > 1 ? "s" : ""}
              </p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">{groupe.regle}</p>
        )}
      </div>

      {elements.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={parStation ? "Stations concernées" : "Employés concernés"}>
          {elements.slice(0, MAX_ELEMENTS).map((el) => {
            const contenu = (
              <span className="truncate">{parStation ? el.stationName : nomAgent(el)}</span>
            );
            const classe =
              "inline-flex h-6 max-w-[220px] items-center gap-1.5 rounded-sm border border-border bg-card px-2 text-xs font-medium text-foreground";
            return (
              <li key={parStation ? el.stationName : el._id || `${el.lastName}-${el.matricule}`}>
                {parStation ? (
                  <Link href={lienStation(el.stationName)} className={cn(classe, "hover:border-bleu-border hover:text-bleu")}>
                    {contenu}
                  </Link>
                ) : (
                  <span className={classe}>{contenu}</span>
                )}
              </li>
            );
          })}
          {elements.length > MAX_ELEMENTS && (
            <li className="inline-flex h-6 items-center px-1 text-xs text-muted-foreground">
              + {elements.length - MAX_ELEMENTS}
            </li>
          )}
        </ul>
      )}

      {onVoir && (
        <Button variant="outline" size="sm" className="mt-auto w-fit bg-card" onClick={() => onVoir(alerte)}>
          Voir les documents
        </Button>
      )}
    </div>
  );
}

/**
 * Alertes du suivi : congés CDD, congés CDI, absences et reprises.
 * `parStation` liste les stations concernées (vue gestionnaire, toutes
 * stations) ; sinon les employés concernés.
 */
export function AlertesSuivi({ alertes, parStation = false, onVoir }) {
  if (!alertes?.length) return null;
  return (
    <section aria-label="Alertes" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {alertes.map((alerte) => (
        <AlerteCarte key={alerte.groupe} alerte={alerte} parStation={parStation} onVoir={onVoir} />
      ))}
    </section>
  );
}

/** Filtres correspondant au bouton « Voir les documents » d'une alerte. */
export const filtresAlerte = (alerte) => ({ groupe: alerte.groupe, urgence: "en_alerte" });
