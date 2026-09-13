"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Toaster } from "@/components/ui/toaster";

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
import { cn } from "@/lib/utils";
import { DESTINATION, TYPES_DOCUMENT, nomAgent } from "@/lib/bordereau";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

const TYPE_ICONS = { absence: CalendarX2, reprise: LogIn, conge: Plane };

const FILTRES_TYPE = [
  { value: "tous", label: "Tous" },
  { value: "absence", label: "Absences" },
  { value: "reprise", label: "Reprises" },
  { value: "conge", label: "Congés" },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const formatDateHeure = (value) =>
  value
    ? new Date(value).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/** Clé unique d'un document : un même _id ne peut exister que dans un type. */
const cle = (doc) => `${doc.type}:${doc._id}`;

/** Case à cocher native, avec l'état intermédiaire du « tout sélectionner ». */
function Checkbox({ checked, indeterminate = false, onChange, label, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 cursor-pointer accent-primary align-middle disabled:cursor-not-allowed disabled:opacity-40"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      aria-label={label}
      disabled={disabled}
    />
  );
}

export default function EnvoiPage() {
  const router = useRouter();

  const [onglet, setOnglet] = useState("attente");
  const [documents, setDocuments] = useState([]);
  const [bordereaux, setBordereaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [filtreType, setFiltreType] = useState("tous");
  const [station, setStation] = useState("");
  const [selection, setSelection] = useState(() => new Set());

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [aAnnuler, setAAnnuler] = useState(null);
  const [annulationEnCours, setAnnulationEnCours] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [resAttente, resBordereaux] = await Promise.all([
        fetch(`${API}/api/bordereaux/en-attente`, { credentials: "include" }),
        fetch(`${API}/api/bordereaux`, { credentials: "include" }),
      ]);
      if (resAttente.status === 401 || resBordereaux.status === 401) {
        router.push("/login");
        return;
      }
      if (!resAttente.ok || !resBordereaux.ok) {
        throw new Error("Erreur lors du chargement des envois");
      }
      const attente = await resAttente.json();
      setDocuments([...attente.absences, ...attente.reprises, ...attente.conges]);
      setBordereaux(await resBordereaux.json());
      setError(null);
    } catch (err) {
      console.error("Error fetching envois:", err);
      setError("Impossible de charger les envois.");
      toast.error("Impossible de charger les envois", {
        duration: 3000,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Lien direct vers l'historique (/envoi?onglet=historique), utilisé par le
  // bandeau des documents verrouillés.
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("onglet") === "historique") {
        setOnglet("historique");
      }
    } catch {}
  }, []);

  const stations = useMemo(
    () => [...new Set(documents.map((d) => d.stationName).filter(Boolean))].sort(),
    [documents]
  );

  // Un bordereau ne couvre qu'une station. Un chef de station n'en voit
  // qu'une ; un administrateur ou un gestionnaire doit d'abord en choisir une.
  const choixStationRequis = stations.length > 1;

  useEffect(() => {
    if (stations.length === 1) setStation(stations[0]);
    else if (station && !stations.includes(station)) setStation("");
  }, [stations, station]);

  // Changer de station repart d'une sélection vide.
  useEffect(() => {
    setSelection(new Set());
  }, [station]);

  const peutSelectionner = !choixStationRequis || Boolean(station);

  const documentsStation = useMemo(
    () => (station ? documents.filter((d) => d.stationName === station) : documents),
    [documents, station]
  );

  const comptesType = useMemo(() => {
    const comptes = { tous: documentsStation.length, absence: 0, reprise: 0, conge: 0 };
    documentsStation.forEach((d) => {
      comptes[d.type] += 1;
    });
    return comptes;
  }, [documentsStation]);

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return documentsStation
      .filter((doc) => {
        if (filtreType !== "tous" && doc.type !== filtreType) return false;
        if (!terme) return true;
        const p = doc.personnel || {};
        return `${p.firstName || ""} ${p.lastName || ""} ${p.matricule || ""}`
          .toLowerCase()
          .includes(terme);
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [documentsStation, filtreType, recherche]);

  const clesVisibles = visibles.map(cle);
  const nbVisiblesCoches = clesVisibles.filter((k) => selection.has(k)).length;
  const toutVisibleCoche =
    clesVisibles.length > 0 && nbVisiblesCoches === clesVisibles.length;

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
  const resumeSelection = ["absence", "reprise", "conge"]
    .map((type) => {
      const n = selectionnes.filter((d) => d.type === type).length;
      if (!n) return null;
      return type === "conge" ? pluriel(n, "congé") : pluriel(n, type);
    })
    .filter(Boolean)
    .join(" · ");
  const stationSelection = selectionnes[0]?.stationName || station;

  const genererBordereau = async () => {
    setEnvoiEnCours(true);
    try {
      const corps = { absences: [], reprises: [], conges: [] };
      selectionnes.forEach((d) => corps[TYPES_DOCUMENT[d.type].champ].push(d._id));

      const response = await fetch(`${API}/api/bordereaux`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Un document envoyé entre-temps : on recharge la liste à jour.
        if (response.status === 409) {
          setConfirmOpen(false);
          setSelection(new Set());
          charger();
        }
        throw new Error(data.message || "Échec de la génération du bordereau");
      }

      setConfirmOpen(false);
      toast.success("Bordereau généré — documents marqués envoyés", {
        duration: 3000,
        position: "bottom-left",
      });
      router.push(`/envoi/imprimer/${data._id}`);
    } catch (err) {
      console.error("Error creating bordereau:", err);
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
      const response = await fetch(`${API}/api/bordereaux/${aAnnuler._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Échec de l’annulation");
      }

      setAAnnuler(null);
      toast.success(
        `Bordereau annulé — ${pluriel(data.liberes ?? 0, "document")} à renvoyer`,
        { duration: 3500, position: "bottom-left" }
      );
      charger();
    } catch (err) {
      console.error("Error cancelling bordereau:", err);
      toast.error(err.message || "Erreur lors de l’annulation", {
        duration: 3000,
        position: "bottom-left",
      });
    } finally {
      setAnnulationEnCours(false);
    }
  };

  const onglets = [
    { value: "attente", label: "À envoyer", count: documents.length, icon: Send },
    { value: "historique", label: "Bordereaux", count: bordereaux.length, icon: History },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] p-6 lg:p-8 text-foreground">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Envois</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">
          Transmettez à l’{DESTINATION} les documents imprimés : chaque envoi
          génère un bordereau d’envoi et marque les documents comme envoyés.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Envois"
        className="mb-6 inline-flex rounded-md border border-border bg-card p-1"
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
                actif
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-80">
              <Input
                placeholder="Rechercher par nom, matricule..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-10"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600"
                size={20}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {choixStationRequis && (
                <Select value={station} onValueChange={setStation}>
                  <SelectTrigger className="w-[200px]" aria-label="Station">
                    <SelectValue placeholder="Choisir une station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

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
                    <span className="tabular-nums text-muted-foreground">
                      {comptesType[f.value]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {choixStationRequis && !station && (
            <p className="mb-4 flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-[13.5px] text-muted-foreground">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Un bordereau ne regroupe que les documents d’une seule station :
              choisissez-en une pour sélectionner des documents.
            </p>
          )}

          <Card className="mb-24 bg-card shadow-xs">
            <CardContent className="p-0">
              {loading ? (
                <TableSkeleton />
              ) : error ? (
                <div className="flex h-64 items-center justify-center text-destructive-text">
                  <AlertTriangle size={32} className="mr-2" /> {error}
                </div>
              ) : visibles.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <FileStack size={48} className="mb-2" />
                  {documents.length === 0
                    ? "Tous les documents ont été envoyés"
                    : "Aucun document ne correspond aux filtres"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={toutVisibleCoche}
                          indeterminate={nbVisiblesCoches > 0 && !toutVisibleCoche}
                          onChange={basculerVisibles}
                          label="Tout sélectionner"
                          disabled={!peutSelectionner}
                        />
                      </TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Employé</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Créé le</TableHead>
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
                          className={cn(peutSelectionner && "cursor-pointer")}
                          onClick={() => peutSelectionner && basculer(doc, !coche)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={coche}
                              onChange={(value) => basculer(doc, value)}
                              label={`Sélectionner ${type.label} — ${nomAgent(doc.personnel)}`}
                              disabled={!peutSelectionner}
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
                            <div className="text-sm text-muted-foreground">
                              {doc.personnel?.matricule}
                            </div>
                          </TableCell>
                          <TableCell>{doc.stationName || "—"}</TableCell>
                          <TableCell className="tabular-nums">
                            {formatDate(doc.date)}
                            <div className="text-sm text-muted-foreground">
                              {type.libelleDate}
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                          <TableCell
                            className="text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Imprimer le document"
                              onClick={() =>
                                window.open(type.imprimer(doc._id), "_blank", "noopener")
                              }
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
              )}
            </CardContent>
          </Card>

          {selection.size > 0 && (
            <div className="sticky bottom-4 z-10 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13.5px]">
                <span className="font-semibold tabular-nums">
                  {pluriel(selection.size, "document")}
                </span>{" "}
                {selection.size > 1 ? "sélectionnés" : "sélectionné"}
                <span className="text-muted-foreground"> · {resumeSelection}</span>
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
                Aucun bordereau généré
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead className="text-right">Absences</TableHead>
                    <TableHead className="text-right">Reprises</TableHead>
                    <TableHead className="text-right">Congés</TableHead>
                    <TableHead>Généré par</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bordereaux.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell className="tabular-nums">
                        {formatDateHeure(b.createdAt)}
                      </TableCell>
                      <TableCell>{b.stationName}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.nbAbsences}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.nbReprises}</TableCell>
                      <TableCell className="text-right tabular-nums">{b.nbConges}</TableCell>
                      <TableCell>{b.createdBy || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/envoi/imprimer/${b._id}`)}
                          >
                            <Printer className="mr-1.5 h-4 w-4" />
                            Imprimer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive-text"
                            onClick={() => setAAnnuler(b)}
                          >
                            <Undo2 className="mr-1.5 h-4 w-4" />
                            Annuler
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <CustomAlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Générer le bordereau d’envoi ?"
        description={`${pluriel(selection.size, "document")} de la station ${stationSelection} ${
          selection.size > 1 ? "seront marqués envoyés" : "sera marqué envoyé"
        } à l’${DESTINATION}. Vous pourrez annuler ce bordereau depuis l’onglet Bordereaux.`}
        confirmText="Générer et imprimer"
        cancelText="Annuler"
        loading={envoiEnCours}
        onConfirm={genererBordereau}
      />

      <CustomAlertDialog
        open={Boolean(aAnnuler)}
        onOpenChange={(open) => !open && setAAnnuler(null)}
        title="Annuler ce bordereau ?"
        description={
          aAnnuler
            ? `Les ${pluriel(
                aAnnuler.nbAbsences + aAnnuler.nbReprises + aAnnuler.nbConges,
                "document"
              )} de ce bordereau redeviendront « à envoyer » et le bordereau sera supprimé.`
            : ""
        }
        confirmText="Annuler le bordereau"
        cancelText="Garder"
        variant="destructive"
        loading={annulationEnCours}
        onConfirm={annulerBordereau}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}
