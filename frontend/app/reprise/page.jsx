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
  X,
  AlertTriangle,
  Filter,
  SlidersHorizontal,
  LogIn,
  Printer,
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
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { EnvoyeBadge, VerrouMenuNote } from "@/components/document-verrouille";

export default function RepriseListPage() {
  const router = useRouter();
  const [reprises, setReprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stationFilter, setStationFilter] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "dateReprise",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repriseToDelete, setRepriseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchReprises = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des avis de reprise");
        }
        setReprises(await response.json());
        setError(null);
      } catch (err) {
        console.error("Error fetching reprises:", err);
        setError("Impossible de charger les avis de reprise.");
        toast.error("Impossible de charger les avis de reprise", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReprises();
  }, [router]);

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "—";

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const confirmDelete = async () => {
    if (!repriseToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises/${repriseToDelete._id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Échec de la suppression");
      }

      setReprises((prev) => prev.filter((r) => r._id !== repriseToDelete._id));
      setDeleteDialogOpen(false);
      toast.success(
        "Avis supprimé — les absences concernées sont rouvertes",
        { duration: 3500, position: "bottom-left" }
      );
    } catch (err) {
      console.error("Error deleting reprise:", err);
      toast.error(err.message || "Erreur lors de la suppression", {
        duration: 3000,
        position: "bottom-left",
      });
    } finally {
      setDeleting(false);
    }
  };

  const stations = [
    ...new Set(reprises.map((r) => r.personnel?.stationName).filter(Boolean)),
  ];

  /** Première absence clôturée : c'est le début de l'absence de l'agent. */
  const firstAbsenceDate = (reprise) => {
    if (!reprise.absences?.length) return null;
    return reprise.absences
      .map((a) => new Date(a.date))
      .sort((a, b) => a - b)[0];
  };

  const filtered = reprises.filter((reprise) => {
    const p = reprise.personnel || {};
    const haystack = `${p.firstName || ""} ${p.lastName || ""} ${p.matricule || ""
      }`.toLowerCase();

    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStation =
      stationFilter.length === 0 || stationFilter.includes(p.stationName);

    return matchesSearch && matchesStation;
  });

  const sorted = [...filtered].sort((a, b) => {
    let av;
    let bv;
    switch (sortConfig.key) {
      case "employee":
        av = `${a.personnel?.lastName || ""} ${a.personnel?.firstName || ""}`;
        bv = `${b.personnel?.lastName || ""} ${b.personnel?.firstName || ""}`;
        break;
      case "station":
        av = a.personnel?.stationName || "";
        bv = b.personnel?.stationName || "";
        break;
      case "dateReprise":
      default:
        av = new Date(a.dateReprise);
        bv = new Date(b.dateReprise);
    }
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paged = sorted.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="mx-auto w-full max-w-[1400px] p-6 lg:p-8 text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Avis de reprise
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Reprises de service : chaque avis clôture les absences ouvertes de
            l&apos;agent et le remet en service.
          </p>
        </div>
        <Button onClick={() => router.push("/reprise/add")}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter un avis de reprise
        </Button>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
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

        <div className="flex space-x-2">
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
                    setStationFilter([]);
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
                {[
                  { key: "employee", label: "Employé" },
                  { key: "station", label: "Station" },
                  { key: "dateReprise", label: "Date de reprise" },
                ].map((item) => (
                  <DropdownMenuRadioItem key={item.key} value={item.key}>
                    {item.label}{" "}
                    {sortConfig.key === item.key
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : null}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filtres actifs */}
      {(searchTerm || stationFilter.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>
          {stationFilter.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              Station: {s}
              <X
                className="ml-1 cursor-pointer"
                size={12}
                onClick={() => setStationFilter((p) => p.filter((x) => x !== s))}
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

      {/* Tableau */}
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
              <LogIn size={48} className="mb-2" /> Aucun avis de reprise trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: "employee", label: "Employé" },
                    { key: "station", label: "Station" },
                  ].map((col) => (
                    <TableHead key={col.key}>
                      <Button
                        className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground"
                        variant="ghost"
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}{" "}
                        {sortConfig.key === col.key
                          ? sortConfig.direction === "asc"
                            ? "↑"
                            : "↓"
                          : null}
                      </Button>
                    </TableHead>
                  ))}
                  <TableHead>Motif de l&apos;absence</TableHead>
                  <TableHead>Absence depuis</TableHead>
                  <TableHead>
                    <Button
                      className="-ml-2.5 h-8 px-2.5 text-[11.5px] font-semibold uppercase tracking-[0.05em] text-ink-750 hover:text-foreground"
                      variant="ghost"
                      onClick={() => handleSort("dateReprise")}
                    >
                      Date de reprise{" "}
                      {sortConfig.key === "dateReprise"
                        ? sortConfig.direction === "asc"
                          ? "↑"
                          : "↓"
                        : null}
                    </Button>
                  </TableHead>
                  <TableHead>Jours clôturés</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((r) => {
                  const first = firstAbsenceDate(r);
                  return (
                    <TableRow key={r._id} className="hover:bg-background">
                      <TableCell>
                        {r.personnel?.firstName} {r.personnel?.lastName}
                        {r.bordereau && <EnvoyeBadge />}
                        <div className="text-sm text-muted-foreground">
                          {r.personnel?.matricule}
                        </div>
                      </TableCell>
                      <TableCell>{r.personnel?.stationName}</TableCell>
                      <TableCell>
                        {r.absences?.length ? (
                          <StatusBadge
                            kind="absence"
                            value={r.absences[0].motif}
                          />
                        ) : (
                          <span className="text-[13.5px] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDate(first)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDate(r.dateReprise)}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {r.absences?.length || 0} j
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
                                router.push(`/reprise/details/${r._id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/reprise/imprimer/${r._id}`)
                              }
                            >
                              <Printer className="mr-2 h-4 w-4" /> Imprimer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={Boolean(r.bordereau)}
                              onClick={() =>
                                router.push(`/reprise/edit/${r._id}`)
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive-text"
                              disabled={Boolean(r.bordereau)}
                              onClick={() => {
                                setRepriseToDelete(r);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                            {r.bordereau && <VerrouMenuNote />}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
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

      <CustomAlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmer la suppression"
        description="Supprimer cet avis de reprise rouvrira les absences qu'il a clôturées et remettra l'agent en statut Absent. Cette action est irréversible."
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
