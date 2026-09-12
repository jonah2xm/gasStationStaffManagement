"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import {
    Input
} from "@/components/ui/input";
import {
    Button
} from "@/components/ui/button";
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
    Search,
    ChevronLeft,
    ChevronRight,
    X,
    Filter,
    Download,
    Loader2,
    Clock,
    Calendar as CalendarIcon,
    Plus,
    Edit,
    Trash2,
    MoreHorizontal,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PointageListPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({
        key: "date",
        direction: "desc",
    });
    const [stationFilter, setStationFilter] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [pointageData, setPointageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pointageToDelete, setPointageToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchPointages();
    }, []);

    const fetchPointages = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pointage`,
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (response.status === 401) {
                router.push("/login");
                return;
            }

            if (!response.ok) {
                throw new Error("Failed to fetch pointages");
            }

            const data = await response.json();
            setPointageData(data);
            setError(null);
        } catch (error) {
            console.error("Error fetching pointages:", error);
            setError("Erreur lors du chargement des pointages.");
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    const filteredPointages = useMemo(() => {
        return pointageData.filter(
            (p) => {
                const matchesSearch =
                    searchTerm === "" ||
                    p.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.stationName.toLowerCase().includes(searchTerm.toLowerCase());

                const matchesStation = stationFilter.length === 0 || stationFilter.includes(p.stationName);

                const pDate = new Date(p.date);
                pDate.setHours(0, 0, 0, 0);

                let matchesDate = true;
                if (startDate) {
                    const sDate = new Date(startDate);
                    sDate.setHours(0, 0, 0, 0);
                    if (pDate < sDate) matchesDate = false;
                }
                if (endDate) {
                    const eDate = new Date(endDate);
                    eDate.setHours(23, 59, 59, 999);
                    if (pDate > eDate) matchesDate = false;
                }

                return matchesSearch && matchesStation && matchesDate;
            }
        );
    }, [searchTerm, stationFilter, startDate, endDate, pointageData]);

    const sortedPointages = useMemo(() => {
        const sortedList = [...filteredPointages];
        if (sortConfig.key) {
            sortedList.sort((a, b) => {
                let aValue = a[sortConfig.key] || "";
                let bValue = b[sortConfig.key] || "";

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
    }, [filteredPointages, sortConfig]);

    const totalPages = Math.ceil(sortedPointages.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPointages = sortedPointages.slice(startIndex, endIndex);

    const handleSort = (key) => {
        setSortConfig((prevConfig) => ({
            key,
            direction:
                prevConfig.key === key && prevConfig.direction === "asc"
                    ? "desc"
                    : "asc",
        }));
    };

    const handleDeleteClick = (p) => {
        setPointageToDelete(p);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!pointageToDelete) return;
        setIsDeleting(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pointage/${pointageToDelete._id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
            if (!response.ok) throw new Error("Erreur");
            toast.success("Pointage supprimé");
            setPointageData(prev => prev.filter(item => item._id !== pointageToDelete._id));
            setDeleteDialogOpen(false);
        } catch (e) {
            toast.error("Erreur de suppression");
        } finally {
            setIsDeleting(false);
        }
    };

    const clearAllFilters = () => {
        setStationFilter([]);
        setSearchTerm("");
        setStartDate("");
        setEndDate("");
        setSortConfig({ key: "date", direction: "desc" });
    };

    const exportToExcel = () => {
        const rows = sortedPointages.map((p) => ({
            Matricule: p.matricule,
            Nom: p.lastName.toUpperCase(),
            Prénom: p.firstName,
            Station: p.stationName,
            Date: new Date(p.date).toLocaleDateString("fr-FR"),
            Entrée: p.entryTime ? new Date(p.entryTime).toLocaleTimeString("fr-FR") : "-",
            Sortie: p.exitTime ? new Date(p.exitTime).toLocaleTimeString("fr-FR") : "-",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pointages");
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(
            new Blob([wbout], { type: "application/octet-stream" }),
            `pointages_${new Date().toISOString().split("T")[0]}.xlsx`
        );
    };

    const formatTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    };

    const formatDateLabel = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const allStations = useMemo(() => {
        return [...new Set(pointageData.map((p) => p.stationName))]
            .filter(Boolean)
            .sort();
    }, [pointageData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, stationFilter, startDate, endDate, sortConfig]);

    return (
        <div className="mx-auto w-full max-w-[1400px] p-6 lg:p-8 text-foreground">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Historique des Pointages</h1>
                    <p className="text-muted-foreground mt-1">Suivi de présence par personnel (Consolidé)</p>
                </div>
                <div className="flex gap-4">
                    <Link href="/pointage-list/add">
                        <Button className="rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Pointage Manuel
                        </Button>
                    </Link>
                    <Button onClick={exportToExcel} variant="outline" className="flex items-center rounded-xl border-input">
                        <Download className="mr-2 h-4 w-4" /> Exporter Excel
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end mb-6 space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex flex-col md:flex-row flex-1 gap-4 w-full">
                    <div className="relative flex-1 max-w-sm">
                        <label className="text-xs font-semibold text-muted-foreground mb-1 block">Recherche</label>
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Matricule, nom, station..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full bg-card rounded-xl border-input focus:border-foreground"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-600" size={18} />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Du</label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-card rounded-xl border-input focus:border-foreground"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Au</label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-card rounded-xl border-input focus:border-foreground"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-xl border-input">
                                <Filter className="mr-2 h-4 w-4" />
                                Stations
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Stations</DropdownMenuLabel>
                            <DropdownMenuSeparator />
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
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(searchTerm || stationFilter.length > 0 || startDate || endDate) && (
                        <Button variant="ghost" onClick={clearAllFilters} className="text-muted-foreground">
                            <X className="mr-2 h-4 w-4" /> Effacer
                        </Button>
                    )}
                </div>
            </div>

            <Card className="bg-card shadow-xs mb-8 overflow-hidden rounded-2xl border-none">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-ink-700" />
                            <p className="text-muted-foreground font-medium">Récupération des données...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col justify-center items-center h-64 text-destructive-text space-y-4">
                            <p className="font-medium">{error}</p>
                            <Button variant="outline" onClick={fetchPointages} className="rounded-xl">Réessayer</Button>
                        </div>
                    ) : currentPointages.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-64 text-ink-600 space-y-2">
                            <Clock className="h-12 w-12 opacity-20" />
                            <p className="font-medium">Aucun enregistrement trouvé</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-ink-50">
                                <TableRow className="border-b border-border">
                                    <TableHead className="font-semibold text-ink-800 py-4">Matricule</TableHead>
                                    <TableHead className="font-semibold text-ink-800 py-4">Personnel</TableHead>
                                    <TableHead className="font-semibold text-ink-800 py-4">Station</TableHead>
                                    <TableHead className="cursor-pointer font-semibold text-ink-800 py-4" onClick={() => handleSort("date")}>
                                        <div className="flex items-center gap-2">
                                            Date
                                            {sortConfig.key === "date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-ink-800 py-4">Entrée</TableHead>
                                    <TableHead className="font-semibold text-ink-800 py-4">Sortie</TableHead>
                                    <TableHead className="text-right py-4 pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentPointages.map((p) => (
                                    <TableRow key={p._id} className="hover:bg-ink-50 transition-colors border-b border-ink-150 last:border-0">
                                        <TableCell className="font-mono text-sm text-info font-semibold">{p.matricule}</TableCell>
                                        <TableCell className="font-semibold text-foreground">
                                            {p.lastName.toUpperCase()} {p.firstName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-background text-ink-750 border-border rounded-lg">
                                                {p.stationName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-ink-750">
                                                <CalendarIcon className="h-4 w-4 text-ink-600" />
                                                <span className="text-sm font-medium">{formatDateLabel(p.date)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {p.entryTime ? (
                                                <div className="flex items-center gap-1.5 text-success font-semibold bg-success-subtle px-2.5 py-1.5 rounded-lg w-fit text-xs border border-success-border shadow-sm">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatTime(p.entryTime)}
                                                </div>
                                            ) : (
                                                <span className="text-ink-450">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {p.exitTime ? (
                                                <div className="flex items-center gap-1.5 text-warning font-semibold bg-warning-subtle px-2.5 py-1.5 rounded-lg w-fit text-xs border border-warning-border shadow-sm">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    {formatTime(p.exitTime)}
                                                </div>
                                            ) : (
                                                <span className="text-ink-450">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-border shadow-xs">
                                                    <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Options</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => router.push(`/pointage-list/edit/${p._id}`)} className="cursor-pointer hover:bg-info-subtle text-info focus:text-info-text focus:bg-info-subtle">
                                                        <Edit className="mr-2 h-4 w-4" /> Modifier
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(p)} className="cursor-pointer hover:bg-destructive-subtle text-destructive-text focus:text-destructive-text focus:bg-destructive-subtle">
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

            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-xs border-none mb-10">
                    <p className="text-sm text-muted-foreground font-medium">
                        Affichage de <span className="font-semibold text-foreground">{startIndex + 1}</span> à{" "}
                        <span className="font-semibold text-foreground">{Math.min(endIndex, sortedPointages.length)}</span> sur{" "}
                        <span className="font-semibold text-foreground">{sortedPointages.length}</span> résultats
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="rounded-xl border-border h-10 px-4"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="rounded-xl border-border h-10 px-4"
                        >
                            Suivant <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}

            <CustomAlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                title="Supprimer le pointage ?"
                description={`Êtes-vous sûr de vouloir supprimer les enregistrements de ${pointageToDelete?.lastName} ${pointageToDelete?.firstName} pour le ${pointageToDelete ? formatDateLabel(pointageToDelete.date) : ''} ? Cette action est irréversible.`}
                confirmText="Supprimer"
                cancelText="Annuler"
                variant="destructive"
                loading={isDeleting}
            />

            <Toaster position="bottom-right" />
        </div>
    );
}
