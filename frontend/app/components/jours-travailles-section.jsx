"use client";

import { useEffect } from "react";

import { Input } from "@/components/ui/input";
import { FormSection } from "@/components/ui/form-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  MAX_JOURS_TRAVAILLES,
  MOTIFS_RECUPERATION,
  ajusterJours,
  aujourdhuiISO,
} from "@/lib/recuperation";

/**
 * Jours travaillés d'une récupération : une ligne par jour récupéré, créées
 * et retirées au rythme de la durée. Non repris sur la demande imprimée.
 *
 * `erreurs` : résultat de erreursJours, affiché une fois la saisie validée.
 */
export function JoursTravaillesSection({ jours, onChange, duree, erreurs, disabled }) {
  const n = Number.parseInt(duree, 10) || 0;

  useEffect(() => {
    const ajustes = ajusterJours(jours, duree);
    if (ajustes !== jours) onChange(ajustes);
    // Seule la durée pilote le nombre de lignes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duree]);

  const modifier = (index, champ, valeur) =>
    onChange(jours.map((j, i) => (i === index ? { ...j, [champ]: valeur } : j)));

  const max = aujourdhuiISO();

  return (
    <FormSection
      title="Jours travaillés"
      description="Un jour travaillé par jour de récupération, avec son motif. Ces informations ne figurent pas sur la demande imprimée."
    >
      <div className="space-y-3 sm:col-span-2">
        {n < 1 ? (
          <p className="text-[13.5px] text-muted-foreground">
            Renseignez la durée pour saisir les jours travaillés.
          </p>
        ) : n > MAX_JOURS_TRAVAILLES ? (
          <p className="text-[13.5px] text-destructive-text">
            Une récupération ne peut pas dépasser {MAX_JOURS_TRAVAILLES} jours.
          </p>
        ) : (
          jours.map((jour, index) => {
            const e = erreurs?.lignes?.[index] || {};
            return (
              <div
                key={index}
                className="grid items-start gap-3 sm:grid-cols-[64px_minmax(0,180px)_minmax(0,1fr)]"
              >
                <span className="pt-2.5 text-[13px] font-medium text-muted-foreground">
                  Jour {index + 1}
                </span>
                <div className="space-y-1">
                  <Input
                    type="date"
                    aria-label={`Date du jour travaillé ${index + 1}`}
                    value={jour.date}
                    max={max}
                    onChange={(ev) => modifier(index, "date", ev.target.value)}
                    disabled={disabled}
                    aria-invalid={Boolean(e.date) || undefined}
                    className="tabular-nums"
                  />
                  {e.date && <p className="text-xs text-destructive-text">{e.date}</p>}
                </div>
                <div className="space-y-1">
                  <Select
                    value={jour.motif}
                    onValueChange={(valeur) => modifier(index, "motif", valeur)}
                    disabled={disabled}
                  >
                    <SelectTrigger
                      aria-label={`Motif du jour travaillé ${index + 1}`}
                      aria-invalid={Boolean(e.motif) || undefined}
                      className={cn(e.motif && "border-destructive")}
                    >
                      <SelectValue placeholder="Choisir un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MOTIFS_RECUPERATION).map(([valeur, label]) => (
                        <SelectItem key={valeur} value={valeur}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {e.motif && <p className="text-xs text-destructive-text">{e.motif}</p>}
                </div>
              </div>
            );
          })
        )}
        {erreurs?.global && n >= 1 && n <= MAX_JOURS_TRAVAILLES && (
          <p role="alert" className="text-[13px] text-destructive-text">
            {erreurs.global}
          </p>
        )}
      </div>
    </FormSection>
  );
}
