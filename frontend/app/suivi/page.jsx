"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Building, FileStack, RefreshCw } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FILTRES_VIDES,
  TRIS_STATIONS,
  compter,
  filtrerDocuments,
  grouperParStation,
  libelleEcheance,
  lienStation,
  nomAgent,
  pluriel,
  trierStations,
} from "@/lib/suivi";
import { useCurrentUser } from "@/lib/use-current-user";
import { AlertesSuivi, filtresAlerte } from "@/components/suivi/alertes-suivi";
import {
  BarreFiltres,
  BordereauxReception,
  SuiviDocuments,
  useActionBordereau,
} from "@/components/suivi/suivi-documents";
import { Onglets, useOngletUrl } from "@/components/suivi/onglets";
import { useSuivi } from "@/components/suivi/use-suivi";
import { SuiviCbr } from "@/components/suivi/suivi-cbr";

// Gestionnaire et administrateur : une étape du circuit par onglet, dans
// l'ordre où un document les traverse. Bordereaux et documents ne sont
// jamais affichés ensemble.
const ETAPES = [
  {
    value: "stations",
    etape: 1,
    label: "Envoi des stations",
    aide: "Les stations délivrent leurs avis d’absence, avis de reprise et demandes de congé avant l’échéance.",
  },
  {
    value: "reception",
    etape: 2,
    label: "Réception des bordereaux",
    aide: "Marquez reçus les bordereaux d’envoi arrivés des stations : leurs documents passent à « Non délivré ».",
  },
  {
    value: "cbr",
    etape: 3,
    label: "Transmission au District CBR",
    aide: "Transmettez les documents réceptionnés au District CBR par bordereau, puis confirmez leur remise.",
  },
];

const VALEURS_ETAPES = ETAPES.map((e) => e.value);

