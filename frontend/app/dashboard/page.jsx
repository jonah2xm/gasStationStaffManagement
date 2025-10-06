"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AccountHeader } from "@/components/account-header"
import {
  Users,
  Briefcase,
  Calendar,
  Activity,
  Eye,
  User,
  CalendarDays,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plane,
} from "lucide-react"

// Components for the tables
function AbsencesAITable({ absences, loading }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return "En cours"
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? `${diffDays} jour(s)` : "Terminé"
  }

  const getOperationTypeBadge = (type) => {
    const types = {
      avisAbsence: { label: "Avis Absence", color: "bg-orange-100 text-orange-800" },
      avisReprise: { label: "Avis Reprise", color: "bg-green-100 text-green-800" },
    }

    const typeInfo = types[type] || { label: type, color: "bg-gray-100 text-gray-800" }
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (absences.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>Aucune absence AI trouvée</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employé</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date début</TableHead>
            <TableHead>Date fin</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence._id} className="hover:bg-gray-50">
              <TableCell>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      {absence.personnel?.firstName} {absence.personnel?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{absence.personnel?.matricule}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{getOperationTypeBadge(absence.operationType)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(absence.startDate)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(absence.endDate)}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={absence.endDate ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                  {calculateDaysRemaining(absence.endDate)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function AbsencesAATable({ absences, loading }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const calculateDaysRemaining = (endDate) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getAbsenceTypeBadge = (type) => {
    const types = {
      maladie: { label: "Maladie", color: "bg-red-100 text-red-800" },
      decés: { label: "Décès", color: "bg-gray-100 text-gray-800" },
      marriage: { label: "Mariage", color: "bg-pink-100 text-pink-800" },
      naissance: { label: "Naissance", color: "bg-blue-100 text-blue-800" },
      examen: { label: "Examen", color: "bg-green-100 text-green-800" },
      autre: { label: "Autre", color: "bg-yellow-100 text-yellow-800" },
    }

    const typeInfo = types[type] || { label: type, color: "bg-gray-100 text-gray-800" }
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (absences.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>Aucune absence AA proche du retour</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Employé</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[130px]">Date début</TableHead>
            <TableHead className="w-[130px]">Date fin</TableHead>
            <TableHead className="w-[120px]">Jours restants</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence._id} className="hover:bg-gray-50">
              <TableCell className="py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {absence.personnel?.firstName} {absence.personnel?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{absence.personnel?.matricule}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">{getAbsenceTypeBadge(absence.absenceType)}</TableCell>
              <TableCell className="py-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{formatDate(absence.startDate)}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{formatDate(absence.endDate)}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                  {calculateDaysRemaining(absence.endDate)} jour(s)
                </Badge>
              </TableCell>
              <TableCell className="py-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function CongeTable({ conges, loading }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const calculateDaysRemaining = (dateRetour) => {
    const today = new Date()
    const returnDate = new Date(dateRetour)
    const diffTime = returnDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getCongeTypeBadge = (type) => {
    const types = {
      ordinaire: { label: "Ordinaire", color: "bg-blue-100 text-blue-800" },
      anticipe: { label: "Anticipé", color: "bg-orange-100 text-orange-800" },
    }

    const typeInfo = types[type] || { label: type, color: "bg-gray-100 text-gray-800" }
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (conges.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
        <p>Aucun congé proche du retour</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Employé</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            <TableHead className="w-[150px]">Station</TableHead>
            <TableHead className="w-[130px]">Date début</TableHead>
            <TableHead className="w-[130px]">Date retour</TableHead>
            <TableHead className="w-[100px]">Durée</TableHead>
            <TableHead className="w-[120px]">Jours restants</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conges.map((conge) => (
            <TableRow key={conge._id} className="hover:bg-gray-50">
              <TableCell className="py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {conge.personnel?.firstName} {conge.personnel?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{conge.personnel?.matricule}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">{getCongeTypeBadge(conge.typeConge)}</TableCell>
              <TableCell className="py-4">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">{conge.stationName}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{formatDate(conge.dateDebut)}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{formatDate(conge.dateRetour)}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <Badge className="bg-gray-100 text-gray-800 px-3 py-1">
                  {conge.dureeConge} jour{conge.dureeConge > 1 ? "s" : ""}
                </Badge>
              </TableCell>
              <TableCell className="py-4">
                <Badge className="bg-green-100 text-green-800 px-3 py-1">
                  {calculateDaysRemaining(conge.dateRetour)} jour(s)
                </Badge>
              </TableCell>
              <TableCell className="py-4">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Status Chart Component
function StatusChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm font-medium text-gray-700">{item.name}</span>
          </div>
          <span className="text-sm font-bold text-gray-800">{item.value}%</span>
        </div>
      ))}
      <div className="mt-4 pt-4 border-t">
        <div className="flex space-x-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          {data.map((item, index) => (
            <div
              key={index}
              className="h-full"
              style={{
                backgroundColor: item.color,
                width: `${item.value}%`,
              }}
            />
          ))}
        </div>
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
    { name: "Actif", value: 0, color: "#10B981" },
    { name: "En congé", value: 0, color: "#F59E0B" },
    { name: "Absent", value: 0, color: "#EF4444" },
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
            { name: "Actif", value: activePercentage, color: "#10B981" },
            { name: "En congé", value: congePercentage, color: "#F59E0B" },
            { name: "Absent", value: absentPercentage, color: "#EF4444" },
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 text-gray-800">

      <h1 className="text-3xl font-bold mb-6 text-gray-800">Personnel Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Personnel</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.totalPersonnel.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Affectation Temporaire</CardTitle>
            <Briefcase className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {loadingStats ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                stats.totalAffectationTemp.toLocaleString()
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conges</CardTitle>
            <Calendar className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.totalConges.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Absences Autorisé</CardTitle>
            <Activity className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">
              {loadingStats ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.totalAbsencesAA.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-6">
        {/* Absence AI Table */}
        <Card className="lg:col-span-2 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
              Avis Absence AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AbsencesAITable absences={absencesAI} loading={loadingAbsences} />
          </CardContent>
        </Card>

        {/* Status Chart */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart data={statusData} loading={loadingStatusChart} />
          </CardContent>
        </Card>
      </div>

      {/* Absence AA Table - Full Width */}
      <div className="grid gap-6 md:grid-cols-1 mb-6">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-500" />
              Absence AA - Retour dans 3 jours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <AbsencesAATable absences={absencesAA} loading={loadingAbsences} />
          </CardContent>
        </Card>
      </div>

      {/* Conge Table - Full Width */}
      <div className="grid gap-6 md:grid-cols-1 mb-6">
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center">
              <Plane className="mr-2 h-5 w-5 text-green-500" />
              Congé - Retour dans 3 jours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <CongeTable conges={conges} loading={loadingAbsences} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
