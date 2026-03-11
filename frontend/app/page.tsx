"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Fingerprint,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans selection:bg-yellow-200">
      {/* Structural Header (matching internal feel) */}
      <header className="bg-white border-b border-gray-200 py-4 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <Image
                src="/naftalLogo.png"
                alt="Naftal Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-gray-900">NSC Portal</span>
            </div>
          </div>

          <Link href="/login">
            <Button variant="ghost" className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-2">
              <ShieldCheck size={16} />
              Accès Sécurisé
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 pb-24">
        {/* Portal Entry container */}
        <div className="w-full max-w-4xl space-y-12">

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-700 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              <Building2 size={12} /> Gestion des Stations Service
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Système de Management <br />
              <span className="text-gray-400">Opérationnel Centralisé</span>
            </h1>
            <p className="text-gray-500 font-medium max-w-xl mx-auto text-lg">
              Bienvenue sur l'interface de pilotage NSC. Sélectionnez votre espace de travail pour commencer.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* CTA 1: Public/Station Attendance */}
            <Card className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2.5rem] border-none overflow-hidden group transition-all hover:-translate-y-1">
              <CardContent className="p-10 flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#ffeb10] group-hover:text-black transition-all duration-300">
                  <Fingerprint size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-gray-900">Espace Pointage</h3>
                  <p className="text-gray-400 font-medium px-4">
                    Interface simplifiée pour l'enregistrement des entrées et sorties du personnel de station.
                  </p>
                </div>
                <Link href="/pointage" className="w-full">
                  <Button className="w-full h-14 rounded-2xl bg-gray-50 text-gray-900 hover:bg-[#ffeb10] hover:text-black font-black text-lg transition-all flex items-center justify-center gap-2 border-none">
                    Accéder au Pointage
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* CTA 2: Management */}
            <Card className="bg-blue-600 shadow-[0_20px_50px_rgba(37,99,235,0.1)] rounded-[2.5rem] border-none overflow-hidden group transition-all hover:-translate-y-1">
              <CardContent className="p-10 flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center text-white group-hover:bg-[#ffeb10] group-hover:text-black transition-all duration-300">
                  <LayoutDashboard size={40} strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white">Espace Gestion</h3>
                  <p className="text-blue-100 font-medium px-4">
                    Tableaux de bord, rapports et administration complète pour les chefs de station et gestionnaires.
                  </p>
                </div>
                <Link href="/login" className="w-full">
                  <Button className="w-full h-14 rounded-2xl bg-white/10 text-white hover:bg-[#ffeb10] hover:text-black font-black text-lg transition-all flex items-center justify-center gap-2 border-none">
                    Espace Gestionnaires
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="pt-8 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Utilisateurs</p>
              <div className="flex items-center justify-center gap-2 text-gray-900 font-black">
                <Users size={14} className="text-[#ffeb10]" />
                <span>Multi-Rôles</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Localisation</p>
              <div className="flex items-center justify-center gap-2 text-gray-900 font-black">
                <Building2 size={14} className="text-[#ffeb10]" />
                <span>Multi-Stations</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Données</p>
              <div className="flex items-center justify-center gap-2 text-gray-900 font-black">
                <LayoutDashboard size={14} className="text-[#ffeb10]" />
                <span>Temps Réel</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Sécurité</p>
              <div className="flex items-center justify-center gap-2 text-gray-900 font-black">
                <ShieldCheck size={14} className="text-[#ffeb10]" />
                <span>Chiffré SSL</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Simplified Footer matching internal project */}
      <footer className="py-8 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm font-bold">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase font-black tracking-[0.2em]">NSC PORTAL SYSTEM</span>
            <div className="w-1 h-1 bg-yellow-400 rounded-full" />
            <span>v2.4.0</span>
          </div>
          <p>© {new Date().getFullYear()} Naftal. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
