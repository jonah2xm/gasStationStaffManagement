"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { EyeIcon, EyeOffIcon, Loader2, Lock, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

function Brand({ size = "md", onDark = false }) {
  const tile = size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const logo = size === "lg" ? 34 : 28;
  return (
    <div className="flex items-center gap-3">
      <span className={`flex ${tile} shrink-0 items-center justify-center rounded-[10px] border ${onDark ? "border-white/20" : "border-border"} bg-card p-1`}>
        <Image src="/naftalLogo.png" alt="Naftal" width={logo} height={logo} className="object-contain" />
      </span>
      <div className="leading-tight">
        <p className={`text-[15px] font-semibold ${onDark ? "text-white" : "text-brand"}`}>NSC Portal</p>
        <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${onDark ? "text-white/70" : "text-muted-foreground"}`}>
          Naftal Staff Connect
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: identifier,
          password: password,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Identifiants incorrects");
        return;
      }

      toast.success("Connexion réussie!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    } catch (error) {
      console.error("Error during login:", error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-[560px] flex-col justify-between overflow-hidden bg-brand p-10 lg:flex">
        {/* Station NAFTAL sous un voile bleu marine : la photo reste visible, le texte lisible. */}
        <Image
          src="/loginPageImage.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 44vw, 1px"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-brand/95 via-brand/75 to-brand/95" />
        <div className="relative">
          <Brand size="lg" onDark />
        </div>
        <div className="relative space-y-4">
          <span aria-hidden className="block h-1.5 w-12 rounded-full bg-primary" />
          <h1 className="max-w-[17ch] text-[32px] font-semibold leading-10 tracking-tight text-white">
            Le personnel des stations, géré au même endroit.
          </h1>
          <p className="max-w-[46ch] text-sm leading-6 text-white/80">
            Congés, absences, affectations et pointages de l'ensemble des stations, avec des statuts à jour en temps réel.
          </p>
        </div>
        <p className="relative text-xs tabular-nums text-white/60">NSC Portal · v2.4.0</p>
      </aside>

      {/* Sign-in form */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[380px] space-y-7">
          {/* Petit écran : le panneau photo est masqué, la marque garde son fond bleu marine. */}
          <div className="rounded-xl bg-brand p-4 lg:hidden">
            <Brand onDark />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-brand">Connexion</h2>
            <p className="text-[13.5px] text-muted-foreground">Accédez à votre espace de gestion.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="identifier">Nom d'utilisateur</Label>
              <div className="relative">
                <User aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
                <Input
                  id="identifier"
                  placeholder="Identifiant"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="h-11 pl-9"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-9 pr-11"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[7px] text-ink-700 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connexion…</span>
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="space-y-2 border-t border-border pt-5 text-[13px]">
            <p className="text-muted-foreground">Mot de passe oublié ? Contactez votre administrateur.</p>
            <Link href="/pointage" className="inline-block font-medium text-brand underline-offset-4 hover:underline">
              Aller à l'espace pointage
            </Link>
          </div>
        </div>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}
