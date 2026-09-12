import * as React from "react";
import {
  Baby,
  CalendarDays,
  Clock,
  FileText,
  Flower2,
  Heart,
  Landmark,
  MoreHorizontal,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/*
 * One status taxonomy for every module (NSC Design System, section 03).
 * States (actif, en cours, terminé…) carry a semantic color and a dot;
 * categories (absence reason, station type, recovery type) stay neutral and
 * are told apart by their icon. Brand yellow only appears as the "unread" dot.
 */

type Tone =
  | "success"
  | "info"
  | "teal"
  | "danger"
  | "warning"
  | "neutral"
  | "upcoming"
  | "violet"
  | "unread"
  | "read"
  | "ink"
  | "brandOutline"
  | "tealOutline";

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-success-border bg-success-subtle text-success-text",
  info: "border-info-border bg-info-subtle text-info-text",
  teal: "border-teal-border bg-teal-subtle text-teal-text",
  danger: "border-destructive-border bg-destructive-subtle text-destructive-text",
  warning: "border-warning-border bg-warning-subtle text-warning-text",
  neutral: "border-border bg-muted text-ink-750",
  upcoming: "border-input bg-card text-ink-750",
  violet: "border-violet-border bg-violet-subtle text-violet-text",
  unread: "border-input bg-card font-semibold text-foreground",
  read: "border-border bg-muted text-ink-600",
  ink: "border-foreground bg-foreground text-white",
  brandOutline: "border-brand bg-card text-brand",
  tealOutline: "border-teal bg-card text-teal-text",
};

const DOT_CLASSES: Partial<Record<Tone, string>> = {
  success: "bg-success",
  info: "bg-info",
  teal: "bg-teal",
  danger: "bg-destructive",
  warning: "bg-warning",
  neutral: "bg-chart-muted",
  upcoming: "border-[1.5px] border-chart-muted bg-transparent",
  unread: "h-[7px] w-[7px] border border-primary-strong bg-primary",
};

interface StatusEntry {
  label: string;
  tone: Tone;
  dot?: boolean;
  icon?: LucideIcon;
}

const PERSONNEL_ACTIVE: StatusEntry = { label: "Actif", tone: "success", dot: true };
const PERSONNEL_LEAVE: StatusEntry = { label: "En congé", tone: "info", dot: true };
const PERSONNEL_RECOVERY: StatusEntry = { label: "En récupération", tone: "teal", dot: true };
const PERSONNEL_AI: StatusEntry = { label: "Absence AI", tone: "danger", dot: true };
const PERSONNEL_AA: StatusEntry = { label: "Absence AA", tone: "warning", dot: true };
const PERIOD_UPCOMING: StatusEntry = { label: "À venir", tone: "upcoming", dot: true };
const PERIOD_ONGOING: StatusEntry = { label: "En cours", tone: "info", dot: true };

