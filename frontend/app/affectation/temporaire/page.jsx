"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Filter,
  SlidersHorizontal,
  ArrowRightLeft,
  Building,
  MapPin,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountHeader } from "@/components/account-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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

// Status types
const statusTypes = {
  active: {
    label: "En cours",
    color: "bg-green-100 text-green-800",
  },
  upcoming: {
    label: "À venir",
    color: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Terminée",
    color: "bg-gray-100 text-gray-800",
  },
};

export default function AffectationTemporairePage() {
  const router = useRouter();
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState([]);
  const [stationFilter, setStationFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "desc",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [affectationToDelete, setAffectationToDelete] = useState(null);
  const [deletingAffectation, setDeletingAffectation] = useState(false);
  const [stations, setStations] = useState([]);

  const itemsPerPage = 5;

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    const fetchAffectations = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();
        console.log("Fetched absences:", data);
        setAffectations(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAffectations();
  }, []);

  // Format date to French date string
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "Invalid Date") return "Non défini";
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", options);
  };

  const handleDeleteClick = (affectation) => {
    setAffectationToDelete(affectation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!affectationToDelete) return;

    setDeletingAffectation(true);
    try {
      // In a real application, you would call your API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp/${affectationToDelete._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete affectation");
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Affectation supprimée avec succès", {
        duration: 3000,
        position: "bottom-left",
      });

      // Remove from local state
      setAffectations((prev) =>
        prev.filter((a) => a._id !== affectationToDelete._id)
      );
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting affectation:", error);
      toast.error("Erreur lors de la suppression de l'affectation");
    } finally {
      setDeletingAffectation(false);
    }
  };

  const handleViewDetails = (affectation) => {
    router.push(`/affectation/temporaire/details/${affectation._id}`);
  };

  const handleEditAffectation = (affectation) => {
    router.push(`/affectation/temporaire/edit/${affectation._id}`);
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
    setStationFilter([]);
    setDateFilter("");
  };

  const getStatusBadge = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    let status = "completed"; // default

    if (today < start) {
      status = "upcoming";
    } else if (today >= start && today <= end) {
      status = "active";
    }

    return (
      <Badge
        className={statusTypes[status]?.color || "bg-gray-100 text-gray-800"}
      >
        {statusTypes[status]?.label || "Inconnu"}
      </Badge>
    );
  };

  const filteredAffectations = affectations.filter((affectation) => {
    const employee = affectation.personnel;

    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      affectation.originStation.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      affectation.affectedStation.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(affectation.status);

    const matchesStation =
      stationFilter.length === 0 ||
      stationFilter.includes(affectation.originStation.name) ||
      stationFilter.includes(affectation.affectedStation.name);

    let matchesDate = true;
    if (dateFilter === "current") {
      const today = new Date();
      const startDate = new Date(affectation.startDate);
      const endDate = affectation.endDate
        ? new Date(affectation.endDate)
        : null;
      matchesDate = startDate <= today && (!endDate || endDate >= today);
    } else if (dateFilter === "past") {
      const today = new Date();
      const endDate = affectation.endDate
        ? new Date(affectation.endDate)
        : null;
      matchesDate = endDate && endDate < today;
    } else if (dateFilter === "future") {
      const today = new Date();
      const startDate = new Date(affectation.startDate);
      matchesDate = startDate > today;
    }

    return matchesSearch && matchesStatus && matchesStation && matchesDate;
  });

  const sortedAffectations = [...filteredAffectations].sort((a, b) => {
    let aValue, bValue;

    switch (sortConfig.key) {
      case "employeeName":
        aValue = `${a.personnel.firstName} ${a.personnel.lastName}`;
        bValue = `${b.personnel.firstName} ${b.personnel.lastName}`;
        break;
      case "originStation":
        aValue = a.originStation || "";
        bValue = b.originStation || "";
        break;
      case "temporaryStation":
        aValue = a.temporaryStation || "";
        bValue = b.temporaryStation || "";
        break;
      case "startDate":
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case "endDate":
        aValue = a.endDate ? new Date(a.endDate) : new Date(0);
        bValue = b.endDate ? new Date(b.endDate) : new Date(0);
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        aValue = a[sortConfig.key];
        bValue = b[sortConfig.key];
    }

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedAffectations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAffectations = sortedAffectations.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name="John Doe"
        role="HR Manager"
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Affectations Temporaires
        </h1>
        <Button
          onClick={() => router.push("/affectation/temporaire/add")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter une Affectation
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-96">
          <Input
            type="text"
            placeholder="Rechercher par nom, matricule ou station..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Statut</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.entries(statusTypes).map(([key, { label }]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={statusFilter.includes(key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilter([...statusFilter, key]);
                        } else {
                          setStatusFilter(
                            statusFilter.filter((item) => item !== key)
                          );
                        }
                      }}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Station</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {stations.map((station) => (
                    <DropdownMenuCheckboxItem
                      key={station}
                      checked={stationFilter.includes(station)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStationFilter([...stationFilter, station]);
                        } else {
                          setStationFilter(
                            stationFilter.filter((item) => item !== station)
                          );
                        }
                      }}
                    >
                      {station}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Période</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={dateFilter}
                    onValueChange={setDateFilter}
                  >
                    <DropdownMenuRadioItem value="">
                      Toutes les périodes
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="current">
                      En cours
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="past">
                      Terminées
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="future">
                      À venir
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  Effacer tous les filtres
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortConfig.key}
                onValueChange={(key) => handleSort(key)}
              >
                <DropdownMenuRadioItem value="employeeName">
                  Nom{" "}
                  {sortConfig.key === "employeeName" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="originStation">
                  Station d'origine{" "}
                  {sortConfig.key === "originStation" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="temporaryStation">
                  Station temporaire{" "}
                  {sortConfig.key === "temporaryStation" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="startDate">
                  Date de début{" "}
                  {sortConfig.key === "startDate" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="endDate">
                  Date de fin{" "}
                  {sortConfig.key === "endDate" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="status">
                  Statut{" "}
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {(statusFilter.length > 0 ||
        stationFilter.length > 0 ||
        dateFilter ||
        searchTerm) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>

          {statusFilter.map((status) => (
            <Badge key={status} variant="secondary" className="text-xs">
              Statut: {statusTypes[status]?.label || status}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() =>
                  setStatusFilter(statusFilter.filter((t) => t !== status))
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {stationFilter.map((station) => (
            <Badge key={station} variant="secondary" className="text-xs">
              Station: {station}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() =>
                  setStationFilter(stationFilter.filter((s) => s !== station))
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {dateFilter && (
            <Badge variant="secondary" className="text-xs">
              Période:{" "}
              {dateFilter === "current"
                ? "En cours"
                : dateFilter === "past"
                ? "Terminées"
                : "À venir"}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => setDateFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Recherche: {searchTerm}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={clearFilters}
          >
            Effacer tous les filtres
          </Button>
        </div>
      )}

      <Card className="bg-white shadow-lg mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">
                Chargement des affectations...
              </span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <p>{error}</p>
            </div>
          ) : currentAffectations.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <MapPin className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg mb-2">Aucune affectation trouvée</p>
              <p className="text-sm text-gray-400 mb-4">
                {searchTerm ||
                statusFilter.length > 0 ||
                stationFilter.length > 0 ||
                dateFilter
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par ajouter une nouvelle affectation temporaire"}
              </p>
              {searchTerm ||
              statusFilter.length > 0 ||
              stationFilter.length > 0 ||
              dateFilter ? (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center"
                >
                  <X className="mr-2 h-4 w-4" />
                  Effacer les filtres
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/affectation/temporaire/add")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une Affectation
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("employeeName")}
                      className="font-semibold"
                    >
                      Employé{" "}
                      {sortConfig.key === "employeeName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("originStation")}
                      className="font-semibold"
                    >
                      Station d'origine{" "}
                      {sortConfig.key === "originStation" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("temporaryStation")}
                      className="font-semibold"
                    >
                      Station temporaire{" "}
                      {sortConfig.key === "temporaryStation" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("startDate")}
                      className="font-semibold"
                    >
                      Date de début{" "}
                      {sortConfig.key === "startDate" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("endDate")}
                      className="font-semibold"
                    >
                      Date de fin{" "}
                      {sortConfig.key === "endDate" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="font-semibold"
                    >
                      Statut{" "}
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAffectations.map((affectation) => (
                  <TableRow key={affectation._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-semibold">
                          {affectation.personnel.firstName}{" "}
                          {affectation.personnel.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {affectation.personnel.matricule}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{affectation.originStation.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{affectation.affectedStation.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatDate(affectation.startDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatDate(affectation.endDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(
                        affectation.startDate,
                        affectation.endDate
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(affectation)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditAffectation(affectation)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(affectation)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && !error && sortedAffectations.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            Affichage {startIndex + 1} à{" "}
            {Math.min(endIndex, sortedAffectations.length)} sur{" "}
            {sortedAffectations.length} affectations
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'affectation temporaire de{" "}
              {affectationToDelete?.personnel?.firstName}{" "}
              {affectationToDelete?.personnel?.lastName} ? Cette action ne peut
              pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAffectation}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletingAffectation}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingAffectation ? (
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
