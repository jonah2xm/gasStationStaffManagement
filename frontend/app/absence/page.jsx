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
  CalendarX2,
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
import { bordereauVerrou } from "@/lib/bordereau";
import {
  ABSENCE_MOTIFS,
  isAutorisee,
  isSignaled48h,
  motifLabel,
} from "@/lib/absence-motifs";

export default function AbsenceListPage() {
  const router = useRouter();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [motifFilter, setMotifFilter] = useState([]);
  const [stationFilter, setStationFilter] = useState([]);
  const [natureFilter, setNatureFilter] = useState([]);
  const [etatFilter, setEtatFilter] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 8;

  useEffect(() => {
    const fetchAbsences = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des absences");
        }
        setAbsences(await response.json());
        setError(null);
      } catch (err) {
        console.error("Error fetching absences:", err);
        setError("Impossible de charger les absences. Réessayez plus tard.");
        toast.error("Impossible de charger les absences", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAbsences();
  }, [router]);

  const formatDate = (value) =>
    new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDeleteClick = (absence) => {
    setAbsenceToDelete(absence);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!absenceToDelete) return;
    setDeleting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/${absenceToDelete._id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Échec de la suppression");
      }

      setAbsences((prev) => prev.filter((a) => a._id !== absenceToDelete._id));
      setDeleteDialogOpen(false);
      toast.success("Absence supprimée avec succès", {
        duration: 3000,
        position: "bottom-left",
      });
    } catch (err) {
      console.error("Error deleting absence:", err);
      toast.error(err.message || "Erreur lors de la suppression", {
        duration: 3000,
        position: "bottom-left",
      });
    } finally {
      setDeleting(false);
    }
  };

  const stations = [
    ...new Set(absences.map((a) => a.personnel?.stationName).filter(Boolean)),
  ];

  const filtered = absences.filter((absence) => {
    const p = absence.personnel || {};
    const haystack = `${p.firstName || ""} ${p.lastName || ""} ${p.matricule || ""
      }`.toLowerCase();

    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesMotif =
      motifFilter.length === 0 || motifFilter.includes(absence.motif);
    const matchesStation =
      stationFilter.length === 0 || stationFilter.includes(p.stationName);

    const nature = isAutorisee(absence.motif) ? "Autorisée" : "Non autorisée";
    const matchesNature =
      natureFilter.length === 0 || natureFilter.includes(nature);

    const etat = absence.reprise ? "Clôturée" : "Ouverte";
    const matchesEtat = etatFilter.length === 0 || etatFilter.includes(etat);

    return (
      matchesSearch && matchesMotif && matchesStation && matchesNature && matchesEtat
    );
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
      case "motif":
        av = motifLabel(a.motif);
        bv = motifLabel(b.motif);
        break;
      case "date":
      default:
        av = new Date(a.date);
        bv = new Date(b.date);
    }
    if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
    if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paged = sorted.slice(startIndex, startIndex + itemsPerPage);

  const signaledCount = absences.filter(isSignaled48h).length;

  return (
    <div className="mx-auto w-full max-w-[1400px] p-6 lg:p-8 text-foreground">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Gestion des Absences
          </h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Absences autorisées et non autorisées, réunies en une seule liste.
          </p>
        </div>
        <Button onClick={() => router.push("/absence/add")}>
          <Plus className="mr-2 h-4 w-4" /> Ajouter une absence
        </Button>
      </div>

      {/* Alerte 48 h — uniquement les absences non autorisées */}
      {!loading && signaledCount > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive-border bg-destructive-subtle px-4 py-3">
          <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-destructive" />
          <p className="text-[13.5px] text-destructive-text">
            <span className="font-semibold">
              {signaledCount} absence{signaledCount > 1 ? "s" : ""} non
              autorisée{signaledCount > 1 ? "s" : ""}
            </span>{" "}
            dépasse{signaledCount > 1 ? "nt" : ""} 48 heures sans avis de
            reprise.
          </p>
          <Button
            variant="outline"
            className="ml-auto shrink-0"
            onClick={() => setNatureFilter(["Non autorisée"])}
          >
            Voir
          </Button>
        </div>
      )}

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
                <DropdownMenuSubTrigger>Nature</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {["Autorisée", "Non autorisée"].map((label) => (
                    <DropdownMenuCheckboxItem
                      key={label}
                      checked={natureFilter.includes(label)}
                      onCheckedChange={(chk) =>
                        setNatureFilter((prev) =>
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

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>État</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {["Ouverte", "Clôturée"].map((label) => (
                    <DropdownMenuCheckboxItem
                      key={label}
                      checked={etatFilter.includes(label)}
                      onCheckedChange={(chk) =>
                        setEtatFilter((prev) =>
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

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Motif</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {ABSENCE_MOTIFS.map((m) => (
                    <DropdownMenuCheckboxItem
                      key={m.value}
                      checked={motifFilter.includes(m.value)}
                      onCheckedChange={(chk) =>
                        setMotifFilter((prev) =>
                          chk
                            ? [...prev, m.value]
                            : prev.filter((x) => x !== m.value)
                        )
                      }
                    >
                      {m.label}
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
                    setMotifFilter([]);
                    setStationFilter([]);
                    setNatureFilter([]);
                    setEtatFilter([]);
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
                  { key: "motif", label: "Motif" },
                  { key: "date", label: "Date d'absence" },
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
      {(searchTerm ||
        motifFilter.length > 0 ||
        stationFilter.length > 0 ||
        natureFilter.length > 0 ||
        etatFilter.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium">Filtres actifs:</span>
            {etatFilter.map((e) => (
              <Badge key={e} variant="secondary" className="text-xs">
                État: {e}
                <X
                  className="ml-1 cursor-pointer"
                  size={12}
                  onClick={() => setEtatFilter((p) => p.filter((x) => x !== e))}
                />
              </Badge>
            ))}
            {natureFilter.map((n) => (
              <Badge key={n} variant="secondary" className="text-xs">
                Nature: {n}
                <X
                  className="ml-1 cursor-pointer"
                  size={12}
                  onClick={() =>
                    setNatureFilter((p) => p.filter((x) => x !== n))
                  }
                />
              </Badge>
            ))}
            {motifFilter.map((m) => (
              <Badge key={m} variant="secondary" className="text-xs">
                Motif: {motifLabel(m)}
                <X
                  className="ml-1 cursor-pointer"
                  size={12}
                  onClick={() => setMotifFilter((p) => p.filter((x) => x !== m))}
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
              <CalendarX2 size={48} className="mb-2" /> Aucune absence trouvée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    { key: "employee", label: "Employé" },
                    { key: "station", label: "Station" },
                    { key: "motif", label: "Motif" },
                    { key: "date", label: "Date d'absence" },
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
                  <TableHead>Nature</TableHead>
                  <TableHead>Reprise</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((a) => (
                  <TableRow key={a._id} className="hover:bg-background">
                    <TableCell>
                      {a.personnel?.firstName} {a.personnel?.lastName}
                      {bordereauVerrou(a) && <EnvoyeBadge />}
                      <div className="text-sm text-muted-foreground">
                        {a.personnel?.matricule}
                      </div>
                    </TableCell>
                    <TableCell>{a.personnel?.stationName}</TableCell>
                    <TableCell>
                      <StatusBadge kind="absence" value={a.motif} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDate(a.date)}
                    </TableCell>
                    <TableCell>
                      {isSignaled48h(a) ? (
                        <Badge className="border-destructive-border bg-destructive-subtle text-destructive-text">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Plus de 48 h
                        </Badge>
                      ) : isAutorisee(a.motif) ? (
                        <span className="text-[13.5px] text-muted-foreground">
                          Autorisée
                        </span>
                      ) : (
                        <span className="text-[13.5px] text-destructive-text">
                          Non autorisée
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {a.reprise ? (
                        <Badge className="border-success-border bg-success-subtle text-success-text">
                          Clôturée le {formatDate(a.reprise.dateReprise)}
                        </Badge>
                      ) : (
                        <span className="text-[13.5px] text-muted-foreground">
                          Ouverte
                        </span>
                      )}
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
                              router.push(`/absence/details/${a._id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/absence/imprimer/${a._id}`)
                            }
                          >
                            <Printer className="mr-2 h-4 w-4" /> Imprimer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={Boolean(bordereauVerrou(a))}
                            onClick={() => router.push(`/absence/edit/${a._id}`)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive-text"
                            disabled={Boolean(bordereauVerrou(a))}
                            onClick={() => handleDeleteClick(a)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                          </DropdownMenuItem>
                          {bordereauVerrou(a) && <VerrouMenuNote />}
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
        description="Êtes-vous sûr de vouloir supprimer cette absence ? Cette action est irréversible."
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
