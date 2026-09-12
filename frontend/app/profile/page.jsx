"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

import { User, Mail, Shield, Calendar, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { DetailItem, DetailList, DetailSection, DetailSkeleton, PageError } from "@/components/ui/detail-layout"
import { StatusBadge } from "@/components/ui/status-badge"

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
      administrateur: { label: "Administrateur", color: "border-foreground bg-foreground text-white" },
      consultant: { label: "Consultant", color: "border-brand bg-card text-brand" },
      "chef station": { label: "Chef station", color: "border-teal bg-card text-teal-text" },
    }

    const config = roleConfig[role] || { label: role, color: "border-border bg-muted text-ink-750" }
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
    return <DetailSkeleton />
  }

  if (!user) {
    return (
      <PageError
        title="Erreur lors du chargement du profil"
        message="Votre session a peut-être expiré. Reconnectez-vous puis réessayez."
        onRetry={() => window.location.reload()}
      />
    )
  }

  const initials = (user.username || "?").slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Mon profil"
        description="Les informations de votre compte NSC Portal."
        actions={
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              Paramètres
            </Link>
          </Button>
        }
      />

      <section className="rounded-lg border border-border bg-card px-5 py-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-info text-lg font-semibold text-primary"
            >
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">{user.username}</p>
              <p className="truncate text-[13px] text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <StatusBadge kind="role" value={user.role} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSection title="Compte" className="xl:col-span-2">
          <DetailList>
            <DetailItem label="Nom d'utilisateur">{user.username}</DetailItem>
            <DetailItem label="Adresse email">{user.email}</DetailItem>
            <DetailItem label="Rôle">
              <StatusBadge kind="role" value={user.role} />
            </DetailItem>
            <DetailItem label="Station">{user.occupiedStation}</DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Activité">
          <dl className="space-y-4">
            <DetailItem label="Membre depuis">{user.createdAt ? formatDate(user.createdAt) : ""}</DetailItem>
            {user.updatedAt && user.updatedAt !== user.createdAt && (
              <DetailItem label="Dernière modification">{formatDate(user.updatedAt)}</DetailItem>
            )}
          </dl>
        </DetailSection>
      </div>
    </div>
  )
}
