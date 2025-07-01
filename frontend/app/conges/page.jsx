"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
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
  Building,
  Calendar,
  Clock,
  Plane,
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

// Leave types
const leaveTypes = {
  ordinaire: { label: "Ordinaire", color: "bg-blue-100 text-blue-800" },
  anticipe: { label: "Anticipé", color: "bg-orange-100 text-orange-800" },
};

const getLeaveStatusLabel = (dateDebut, dateRetour) => {
  const today = new Date();
  const start = new Date(dateDebut);
  const end = new Date(dateRetour);
  return today >= start && today <= end ? "En cours" : "Terminé";
};

// badge helper, relies on the label above
const getLeaveStatusBadge = (dateDebut, dateRetour) => {
  const label = getLeaveStatusLabel(dateDebut, dateRetour);
  const info =
    label === "En cours"
      ? { color: "bg-green-100 text-green-800" }
      : { color: "bg-gray-100 text-gray-700" };

  return <Badge className={info.color}>{label}</Badge>;
};

export default function CongeMainPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [stationFilter, setStationFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "dateDebut",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState({});

  const itemsPerPage = 5;
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include", // 👈 IMPORTANT: needed to send cookies
          }
        );

        if (!res.ok) {
          // router.push("/login");
          throw new Error("Not authenticated");
        }

        const data = await res.json();
        console.log("data", data);
        setUser(data.user); // Adjust based on backend response structure
      } catch (err) {
        console.warn("User not logged in or error:", err.message);
        setUser(null);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include", // 👈 IMPORTANT: needed to send cookies
          }
        );

        if (!res.ok) {
          // router.push("/login");
          throw new Error("Not authenticated");
        }

        const data = await res.json();
        console.log("data", data);
        setUser(data.user); // Adjust based on backend response structure
      } catch (err) {
        console.warn("User not logged in or error:", err.message);
        setUser(null);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user]);
  // Fetch congés and derive stations
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to load congés");
        const data = await res.json();
        console.log("fetched congés", data);

        setRecords(data);

        // extract unique station names
        const uniqueStations = Array.from(
          new Set(data.map((r) => r.station?.name || "Non défini"))
        );
        setStations(uniqueStations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Format date for display
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getLeaveTypeBadge = (type) => {
    const info = leaveTypes[type] || {
      label: "Inconnu",
      color: "bg-gray-100 text-gray-800",
    };
    return <Badge className={info.color}>{info.label}</Badge>;
  };

  // Calculate remaining days
  const calculateRemainingDays = (dateDebut, duree) => {
    const start = new Date(dateDebut);
    const today = new Date();
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + Number(duree));

    if (today < start) return Number(duree);
    if (today > endDate) return 0;

    const diffTime = endDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Delete flow
  const handleDeleteClick = (r) => {
    setRecordToDelete(r);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges/${recordToDelete._id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error("Échec de la suppression");
      toast.success("Congé supprimé");
      setRecords((prev) => prev.filter((r) => r._id !== recordToDelete._id));
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Apply search & filters
  const filtered = records.filter((r) => {
    const fullName =
      `${r.personnel.firstName} ${r.personnel.lastName}`.toLowerCase();
    if (
      !fullName.includes(searchTerm.toLowerCase()) &&
      !r.personnel.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;

    if (
      typeFilter.length &&
      !typeFilter.includes(leaveTypes[r.typeConge]?.label)
    )
      return false;

    if (stationFilter.length && !stationFilter.includes(r.station?.name))
      return false;
    if (statusFilter.length) {
      const status = getLeaveStatusLabel(r.dateDebut, r.dateRetour);
      if (!statusFilter.includes(status)) return false;
    }
    return true;
  });

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    switch (sortConfig.key) {
      case "employee":
        av = a.personnel.lastName;
        bv = b.personnel.lastName;
        break;
      case "station":
        av = a.station?.name || "";
        bv = b.station?.name || "";
        break;
      case "dateDebut":
        av = new Date(a.dateDebut);
        bv = new Date(b.dateDebut);
        break;
      case "duree":
        av = +a.dureeConge;
        bv = +b.dureeConge;
        break;
      case "dateRetour":
        av = new Date(a.dateRetour);
        bv = new Date(b.dateRetour);
        break;
      default:
        av = "";
        bv = "";
    }
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paged = sorted.slice(startIndex, startIndex + itemsPerPage);

  // above your CongeMainPage component:

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name={user?.username || "Utilisateur"}
        role={user?.role || "Invité"}
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Gestion des Congés</h1>
        <Button
          onClick={() => router.push("/conges/add")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="mr-2" /> Ajouter un congé
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-96">
          <Input
            placeholder="Rechercher par nom, matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2" /> Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Filtres</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Type de congé</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.values(leaveTypes).map((t) => (
                    <DropdownMenuCheckboxItem
                      key={t.label}
                      checked={typeFilter.includes(t.label)}
                      onCheckedChange={(chk) =>
                        setTypeFilter((prev) =>
                          chk
                            ? [...prev, t.label]
                            : prev.filter((x) => x !== t.label)
                        )
                      }
                    >
                      {t.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Station</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {stations.map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s}
                      checked={stationFilter.includes(s)}
                      onCheckedChange={(chk) =>
                        setStationFilter((prev) =>
                          chk ? [...prev, s] : prev.filter((x) => x !== s)
                        )
                      }
                    >
                      {s}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {["En cours", "Terminé"].map((label) => (
                    <DropdownMenuCheckboxItem
                      key={label}
                      checked={statusFilter.includes(label)}
                      onCheckedChange={(chk) =>
                        setStatusFilter((prev) =>
                          chk
                            ? [...prev, label]
                            : prev.filter((x) => x !== label)
                        )
                      }
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setTypeFilter([]);
                    setStationFilter([]);
                    setStatusFilter([]);
                  }}
                >
                  Effacer tous les filtres
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2" /> Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortConfig.key}
                onValueChange={handleSort}
              >
                <DropdownMenuRadioItem value="employee">
                  Employé{" "}
                  {sortConfig.key === "employee"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : null}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="station">
                  Station{" "}
                  {sortConfig.key === "station"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : null}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dateDebut">
                  Date de début{" "}
                  {sortConfig.key === "dateDebut"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : null}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="duree">
                  Durée{" "}
                  {sortConfig.key === "duree"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : null}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active filters */}
      {(searchTerm || typeFilter.length || stationFilter.length) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>
          {typeFilter.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">
              Type: {t}
              <X
                className="ml-1 cursor-pointer"
                size={12}
                onClick={() => setTypeFilter((p) => p.filter((x) => x !== t))}
              />
            </Badge>
          ))}
          {stationFilter.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              Station: {s}
              <X
                className="ml-1 cursor-pointer"
                size={12}
                onClick={() =>
                  setStationFilter((p) => p.filter((x) => x !== s))
                }
              />
            </Badge>
          ))}
          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Recherche: {searchTerm}
              <X
                className="ml-1 cursor-pointer"
                size={12}
                onClick={() => setSearchTerm("")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <Card className="bg-white shadow-lg mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <AlertTriangle size={32} className="mr-2" /> {error}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Plane size={48} className="mb-2" /> Aucun congé trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("employee")}
                    >
                      Employé{" "}
                      {sortConfig.key === "employee"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("station")}
                    >
                      Station{" "}
                      {sortConfig.key === "station"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("dateDebut")}
                    >
                      Date de début{" "}
                      {sortConfig.key === "dateDebut"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>

                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("dateRetour")}
                    >
                      Date de retour{" "}
                      {sortConfig.key === "dateRetour"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}{" "}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("duree")}>
                      Durée{" "}
                      {sortConfig.key === "duree"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>Jours restants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r._id} className="hover:bg-gray-50">
                    <TableCell>
                      {r.personnel.firstName} {r.personnel.lastName}
                      <div className="text-sm text-gray-500">
                        {r.personnel.matricule}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Building className="inline mr-1" /> {r.station?.name}
                    </TableCell>
                    <TableCell>{getLeaveTypeBadge(r.typeConge)}</TableCell>
                    <TableCell>
                      <Calendar className="inline mr-1" />{" "}
                      {formatDate(r.dateDebut)}
                    </TableCell>
                    <TableCell>
                      <Calendar className="inline mr-1" />{" "}
                      {formatDate(r.dateRetour)}
                    </TableCell>
                    <TableCell>
                      <Clock className="inline mr-1" /> {r.dureeConge} jour
                      {r.dureeConge > 1 && "s"}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-blue-600">
                        {calculateRemainingDays(r.dateDebut, r.dureeConge)} jour
                        {calculateRemainingDays(r.dateDebut, r.dureeConge) >
                          1 && "s"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getLeaveStatusBadge(r.dateDebut, r.dateRetour)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="p-0">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => router.push(`/conges/${r._id}`)}
                          >
                            <Eye className="mr-2" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/conges/edit/${r._id}`)}
                          >
                            <Edit className="mr-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(r)}
                          >
                            <Trash2 className="mr-2" /> Supprimer
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

      {/* Pagination */}
      {!loading && !error && sorted.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            Affichage {startIndex + 1} à{" "}
            {Math.min(startIndex + itemsPerPage, sorted.length)} sur{" "}
            {sorted.length}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              <ChevronLeft />
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce congé ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 animate-spin" />} Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-left" />
    </div>
  );
}
