"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Plus,
  Loader2,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Eye
} from "lucide-react";
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
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog"

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "actif":
      return "bg-green-100 text-green-800";
    case "en congé":
      return "bg-yellow-100 text-yellow-800";
    case "en formation":
      return "bg-blue-100 text-blue-800";
    case "inactif":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getHolidaysLeftColor = (holidaysLeft) => {
  if (holidaysLeft === null || holidaysLeft === undefined) return "bg-gray-100 text-gray-800";
  if (holidaysLeft <= 5) return "bg-green-100 text-green-800"
  if (holidaysLeft <= 15) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800"; 
};

export default function EmployeeListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: "lastName",
    direction: "asc",
  });
  const [statusFilter, setStatusFilter] = useState([]);
  const [posteFilter, setPosteFilter] = useState([]);
  const [stationFilter, setStationFilter] = useState([]);
  const [quickFilters, setQuickFilters] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [user, setUser] = useState();
  const [deleting,setDeleting]=useState(false)
  const itemsPerPage = 10;


  useEffect(() => {
    fetchEmployees();
  }, [user]);

  const exportToExcel = () => {
    // 1️⃣ Group rows by stationName
    const grouped = sortedEmployees.reduce((acc, e) => {
      const station = e.stationName || "Non définie";
      if (!acc[station]) acc[station] = [];
      acc[station].push({
        "N°": `N${acc[station].length + 1}`,
        Station: station,
        P_MAT: e.matricule,
        P_NOMP: `${e.lastName.toUpperCase()} ${e.firstName}`,
        "poste sur fiche de paie": e.poste,
        Status: e.status || "Non défini",
        "Congés Restants": e.holidaysLeft !== null && e.holidaysLeft !== undefined ? e.holidaysLeft : "Non défini",
      });
      return acc;
    }, {});

    // 2️⃣ Create a new workbook
    const wb = XLSX.utils.book_new();

    // 3️⃣ For each station, add a sheet
    Object.entries(grouped).forEach(([station, rows]) => {
      const ws = XLSX.utils.json_to_sheet(rows, { origin: "A1" });
      // Optionally freeze header row:
      ws["!freeze"] = { xSplit: 0, ySplit: 1 };
      // Sheet names limited to 31 characters:
      XLSX.utils.book_append_sheet(wb, ws, station.slice(0, 31));
    });

    // 4️⃣ Write and trigger download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "personnel_par_station.xlsx"
    );
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`,
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
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      console.log("data", data);
      setEmployeeData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees. Please try again later.");
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const allPostes = useMemo(() => {
    const postes = [...new Set(employeeData.map((e) => e.poste))].filter(
      Boolean
    );
    return postes.sort();
  }, [employeeData]);

  const allStatuses = useMemo(() => {
    const statuses = [...new Set(employeeData.map((e) => e.status))].filter(
      Boolean
    );
    return statuses.sort();
  }, [employeeData]);

  const allStations = useMemo(() => {
    return [...new Set(employeeData.map((e) => e.stationName))]
      .filter(Boolean)
      .sort();
  }, [employeeData]);

  const filteredEmployees = useMemo(() => {
    return employeeData.filter(
      (employee) =>
        (searchTerm === "" ||
          (employee.matricule &&
            employee.matricule
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (employee.lastName &&
            employee.lastName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (employee.firstName &&
            employee.firstName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (employee.poste &&
            employee.poste.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        (statusFilter.length === 0 ||
          (employee.status && statusFilter.includes(employee.status))) &&
        (posteFilter.length === 0 ||
          (employee.poste && posteFilter.includes(employee.poste))) &&
        (stationFilter.length === 0 ||
          (employee.stationName &&
            stationFilter.includes(employee.stationName))) &&
        (quickFilters.length === 0 || quickFilters.includes(employee.status))
    );
  }, [
    searchTerm,
    statusFilter,
    posteFilter,
    stationFilter,
    quickFilters,
    employeeData,
  ]);

  const sortedEmployees = useMemo(() => {
    const sortedList = [...filteredEmployees];
    if (sortConfig.key) {
      sortedList.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

        // Special handling for holidaysLeft sorting
        if (sortConfig.key === "holidaysLeft") {
          aValue = a[sortConfig.key] !== null && a[sortConfig.key] !== undefined ? a[sortConfig.key] : -1;
          bValue = b[sortConfig.key] !== null && b[sortConfig.key] !== undefined ? b[sortConfig.key] : -1;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortedList;
  }, [filteredEmployees, sortConfig]);

  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = sortedEmployees.slice(startIndex, endIndex);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const clearAllFilters = () => {
    setStatusFilter([]);
    setPosteFilter([]);
    setStationFilter([]);
    setQuickFilters([]);
    setSortConfig({ key: "lastName", direction: "asc" });
  };

  const toggleQuickFilter = (filter) => {
    setQuickFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const removeFilter = (type, value) => {
    switch (type) {
      case "status":
        setStatusFilter((prev) => prev.filter((s) => s !== value));
        break;
      case "poste":
        setPosteFilter((prev) => prev.filter((p) => p !== value));
        break;
      case "station":
        setStationFilter((prev) => prev.filter((s) => s !== value));
        break;
      case "quick":
        setQuickFilters((prev) => prev.filter((f) => f !== value));
        break;
    }
  };

  const handleEditEmployee = (employee) => {
    router.push(`/personnel/edit-personnel/${employee._id}`);
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setDeleting(true)
    setDeletingEmployee(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel/${employeeToDelete._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }

      toast.success("Personnel supprimé avec succès", {
        duration: 3000,
        position: "bottom-left",
      });

      // Remove from local state
      setEmployeeData((prev) =>
        prev.filter((emp) => emp._id !== employeeToDelete._id)
      );
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Erreur lors de la suppression du personnel");
    } finally {
      setDeletingEmployee(false);
      setDeleting(false)
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    statusFilter,
    posteFilter,
    stationFilter,
    quickFilters,
    sortConfig,
  ]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Liste du Personnel</h1>
        <div className="flex justify-between items-center mb-8 ">
          <Link href="/personnel/add-personnel" className="mx-5">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              <Plus className="mr-2 h-4 w-4" /> Ajouter Personnel
            </Button>
          </Link>
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center mx-5"
          >
            <Download className="mr-2 h-4 w-4" /> Exporter Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-96">
          <Input
            type="text"
            placeholder="Rechercher personnel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white rounded-full border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
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
                Trier et Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <div className="grid grid-cols-2 gap-4 p-4">
                <div>
                  <DropdownMenuLabel>Trier par</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={sortConfig.key}
                    onValueChange={(value) => handleSort(value)}
                  >
                    <DropdownMenuRadioItem value="lastName">
                      Nom{" "}
                      {sortConfig.key === "lastName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="firstName">
                      Prénom{" "}
                      {sortConfig.key === "firstName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="poste">
                      Poste{" "}
                      {sortConfig.key === "poste" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="matricule">
                      Matricule{" "}
                      {sortConfig.key === "matricule" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="status">
                      Status{" "}
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="stationName">
                      Station{" "}
                      {sortConfig.key === "stationName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="holidaysLeft">
                      Congés{" "}
                      {sortConfig.key === "holidaysLeft" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </div>
                <div>
                  <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {allStatuses.map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={statusFilter.includes(status)}
                            onCheckedChange={(checked) =>
                              setStatusFilter(
                                checked
                                  ? [...statusFilter, status]
                                  : statusFilter.filter((s) => s !== status)
                              )
                            }
                          >
                            {status}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Poste</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {allPostes.map((poste) => (
                          <DropdownMenuCheckboxItem
                            key={poste}
                            checked={posteFilter.includes(poste)}
                            onCheckedChange={(checked) =>
                              setPosteFilter(
                                checked
                                  ? [...posteFilter, poste]
                                  : posteFilter.filter((p) => p !== poste)
                              )
                            }
                          >
                            {poste}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Station</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {allStations.map((station) => (
                          <DropdownMenuCheckboxItem
                            key={station}
                            checked={stationFilter.includes(station)}
                            onCheckedChange={(checked) =>
                              setStationFilter(
                                checked
                                  ? [...stationFilter, station]
                                  : stationFilter.filter((s) => s !== station)
                              )
                            }
                          >
                            {station}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </div>
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  Effacer tous les filtres
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {allStatuses.map((status) => (
          <TooltipProvider key={status}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={
                    quickFilters.includes(status) ? "secondary" : "outline"
                  }
                  size="sm"
                  onClick={() => toggleQuickFilter(status)}
                >
                  {status}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Afficher uniquement les employés "{status}"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      {(statusFilter.length > 0 ||
        posteFilter.length > 0 ||
        stationFilter.length > 0 ||
        quickFilters.length > 0 ||
        sortConfig.key !== "lastName") && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>
          {statusFilter.map((status) => (
            <Badge key={status} variant="secondary" className="text-xs">
              Status: {status}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => removeFilter("status", status)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {posteFilter.map((poste) => (
            <Badge key={poste} variant="secondary" className="text-xs">
              Poste: {poste}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => removeFilter("poste", poste)}
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
                onClick={() => removeFilter("station", station)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {quickFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="text-xs">
              {filter}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => removeFilter("quick", filter)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {sortConfig.key !== "lastName" && (
            <Badge variant="secondary" className="text-xs">
              Trié par: {sortConfig.key} (
              {sortConfig.direction === "asc" ? "ascendant" : "descendant"})
            </Badge>
          )}
        </div>
      )}

      <Card className="bg-white shadow-lg mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">
                Chargement des données...
              </span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <p>{error}</p>
              <Button
                variant="outline"
                className="ml-4"
                onClick={fetchEmployees}
              >
                Réessayer
              </Button>
            </div>
          ) : currentEmployees.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <p>Aucun personnel trouvé</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead  className="font-semibold">Matricule</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("firstName")}
                      className="font-semibold"
                    >
                      Nom{" "}
                      {sortConfig.key === "firstName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("lastName")}
                      className="font-semibold"
                    >
                      Prénom{" "}
                      {sortConfig.key === "lastName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("poste")}
                      className="font-semibold"
                    >
                      Poste{" "}
                      {sortConfig.key === "poste" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("stationName")}
                      className="font-semibold"
                    >
                      Station{" "}
                      {sortConfig.key === "stationName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="font-semibold"
                    >
                      Status{" "}
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("holidaysLeft")}
                      className="font-semibold"
                    >
                      Congés{" "}
                      {sortConfig.key === "holidaysLeft" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentEmployees.map((employee) => (
                  <TableRow key={employee._id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {employee.matricule}
                    </TableCell>
                    <TableCell>{employee.firstName}</TableCell>
                    <TableCell>{employee.lastName}</TableCell>
                    <TableCell>{employee.poste}</TableCell>
                    <TableCell>{employee.stationName}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(
                          employee.status
                        )} font-semibold`}
                      >
                        {employee.status || "Non défini"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getHolidaysLeftColor(
                          employee.holidaysLeft
                        )} font-semibold`}
                      >
                        {employee.holidaysLeft !== null && employee.holidaysLeft !== undefined 
                          ? `${employee.holidaysLeft} jours` 
                          : "Non défini"}
                      </Badge>
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
                            onClick={() => (
                              router.push(`personnel/details/${employee._id}`)
                             
                            )}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(employee)}
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

      {!loading && !error && sortedEmployees.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            Affichage {startIndex + 1} à{" "}
            {Math.min(endIndex, sortedEmployees.length)} sur{" "}
            {sortedEmployees.length} employés
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
      
      <CustomAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer ce personnel ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}