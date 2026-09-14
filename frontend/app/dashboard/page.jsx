"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { StatusBadge, DaysLeftBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { dateRetourEstimee, isAutorisee, isSignaled48h } from "@/lib/absence-motifs"
import { useCurrentUser } from "@/lib/use-current-user"
import { sectionRetiree } from "@/lib/acces"
import {
  ArrowLeftRight,
  BellRing,
  CalendarCheck,
  CalendarClock,
  Eye,
  LogIn,
  Plane,
  Users,
} from "lucide-react"

// Chart colors from the design tokens (chart-1, chart-2, chart-4).
const STATUS_COLORS = {
  actif: "#0F7B55",
  conge: "#1B63C4",
  absent: "#DC2626",
}

const formatDate = (dateString) => {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const JOUR = 24 * 60 * 60 * 1000
// Retours affichés : aujourd'hui et les 3 jours suivants.
const FENETRE_RETOUR = 3

const minuit = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Jours calendaires d'aujourd'hui jusqu'à la date : 0 aujourd'hui, négatif une fois passée.
const joursAvant = (date) => Math.round((minuit(date) - minuit(new Date())) / JOUR)

const nomComplet = (p) => `${p?.lastName || ""} ${p?.firstName || ""}`.trim()

/**
 * Agents attendus en reprise, quel que soit le motif de leur départ : fin de
 * congé, retour estimé d'une absence encore ouverte (date + durée), fin
 * d'affectation temporaire.
 */
function construireRetours({ conges = [], absences = [], affectations = [] }) {
  const retours = []

  for (const c of conges) {
    if (!c.dateRetour) continue
    retours.push({
      cle: `conge:${c._id}`,
      type: "conge",
      valeur: c.typeConge,
      personnel: c.personnel,
      station: c.station?.name || c.stationName,
      depuis: c.dateDebut,
      retour: c.dateRetour,
      href: `/conges/details/${c._id}`,
    })
  }

  for (const a of absences) {
    // Une absence clôturée par un avis de reprise n'attend plus de retour.
    if (a.reprise) continue
    const retour = dateRetourEstimee(a)
    if (!retour) continue
    retours.push({
      cle: `absence:${a._id}`,
      type: "absence",
      valeur: a.motif,
      personnel: a.personnel,
      station: a.personnel?.stationName,
      depuis: a.date,
      retour,
      estime: true,
      href: `/absence/details/${a._id}`,
    })
  }

  for (const t of affectations) {
    if (!t.endDate) continue
    retours.push({
      cle: `affectation:${t._id}`,
      type: "affectation",
      personnel: t.personnel,
      station: [t.affectedStation?.name, t.originStation?.name].filter(Boolean).join(" → "),
      depuis: t.startDate,
      retour: t.endDate,
      href: "/affectation/temporaire",
    })
  }

  return retours
    .map((r) => ({ ...r, jours: joursAvant(r.retour) }))
    .filter((r) => r.jours >= 0 && r.jours <= FENETRE_RETOUR)
    .sort((a, b) => a.jours - b.jours || nomComplet(a.personnel).localeCompare(nomComplet(b.personnel), "fr"))
}

function EmployeeCell({ personnel }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium text-foreground">
        {personnel?.firstName} {personnel?.lastName}
      </span>
      <span className="text-[12.5px] tabular-nums text-muted-foreground">{personnel?.matricule}</span>
    </div>
  )
}

function ViewButton({ href, label }) {
  return (
    <Button asChild variant="ghost" size="icon" className="h-[30px] w-[30px] text-bleu hover:bg-bleu-subtle hover:text-bleu">
      <Link href={href} aria-label={label} title={label}>
        <Eye className="h-4 w-4" />
      </Link>
    </Button>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-5 w-5 text-ink-700" strokeWidth={1.8} />
      </span>
      <p className="text-[15px] font-semibold text-foreground">{title}</p>
      <p className="max-w-[42ch] text-[13.5px] text-muted-foreground">{description}</p>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, loading }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-muted-foreground">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bleu-subtle">
          <Icon aria-hidden className="h-4 w-4 text-bleu" strokeWidth={1.9} />
        </span>
      </div>
      <div className="mt-2.5 text-[28px] font-semibold leading-8 tracking-tight tabular-nums text-foreground">
        {loading ? <Skeleton className="h-8 w-16" /> : value.toLocaleString("fr-FR")}
      </div>
    </Card>
  )
}

