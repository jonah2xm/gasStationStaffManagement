"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarX2,
  FileStack,
  History,
  LogIn,
  Plane,
  Printer,
  Search,
  Send,
  Undo2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
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
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { DESTINATION_CBR, TYPES_DOCUMENT, nomAgent } from "@/lib/bordereau";
import { FILTRES_TYPE, formatDate, formatDateHeure, pluriel } from "@/lib/suivi";
import { Checkbox } from "@/components/suivi/suivi-documents";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

const TYPE_ICONS = { absence: CalendarX2, reprise: LogIn, conge: Plane };

/** Clé unique d'un document : un même _id ne peut exister que dans un type. */
const cle = (doc) => `${doc.type}:${doc._id}`;

const nomsStations = (docs) => [...new Set(docs.map((d) => d.stationName).filter(Boolean))];

/**
 * Circuit Agence COM Oran → District CBR : documents réceptionnés des
 * stations (« Non délivré »), sélection, bordereau numéroté et historique.
 * Le passage à « Délivré » se fait ensuite depuis le Suivi des documents.
 */
export function EnvoiCbr() {
  const router = useRouter();

  const [onglet, setOnglet] = useState("attente");
  const [documents, setDocuments] = useState([]);
  const [bordereaux, setBordereaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("tous");
  const [station, setStation] = useState("toutes");
  const [selection, setSelection] = useState(() => new Set());

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [aAnnuler, setAAnnuler] = useState(null);
  const [annulationEnCours, setAnnulationEnCours] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [resAttente, resBordereaux] = await Promise.all([
        fetch(`${API}/api/bordereaux-cbr/en-attente`, { credentials: "include" }),
        fetch(`${API}/api/bordereaux-cbr`, { credentials: "include" }),
      ]);
      if (resAttente.status === 401 || resBordereaux.status === 401) {
        router.push("/login");
        return;
      }
      if (!resAttente.ok || !resBordereaux.ok) {
        const data = await (resAttente.ok ? resBordereaux : resAttente).json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors du chargement des envois");
      }
      const attente = await resAttente.json();
      setDocuments([...attente.absences, ...attente.reprises, ...attente.conges]);
      setBordereaux(await resBordereaux.json());
      setSelection(new Set());
      setError(null);
    } catch (err) {
      console.error("Error fetching envois CBR:", err);
      setError(err.message || "Impossible de charger les envois.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Retour depuis la vue d'impression : /envoi?circuit=cbr&onglet=historique
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("onglet") === "historique") {
        setOnglet("historique");
      }
    } catch {}
  }, []);

  const stations = useMemo(
    () => nomsStations(documents).sort((a, b) => a.localeCompare(b, "fr", { numeric: true })),
    [documents]
  );

  useEffect(() => {
    if (station !== "toutes" && !stations.includes(station)) setStation("toutes");
  }, [stations, station]);

  // Filtres hors type : base des compteurs du sélecteur de type.
  const documentsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return documents.filter((doc) => {
      if (station !== "toutes" && doc.stationName !== station) return false;
      if (!terme) return true;
      const p = doc.personnel || {};
      return `${p.firstName || ""} ${p.lastName || ""} ${p.matricule || ""} ${doc.stationName || ""}`
        .toLowerCase()
        .includes(terme);
    });
  }, [documents, station, recherche]);

  const comptesType = useMemo(() => {
    const comptes = { tous: documentsFiltres.length, absence: 0, reprise: 0, conge: 0 };
    documentsFiltres.forEach((d) => {
      comptes[d.type] += 1;
    });
    return comptes;
  }, [documentsFiltres]);

  const visibles = useMemo(
    () =>
      documentsFiltres
        .filter((doc) => filtreType === "tous" || doc.type === filtreType)
        .sort(
          (a, b) =>
            (a.stationName || "").localeCompare(b.stationName || "", "fr", { numeric: true }) ||
            new Date(b.date) - new Date(a.date)
        ),
    [documentsFiltres, filtreType]
  );

  const clesVisibles = visibles.map(cle);
  const nbVisiblesCoches = clesVisibles.filter((k) => selection.has(k)).length;
  const toutVisibleCoche = clesVisibles.length > 0 && nbVisiblesCoches === clesVisibles.length;

  const basculer = (doc, coche) =>
    setSelection((prev) => {
      const next = new Set(prev);
      if (coche) next.add(cle(doc));
      else next.delete(cle(doc));
      return next;
    });

  // « Tout sélectionner » porte sur les lignes affichées (filtres compris).
  const basculerVisibles = (coche) =>
    setSelection((prev) => {
      const next = new Set(prev);
      clesVisibles.forEach((k) => (coche ? next.add(k) : next.delete(k)));
      return next;
    });

  const selectionnes = documents.filter((d) => selection.has(cle(d)));
  const stationsSelection = nomsStations(selectionnes);
  const resumeSelection = ["absence", "reprise", "conge"]
    .map((type) => {
      const n = selectionnes.filter((d) => d.type === type).length;
      if (!n) return null;
      return type === "conge" ? pluriel(n, "congé") : pluriel(n, type);
    })
    .filter(Boolean)
    .join(" · ");

  const genererBordereau = async () => {
    setEnvoiEnCours(true);
    try {
      const corps = { absences: [], reprises: [], conges: [] };
      selectionnes.forEach((d) => corps[TYPES_DOCUMENT[d.type].champ].push(d._id));

      const response = await fetch(`${API}/api/bordereaux-cbr`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          setConfirmOpen(false);
          charger();
        }
        throw new Error(data.message || "Échec de la génération du bordereau");
      }

      setConfirmOpen(false);
      toast.success(`Bordereau N° ${data.reference} généré`, {
        duration: 3000,
        position: "bottom-left",
      });
      router.push(`/envoi/cbr/imprimer/${data._id}`);
    } catch (err) {
      console.error("Error creating bordereau CBR:", err);
      toast.error(err.message || "Erreur lors de la génération du bordereau", {
        duration: 3500,
        position: "bottom-left",
      });
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const annulerBordereau = async () => {
    if (!aAnnuler) return;
    setAnnulationEnCours(true);
    try {
      const response = await fetch(`${API}/api/bordereaux-cbr/${aAnnuler._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Échec de l’annulation");
      }

      setAAnnuler(null);
      toast.success(
        `Bordereau N° ${aAnnuler.reference} annulé — ${pluriel(data.liberes ?? 0, "document")} à transmettre`,
        { duration: 3500, position: "bottom-left" }
      );
      charger();
    } catch (err) {
      console.error("Error cancelling bordereau CBR:", err);
      toast.error(err.message || "Erreur lors de l’annulation", {
        duration: 3500,
        position: "bottom-left",
      });
    } finally {
      setAnnulationEnCours(false);
    }
  };

  const onglets = [
    { value: "attente", label: "À transmettre à la CBR", count: documents.length, icon: Send },
    { value: "historique", label: "Bordereaux CBR", count: bordereaux.length, icon: History },
  ];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Envois au District CBR"
        className="mb-6 inline-flex flex-wrap rounded-md border border-border bg-card p-1"
      >
        {onglets.map((tab) => {
          const actif = onglet === tab.value;
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={actif}
              onClick={() => setOnglet(tab.value)}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded px-3 text-[13px] font-medium transition-colors",
                actif ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  "rounded px-1.5 text-[11.5px] tabular-nums",
                  actif ? "bg-primary-foreground/20" : "bg-muted"
                )}
              >
                {loading ? "…" : tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {onglet === "attente" ? (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-80">
              <Input
                placeholder="Rechercher par nom, matricule, station..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-10"
                aria-label="Rechercher"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" size={20} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={station} onValueChange={setStation}>
                <SelectTrigger className="w-[190px]" aria-label="Station">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les stations</SelectItem>
                  {stations.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="inline-flex rounded-md border border-border bg-card p-0.5">
                {FILTRES_TYPE.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={filtreType === f.value}
                    onClick={() => setFiltreType(f.value)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium transition-colors",
                      filtreType === f.value
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                    <span className="tabular-nums text-muted-foreground">{comptesType[f.value]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Card className="mb-24 bg-card shadow-xs">
            <CardContent className="p-0">
              {loading ? (
                <TableSkeleton />
              ) : error ? (
                <div className="flex h-64 items-center justify-center text-destructive-text">
                  <AlertTriangle size={32} className="mr-2" /> {error}
                </div>
              ) : visibles.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center px-6 text-center text-muted-foreground">
                  <FileStack size={48} className="mb-2" />
                  {documents.length === 0
                    ? "Aucun document reçu en attente de transmission au District CBR"
                    : "Aucun document ne correspond aux filtres"}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={toutVisibleCoche}
                            indeterminate={nbVisiblesCoches > 0 && !toutVisibleCoche}
                            onChange={basculerVisibles}
                            label="Tout sélectionner"
                          />
                        </TableHead>
                        <TableHead>Document</TableHead>
                        <TableHead>Employé</TableHead>
                        <TableHead>Station</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Réceptionné le</TableHead>
                        <TableHead className="text-right">Imprimer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibles.map((doc) => {
                        const type = TYPES_DOCUMENT[doc.type];
                        const Icon = TYPE_ICONS[doc.type];
                        const coche = selection.has(cle(doc));
                        return (
                          <TableRow
                            key={cle(doc)}
                            data-state={coche ? "selected" : undefined}
                            className="cursor-pointer"
                            onClick={() => basculer(doc, !coche)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={coche}
                                onChange={(value) => basculer(doc, value)}
                                label={`Sélectionner ${type.label} — ${nomAgent(doc.personnel)}`}
                              />
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-2 text-[13.5px] font-medium">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                {type.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              {nomAgent(doc.personnel)}
                              <div className="text-sm text-muted-foreground">{doc.personnel?.matricule}</div>
                            </TableCell>
                            <TableCell>{doc.stationName || "—"}</TableCell>
                            <TableCell className="tabular-nums">
                              {formatDate(doc.date)}
                              <div className="text-sm text-muted-foreground">{type.libelleDate}</div>
                            </TableCell>
                            <TableCell className="tabular-nums">{formatDate(doc.statutGestionLe)}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Imprimer le document"
                                onClick={() => window.open(type.imprimer(doc._id), "_blank", "noopener")}
                              >
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Imprimer le document</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {selection.size > 0 && (
            <div className="sticky bottom-4 z-10 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13.5px]">
                <span className="font-semibold tabular-nums">{pluriel(selection.size, "document")}</span>{" "}
                {selection.size > 1 ? "sélectionnés" : "sélectionné"}
                <span className="text-muted-foreground">
                  {" "}
                  · {resumeSelection} · {pluriel(stationsSelection.length, "station")}
                </span>
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelection(new Set())}>
                  <X className="mr-1.5 h-4 w-4" />
                  Effacer
                </Button>
                <Button onClick={() => setConfirmOpen(true)}>
                  <Send className="mr-1.5 h-4 w-4" />
                  Générer le bordereau
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="bg-card shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton />
            ) : error ? (
              <div className="flex h-64 items-center justify-center text-destructive-text">
                <AlertTriangle size={32} className="mr-2" /> {error}
              </div>
            ) : bordereaux.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                <History size={48} className="mb-2" />
                Aucun bordereau CBR généré
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Stations</TableHead>
                      <TableHead className="text-right">Absences</TableHead>
                      <TableHead className="text-right">Reprises</TableHead>
                      <TableHead className="text-right">Congés</TableHead>
                      <TableHead>Délivrés</TableHead>
                      <TableHead>Généré par</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bordereaux.map((b) => {
                      const toutDelivre = b.nbDocuments > 0 && b.nbDelivres === b.nbDocuments;
                      return (
                        <TableRow key={b._id}>
                          <TableCell className="font-medium tabular-nums">{b.reference}</TableCell>
                          <TableCell className="tabular-nums">{formatDateHeure(b.createdAt)}</TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="block truncate" title={b.stations.join(", ")}>
                              {b.stations.join(", ") || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{b.nbAbsences}</TableCell>
                          <TableCell className="text-right tabular-nums">{b.nbReprises}</TableCell>
                          <TableCell className="text-right tabular-nums">{b.nbConges}</TableCell>
                          <TableCell>
                            <StatusBadge
                              kind="suivi"
                              value={toutDelivre ? "delivre" : "non_delivre"}
                              label={`${b.nbDelivres} / ${b.nbDocuments}`}
                            />
                          </TableCell>
                          <TableCell>{b.createdBy || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/envoi/cbr/imprimer/${b._id}`)}
                              >
                                <Printer className="mr-1.5 h-4 w-4" />
                                Imprimer
                              </Button>
                              {b.nbDelivres > 0 ? (
                                // Des documents sont déjà délivrés : l'annulation est refusée.
                                <span
                                  className="inline-flex h-9 items-center px-3 text-[13px] text-muted-foreground"
                                  title="Des documents sont déjà « Délivré » : repassez-les à « Non délivré » depuis le Suivi pour pouvoir annuler."
                                >
                                  Délivré
                                </span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive-text"
                                  onClick={() => setAAnnuler(b)}
                                >
                                  <Undo2 className="mr-1.5 h-4 w-4" />
                                  Annuler
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CustomAlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Générer le bordereau d’envoi au ${DESTINATION_CBR} ?`}
        description={`${pluriel(selection.size, "document")} de ${pluriel(
          stationsSelection.length,
          "station"
        )} ${selection.size > 1 ? "seront inclus" : "sera inclus"} dans un bordereau numéroté. Marquez-les « Délivré » depuis le Suivi des documents une fois remis.`}
        confirmText="Générer et imprimer"
        cancelText="Annuler"
        loading={envoiEnCours}
        onConfirm={genererBordereau}
      />

      <CustomAlertDialog
        open={Boolean(aAnnuler)}
        onOpenChange={(open) => !open && setAAnnuler(null)}
        title={`Annuler le bordereau N° ${aAnnuler?.reference || ""} ?`}
        description={
          aAnnuler
            ? `Les ${pluriel(aAnnuler.nbDocuments, "document")} de ce bordereau restent « Non délivré » et redeviennent « à transmettre ».`
            : ""
        }
        confirmText="Annuler le bordereau"
        cancelText="Garder"
        variant="destructive"
        loading={annulationEnCours}
        onConfirm={annulerBordereau}
      />
    </div>
  );
}
