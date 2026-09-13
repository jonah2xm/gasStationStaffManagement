"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

/**
 * Signalement des documents envoyés : un document figurant sur un bordereau
 * d'envoi ne peut plus être modifié ni supprimé tant que ce bordereau n'est pas
 * annulé (voir backend/src/utils/verrouEnvoi.js, qui l'impose côté serveur).
 */

const formatDate = (value) =>
  new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const HISTORIQUE_HREF = "/envoi?onglet=historique";

/** Pastille « Envoyé » à côté du nom, dans les listes. */
export function EnvoyeBadge() {
  return (
    <span
      className="ml-2 inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-px align-middle text-[11px] font-medium text-muted-foreground"
      title="Document envoyé sur un bordereau : modification verrouillée"
    >
      <Lock className="h-3 w-3" aria-hidden />
      Envoyé
    </span>
  );
}

/** Explication sous les actions désactivées du menu d'une ligne. */
export function VerrouMenuNote() {
  return (
    <p className="max-w-[230px] px-2 pb-1.5 pt-1 text-[12px] leading-4 text-muted-foreground">
      Document envoyé : annulez son bordereau pour le modifier ou le supprimer.
    </p>
  );
}

/** Bandeau des pages de détail et de modification. */
export function VerrouNotice({ verrou }) {
  const router = useRouter();
  if (!verrou) return null;

  const b = verrou.bordereau;
  const date = b && typeof b === "object" && b.createdAt ? ` du ${formatDate(b.createdAt)}` : "";

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <Lock
          className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted-foreground"
          aria-hidden
        />
        <p className="text-[13.5px] text-foreground">
          {verrou.parReprise
            ? `Cette absence est clôturée par un avis de reprise envoyé sur le bordereau${date}.`
            : `Ce document figure sur le bordereau d’envoi${date}.`}{" "}
          <span className="text-muted-foreground">
            Modification et suppression sont verrouillées tant que ce bordereau
            n’est pas annulé.
          </span>
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => router.push(HISTORIQUE_HREF)}
      >
        Voir les bordereaux
      </Button>
    </div>
  );
}

/** Remplace le formulaire de modification d'un document verrouillé. */
export function DocumentVerrouillePage({ verrou, title, backHref, backLabel }) {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader backHref={backHref} backLabel={backLabel} title={title} />
      <VerrouNotice verrou={verrou} />
      <Button variant="outline" onClick={() => router.push(backHref)}>
        Retour
      </Button>
    </div>
  );
}
