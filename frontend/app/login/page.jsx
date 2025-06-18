"use client";

import Image from "next/image";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Post login credentials to the backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: identifier, // assuming your identifier is an email address
            password: password,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        // You can handle error messages here
        console.log("Login failed with status:", response.status);
        console.log("Status text:", response.statusText);
        return;
      }

      const data = await response.json();
      console.log("Login successful:", data);

      // Redirect to the dashboard on successful login
      router.push("/dashboard");
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left side - Image */}
          <div className="md:w-1/2 relative h-64 md:h-auto">
            <Image
              src="/loginPageImage.jpg"
              alt="Naftal Background"
              layout="fill"
              objectFit="cover"
              className="rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
            />
            <div className="absolute inset-0 bg-blue-900 bg-opacity-40 flex items-center justify-center">
              <div className="text-white text-center p-6">
                <h2 className="text-3xl font-bold mb-4">
                  Bienvenue chez Naftal
                </h2>
                <p className="text-lg">
                  Votre partenaire énergétique de confiance
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <CardHeader className="flex justify-center items-center mb-8">
              <Image
                src="/logoNaftal.jpg"
                alt="Naftal Logo"
                width={100}
                height={40}
                className="h-12 w-15"
              />
            </CardHeader>
            <CardContent>
              <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">
                Espace Professionnel MyNaftal
              </h1>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="identifier"
                    className="text-sm font-medium text-gray-700"
                  >
                    Identifiant
                  </label>
                  <Input
                    id="identifier"
                    placeholder="Entrez votre identifiant"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3 text-gray-800 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 text-gray-800 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition duration-200 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 text-lg font-semibold shadow-md hover:shadow-lg"
                >
                  Se connecter
                </Button>
              </form>
              <div className="mt-6 text-center text-sm text-gray-600">
                <a
                  href="#"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Mot de passe oublié?
                </a>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
      <footer className="absolute bottom-4 text-center text-sm text-gray-600">
        © 2024 Naftal. Tous droits réservés.
      </footer>
    </div>
  );
}
