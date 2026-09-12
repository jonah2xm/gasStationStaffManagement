"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { EyeIcon, EyeOffIcon, Loader2, CheckCircle2, Clock, MapPin, LogIn, LogOut } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function PointagePage() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pointageSuccess, setPointageSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identifier || !password) {
            toast.error("Veuillez remplir tous les champs");
            return;
        }

        setIsLoading(true);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
            const response = await fetch(`${backendUrl}/api/pointage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: identifier,
                    password: password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.message || "Identifiant ou mot de passe incorrect");
                return;
            }

            const data = await response.json();
            setPointageSuccess(data.pointage);
            toast.success("Pointage enregistré !");

            // Reset form
            setIdentifier("");
            setPassword("");
        } catch (error) {
            console.error("Error during pointage:", error);
            toast.error("Erreur technique. Veuillez réessayer.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setPointageSuccess(null);
    };

    const isEntry = pointageSuccess?.type === "entrée";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-md">
                <div className="flex items-center gap-3 border-b border-border px-6 py-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card p-1">
                        <Image src="/naftalLogo.png" alt="Naftal" width={34} height={34} className="object-contain" />
                    </span>
                    <div className="leading-tight">
                        <h1 className="text-lg font-semibold text-foreground">Système de pointage</h1>
                        <p className="text-[13px] text-muted-foreground">Identifiez-vous pour valider votre présence</p>
                    </div>
                </div>

                <div className="p-6">
                    {!pointageSuccess ? (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <Label htmlFor="identifier">Matricule</Label>
                                <Input
                                    id="identifier"
                                    placeholder="Ex : 123456"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="username"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="h-12 text-base tabular-nums"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="•••••"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 pr-12 text-base"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[7px] text-ink-700 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" size="lg" disabled={isLoading} className="h-12 w-full text-base">
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Valider ma présence"}
                            </Button>
                        </form>
                    ) : (
                        <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle">
                                <CheckCircle2 className="h-9 w-9 text-success" />
                            </span>
                            <h2 className="mt-4 text-xl font-semibold text-foreground">Merci, {pointageSuccess.name} !</h2>
                            <p className="mt-1 text-[13.5px] text-muted-foreground">Votre pointage a été enregistré avec succès.</p>

                            <dl className="mt-6 divide-y divide-border rounded-lg border border-border text-left">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Clock className="h-4 w-4 shrink-0 text-ink-700" />
                                    <dt className="flex-1 text-[13px] text-muted-foreground">Heure d'enregistrement</dt>
                                    <dd className="text-[15px] font-semibold tabular-nums text-foreground">
                                        {new Date(pointageSuccess.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </dd>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <MapPin className="h-4 w-4 shrink-0 text-ink-700" />
                                    <dt className="flex-1 text-[13px] text-muted-foreground">Station</dt>
                                    <dd className="text-[15px] font-semibold tabular-nums text-foreground">{pointageSuccess.station}</dd>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    {isEntry ? <LogIn className="h-4 w-4 shrink-0 text-ink-700" /> : <LogOut className="h-4 w-4 shrink-0 text-ink-700" />}
                                    <dt className="flex-1 text-[13px] text-muted-foreground">Type de pointage</dt>
                                    <dd>
                                        <span
                                            className={`inline-flex h-7 items-center gap-1.5 rounded-sm border px-2.5 text-[13px] font-semibold capitalize ${
                                                isEntry
                                                    ? "border-success-border bg-success-subtle text-success-text"
                                                    : "border-warning-border bg-warning-subtle text-warning-text"
                                            }`}
                                        >
                                            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${isEntry ? "bg-success" : "bg-warning"}`} />
                                            {pointageSuccess.type}
                                        </span>
                                    </dd>
                                </div>
                            </dl>

                            <Button onClick={handleReset} variant="outline" size="lg" className="mt-6 h-12 w-full">
                                Nouveau pointage
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Toaster position="top-center" />
            <p className="mt-6 text-center text-xs text-muted-foreground">
                © 2024 Naftal Staff Connect · Système de gestion du personnel
            </p>
        </div>
    );
}