// Keys are lower-case and accent-free; see normalize().
const STATUS = {
  personnel: {
    actif: PERSONNEL_ACTIVE,
    conge: PERSONNEL_LEAVE,
    "en conge": PERSONNEL_LEAVE,
    recuperation: PERSONNEL_RECOVERY,
    "en recuperation": PERSONNEL_RECOVERY,
    ai: PERSONNEL_AI,
    "absence ai": PERSONNEL_AI,
    aa: PERSONNEL_AA,
    "absence aa": PERSONNEL_AA,
    "en formation": { label: "En formation", tone: "neutral", dot: true },
    inactif: { label: "Inactif", tone: "neutral", dot: true },
  },
  period: {
    "a venir": PERIOD_UPCOMING,
    upcoming: PERIOD_UPCOMING,
    "en cours": PERIOD_ONGOING,
    ongoing: PERIOD_ONGOING,
    active: PERIOD_ONGOING,
    termine: { label: "Terminé", tone: "neutral", dot: true },
    terminee: { label: "Terminée", tone: "neutral", dot: true },
    completed: { label: "Terminé", tone: "neutral", dot: true },
  },
  conge: {
    ordinaire: { label: "Ordinaire", tone: "neutral" },
    anticipe: { label: "Anticipé", tone: "violet" },
  },
  recuperation: {
    jour: { label: "Par jour", tone: "neutral", icon: CalendarDays },
    heure: { label: "Par heure", tone: "neutral", icon: Clock },
  },
  absenceAA: {
    maladie: { label: "Maladie", tone: "neutral", icon: Stethoscope },
    deces: { label: "Décès", tone: "neutral", icon: Flower2 },
    marriage: { label: "Mariage", tone: "neutral", icon: Heart },
    mariage: { label: "Mariage", tone: "neutral", icon: Heart },
    naissance: { label: "Naissance", tone: "neutral", icon: Baby },
    examen: { label: "Examen", tone: "neutral", icon: FileText },
    pilgrimage: { label: "Pèlerinage", tone: "neutral", icon: Landmark },
    pelerinage: { label: "Pèlerinage", tone: "neutral", icon: Landmark },
    autre: { label: "Autre", tone: "neutral", icon: MoreHorizontal },
  },
  absenceAI: {
    avisabsence: { label: "Avis d'absence", tone: "danger" },
    avisreprise: { label: "Avis de reprise", tone: "success" },
  },
  notification: {
    unread: { label: "Non lue", tone: "unread", dot: true },
    read: { label: "Lue", tone: "read" },
  },
  role: {
    administrateur: { label: "Administrateur", tone: "ink" },
    gestionnaire: { label: "Gestionnaire", tone: "brandOutline" },
    "chef station": { label: "Chef station", tone: "tealOutline" },
    personnel: { label: "Personnel", tone: "neutral" },
  },
  station: {
    urbaine: { label: "Urbaine", tone: "neutral" },
    rurale: { label: "Rurale", tone: "neutral" },
    autoroute: { label: "Autoroute", tone: "neutral" },
    airport: { label: "Aéroport", tone: "neutral" },
    aeroport: { label: "Aéroport", tone: "neutral" },
  },
} satisfies Record<string, Record<string, StatusEntry>>;

export type StatusKind = keyof typeof STATUS;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveStatus(kind: StatusKind, value?: string | null): StatusEntry {
  const raw = value ?? "";
  const entries: Record<string, StatusEntry> = STATUS[kind];
  return entries[normalize(raw)] ?? { label: raw || "—", tone: "neutral" };
}

const badgeBase =
  "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-sm border px-[9px] text-xs font-medium";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: StatusKind;
  value?: string | null;
  /** Overrides the taxonomy label while keeping its color. */
  label?: React.ReactNode;
}

function StatusBadge({ kind, value, label, className, ...props }: StatusBadgeProps) {
  const entry = resolveStatus(kind, value);
  const Icon = entry.icon;
  return (
    <span className={cn(badgeBase, TONE_CLASSES[entry.tone], className)} {...props}>
      {entry.dot && (
        <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASSES[entry.tone])} />
      )}
      {Icon && <Icon aria-hidden className="h-[13px] w-[13px] shrink-0" strokeWidth={2} />}
      {label ?? entry.label}
    </span>
  );
}

export interface DaysLeftBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  days: number;
}

// "Retour proche" (≤ 3 days) is a highlight on the days-left cell, never an extra status.
function DaysLeftBadge({ days, className, ...props }: DaysLeftBadgeProps) {
  if (days >= 0 && days <= 3) {
    return (
      <span
        className={cn(badgeBase, "border-warning-border bg-warning-subtle font-semibold tabular-nums text-warning-text", className)}
        {...props}
      >
        {days === 0 ? "Retour aujourd'hui" : `Retour dans ${days} j`}
      </span>
    );
  }
  return (
    <span className={cn("text-[13.5px] tabular-nums text-ink-800", className)} {...props}>
      {Math.max(days, 0)} j
    </span>
  );
}

export { StatusBadge, DaysLeftBadge };
