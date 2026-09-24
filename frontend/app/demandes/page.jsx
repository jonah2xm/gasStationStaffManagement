"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FileX2, Search, Undo2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Onglets, useOngletUrl } from "@/components/suivi/onglets";
import { useCurrentUser } from "@/lib/use-current-user";
import { CHEF_STATION, MOTIF_MAX, ROLES_DECIDEURS, TYPES_DEMANDE, signalerDemandes } from "@/lib/demandes";

/**
 * Demandes d'annulation. Le chef de station suit les demandes de sa station
 * et peut retirer celles en attente ; le gestionnaire et l'administrateur
 * voient toutes les stations et acceptent (le document est supprimé) ou
 * refusent.
 */

const ONGLETS = ["en_attente", "traitees", "toutes"];

const API = () => `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/demandes`;

const formatDate = (value) =>
  new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const formatDateHeure = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function DemandesPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const estChef = user?.role === CHEF_STATION;
  const estDecideur = ROLES_DECIDEURS.includes(user?.role);

  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [onglet, setOnglet] = useOngletUrl("onglet", ONGLETS, "en_attente");

  // { demande, action: "accepter" | "refuser" }
  const [decision, setDecision] = useState(null);
  const [aRetirer, setARetirer] = useState(null);
  const [retrait, setRetrait] = useState(false);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const res = await fetch(API(), { credentials: "include" });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (actif) {
          setDemandes(data);
          setError(null);
        }
      } catch {
        if (actif) setError("Impossible de charger les demandes. Réessayez plus tard.");
      } finally {
        if (actif) setLoading(false);
      }
    })();
    return () => {
      actif = false;
    };
  }, [router]);

  const remplacer = (maj) =>
    setDemandes((prev) => prev.map((d) => (d._id === maj._id ? { ...d, ...maj } : d)));

  const nbEnAttente = demandes.filter((d) => d.statut === "en_attente").length;

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return demandes
      .filter((d) =>
        onglet === "en_attente"
          ? d.statut === "en_attente"
          : onglet === "traitees"
            ? d.statut !== "en_attente"
            : true
      )
      .filter((d) => {
        if (!terme) return true;
        const texte = `${d.apercu?.agent} ${d.apercu?.matricule} ${d.stationName} ${d.motif}`;
        return texte.toLowerCase().includes(terme);
      });
  }, [demandes, onglet, recherche]);

  const retirer = async () => {
    if (!aRetirer) return;
    setRetrait(true);
    try {
      const res = await fetch(`${API()}/${aRetirer._id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Le retrait a échoué.");
      setDemandes((prev) => prev.filter((d) => d._id !== aRetirer._id));
      setARetirer(null);
      toast.success("Demande retirée");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRetrait(false);
    }
  };

  const colonnes = estChef ? 6 : 7;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 text-foreground lg:p-8">
      <PageHeader
        title="Demandes d’annulation"
        description={
          estChef
            ? "Suivez les demandes d’annulation envoyées pour les documents de votre station."
            : "Acceptez ou refusez les demandes d’annulation des chefs de station. Accepter supprime le document."
        }
      />

      <Card>
        <CardContent className="space-y-4 p-0">
          <div className="flex flex-col gap-3 px-4 pt-2 md:flex-row md:items-end md:justify-between">
            <Onglets
              label="Statut des demandes"
              valeur={onglet}
              onChange={setOnglet}
              onglets={[
                { value: "en_attente", label: "En attente", compteur: nbEnAttente, ton: "warning" },
                { value: "traitees", label: "Traitées" },
                { value: "toutes", label: "Toutes" },
              ]}
            />
            <div className="relative w-full pb-2 md:w-72">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Agent, matricule, station, motif…"
                className="pl-9"
                aria-label="Rechercher une demande"
              />
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} columns={colonnes} />
          ) : error ? (
            <p className="px-4 pb-6 text-[13.5px] text-destructive-text">{error}</p>
          ) : visibles.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 pb-12 pt-8 text-center">
              <FileX2 aria-hidden className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-[13.5px] text-muted-foreground">
                {recherche
                  ? "Aucune demande ne correspond à la recherche."
                  : onglet === "en_attente"
                    ? "Aucune demande en attente."
                    : "Aucune demande."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Document</TableHead>
                  <TableHead className="min-w-[120px]">Agent</TableHead>
                  {!estChef && <TableHead className="whitespace-nowrap">Station</TableHead>}
                  <TableHead className="min-w-[160px]">Motif</TableHead>
                  <TableHead>Demandée</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((d) => {
                  const enAttente = d.statut === "en_attente";
                  const type = TYPES_DEMANDE[d.typeDocument];
                  return (
                    <TableRow key={d._id} className="align-top hover:bg-background">
                      <TableCell>
                        <div className="font-medium">{d.apercu?.titre || type?.label}</div>
                        <div className="text-sm text-muted-foreground">{d.apercu?.detail}</div>
                        {enAttente && type && (
                          <Link
                            href={type.details(d.document)}
                            className="text-[12.5px] font-medium text-bleu hover:text-bleu-strong"
                          >
                            Voir le document
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.apercu?.agent || "—"}
                        <div className="text-sm text-muted-foreground">{d.apercu?.matricule}</div>
                      </TableCell>
                      {!estChef && <TableCell className="whitespace-nowrap">{d.stationName}</TableCell>}
                      <TableCell className="max-w-[300px] whitespace-pre-line break-words text-[13.5px]">
                        {d.motif}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(d.createdAt)}
                        <div className="text-sm text-muted-foreground">
                          par {d.demandeur?.username || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge kind="demande" value={d.statut} />
                        {!enAttente && d.decisionLe && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatDateHeure(d.decisionLe)}
                            {d.decisionPar?.username ? ` — ${d.decisionPar.username}` : ""}
                          </div>
                        )}
                        {d.commentaire && (
                          <p className="mt-1 max-w-[240px] whitespace-pre-line break-words text-xs text-foreground">
                            « {d.commentaire} »
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {enAttente && estDecideur && (
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDecision({ demande: d, action: "refuser" })}
                            >
                              <X className="mr-1.5 h-3.5 w-3.5" /> Refuser
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDecision({ demande: d, action: "accepter" })}
                            >
                              <Check className="mr-1.5 h-3.5 w-3.5" /> Accepter
                            </Button>
                          </div>
                        )}
                        {enAttente && estChef && (
                          <Button size="sm" variant="outline" onClick={() => setARetirer(d)}>
                            <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Retirer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DecisionDialog
        decision={decision}
        onClose={() => setDecision(null)}
        onDecidee={(maj) => {
          remplacer(maj);
          setDecision(null);
          signalerDemandes();
        }}
      />

      <CustomAlertDialog
        open={Boolean(aRetirer)}
        onOpenChange={(open) => !open && setARetirer(null)}
        title="Retirer la demande"
        description="La demande d’annulation sera retirée et le document restera en place."
        confirmText="Retirer"
        cancelText="Annuler"
        loading={retrait}
        onConfirm={retirer}
        onCancel={() => setARetirer(null)}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}

/** Accepter (le document est supprimé) ou refuser, avec un commentaire facultatif. */
function DecisionDialog({ decision, onClose, onDecidee }) {
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const demande = decision?.demande;
  const accepter = decision?.action === "accepter";

  useEffect(() => {
    setCommentaire("");
    setErreur("");
  }, [demande?._id, decision?.action]);

  const valider = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      const res = await fetch(`${API()}/${demande._id}/${decision.action}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentaire: commentaire.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "L’opération a échoué.");
      toast.success(accepter ? "Demande acceptée : document supprimé" : "Demande refusée");
      onDecidee(data);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={Boolean(decision)} onOpenChange={(open) => !open && !envoi && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {demande && (
          <form onSubmit={valider} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{accepter ? "Accepter l’annulation" : "Refuser l’annulation"}</DialogTitle>
              <DialogDescription>
                {accepter
                  ? "Le document sera supprimé définitivement, avec les mêmes effets que le bouton Supprimer."
                  : "Le document reste en place. Le chef de station sera notifié du refus."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1 rounded-md border border-border bg-muted px-3 py-2.5 text-[13.5px]">
              <p className="font-medium text-foreground">
                {demande.apercu?.titre} — {demande.apercu?.agent}
              </p>
              <p className="text-muted-foreground">{demande.apercu?.detail}</p>
              <p className="pt-1 text-foreground">
                <span className="text-muted-foreground">Motif : </span>
                {demande.motif}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="commentaire-decision">
                Commentaire <span className="font-normal text-muted-foreground">(facultatif)</span>
              </Label>
              <Textarea
                id="commentaire-decision"
                value={commentaire}
                maxLength={MOTIF_MAX}
                placeholder={accepter ? "" : "Ex. : le congé a déjà commencé"}
                onChange={(e) => setCommentaire(e.target.value)}
              />
            </div>

            {erreur && (
              <p role="alert" className="rounded-md border border-destructive-border bg-destructive-subtle px-3 py-2 text-[13px] text-destructive-text">
                {erreur}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" disabled={envoi} onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" variant={accepter ? "destructive" : "default"} disabled={envoi}>
                {envoi && (
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden
                  />
                )}
                {accepter ? "Accepter et supprimer" : "Refuser la demande"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
