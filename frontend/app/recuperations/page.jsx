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
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog"
// Recovery types
const recoveryTypes = {
  heures_supplementaires: {
    label: "Heures supplémentaires",
    color: "border-border bg-muted text-ink-750",
  },
  travail_weekend: {
    label: "Travail weekend",
    color: "border-border bg-muted text-ink-750",
  },
  jour_ferie: {
    label: "Jour férié travaillé",
    color: "border-border bg-muted text-ink-750",
  },
  mission_prolongee: {
    label: "Mission prolongée",
    color: "border-border bg-muted text-ink-750",
  },
  astreinte: { label: "Astreinte", color: "border-border bg-muted text-ink-750" },
};

export default function RecuperationMainPage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState([]);
  const [stationFilter, setStationFilter] = useState([]);
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
  // Fetch data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recuperations`,
          {
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error("Failed to load recuperation");
        const data = await res.json();
        console.log("data", data);
        setRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Format date
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getRecoveryTypeBadge = (type) => {
    const typeInfo = recoveryTypes[type] || {
      label: "Inconnu",
      color: "border-border bg-muted text-ink-750",
    };
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  // Calculate remaining days
  const calculateRemainingDays = (dateDebut, duree) => {
    const startDate = new Date(dateDebut);
    const today = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Number.parseInt(duree));

    if (today < startDate) {
      // Recovery hasn't started yet
      return Number.parseInt(duree);
    } else if (today > endDate) {
      // Recovery has ended
      return 0;
    } else {
      // Recovery is in progress
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  };

  // Delete
  const handleDeleteClick = (r) => {
    setRecordToDelete(r);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recuperations/${recordToDelete._id}`,
        {
          method: "DELETE",
          body: recordToDelete,
          credentials: "include",
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Erreur lors de la mise à jour de la récupération"
        );
      }
      toast.success("Récupération supprimée");
      setRecords((prev) => prev.filter((r) => r._id !== recordToDelete._id));
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Erreur suppression");
    } finally {
      setDeleting(false);
    }
  };

  // Sorting
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filters & search
  const filtered = records.filter((r) => {
    const fullName =
      `${r.personnelId.firstName} ${r.personnelId.lastName}`.toLowerCase();
    if (
      !fullName.includes(searchTerm.toLowerCase()) &&
      !r.personnelId.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    const typeLabel = recoveryTypes[r.typeRecuperation]?.label || "";
    if (typeFilter.length && !typeFilter.includes(typeLabel)) return false;
    if (stationFilter.length && !stationFilter.includes(r.station?.name))
      return false;
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    switch (sortConfig.key) {
      case "employee":
        av = a.personnelId.lastName;
        bv = b.personnelId.lastName;
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
        av = Number.parseInt(a.dureeRecuperation);
        bv = Number.parseInt(b.dureeRecuperation);
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
  const endIndex = startIndex + itemsPerPage;
  const paged = sorted.slice(startIndex, endIndex);

  return (
    <div className="mx-auto w-full max-w-[1400px] p-6 lg:p-8 text-foreground">


      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Gestion des Récupérations</h1>
        <Button
          onClick={() => router.push("/recuperations/add")}
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter une récupération
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Input
            placeholder="Rechercher par nom, matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600"
            size={20}
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex space-x-2">
          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" /> Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Filtres</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Type de récupération
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.values(recoveryTypes).map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type.label}
                      checked={typeFilter.includes(type.label)}
                      onCheckedChange={(chk) =>
                        setTypeFilter((prev) =>
                          chk
                            ? [...prev, type.label]
                            : prev.filter((x) => x !== type.label)
                        )
                      }
                    >
                      {type.label}
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
                  }}
                >
                  Effacer tous les filtres
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Trier
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
                  {sortConfig.key === "employee" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="station">
                  Station{" "}
                  {sortConfig.key === "station" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dateDebut">
                  Date de début{" "}
                  {sortConfig.key === "dateDebut" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>

                <DropdownMenuRadioItem value="dateRetour">
                  Date de retour{" "}
                  {sortConfig.key === "dateRetour" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="duree">
                  Durée{" "}
                  {sortConfig.key === "duree" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {!!(searchTerm || typeFilter.length || stationFilter.length) && (
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
      <Card className="bg-card shadow-xs mb-8">
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-destructive-text">
              <AlertTriangle size={32} className="mr-2" /> {error}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Plane size={48} className="mb-2" /> Aucune récupération trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground"
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
                    <Button className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground"
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

                  <TableHead>
                    <Button className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground"
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
                    <Button className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground"
                      variant="ghost"
                      onClick={() => handleSort("dateRetour")}
                    >
                      Date de retour{" "}
                      {sortConfig.key === "dateRetour"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground" variant="ghost" onClick={() => handleSort("duree")}>
                      Durée{" "}
                      {sortConfig.key === "duree"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>Jours restants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r._id} className="hover:bg-background">
                    <TableCell>
                      {r.personnelId.firstName} {r.personnelId.lastName}
                      <div className="text-sm text-muted-foreground">
                        {r.personnelId.matricule}
                      </div>
                    </TableCell>
                    <TableCell>
                      
                      {r.stationName || "Non défini"}
                    </TableCell>
                    <TableCell>
                      
                      {formatDate(r.dateDebut)}
                    </TableCell>
                    <TableCell>
                      
                      {formatDate(r.dateRetour)}
                    </TableCell>
                    <TableCell>
                      {r.dureeRecuperation}{" "}
                      jour
                      {Number.parseInt(r.dureeRecuperation) > 1 ? "s" : ""}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-info">
                        {calculateRemainingDays(
                          r.dateDebut,
                          r.dureeRecuperation
                        )}{" "}
                        jour
                        {calculateRemainingDays(
                          r.dateDebut,
                          r.dureeRecuperation
                        ) > 1
                          ? "s"
                          : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/recuperations/details/${r._id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/recuperations/edit/${r._id}`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(r)}
                            className="text-destructive-text"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
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
            Affichage {startIndex + 1} à {Math.min(endIndex, sorted.length)} sur{" "}
            {sorted.length}
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
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
      <Toaster position="bottom-left" />
    </div>
  );
}
