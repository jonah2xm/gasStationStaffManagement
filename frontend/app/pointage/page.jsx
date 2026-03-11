"use client";

import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, Loader2, CheckCircle2, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

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

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden border-none">
                <CardHeader className="bg-blue-600 p-8 text-center relative">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
                    </div>
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/naftalLogo.png"
                            alt="Naftal Logo"
                            width={100}
                            height={100}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Système de Pointage</h1>
                    <p className="text-blue-100 text-sm opacity-80 mt-1">Veuillez vous identifier pour valider votre présence</p>
                </CardHeader>

                <CardContent className="p-8">
                    {!pointageSuccess ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label htmlFor="identifier" className="text-sm font-semibold text-gray-700 block">
                                    Matricule
                                </label>
                                <Input
                                    id="identifier"
                                    placeholder="EX: 123456"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all bg-gray-50"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold text-gray-700 block">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="•••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all bg-gray-50 pr-12"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-md transform active:scale-95 transition-all"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    "Valider ma présence"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="py-6 text-center animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-center mb-6">
                                <div className="rounded-full bg-green-100 p-4">
                                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Merci, {pointageSuccess.name} !</h2>
                            <p className="text-gray-600 mb-8">Votre pointage a été enregistré avec succès.</p>

                            <div className="bg-gray-50 rounded-2xl p-6 space-y-4 mb-8 text-left border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Heure d'enregistrement</p>
                                        <p className="text-lg font-medium text-gray-800">
                                            {new Date(pointageSuccess.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-5 w-5 text-red-500" />
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Station / Lieu</p>
                                        <p className="text-lg font-medium text-gray-800">{pointageSuccess.station}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                                    <div className={`h-2.5 w-2.5 rounded-full ${pointageSuccess.type === 'entrée' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Type de pointage</p>
                                        <p className="text-lg font-bold text-gray-800 capitalize">{pointageSuccess.type}</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="w-full h-12 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                Nouveau pointage
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Toaster position="top-center" />

            <div className="fixed bottom-6 text-gray-400 text-sm">
                © 2024 Naftal Staff Connect • Système de Gestion du Personnel
            </div>
        </div>
    );
}
