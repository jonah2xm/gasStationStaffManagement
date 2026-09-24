"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOTIF_MAX, TYPES_DEMANDE, demanderAnnulation } from "@/lib/demandes";

/**
 * Demande d'annulation d'un document par le chef de station : le motif est
 * obligatoire, un gestionnaire ou un administrateur décide ensuite.
 *
 * `document` : { _id, agent, detail } — agent et détail affichés en rappel.
 */
export function DemandeAnnulationDialog({ open, onOpenChange, typeDocument, document, onEnvoyee }) {
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (open) {
      setMotif("");
      setErreur("");
    }
  }, [open, document?._id]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (!motif.trim()) {
      setErreur("Indiquez le motif de l’annulation.");
      return;
    }
    setEnvoi(true);
    try {
      await demanderAnnulation(typeDocument, document._id, motif.trim());
      toast.success("Demande d’annulation envoyée", { position: "bottom-left" });
      onEnvoyee?.(document._id);
      onOpenChange(false);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !envoi && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={envoyer} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Demander l’annulation</DialogTitle>
            <DialogDescription>
              Un gestionnaire ou un administrateur examinera votre demande. Si elle est acceptée,
              le document sera supprimé.
            </DialogDescription>
          </DialogHeader>

          {document && (
            <div className="rounded-md border border-border bg-muted px-3 py-2.5 text-[13.5px]">
              <p className="font-medium text-foreground">
                {TYPES_DEMANDE[typeDocument]?.label} — {document.agent}
              </p>
              {document.detail && <p className="text-muted-foreground">{document.detail}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="motif-annulation">Motif de l’annulation</Label>
            <Textarea
              id="motif-annulation"
              value={motif}
              maxLength={MOTIF_MAX}
              autoFocus
              aria-invalid={Boolean(erreur) || undefined}
              placeholder="Ex. : saisie en double, mauvais agent, dates erronées…"
              onChange={(e) => {
                setMotif(e.target.value);
                if (erreur) setErreur("");
              }}
            />
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-destructive-text" role={erreur ? "alert" : undefined}>
                {erreur}
              </span>
              <span className="shrink-0 text-muted-foreground">
                {motif.length}/{MOTIF_MAX}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={envoi} onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={envoi}>
              {envoi && (
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              )}
              Envoyer la demande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Pastille « Annulation demandée » à côté du nom, dans les listes. */
export function AnnulationDemandeeBadge() {
  return (
    <span
      className="ml-2 inline-flex items-center rounded border border-warning-border bg-warning-subtle px-1.5 py-px align-middle text-[11px] font-medium text-warning-text"
      title="Une demande d’annulation de ce document est en attente"
    >
      Annulation demandée
    </span>
  );
}
