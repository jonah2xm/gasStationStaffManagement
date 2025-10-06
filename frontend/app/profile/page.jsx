"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { User, Mail, Shield, Calendar, CheckCircle, Loader2, AlertCircle } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        })

        if (!res.ok) {
          throw new Error("Not authenticated")
        }

        const data = await res.json()
        setUser(data.user)
      } catch (err) {
        console.error("Error fetching profile:", err)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [router])

  const getRoleBadge = (role) => {
    const roleConfig = {
      administrateur: { label: "Administrateur", color: "bg-red-100 text-red-800" },
      consultant: { label: "Consultant", color: "bg-blue-100 text-blue-800" },
      "chef station": { label: "Chef Station", color: "bg-green-100 text-green-800" },
    }

    const config = roleConfig[role] || { label: role, color: "bg-gray-100 text-gray-800" }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Erreur lors du chargement du profil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
 


      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Mon Profil</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{user.username}</CardTitle>
                <div className="mt-2">{getRoleBadge(user.role)}</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Rôle: {user.role}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Membre depuis</p>
                      <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  {user.updatedAt !== user.createdAt && (
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Dernière modification</p>
                        <p className="text-xs text-gray-500">{formatDate(user.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Informations du Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{user.username}</p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Adresse email</label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">{user.email}</p>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Rôle</label>
                  <div className="bg-gray-50 p-3 rounded-md">{getRoleBadge(user.role)}</div>
                </div>

                <Separator />


              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
