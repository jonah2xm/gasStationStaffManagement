"use client"

import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!identifier || !password) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: identifier,
          password: password,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || "Identifiants incorrects")
        return
      }

      const data = await response.json()
      toast.success("Connexion réussie!")

      // Small delay to show success message
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (error) {
      console.error("Error during login:", error)
      toast.error("Erreur de connexion. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50 flex items-center justify-center p-4 relative">
      <Card className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Left side - Image */}
          <div className="md:w-1/2 relative h-64 md:h-auto">
            <Image
              src="/loginPageImage.jpg"
              alt="Naftal Background"
              fill
              className="object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 to-blue-800/40 flex items-center justify-center">
              <div className="text-white text-center p-6 max-w-md">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Bienvenue chez Staff Connect</h2>
                <p className="text-lg md:text-xl opacity-90 leading-relaxed">
                  Votre partenaire énergétique de confiance
                </p>
                <div className="mt-6 w-16 h-1 bg-white/60 mx-auto rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
            <CardHeader className="flex justify-center items-center mb-8 p-0">
             
                <Image
                  src="/logoNaftal.jpg"
                  alt="Naftal Logo"
                  width={120}
                  height={60}
                 
                />
             
            </CardHeader>

            <CardContent className="p-0">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Espace Professionnel</h1>
                <p className="text-blue-600 font-semibold text-lg">NSC</p>
                <div className="w-12 h-1 bg-blue-600 mx-auto mt-3 rounded-full"></div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="identifier" className="text-sm font-semibold text-gray-700 block">
                    Identifiant
                  </label>
                  <Input
                    id="identifier"
                    placeholder="Entrez votre identifiant"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full px-4 py-3 text-gray-800 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
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
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 text-gray-800 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200 text-sm"
                >
                  Mot de passe oublié?
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center leading-relaxed">
                  En vous connectant, vous acceptez nos{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    conditions d'utilisation
                  </a>{" "}
                  et notre{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    politique de confidentialité
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-sm text-gray-600 px-4">
        <p>© 2024 Naftal. Tous droits réservés.</p>
      </footer>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10B981",
            },
          },
          error: {
            style: {
              background: "#EF4444",
            },
          },
        }}
      />
    </div>
  )
}