function SectionCard({ title, description, icon: Icon, className, children }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start gap-3 space-y-0 border-b border-border px-5 py-4">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bleu-subtle">
            <Icon aria-hidden className="h-4 w-4 text-bleu" />
          </span>
        )}
        <div className="flex flex-col gap-0.5">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function AbsencesTable({ absences, loading }) {
  if (loading) return <TableSkeleton rows={4} columns={5} />

  if (absences.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Aucune absence récente"
        description="Aucune absence n'a été enregistrée pour le moment."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employé</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Date d'absence</TableHead>
          <TableHead>Nature</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {absences.map((absence) => (
          <TableRow key={absence._id}>
            <TableCell>
              <EmployeeCell personnel={absence.personnel} />
            </TableCell>
            <TableCell>
              <StatusBadge kind="absence" value={absence.motif} />
            </TableCell>
            <TableCell className="tabular-nums">{formatDate(absence.date)}</TableCell>
            <TableCell>
              {isSignaled48h(absence) ? (
                <Badge className="border-destructive-border bg-destructive-subtle text-destructive-text">
                  Plus de 48 h
                </Badge>
              ) : isAutorisee(absence.motif) ? (
                <span className="text-[13.5px] text-muted-foreground">Autorisée</span>
              ) : (
                <span className="text-[13.5px] text-destructive-text">Non autorisée</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <ViewButton href={`/absence/details/${absence._id}`} label="Voir l'absence" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Absences non autorisées de plus de 48 h, en attente d'un avis de reprise.
function Absences48HTable({ absences, loading }) {
  if (loading) return <TableSkeleton rows={3} columns={3} />

  if (absences.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Aucune absence à signaler"
        description="Aucune absence non autorisée ne dépasse 48 heures."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employé</TableHead>
          <TableHead>Date d'absence</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {absences.map((absence) => (
          <TableRow key={absence._id}>
            <TableCell>
              <EmployeeCell personnel={absence.personnel} />
            </TableCell>
            <TableCell className="tabular-nums">{formatDate(absence.date)}</TableCell>
            <TableCell className="text-right">
              <ViewButton href={`/absence/details/${absence._id}`} label="Voir l'absence" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

const LIBELLES_RETOUR = {
  conge: { libelle: "Congé", voir: "Voir le congé" },
  absence: { libelle: "Absence", voir: "Voir l'absence" },
  affectation: { libelle: "Affectation temporaire", voir: "Voir les affectations temporaires" },
}

function MotifRetour({ retour }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13.5px] font-medium text-foreground">{LIBELLES_RETOUR[retour.type].libelle}</span>
      {retour.type === "conge" && <StatusBadge kind="conge" value={retour.valeur} />}
      {retour.type === "absence" && <StatusBadge kind="absence" value={retour.valeur} />}
    </div>
  )
}

function RetoursTable({ retours, loading }) {
  if (loading) return <TableSkeleton rows={3} columns={6} />

  if (retours.length === 0) {
    return (
      <EmptyState
        icon={LogIn}
        title="Aucun retour prévu"
        description="Aucun agent n'est attendu en reprise dans les 3 prochains jours."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employé</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Station</TableHead>
          <TableHead>Depuis</TableHead>
          <TableHead>Retour</TableHead>
          <TableHead>Jours restants</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {retours.map((retour) => (
          <TableRow key={retour.cle}>
            <TableCell>
              <EmployeeCell personnel={retour.personnel} />
            </TableCell>
            <TableCell>
              <MotifRetour retour={retour} />
            </TableCell>
            <TableCell>{retour.station || "—"}</TableCell>
            <TableCell className="tabular-nums">{formatDate(retour.depuis)}</TableCell>
            <TableCell className="tabular-nums">
              {formatDate(retour.retour)}
              {retour.estime && <div className="text-xs text-muted-foreground">Estimé (durée de l'absence)</div>}
            </TableCell>
            <TableCell>
              <DaysLeftBadge days={retour.jours} />
            </TableCell>
            <TableCell className="text-right">
              <ViewButton href={retour.href} label={LIBELLES_RETOUR[retour.type].voir} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function StatusChart({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center justify-between">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
        <Skeleton className="h-2 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-2.5">
          <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-[4px]" style={{ backgroundColor: item.color }} />
          <span className="flex-1 text-[13.5px] font-medium text-ink-800">{item.name}</span>
          <span className="text-[13.5px] font-semibold tabular-nums text-foreground">{item.value} %</span>
        </div>
      ))}
      <div className="!mt-5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
        {data.map((item) => (
          <div key={item.name} className="h-full" style={{ backgroundColor: item.color, width: `${item.value}%` }} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState({})
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [absences, setAbsences] = useState([])
  const [absences48h, setAbsences48h] = useState([])
  const [retours, setRetours] = useState([])
  const [loadingAbsences, setLoadingAbsences] = useState(true)

  // Statistics state
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    totalAffectationTemp: 0,
    totalConges: 0,
    totalAbsences: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // Les affectations ne concernent pas le chef de station (voir lib/acces.js).
  const connecte = useCurrentUser()
  const afficherAffectations = connecte !== undefined && !sectionRetiree(connecte?.role, "/affectation")
  const retoursVisibles = afficherAffectations ? retours : retours.filter((r) => r.type !== "affectation")

  // Status chart state
  const [statusData, setStatusData] = useState([
    { name: "Actif", value: 0, color: STATUS_COLORS.actif },
    { name: "En congé", value: 0, color: STATUS_COLORS.conge },
    { name: "Absent", value: 0, color: STATUS_COLORS.absent },
  ])
  const [loadingStatusChart, setLoadingStatusChart] = useState(true)

  /*useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
        })

        if (!res.ok) {
          throw new Error("Not authenticated")
        }

        const data = await res.json()
        console.log("data", data)
        setUser(data.user)
      } catch (err) {
        console.warn("User not logged in or error:", err.message)
        setUser(null)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])*/

  // Fetch statistics data
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      try {
        setLoadingStats(true)

        // Fetch all data in parallel
        const [personnelRes, affectationRes, congeRes, absenceRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences`, { credentials: "include" }),
        ])

        const newStats = {
          totalPersonnel: 0,
          totalAffectationTemp: 0,
          totalConges: 0,
          totalAbsences: 0,
        }

        if (personnelRes.ok) {
          const personnelData = await personnelRes.json()
          newStats.totalPersonnel = personnelData.length || 0
        }

        if (affectationRes.ok) {
          const affectationData = await affectationRes.json()
          newStats.totalAffectationTemp = affectationData.length || 0
        }

        if (congeRes.ok) {
          const congeData = await congeRes.json()
          newStats.totalConges = congeData.length || 0
        }

        if (absenceRes.ok) {
          const absenceData = await absenceRes.json()
          newStats.totalAbsences = absenceData.length || 0
        }

        setStats(newStats)
      } catch (err) {
        console.error("Error fetching statistics:", err)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [user])

  // Absences récentes, absences de plus de 48 h et retours à prévoir
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoadingAbsences(true)

        const [absenceRes, absence48hRes, congeRes, affectationRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/non-autorisees-48h`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp`, { credentials: "include" }),
        ])

        const absenceData = absenceRes.ok ? await absenceRes.json() : []
        const congeData = congeRes.ok ? await congeRes.json() : []
        const affectationData = affectationRes.ok ? await affectationRes.json() : []

        // La liste est déjà triée par date décroissante côté API.
        setAbsences(absenceData.slice(0, 6))

        if (absence48hRes.ok) {
          const result = await absence48hRes.json()
          setAbsences48h(result.data || [])
        }

        setRetours(
          construireRetours({
            conges: Array.isArray(congeData) ? congeData : [],
            absences: Array.isArray(absenceData) ? absenceData : [],
            affectations: Array.isArray(affectationData) ? affectationData : [],
          })
        )
      } catch (err) {
        console.error("Error fetching data:", err)
      } finally {
        setLoadingAbsences(false)
         setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Fetch status chart data
  useEffect(() => {
    const fetchStatusData = async () => {
      if (!user) return

      try {
        setLoadingStatusChart(true)

        // Fetch all data needed for status calculation
        const [personnelRes, congeRes, absenceRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences`, { credentials: "include" }),
        ])

        let totalPersonnel = 0
        let activeConges = 0
        let activeAbsences = 0

        if (personnelRes.ok) {
          const personnelData = await personnelRes.json()
          totalPersonnel = personnelData.length || 0
        }

        if (congeRes.ok) {
          const congeData = await congeRes.json()
          // Count active conges (current date is between dateDebut and dateRetour)
          const today = new Date()
          activeConges = congeData.filter((conge) => {
            const startDate = new Date(conge.dateDebut)
            const endDate = new Date(conge.dateRetour)
            return today >= startDate && today <= endDate
          }).length
        }

        if (absenceRes.ok) {
          const absenceData = await absenceRes.json()

          // Une absence ne porte qu'une date : est "en cours" celle du jour.
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          activeAbsences = absenceData.filter((absence) => {
            const date = new Date(absence.date)
            date.setHours(0, 0, 0, 0)
            return date.getTime() === today.getTime()
          }).length
        }

        // Calculate percentages
        if (totalPersonnel > 0) {
          const activePersonnel = totalPersonnel - activeConges - activeAbsences
          const activePercentage = Math.round((activePersonnel / totalPersonnel) * 100)
          const congePercentage = Math.round((activeConges / totalPersonnel) * 100)
          const absentPercentage = Math.round((activeAbsences / totalPersonnel) * 100)

          setStatusData([
            { name: "Actif", value: activePercentage, color: STATUS_COLORS.actif },
            { name: "En congé", value: congePercentage, color: STATUS_COLORS.conge },
            { name: "Absent", value: absentPercentage, color: STATUS_COLORS.absent },
          ])
        }
      } catch (err) {
        console.error("Error fetching status data:", err)
      } finally {
        setLoadingStatusChart(false)
      }
    }

    fetchStatusData()
  }, [user])

  useEffect(() => {
    const token = localStorage.getItem("token")
    console.log("token", token)
    if (!token) {
      //router.push("/login");
    }
  }, [router, user])

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
        <p className="text-[13.5px] text-muted-foreground">
          Ce qui demande votre attention aujourd'hui : avis d'absence ouverts et retours à prévoir.
        </p>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${afficherAffectations ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        <KpiCard label="Total personnel" value={stats.totalPersonnel} icon={Users} loading={loadingStats} />
        {afficherAffectations && (
          <KpiCard
            label="Affectations temporaires"
            value={stats.totalAffectationTemp}
            icon={ArrowLeftRight}
            loading={loadingStats}
          />
        )}
        <KpiCard label="Congés" value={stats.totalConges} icon={Plane} loading={loadingStats} />
        <KpiCard label="Absences" value={stats.totalAbsences} icon={CalendarClock} loading={loadingStats} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          icon={BellRing}
          title="Absences récentes"
          description="Absences autorisées et non autorisées, les plus récentes en premier."
        >
          <AbsencesTable absences={absences} loading={loadingAbsences} />
        </SectionCard>

        <SectionCard title="Répartition des statuts" description="Part de l'effectif aujourd'hui.">
          <div className="p-5">
            <StatusChart data={statusData} loading={loadingStatusChart} />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        icon={CalendarClock}
        title="Absences non autorisées de plus de 48 h"
        description="En attente d'un avis de reprise."
      >
        <Absences48HTable absences={absences48h} loading={loadingAbsences} />
      </SectionCard>

      <SectionCard
        icon={LogIn}
        title="Retours dans les 3 prochains jours"
        description={
          afficherAffectations
            ? "Agents attendus en reprise : fin de congé, retour estimé d'une absence ou fin d'affectation temporaire."
            : "Agents attendus en reprise : fin de congé ou retour estimé d'une absence."
        }
      >
        <RetoursTable retours={retoursVisibles} loading={loadingAbsences} />
      </SectionCard>
    </div>
  )
}
