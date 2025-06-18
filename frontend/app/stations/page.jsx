"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FuelIcon as GasPump,
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AccountHeader } from "../components/account-header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const getInitials = (name) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "actif":
      return "bg-green-100 text-green-800";
    case "on leave":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function StationDashboard() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStations: 0,
    totalPersonnel: 0,
    avgPersonnelPerStation: 0,
    stationsWithChief: 0,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [deletingStation, setDeletingStation] = useState(false);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (response.status === 401) {
        toast.error("Session expired. Redirecting to login...");
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch stations");
      }

      const data = await response.json();
      console.log("data", data);
      setStations(data);
      calculateStats(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching stations:", error);
      setError("Failed to load stations. Please try again later.");
      toast.error("Failed to load stations");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (stationData) => {
    const totalStations = stationData.length;
    const totalPersonnel = stationData.reduce((total, station) => {
      return total + (station.personnel?.length || 0);
    }, 0);
    const avgPersonnelPerStation =
      totalStations > 0 ? (totalPersonnel / totalStations).toFixed(1) : 0;
    const stationsWithChief = stationData.filter((station) => {
      return station.personnel?.some((employee) =>
        employee.poste?.includes("CHEF")
      );
    }).length;

    setStats({
      totalStations,
      totalPersonnel,
      avgPersonnelPerStation,
      stationsWithChief,
    });
  };

  const filteredStations = stations.filter(
    (station) =>
      station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.personnel?.some(
        (employee) =>
          employee.p_nomp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.poste?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleEditStation = (station) => {
    router.push(`/stations/edit-station/${station._id}`);
  };

  const handleDeleteClick = (station) => {
    setStationToDelete(station);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!stationToDelete) return;

    setDeletingStation(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/stations/${stationToDelete._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete station");
      }

      toast.success("Station supprimée avec succès", {
        duration: 3000,
        position: "bottom-left",
      });

      // Remove from local state
      setStations((prev) => prev.filter((s) => s._id !== stationToDelete._id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting station:", error);
      toast.error("Erreur lors de la suppression de la station");
    } finally {
      setDeletingStation(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name="John Doe"
        role="HR Manager"
        avatarUrl="/placeholder.svg?height=40&width=40"
      />
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Tableau de Bord des Stations
        </h1>
        <div className="flex items-center space-x-4">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Rechercher stations ou personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
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
          <Button
            variant="outline"
            onClick={fetchStations}
            className="flex items-center"
          >
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
              <Card
                key={index}
                className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {item.title}
                  </CardTitle>
                  <item.icon className={`h-5 w-5 text-${item.color}-500`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800">
                    {item.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStations.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Aucune station trouvée
              </h3>
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
            <Accordion type="multiple" className="space-y-4">
              {filteredStations.map((station) => (
                <AccordionItem
                  key={station._id}
                  value={station._id}
                  className="bg-white rounded-lg shadow-md"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center">
                        <span className="text-xl font-semibold text-gray-800 mr-3">
                          {station.name}
                        </span>
                        <Badge className="bg-blue-100 text-blue-800">
                          {station.code}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {station.personnel?.length || 0} personnel
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStation(station);
                            }}
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(station);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Adresse
                        </h3>
                        <p className="text-gray-800">{station.address}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Ville
                        </h3>
                        <p className="text-gray-800">
                          {station.city}, {station.state}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">
                          Type
                        </h3>
                        <p className="text-gray-800">{station.type}</p>
                      </div>
                      {station.notes && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">
                            Notes
                          </h3>
                          <p className="text-gray-800">{station.notes}</p>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-4">
                      Personnel
                    </h3>
                    {station.personnels?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">Avatar</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead>Poste</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {station.personnels.map((employee) => (
                              <TableRow
                                key={employee._id || employee.matricule}
                                className="hover:bg-gray-50"
                              >
                                <TableCell>
                                  <Avatar>
                                    <AvatarFallback>
                                      {getInitials(employee.lastName)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {employee.lastName} {employee.firstName}
                                </TableCell>
                                <TableCell>{employee.poste}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={`${getStatusColor(
                                      employee.status
                                    )} font-semibold`}
                                  >
                                    {employee.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="text-gray-800"
                                    >
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
                                      <DropdownMenuItem>
                                        Voir détails
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        Modifier employé
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-red-600">
                                        Supprimer employé
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
                      <div className="text-center py-6 bg-gray-50 rounded-md">
                        <p className="text-gray-500">
                          Aucun personnel assigné à cette station
                        </p>
                        <Button variant="outline" className="mt-2">
                          <Plus className="mr-2 h-4 w-4" /> Ajouter Personnel
                        </Button>
                      </div>
                    )}
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la station "
              {stationToDelete?.name}" ? Cette action ne peut pas être annulée
              et supprimera également toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingStation}>
              Annuler
            </AlertDialogCancel>
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
  );
}
