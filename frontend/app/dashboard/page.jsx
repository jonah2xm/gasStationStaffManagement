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
import {
  ArrowLeftRight,
  BellRing,
  CalendarCheck,
  CalendarClock,
  Eye,
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

// Whole days from today until the given date; zero or negative once it has passed.
const daysUntil = (dateString) => Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24))

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
    <Button asChild variant="ghost" size="icon" className="h-[30px] w-[30px]">
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
        <Icon aria-hidden className="h-4 w-4 text-ink-600" strokeWidth={1.9} />
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
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
            <Icon aria-hidden className="h-4 w-4 text-ink-750" />
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

function AbsencesAITable({ absences, loading }) {
  if (loading) return <TableSkeleton rows={4} columns={5} />

  if (absences.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Aucun avis d'absence à suivre"
        description="Aucune absence non autorisée n'est ouverte pour le moment."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employé</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Début</TableHead>
          <TableHead>Fin</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {absences.map((absence) => {
          const days = absence.endDate ? daysUntil(absence.endDate) : null
          return (
            <TableRow key={absence._id}>
              <TableCell>
                <EmployeeCell personnel={absence.personnel} />
              </TableCell>
              <TableCell>
                <StatusBadge kind="absenceAI" value={absence.operationType} />
              </TableCell>
              <TableCell className="tabular-nums">{formatDate(absence.startDate)}</TableCell>
              <TableCell className="tabular-nums">
                {absence.endDate ? formatDate(absence.endDate) : <span className="text-muted-foreground">Non définie</span>}
              </TableCell>
              <TableCell>
                {days === null ? (
                  <StatusBadge kind="period" value="en cours" />
                ) : days > 0 ? (
                  <DaysLeftBadge days={days} />
                ) : (
                  <StatusBadge kind="period" value="termine" />
                )}
              </TableCell>
              <TableCell className="text-right">
                <ViewButton href={`/absence/ai/${absence._id}`} label="Voir l'avis" />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function AbsencesAATable({ absences, loading }) {
  if (loading) return <TableSkeleton rows={3} columns={5} />

  if (absences.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Aucun retour d'absence prévu"
        description="Aucune absence autorisée ne se termine dans les 3 prochains jours."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employé</TableHead>
          <TableHead>Motif</TableHead>
          <TableHead>Début</TableHead>
          <TableHead>Fin</TableHead>
          <TableHead>Jours restants</TableHead>
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
              <StatusBadge kind="absenceAA" value={absence.absenceType} />
            </TableCell>
            <TableCell className="tabular-nums">{formatDate(absence.startDate)}</TableCell>
            <TableCell className="tabular-nums">{formatDate(absence.endDate)}</TableCell>
            <TableCell>
              <DaysLeftBadge days={daysUntil(absence.endDate)} />
            </TableCell>
            <TableCell className="text-right">
              <ViewButton href={`/absence/aa/details/${absence._id}`} label="Voir l'absence" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function CongeTable({ conges, loading }) {
  if (loading) return <TableSkeleton rows={3} columns={6} />

  if (conges.length === 0) {
    return (
      <EmptyState
        icon={Plane}
        title="Aucun retour de congé prévu"
        description="Aucun agent n'est attendu en reprise dans les 3 prochains jours."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employé</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Station</TableHead>
          <TableHead>Début</TableHead>
          <TableHead>Retour</TableHead>
          <TableHead className="text-right">Durée</TableHead>
          <TableHead>Jours restants</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conges.map((conge) => (
          <TableRow key={conge._id}>
            <TableCell>
              <EmployeeCell personnel={conge.personnel} />
            </TableCell>
            <TableCell>
              <StatusBadge kind="conge" value={conge.typeConge} />
            </TableCell>
            <TableCell className="tabular-nums">{conge.stationName}</TableCell>
            <TableCell className="tabular-nums">{formatDate(conge.dateDebut)}</TableCell>
            <TableCell className="tabular-nums">{formatDate(conge.dateRetour)}</TableCell>
            <TableCell className="text-right tabular-nums">{conge.dureeConge} j</TableCell>
            <TableCell>
              <DaysLeftBadge days={daysUntil(conge.dateRetour)} />
            </TableCell>
            <TableCell className="text-right">
              <ViewButton href={`/conges/details/${conge._id}`} label="Voir le congé" />
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
  const [absencesAI, setAbsencesAI] = useState([])
  const [absencesAA, setAbsencesAA] = useState([])
  const [conges, setConges] = useState([])
  const [loadingAbsences, setLoadingAbsences] = useState(true)

  // Statistics state
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    totalAffectationTemp: 0,
    totalConges: 0,
    totalAbsencesAA: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

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
        const [personnelRes, affectationRes, congeRes, absenceAARes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA`, { credentials: "include" }),
        ])

        const newStats = {
          totalPersonnel: 0,
          totalAffectationTemp: 0,
          totalConges: 0,
          totalAbsencesAA: 0,
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

        if (absenceAARes.ok) {
          const absenceAAData = await absenceAARes.json()
          newStats.totalAbsencesAA = absenceAAData.length || 0
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

  // Fetch absences and conges data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoadingAbsences(true)

        // Fetch Absence AI data
        const aiRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI/getAI-only`, {
          credentials: "include",
        })

        // Fetch Absence AA data
        const aaRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA`, {
          credentials: "include",
        })

        // Fetch Conges data
        const congeRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`, {
          credentials: "include",
        })

        if (aiRes.ok) {
          const result = await aiRes.json()
          const aiData=result.data
          // Filter AI absences: show avisAbsence OR those with endDate
          const filteredAI = aiData.filter((absence) => {
            return absence.operationType === "avisAbsence" || absence.endDate
          })
          setAbsencesAI(filteredAI)
        }

        if (aaRes.ok) {
          const aaData = await aaRes.json()
          // Filter AA absences that have less than 3 days to return
          const filteredAA = aaData.filter((absence) => {
            const today = new Date()
            const endDate = new Date(absence.endDate)
            const diffTime = endDate - today
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays > 0 && diffDays <= 3
          })
          setAbsencesAA(filteredAA)
        }

        if (congeRes.ok) {
          const congeData = await congeRes.json()
          // Filter conges that have less than 3 days to return
          const filteredConges = congeData.filter((conge) => {
            const today = new Date()
            const returnDate = new Date(conge.dateRetour)
            const diffTime = returnDate - today
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            return diffDays > 0 && diffDays <= 3
          })
          setConges(filteredConges)
        }
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
        const [personnelRes, congeRes, absenceAARes, absenceAIRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA`, { credentials: "include" }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI`, { credentials: "include" }),
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

        if (absenceAARes.ok && absenceAIRes.ok) {
          const [aaData, aiData] = await Promise.all([absenceAARes.json(), absenceAIRes.json()])

          // Count active AA absences
          const today = new Date()
          const activeAA = aaData.filter((absence) => {
            const startDate = new Date(absence.startDate)
            const endDate = new Date(absence.endDate)
            return today >= startDate && today <= endDate
          }).length

          // Count active AI absences (avisAbsence without avisReprise)
          const activeAI = aiData.filter((absence) => {
            return absence.operationType === "avisAbsence" && !absence.endDate
          }).length

          activeAbsences = activeAA + activeAI
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total personnel" value={stats.totalPersonnel} icon={Users} loading={loadingStats} />
        <KpiCard
          label="Affectations temporaires"
          value={stats.totalAffectationTemp}
          icon={ArrowLeftRight}
          loading={loadingStats}
        />
        <KpiCard label="Congés" value={stats.totalConges} icon={Plane} loading={loadingStats} />
        <KpiCard label="Absences autorisées" value={stats.totalAbsencesAA} icon={CalendarClock} loading={loadingStats} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          icon={BellRing}
          title="Avis d'absence AI"
          description="Absences non autorisées ouvertes et reprises récentes."
        >
          <AbsencesAITable absences={absencesAI} loading={loadingAbsences} />
        </SectionCard>

        <SectionCard title="Répartition des statuts" description="Part de l'effectif aujourd'hui.">
          <div className="p-5">
            <StatusChart data={statusData} loading={loadingStatusChart} />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        icon={CalendarClock}
        title="Absences AA — retour dans 3 jours"
        description="Absences autorisées qui se terminent bientôt."
      >
        <AbsencesAATable absences={absencesAA} loading={loadingAbsences} />
      </SectionCard>

      <SectionCard
        icon={Plane}
        title="Congés — retour dans 3 jours"
        description="Agents attendus en reprise dans les 3 prochains jours."
      >
        <CongeTable conges={conges} loading={loadingAbsences} />
      </SectionCard>
    </div>
  )
}
