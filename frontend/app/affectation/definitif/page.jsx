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
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog"
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


// Status types
const statusTypes = {
  active: { label: "Active", color: "border-success-border bg-success-subtle text-success-text" },
  pending: { label: "En attente", color: "border-input bg-card text-ink-750" },
};

export default function AffectationDefinitivePage() {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);
  const [stationFilter, setStationFilter] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "startDate",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stations, setStations] = useState([]);
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
        const [res1, res2] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationDef`, {
            method: "GET",
            credentials: "include",
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations`, {
            method: "GET",
            credentials: "include",
          }),
        ]);
        if (!res1.ok) throw new Error("Failed to load records");
        if (!res2.ok) throw new Error("Failed to load stations");

        setRecords(await res1.json());
        setStations((await res2.json()).map((s) => s.name));
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

  // Determine status
  const getStatusKey = (status) => {
    return status || "pending";
  };

  const getStatusBadge = (status) => {
    const key = getStatusKey(status);
    return (
      <Badge className={statusTypes[key].color}>{statusTypes[key].label}</Badge>
    );
  };

  // Delete
  const handleDeleteClick = (r) => {
    setRecordToDelete(r);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    console.log("recordToDelete", recordToDelete);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationDef/${recordToDelete._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete employee");
      }
      toast.success("Affectation supprimée");
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
      `${r.personnel.firstName} ${r.personnel.lastName}`.toLowerCase();
    if (!fullName.includes(searchTerm.toLowerCase())) return false;
    const statusLabel = statusTypes[getStatusKey(r.status)].label;
    if (statusFilter.length && !statusFilter.includes(statusLabel))
      return false;
    if (
      stationFilter.length &&
      ![r.originStation.name, r.affectedStation.name].some((n) =>
        stationFilter.includes(n)
      )
    )
      return false;
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let av, bv;
    switch (sortConfig.key) {
      case "employee":
        av = a.personnel.lastName;
        bv = b.personnel.lastName;
        break;
      case "origin":
        av = a.originStation.name;
        bv = b.originStation.name;
        break;
      case "dest":
        av = a.affectedStation.name;
        bv = b.affectedStation.name;
        break;
      case "startDate":
        av = new Date(a.startDate);
        bv = new Date(b.startDate);
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
        <h1 className="text-2xl font-semibold tracking-tight">Affectations Définitives</h1>
        <Button
          onClick={() => router.push("/affectation/definitif/add")}
        >
          <Plus className="mr-2 h-4 w-4" /> Ajouter
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Input
            placeholder="Rechercher par nom, matricule, station..."
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
              <DropdownMenuLabel>Statut</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Statut</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.values(statusTypes).map((st) => (
                    <DropdownMenuCheckboxItem
                      key={st.label}
                      checked={statusFilter.includes(st.label)}
                      onCheckedChange={(chk) => {
                        setStatusFilter((prev) =>
                          chk
                            ? [...prev, st.label]
                            : prev.filter((l) => l !== st.label)
                        );
                      }}
                    >
                      {st.label}
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

              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter([]);
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
                <DropdownMenuRadioItem value="origin">
                  Origine{" "}
                  {sortConfig.key === "origin" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dest">
                  Destination{" "}
                  {sortConfig.key === "dest" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="startDate">
                  Date d'affectation{" "}
                  {sortConfig.key === "startDate" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchTerm || statusFilter.length || stationFilter.length) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>
          {statusFilter.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              Statut: {s}
              <X
                className="ml-1 cursor-pointer"
                size={12}
                onClick={() => setStatusFilter((p) => p.filter((x) => x !== s))}
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
              <MapPin size={48} className="mb-2" /> Aucune donnée
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
                      onClick={() => handleSort("origin")}
                    >
                      Origine{" "}
                      {sortConfig.key === "origin"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground" variant="ghost" onClick={() => handleSort("dest")}>
                      Destination{" "}
                      {sortConfig.key === "dest"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground"
                      variant="ghost"
                      onClick={() => handleSort("startDate")}
                    >
                      Date d'affectation{" "}
                      {sortConfig.key === "startDate"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => (
                  <TableRow key={r._id} className="hover:bg-background">
                    <TableCell>
                      {r.personnel.firstName} {r.personnel.lastName}
                      <div className="text-sm text-muted-foreground">
                        {r.personnel.matricule}
                      </div>
                    </TableCell>
                    <TableCell>
                      
                      {r.originStation.name}
                    </TableCell>
                    <TableCell>
                      
                      {r.affectedStation.name}
                    </TableCell>
                    <TableCell>{formatDate(r.startDate)}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
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
                              router.push(`/affectation/definitif/details/${r._id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/affectation/definitif/edit/${r._id}`
                              )
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
