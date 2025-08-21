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
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

// Operation types
const operationTypes = {
  avisAbsence: {
    label: "Avis Absence",
    color: "bg-yellow-100 text-yellow-800",
  },
  avisReprise: { label: "Avis Reprise", color: "bg-green-100 text-green-800" },
};

export default function AbsenceAIListPage() {
  const router = useRouter();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "desc",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState(null);
  const [deletingAbsence, setDeletingAbsence] = useState(false);

  // New state for adding end date / changing to avis reprise
  const [addEndDateDialogOpen, setAddEndDateDialogOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [endDate, setEndDate] = useState("");
  const [updatingAbsence, setUpdatingAbsence] = useState(false);
  const [endDateError, setEndDateError] = useState("");
  const [deleting,setDeleting]=useState(false)

  const itemsPerPage = 5;

  // Fetch Absence AI data from your API
  useEffect(() => {
    const fetchAbsences = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI`,
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
      } catch (err) {
        console.error("Error fetching absences:", err);
        console.log("error", err);
        setError("Failed to load absences. Please try again later.");
        toast.error("Failed to load absences");
      } finally {
        setLoading(false);
      }
    };

    fetchAbsences();
  }, []);

  // Format date to French date string
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "Invalid Date") return "Non défini";
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", options);
  };
  const calculateDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date(); // today if no endDate
    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  };

  const handleDeleteClick = (absence) => {
    setAbsenceToDelete(absence);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!absenceToDelete) return;
    setDeleting(true)
    setDeletingAbsence(true);
    try {
      // In a real application, you would call your API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI/${absenceToDelete._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete absence");
      }

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
      setDeleting(false)
    }
  };

  const handleViewDetails = (absence) => {
    router.push(`/absence/ai/${absence._id}`);
  };

  const handleEditAbsence = (absence) => {
    router.push(`/absence/ai/edit/${absence._id}`);
  };

  // New function to handle opening the add end date dialog
  const handleAddEndDateClick = (absence) => {
    setSelectedAbsence(absence);
    setEndDate("");
    setEndDateError("");
    setAddEndDateDialogOpen(true);
  };

  // Function to validate and submit the end date
  const handleAddEndDateSubmit = async () => {
    // Validate end date
    if (!endDate) {
      setEndDateError("La date de reprise est requise");
      return;
    }

    const startDate = new Date(selectedAbsence.startDate);
    const selectedEndDate = new Date(endDate);

    if (selectedEndDate < startDate) {
      setEndDateError(
        "La date de reprise doit être postérieure à la date de début"
      );
      return;
    }

    setUpdatingAbsence(true);

    try {
      // Prepare data for the API call
      const updateData = {
        operationType: "avisReprise",
        endDate: endDate,
      };

      // Call the API to update the absence
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI/${selectedAbsence._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'absence");
      }

      const updatedAbsence = await response.json();
      console.log("update", updatedAbsence.data);
      // Update the local state
      setAbsences((prev) =>
        prev.map((absence) =>
          absence._id === selectedAbsence._id
            ? { ...absence, ...updatedAbsence.data }
            : absence
        )
      );

      toast.success("Absence mise à jour avec succès", {
        duration: 3000,
        position: "bottom-left",
      });

      setAddEndDateDialogOpen(false);
    } catch (error) {
      console.error("Error updating absence:", error);
      toast.error("Erreur lors de la mise à jour de l'absence");
    } finally {
      setUpdatingAbsence(false);
    }
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
    setDateFilter("");
  };

  const filteredAbsences = absences.filter((absence) => {
    const employee = absence.personnel;

    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.matricule.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter.length === 0 || typeFilter.includes(absence.operationType);

    let matchesDate = true;
    if (dateFilter === "current") {
      const today = new Date();
      const startDate = new Date(absence.startDate);
      const endDate = absence.endDate ? new Date(absence.endDate) : null;
      matchesDate = startDate <= today && (!endDate || endDate >= today);
    } else if (dateFilter === "past") {
      const today = new Date();
      const endDate = absence.endDate ? new Date(absence.endDate) : null;
      matchesDate = endDate && endDate < today;
    } else if (dateFilter === "future") {
      const today = new Date();
      const startDate = new Date(absence.startDate);
      matchesDate = startDate > today;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const sortedAbsences = [...filteredAbsences].sort((a, b) => {
    let aValue, bValue;

    switch (sortConfig.key) {
      case "employeeName":
        aValue = `${a.personnel.firstName} ${a.personnel.lastName}`;
        bValue = `${b.personnel.firstName} ${b.personnel.lastName}`;
        break;
      case "station":
        aValue = a.personnel.stationName || "";
        bValue = b.personnel.stationName || "";
        break;
      case "operationType":
        aValue = operationTypes[a.operationType]?.label || "";
        bValue = operationTypes[b.operationType]?.label || "";
        break;
      case "startDate":
        aValue = new Date(a.startDate);
        bValue = new Date(b.startDate);
        break;
      case "endDate":
        aValue = a.endDate ? new Date(a.endDate) : new Date(0);
        bValue = b.endDate ? new Date(b.endDate) : new Date(0);
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
          Liste des Absences AI
        </h1>
        <Button
          onClick={() => router.push("/absence/ai/add")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter une Absence AI
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
                <DropdownMenuSubTrigger>Type d'avis</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.entries(operationTypes).map(([key, { label }]) => (
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
                <DropdownMenuRadioItem value="employeeName">
                  Nom{" "}
                  {sortConfig.key === "employeeName" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="station">
                  Station{" "}
                  {sortConfig.key === "station" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="operationType">
                  Type d'avis{" "}
                  {sortConfig.key === "operationType" &&
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
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {(typeFilter.length > 0 || dateFilter || searchTerm) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>

          {typeFilter.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              Type: {operationTypes[type]?.label || type}
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
                {searchTerm || typeFilter.length > 0 || dateFilter
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Commencez par ajouter une nouvelle absence"}
              </p>
              {searchTerm || typeFilter.length > 0 || dateFilter ? (
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
                  onClick={() => router.push("/absence/ai/add")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" /> Ajouter une Absence AI
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
                      onClick={() => handleSort("operationType")}
                      className="font-semibold"
                    >
                      Avis{" "}
                      {sortConfig.key === "operationType" &&
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
                      Date de Fin{" "}
                      {sortConfig.key === "endDate" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAbsences.map((absence) => (
                  <TableRow key={absence._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-semibold">
                          {absence.personnel.firstName}{" "}
                          {absence.personnel.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {absence.personnel.matricule}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {absence.personnel.stationName || "Non défini"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          operationTypes[absence.operationType]?.color ||
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {operationTypes[absence.operationType]?.label ||
                          "Avis Absence"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatDate(absence.startDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {absence.endDate &&
                      formatDate(absence.endDate) !== "01/01/1970" ? (
                        <span className="font-medium">
                          {formatDate(absence.endDate)}
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleAddEndDateClick(absence)}
                          disabled={absence.operationType === "avisReprise"}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Ajouter date de
                          reprise
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {calculateDuration(absence.startDate, absence.endDate)}
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
                          {absence.operationType === "avisAbsence" &&
                            !absence.endDate && (
                              <DropdownMenuItem
                                onClick={() => handleAddEndDateClick(absence)}
                              >
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Ajouter date de reprise
                              </DropdownMenuItem>
                            )}
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
  <CustomAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer ce congé ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Add End Date Dialog */}
      <Dialog
        open={addEndDateDialogOpen}
        onOpenChange={setAddEndDateDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter une date de reprise</DialogTitle>
            <DialogDescription>
              Ajoutez une date de reprise pour convertir cet avis d'absence en
              avis de reprise.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employee" className="text-right">
                Employé
              </Label>
              <div className="col-span-3 font-medium">
                {selectedAbsence?.personnel?.firstName}{" "}
                {selectedAbsence?.personnel?.lastName}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Date de début
              </Label>
              <div className="col-span-3 font-medium">
                {selectedAbsence && formatDate(selectedAbsence.startDate)}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Date de reprise*
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setEndDateError("");
                  }}
                  className={`pl-10 ${endDateError ? "border-red-500" : ""}`}
                />
                <Calendar
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                {endDateError && (
                  <p className="text-red-500 text-sm mt-1">{endDateError}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={updatingAbsence}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddEndDateSubmit}
              disabled={updatingAbsence}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {updatingAbsence ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convertir en avis de reprise
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="bottom-left" />
    </div>
  );
}
