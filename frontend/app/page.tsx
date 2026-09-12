"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Fingerprint,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const TRUST_POINTS = [
  { label: "Multi-stations", caption: "GD R3120 → R3138", icon: Building2 },
  { label: "Multi-rôles", caption: "Admin, gestion, chef station", icon: Users },
  { label: "Temps réel", caption: "Statuts et notifications", icon: RefreshCw },
  { label: "Sécurisé", caption: "Connexion chiffrée SSL", icon: ShieldCheck },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border bg-card p-1">
              <Image src="/naftalLogo.png" alt="Naftal" width={28} height={28} className="object-contain" />
            </span>
            <div className="leading-tight">
              <p className="text-[15px] font-semibold text-foreground">NSC Portal</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Naftal Staff Connect
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/login">
              <ShieldCheck className="h-4 w-4" />
              Connexion
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-4xl space-y-10">
          <div className="space-y-4 text-center">
            <span className="inline-flex h-7 items-center gap-2 rounded-sm border border-border bg-card px-2.5 text-xs font-medium text-ink-750">
              <Building2 className="h-3.5 w-3.5" /> Gestion des stations-service
            </span>
            <h1 className="mx-auto max-w-[22ch] text-[40px] font-semibold leading-[46px] tracking-tight text-foreground">
              Système de gestion du personnel des stations
            </h1>
            <p className="mx-auto max-w-[60ch] text-[15px] leading-6 text-muted-foreground">
              Bienvenue sur l'interface de pilotage NSC. Sélectionnez votre espace de travail pour commencer.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-7 shadow-xs transition-shadow hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                <Fingerprint className="h-6 w-6 text-ink-750" strokeWidth={1.75} />
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Espace Pointage</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Interface simplifiée pour l'enregistrement des entrées et sorties du personnel de station.
                </p>
              </div>
              <Button asChild variant="outline" size="lg" className="mt-auto w-full">
                <Link href="/pointage">
                  Accéder au pointage
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-7 shadow-xs transition-shadow hover:shadow-md">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <LayoutDashboard className="h-6 w-6 text-primary-foreground" strokeWidth={1.75} />
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Espace Gestion</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Tableaux de bord, rapports et administration complète pour les chefs de station et gestionnaires.
                </p>
              </div>
              <Button asChild size="lg" className="mt-auto w-full">
                <Link href="/login">
                  Accéder à la gestion
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-border pt-8 md:grid-cols-4">
            {TRUST_POINTS.map(({ label, caption, icon: Icon }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-700" />
                <div>
                  <p className="text-[13.5px] font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-[13px] text-muted-foreground md:flex-row">
          <span className="tabular-nums">NSC Portal · v2.4.0</span>
          <p>© {new Date().getFullYear()} Naftal. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