function EtatChargement({ erreur, recharger }) {
  if (erreur) {
    return (
      <Card className="bg-card shadow-xs">
        <CardContent className="flex h-64 flex-col items-center justify-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive-text" />
          <p className="text-[13.5px] text-muted-foreground">{erreur.message}</p>
          {erreur.code !== 403 && (
            <Button variant="outline" onClick={() => recharger()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="bg-card shadow-xs">
      <CardContent className="p-0">
        <TableSkeleton />
      </CardContent>
    </Card>
  );
}

function Pastille({ valeur, children, className }) {
  if (!valeur) return null;
  return (
    <span className={`inline-flex h-6 items-center rounded-sm border px-2 text-xs font-medium tabular-nums ${className}`}>
      {children}
    </span>
  );
}

/** Étape 1 : délais d'envoi, une ligne par station, ses employés dépliables. */
function VueStations({ donnees }) {
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [tri, setTri] = useState("urgence");

  const documents = donnees.documents;
  const stations = useMemo(
    () => trierStations(grouperParStation(filtrerDocuments(documents, filtres, true)), tri),
    [documents, filtres, tri]
  );

  return (
    <div className="space-y-5">
      <AlertesSuivi
        alertes={donnees.alertes}
        parStation
        onVoir={(alerte) => setFiltres({ ...FILTRES_VIDES, ...filtresAlerte(alerte) })}
      />

      <BarreFiltres
        filtres={filtres}
        setFiltres={setFiltres}
        gestion
        tri={tri}
        setTri={setTri}
        tris={TRIS_STATIONS}
        placeholder="Rechercher une station, un employé, un matricule..."
      />

      {stations.length === 0 ? (
        <Card className="bg-card shadow-xs">
          <CardContent className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileStack size={40} />
            {documents.length === 0 ? "Aucun document à suivre" : "Aucune station ne correspond aux filtres"}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {stations.map((station) => (
            <AccordionItem
              key={station.stationName}
              value={station.stationName}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-ink-50 hover:no-underline">
                <div className="flex w-full flex-col gap-2 pr-3 text-left md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bleu-subtle">
                      <Building aria-hidden className="h-5 w-5 text-bleu" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-foreground">{station.stationName}</p>
                      <p className="text-[13px] font-normal text-muted-foreground">
                        {pluriel(station.agents.length, "employé")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                    {station.pireUrgence !== "delivre" && (
                      <StatusBadge kind="echeance" value={station.pireUrgence} />
                    )}
                    <Pastille
                      valeur={station.comptes.aReceptionner}
                      className="border-bleu-border bg-bleu-subtle text-bleu"
                    >
                      À réceptionner
                    </Pastille>
                    {station.prochain && (
                      <span className="ml-1 text-[13px] font-normal tabular-nums text-ink-800">
                        Échéance {libelleEcheance(station.prochain)}
                      </span>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="border-t border-border bg-background px-4 pb-4 pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[13.5px] font-semibold">Employés concernés</p>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={lienStation(station.stationName)}>
                      Gérer les documents
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-md border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employé</TableHead>
                        <TableHead>Échéance la plus urgente</TableHead>
                        <TableHead className="text-right">Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {station.agents.map((agent) => (
                        <TableRow key={agent.cle}>
                          <TableCell>
                            <span className="font-medium">{nomAgent(agent.personnel)}</span>
                            <div className="text-xs text-muted-foreground">
                              {[agent.personnel?.matricule, agent.contrat].filter(Boolean).join(" · ")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {agent.prochain ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusBadge kind="echeance" value={agent.pireUrgence} />
                                <span className="text-[13px] tabular-nums">{libelleEcheance(agent.prochain)}</span>
                              </div>
                            ) : (
                              <StatusBadge kind="echeance" value="delivre" label="Tout est délivré" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="text-bleu hover:bg-bleu-subtle hover:text-bleu" asChild>
                              <Link
                                href={`${lienStation(station.stationName)}${
                                  agent.personnel?.matricule ? `?q=${encodeURIComponent(agent.personnel.matricule)}` : ""
                                }`}
                              >
                                Voir
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

/** Étape 2 : bordereaux d'envoi de toutes les stations, à réceptionner. */
function VueReception({ donnees, recharger }) {
  const { enCoursBordereau, actionBordereau } = useActionBordereau(recharger);
  return (
    <BordereauxReception
      bordereaux={donnees.bordereaux}
      documents={donnees.documents}
      onAction={actionBordereau}
      enCours={enCoursBordereau}
      avecStation
    />
  );
}

export default function SuiviPage() {
  const user = useCurrentUser();
  const { donnees, loading, erreur, recharger } = useSuivi({ pret: user !== undefined });

  const gestion = Boolean(donnees?.gestion);
  const chargement = user === undefined || (loading && !donnees);

  const [onglet, setOnglet] = useOngletUrl("etape", VALEURS_ETAPES, "stations");
  // Anciens liens vers la vue District CBR (?vue=cbr).
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("vue") === "cbr") setOnglet("cbr");
    } catch {}
  }, [setOnglet]);

  const documents = donnees?.documents;
  const comptes = useMemo(() => compter(documents || []), [documents]);
  const nbBordereauxARecevoir = (donnees?.bordereaux || []).filter((b) => b.nbNonRecus > 0).length;

  const compteurs = {
    stations: { compteur: comptes.enAlerte, ton: comptes.enRetard ? "danger" : "warning" },
    reception: { compteur: nbBordereauxARecevoir, ton: "bleu" },
    cbr: { compteur: comptes.nonDelivresCbr, ton: "warning" },
  };
  const etapes = ETAPES.map((e) => ({ ...e, ...compteurs[e.value] }));
  const etape = ETAPES.find((e) => e.value === onglet) || ETAPES[0];

  let description = "Avis d’absence, avis de reprise et demandes de congé, des stations jusqu’au District CBR.";
  if (donnees && !gestion) {
    description = donnees.station
      ? `Station ${donnees.station} : délais d’envoi de vos avis d’absence, avis de reprise et demandes de congé.`
      : "Aucune station ne vous est affectée : aucun document à suivre.";
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 text-foreground lg:p-8">
      <PageHeader
        title="Suivi des documents"
        description={description}
        actions={
          donnees && (
            <Button variant="outline" onClick={() => recharger()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          )
        }
      />

      {chargement || (erreur && !donnees) ? (
        <EtatChargement erreur={chargement ? null : erreur} recharger={recharger} />
      ) : gestion ? (
        <div className="space-y-5">
          <div>
            <Onglets label="Étapes du suivi" onglets={etapes} valeur={etape.value} onChange={setOnglet} />
            <p className="mt-3 text-[13px] text-muted-foreground">{etape.aide}</p>
          </div>
          {etape.value === "reception" ? (
            <VueReception donnees={donnees} recharger={recharger} />
          ) : etape.value === "cbr" ? (
            <SuiviCbr donnees={donnees} recharger={recharger} />
          ) : (
            <VueStations donnees={donnees} />
          )}
        </div>
      ) : (
        <SuiviDocuments donnees={donnees} gestion={false} recharger={recharger} />
      )}

      <Toaster position="bottom-left" />
    </div>
  );
}
