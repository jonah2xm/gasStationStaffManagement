import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DetailSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

function DetailSection({ title, description, actions, children, className, bodyClassName }: DetailSectionProps) {
  return (
    <section className={cn("rounded-lg border border-border bg-card shadow-xs", className)}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
            {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("px-5 py-5", bodyClassName)}>{children}</div>
    </section>
  );
}

function DetailList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn("grid gap-x-8 gap-y-5 sm:grid-cols-2", className)}>{children}</dl>;
}

interface DetailItemProps {
  label: React.ReactNode;
  children?: React.ReactNode;
  full?: boolean;
  className?: string;
}

function DetailItem({ label, children, full, className }: DetailItemProps) {
  const empty = children === undefined || children === null || children === "";
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", full && "sm:col-span-2", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm tabular-nums text-foreground">{empty ? <span className="text-ink-500">—</span> : children}</dd>
    </div>
  );
}

interface TransferRouteProps {
  from?: React.ReactNode;
  to?: React.ReactNode;
  fromLabel?: string;
  toLabel?: string;
}

// Origin → destination station, for transfers.
function TransferRoute({ from, to, fromLabel = "Station d'origine", toLabel = "Station d'affectation" }: TransferRouteProps) {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <div className="flex-1 rounded-md border border-border bg-background px-3 py-2.5">
        <p className="text-xs text-muted-foreground">{fromLabel}</p>
        <p className="text-sm font-medium tabular-nums text-foreground">{from || "—"}</p>
      </div>
      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 rotate-90 self-center text-ink-600 sm:rotate-0" />
      <div className="flex-1 rounded-md border border-primary-border bg-primary-subtle px-3 py-2.5">
        <p className="text-xs text-ink-750">{toLabel}</p>
        <p className="text-sm font-semibold tabular-nums text-foreground">{to || "—"}</p>
      </div>
    </div>
  );
}

interface DocumentLinkProps {
  href: string;
  title?: string;
  subtitle?: string;
}

function DocumentLink({ href, title = "Document justificatif", subtitle = "PDF" }: DocumentLinkProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5">
      <span className="flex h-9 w-[30px] shrink-0 items-center justify-center rounded-[5px] border border-destructive-border bg-destructive-subtle text-[9px] font-bold text-destructive-text">
        PDF
      </span>
      <span className="flex min-w-[8rem] flex-1 flex-col">
        <span className="truncate text-[13.5px] font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <Button asChild variant="outline" size="sm">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir
        </a>
      </Button>
    </div>
  );
}

// Loading placeholder shaped like a detail page.
function DetailSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-72" />
      </div>
      <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-48" />
            <Skeleton className="h-2.5 w-28" />
          </div>
        </div>
      </div>
      <div className="grid gap-5 rounded-lg border border-border bg-card p-5 shadow-xs sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        ))}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

interface PageErrorProps {
  title?: string;
  message?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  onRetry?: () => void;
}

function PageError({ title = "Impossible de charger cette page", message, backHref, backLabel = "Retour à la liste", onRetry }: PageErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-2.5 p-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-destructive-subtle">
        <AlertTriangle aria-hidden className="h-5 w-5 text-destructive" strokeWidth={1.9} />
      </span>
      <h1 className="text-[15px] font-semibold text-foreground">{title}</h1>
      {message && <p className="max-w-[46ch] text-[13.5px] text-muted-foreground">{message}</p>}
      <div className="mt-2 flex gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        )}
        {backHref && (
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export { DetailSection, DetailList, DetailItem, TransferRoute, DocumentLink, DetailSkeleton, PageError };
