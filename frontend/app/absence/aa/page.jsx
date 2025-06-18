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
  Download,
  X,
  AlertTriangle,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

// Types of authorized absences
const absenceTypes = {
  maladie: { label: "Maladie", color: "bg-yellow-100 text-yellow-800" },
  deces: { label: "Decès", color: "bg-gray-100 text-gray-800" },
  marriage: { label: "Mariage", color: "bg-pink-100 text-pink-800" },
  naissance: { label: "Naissance", color: "bg-blue-100 text-blue-800" },
  pilgrimage: { label: "Pèlerinage", color: "bg-purple-100 text-purple-800" },
  examen: { label: "Examen", color: "bg-indigo-100 text-indigo-800" },
  autre: { label: "Autre", color: "bg-gray-100 text-gray-800" },
};

// Status colors
const statusColors = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AbsenceAAListPage() {
  const router = useRouter();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "desc",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState(null);
  const [deletingAbsence, setDeletingAbsence] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchAbsences = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch absences");
        }
        const data = await response.json();
        console.log("data", data);
        setAbsences(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching absences:", error.message);
        setError("Failed to load absences. Please try again later.");
        toast.error("Failed to load absences");
      } finally {
        setLoading(false);
      }
    };

    fetchAbsences();
  }, []);

  const formatDate = (dateString) => {
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return new Date(dateString).toLocaleDateString("fr-FR", options);
  };

  const handleDeleteClick = (absence) => {
    setAbsenceToDelete(absence);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!absenceToDelete) return;

    setDeletingAbsence(true);
    try {
      // In a real application, you would call your API
      const response = await fetch(
        `http://localhost:5000/api/absencesAA/${absenceToDelete._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete absence");
      }

      // Simulate API call

      toast.success("Absence supprimée avec succès", {
        duration: 3000,
        position: "bottom-left",
      });

      // Remove from local state
      setAbsences((prev) => prev.filter((a) => a._id !== absenceToDelete._id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting absence:", error);
      toast.error("Erreur lors de la suppression de l'absence");
    } finally {
      setDeletingAbsence(false);
    }
  };

  const handleViewDetails = (absence) => {
    router.push(`/absence/aa/${absence._id}`);
  };
  const handleEditAbsence = (absence) => {
    // In a real application, you would navigate to an edit page
    router.push(`/absence/aa/edit/${absence._id}`);
  };

  const handleDownloadDocument = (absence) => {
    // In a real application, you would download the document
    toast.success(`Téléchargement du document pour ${absence.personnelName}`, {
      duration: 2000,
      position: "bottom-left",
    });
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
    setTypeFilter([]);
    setStatusFilter([]);
    setDateFilter("");
  };

  const filteredAbsences = absences.filter((absence) => {
    const matchesSearch =
      absence.personnel.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      absence.personnel.matricule
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter.length === 0 || typeFilter.includes(absence.absenceType);
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(absence.status);

    let matchesDate = true;
    if (dateFilter === "current") {
      const today = new Date();
      const startDate = new Date(absence.startDate);
      const endDate = new Date(absence.endDate);
      matchesDate = startDate <= today && endDate >= today;
    } else if (dateFilter === "past") {
      const today = new Date();
      const endDate = new Date(absence.endDate);
      matchesDate = endDate < today;
    } else if (dateFilter === "future") {
      const today = new Date();
      const startDate = new Date(absence.startDate);
      matchesDate = startDate > today;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const sortedAbsences = [...filteredAbsences].sort((a, b) => {
    let aValue, bValue;

    switch (sortConfig.key) {
      case "personnelName":
        aValue = a.personnelName;
        bValue = b.personnelName;
        break;
      case "startDate":
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case "endDate":
        aValue = new Date(a.endDate);
        bValue = new Date(b.endDate);
        break;
      case "duration":
        aValue = a.duration;
        bValue = b.duration;
        break;
      case "absenceType":
        aValue = absenceTypes[a.absenceType]?.label || "";
        bValue = absenceTypes[b.absenceType]?.label || "";
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

  function calculateDaysBetweenDates(startDate, endDate) {
    // Ensure dates are in proper format (if they're strings, convert to Date objects)
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate difference in milliseconds, then convert to days
    const diffInMs = end - start;
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

    return diffInDays;
  }

  const totalPages = Math.ceil(sortedAbsences.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAbsences = sortedAbsences.slice(startIndex, endIndex);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name="John Doe"
        role="HR Manager"
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Liste des Absences Autorisées
        </h1>
        <Button
          onClick={() => router.push("/absence/aa/add")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter une Absence
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-96">
          <Input
            type="text"
            placeholder="Rechercher par nom ou matricule..."
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
                <DropdownMenuSubTrigger>Type d'absence</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.entries(absenceTypes).map(([key, { label }]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={typeFilter.includes(key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTypeFilter([...typeFilter, key]);
                        } else {
                          setTypeFilter(
                            typeFilter.filter((item) => item !== key)
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
                      Passées
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
                <DropdownMenuRadioItem value="personnelName">
                  Nom{" "}
                  {sortConfig.key === "personnelName" &&
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
                <DropdownMenuRadioItem value="duration">
                  Durée{" "}
                  {sortConfig.key === "duration" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="absenceType">
                  Type{" "}
                  {sortConfig.key === "absenceType" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {(typeFilter.length > 0 ||
        statusFilter.length > 0 ||
        dateFilter ||
        searchTerm) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>

          {typeFilter.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              Type: {absenceTypes[type]?.label || type}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() =>
                  setTypeFilter(typeFilter.filter((t) => t !== type))
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
                ? "Passées"
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
                Chargement des absences...
              </span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <p>{error}</p>
            </div>
          ) : currentAbsences.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <Calendar className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg mb-2">Aucune absence trouvée</p>
              <p className="text-sm text-gray-400 mb-4">
                {searchTerm ||
                typeFilter.length > 0 ||
                statusFilter.length > 0 ||
                dateFilter
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par ajouter une nouvelle absence autorisée"}
              </p>
              {searchTerm ||
              typeFilter.length > 0 ||
              statusFilter.length > 0 ||
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
                  onClick={() => router.push("/absence/aa/add")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une Absence
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
                      onClick={() => handleSort("personnelName")}
                      className="font-semibold"
                    >
                      Employé{" "}
                      {sortConfig.key === "personnelName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("station")}
                      className="font-semibold"
                    >
                      Station{" "}
                      {sortConfig.key === "station" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("absenceType")}
                      className="font-semibold"
                    >
                      Type{" "}
                      {sortConfig.key === "absenceType" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("startDate")}
                      className="font-semibold"
                    >
                      Période{" "}
                      {sortConfig.key === "startDate" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("duration")}
                      className="font-semibold"
                    >
                      Durée{" "}
                      {sortConfig.key === "duration" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead
                    className="
                    inline-flex
                    items-center
                    text-gray-500
                    justify-center
                    rounded-md
                    text-sm
                    font-medium
                    ring-offset-background
                    transition-colors
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                    disabled:pointer-events-none
                    disabled:opacity-50 hover:bg-accent hover:text-accent-foreground font-semibold text-right"
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAbsences.map((absence) => (
                  <TableRow key={absence._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div
                          className="inline-flex
                      items-center
                      text-black-300
                      justify-center
                      rounded-md
                      text-sm
                      font-medium
                      ring-offset-background
                      transition-colors
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-ring
                      focus-visible:ring-offset-2
                      disabled:pointer-events-none
                      disabled:opacity-50 hover:bg-accent hover:text-accent-foreground font-semibold"
                        >
                          {absence.personnel.firstName}{" "}
                          {absence.personnel.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {absence.personnel.matricule}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex
                      items-center
                      text-black-300
                      justify-center
                      rounded-md
                      text-sm
                      font-medium
                      ring-offset-background
                      transition-colors
                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-ring
                      focus-visible:ring-offset-2
                      disabled:pointer-events-none
                      disabled:opacity-50 hover:bg-accent hover:text-accent-foreground font-semibold"
                      >
                        {absence.personnel.stationName || "Non défini"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          absenceTypes[absence.absenceType]?.color ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {absenceTypes[absence.absenceType]?.label || "Autre"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex flex-col
                    text-black-300
                    justify-center
                    rounded-md
                    text-sm
                    font-medium
                    ring-offset-background
                    transition-colors
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                    disabled:pointer-events-none
                    disabled:opacity-50 hover:bg-accent hover:text-accent-foreground font-semibold"
                      >
                        <span className="text-sm">
                          Du: {formatDate(absence.startDate)}
                        </span>
                        <span className="text-sm">
                          Au: {formatDate(absence.endDate)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="inline-flex
                    items-center
                    text-black-300
                    justify-center
                    rounded-md
                    text-sm
                    font-medium
                    ring-offset-background
                    transition-colors
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
                    disabled:pointer-events-none
                    disabled:opacity-50 hover:bg-accent hover:text-accent-foreground font-semibold"
                    >
                      {calculateDaysBetweenDates(
                        absence.startDate,
                        absence.endDate
                      )}{" "}
                      jour
                      {calculateDaysBetweenDates(
                        absence.startDate,
                        absence.endDate
                      ) > 1
                        ? "s"
                        : ""}
                    </TableCell>

                    <TableCell className="text-middle">
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
                            onClick={() => handleViewDetails(absence)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditAbsence(absence)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(absence)}
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

      {!loading && !error && sortedAbsences.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            Affichage {startIndex + 1} à{" "}
            {Math.min(endIndex, sortedAbsences.length)} sur{" "}
            {sortedAbsences.length} absences
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
              Êtes-vous sûr de vouloir supprimer l'absence autorisée de{" "}
              {absenceToDelete?.personnelName} ? Cette action ne peut pas être
              annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAbsence}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletingAbsence}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingAbsence ? (
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
