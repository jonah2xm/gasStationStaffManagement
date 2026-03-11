"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2,
  FuelIcon,
  Lock,
  User,
  ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

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
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Branding Area */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-xl shadow-blue-400/10 border border-gray-50 mb-4 group transition-transform hover:scale-105 overflow-hidden">
            <Image
              src="/naftalLogo.png"
              alt="Naftal Logo"
              width={60}
              height={60}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Portail de Gestion</h1>
            <p className="text-gray-500 font-semibold mt-1 flex items-center justify-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#ffeb10]" />
              <span className="uppercase tracking-widest text-[10px]">NSC Portal Management</span>
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[2rem] border-none overflow-hidden">
          <CardHeader className="pt-10 px-10 pb-4">
            <h2 className="text-xl font-bold text-gray-800">Authentification</h2>
            <p className="text-sm text-gray-400 font-medium">Accédez à votre espace professionnel</p>
          </CardHeader>
          <CardContent className="p-10 pt-0">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                  Nom d'utilisateur
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-[#ffeb10] transition-colors" />
                  <Input
                    id="identifier"
                    placeholder="Identifiant"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-14 pl-12 rounded-2xl border-gray-100 bg-[#f8f9fa] focus:bg-white focus:ring-4 focus:ring-yellow-400/10 transition-all font-semibold"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Mot de passe
                  </label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-[#ffeb10] transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-12 pr-12 rounded-2xl border-gray-100 bg-[#f8f9fa] focus:bg-white focus:ring-4 focus:ring-yellow-400/10 transition-all font-semibold"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-lg font-black transition-all shadow-xl shadow-blue-200/50 flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Connexion...</span>
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <button className="text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors">
                Mot de passe oublié ?
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">NSC PORTAL SYSTEM</p>
          <div className="flex justify-center gap-6 pt-4">
            <div className="w-1 h-1 bg-yellow-400 rounded-full" />
            <div className="w-1 h-1 bg-gray-200 rounded-full" />
            <div className="w-1 h-1 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
