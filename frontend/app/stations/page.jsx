"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  CaseUpper as GasPump,
  Users,
  Wallet,
  Building2,
  Search,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Building,
  UserCheck,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useRouter } from "next/navigation"
import toast, { Toaster } from "react-hot-toast"

const getInitials = (name) => {
  if (!name) return "??"
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "actif":
      return "bg-green-100 text-green-800 border-green-200"
    case "on leave":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "en congé":
      return "bg-orange-100 text-orange-800 border-orange-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getStationTypeColor = (type) => {
  switch (type?.toLowerCase()) {
    case "rurale":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "autoroute":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "urbaine":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function StationDashboard() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalStations: 0,
    totalPersonnel: 0,
    avgPersonnelPerStation: 0,
    stationsWithChief: 0,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [stationToDelete, setStationToDelete] = useState(null)
  const [deletingStation, setDeletingStation] = useState(false)

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations`, {
        method: "GET",
        credentials: "include",
      })

      if (response.status === 401) {
        toast.error("Session expired. Redirecting to login...")
        router.push("/login")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch stations")
      }

      const data = await response.json()
      console.log("data", data)
      setStations(data)
      calculateStats(data)
      setError(null)
    } catch (error) {
      console.error("Error fetching stations:", error)
      setError("Failed to load stations. Please try again later.")
      toast.error("Failed to load stations")
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (stationData) => {
    const totalStations = stationData.length
    const totalPersonnel = stationData.reduce((total, station) => {
      return total + (station.personnels?.length || 0)
    }, 0)
    console.log("total personnel", totalPersonnel)
    const avgPersonnelPerStation = totalStations > 0 ? (totalPersonnel / totalStations).toFixed(1) : 0
    const stationsWithChief = stationData.filter((station) => {
      return station.personnel?.some((employee) => employee.poste?.includes("CHEF"))
    }).length

    setStats({
      totalStations,
      totalPersonnel,
      avgPersonnelPerStation,
      stationsWithChief,
    })
  }

  const filteredStations = stations.filter(
    (station) =>
      station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.personnel?.some(
        (employee) =>
          employee.p_nomp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.poste?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  )

  const handleEditStation = (station) => {
    router.push(`/stations/edit-station/${station._id}`)
  }

  const handleDeleteClick = (station) => {
    setStationToDelete(station)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!stationToDelete) return

    setDeletingStation(true)
    try {
      const response = await fetch(`http://localhost:5000/api/stations/${stationToDelete._id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete station")
      }

      toast.success("Station supprimée avec succès", {
        duration: 3000,
        position: "bottom-left",
      })

      // Remove from local state
      setStations((prev) => prev.filter((s) => s._id !== stationToDelete._id))
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Error deleting station:", error)
      toast.error("Erreur lors de la suppression de la station")
    } finally {
      setDeletingStation(false)
    }
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Tableau de Bord des Stations</h1>
        <div className="flex items-center space-x-4">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Rechercher stations ou personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full bg-white border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <Link href="/stations/add-station">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> Ajouter Station
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Chargement des stations...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-lg mb-4">{error}</p>
          <Button variant="outline" onClick={fetchStations} className="flex items-center bg-transparent">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              {
                title: "Total des Stations",
                value: stats.totalStations,
                icon: Building2,
                color: "blue",
              },
              {
                title: "Total du Personnel",
                value: stats.totalPersonnel,
                icon: Users,
                color: "green",
              },
              {
                title: "Moy. Personnel par Station",
                value: stats.avgPersonnelPerStation,
                icon: Wallet,
                color: "yellow",
              },
              {
                title: "Stations avec Chef",
                value: stats.stationsWithChief,
                icon: GasPump,
                color: "red",
              },
            ].map((item, index) => (
              <Card key={index} className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{item.title}</CardTitle>
                  <item.icon className={`h-5 w-5 text-${item.color}-500`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">{item.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune station trouvée</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? "Aucune station ne correspond à votre recherche. Essayez d'autres termes."
                  : "Aucune station n'a été ajoutée. Commencez par ajouter une nouvelle station."}
              </p>
              <Link href="/stations/add-station">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une Station
                </Button>
              </Link>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-6">
              {filteredStations.map((station) => (
                <AccordionItem
                  key={station._id}
                  value={station._id}
                  className="bg-white rounded-xl shadow-lg border-0 overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center space-x-4">
                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-lg shadow-md"
                          style={{ backgroundColor: "rgb(59, 130, 246)" }}
                        >
                          <Building className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl font-bold text-gray-800">{station.name}</span>
                            <Badge className="bg-blue-100 text-blue-800 border border-blue-200 font-medium">
                              {station.code}
                            </Badge>
                            <Badge className={`font-medium ${getStationTypeColor(station.type)}`}>{station.type}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {station.city}, {station.state}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{station.personnels?.length || 0} employés</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-blue-100 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditStation(station)
                          }}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-red-100 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(station)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 py-6 bg-gray-50">
                    {/* Station Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                              <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Adresse</h4>
                              <p className="text-sm font-semibold text-gray-800">{station.address}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                              <Building2 className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Type de Station</h4>
                              <p className="text-sm font-semibold text-gray-800">{station.type}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Personnel</h4>
                              <p className="text-sm font-semibold text-gray-800">
                                {station.personnels?.length || 0} employés
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {station.notes && (
                      <Card className="border-0 shadow-sm bg-white mb-6">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                              <p className="text-sm text-gray-700">{station.notes}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Separator className="my-6" />

                    {/* Personnel Section */}
                    <div className="bg-white rounded-lg shadow-sm border-0 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                          <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                          Personnel de la Station
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          onClick={() => {
                            router.push("/personnel/add-personnel")
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Ajouter Personnel
                        </Button>
                      </div>

                      {station.personnels?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-50">
                                <TableHead className="w-[60px]">Avatar</TableHead>
                                <TableHead className="font-semibold">Nom Complet</TableHead>
                                <TableHead className="font-semibold">Poste</TableHead>
                                <TableHead className="font-semibold">Statut</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {station.personnels.map((employee) => (
                                <TableRow
                                  key={employee._id || employee.matricule}
                                  className="hover:bg-blue-50 transition-colors duration-150"
                                >
                                  <TableCell>
                                    <Avatar className="h-10 w-10 border-2 border-gray-200">
                                      <AvatarFallback
                                        className="text-white font-semibold"
                                        style={{ backgroundColor: "rgb(59, 130, 246)" }}
                                      >
                                        {getInitials(`${employee.firstName} ${employee.lastName}`)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-semibold text-gray-800">
                                        {employee.lastName} {employee.firstName}
                                      </div>
                                      <div className="text-xs text-gray-500">ID: {employee.matricule}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                                      {employee.poste}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${getStatusColor(employee.status)} font-medium border`}>
                                      {employee.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                          <span className="sr-only">Open menu</span>
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="cursor-pointer">
                                          <Link
                                            href={`/personnel/edit-personnel/${employee._id}`}
                                            className="flex items-center w-full"
                                          >
                                            <Edit className="mr-2 h-4 w-4" />
                                            Modifier employé
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="cursor-pointer">
                                          <Link
                                            href={`/personnel/details/${employee._id}`}
                                            className="flex items-center w-full"
                                          >
                                            <UserCheck className="mr-2 h-4 w-4" />
                                            Voir détails
                                          </Link>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-dashed border-gray-300">
                          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h4 className="text-lg font-semibold text-gray-600 mb-2">Aucun personnel assigné</h4>
                          <p className="text-gray-500 mb-4">Cette station n'a pas encore d'employés assignés.</p>
                          <Button
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              router.push("/personnel/add-personnel")
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter le Premier Employé
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la station "
              <span className="font-semibold">{stationToDelete?.name}</span>" ? Cette action ne peut pas être annulée et
              supprimera également toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingStation}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletingStation}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingStation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-left" />
    </div>
  )
}
