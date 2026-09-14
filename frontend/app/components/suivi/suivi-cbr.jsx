"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarX2,
  CheckCheck,
  Eye,
  FileStack,
  LogIn,
  MoreHorizontal,
  Plane,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { cn } from "@/lib/utils";
import {
  FILTRES_TYPE,
  TYPES,
  formatDate,
  formatDateHeure,
  libelleContrat,
  lienStation,
  nomAgent,
  pluriel,
} from "@/lib/suivi";
import { Checkbox } from "./suivi-documents";
import { appelSuivi } from "./use-suivi";

const API = process.env.NEXT_PUBLIC_BACKEND_URL;

const TYPE_ICONS = { absence: CalendarX2, reprise: LogIn, conge: Plane };
const CHAMP_TYPE = { absence: "absences", reprise: "reprises", conge: "conges" };

const PAGE_DOCUMENTS = 25;
const PAGE_BORDEREAUX = 10;

// Statut du circuit Agence COM Oran → District CBR.
const STATUTS_CBR = [
  { value: "tous", label: "Tous les statuts" },
  { value: "non_delivre", label: "Non délivrés" },
  { value: "delivre", label: "Délivrés" },
];

const TRIS_CBR = [
  { value: "date_recente", label: "Date la plus récente" },
  { value: "date_ancienne", label: "Date la plus ancienne" },
  { value: "station", label: "Station" },
  { value: "employe", label: "Employé (A → Z)" },
];

const FILTRES_INITIAUX = {
  recherche: "",
  type: "tous",
  statut: "tous",
  station: "toutes",
  contrat: "tous",
};

const SECTIONS = [
  { type: "absence", titre: "Avis d’absence" },
  { type: "reprise", titre: "Avis de reprise" },
  { type: "conge", titre: "Demandes de congé" },
];

const memeBordereau = (doc, bordereau) =>
  doc.bordereauCbr && String(doc.bordereauCbr._id) === String(bordereau._id);

const temps = (d) => (d ? new Date(d).getTime() : 0);
const parStation = (a, b) => (a.stationName || "").localeCompare(b.stationName || "", "fr", { numeric: true });

function ChoixSelect({ id, label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Documents d'un bordereau CBR, groupés par type, avec leurs actions. */
function DetailsBordereauCbr({ bordereau, documents, onFermer, onDelivrer, enCours }) {
  const docs = bordereau ? documents.filter((d) => memeBordereau(d, bordereau)) : [];

  return (
    <Dialog open={Boolean(bordereau)} onOpenChange={(open) => !open && onFermer()}>
      {bordereau && (
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bordereau d’envoi N° {bordereau.reference}</DialogTitle>
            <DialogDescription>
              {[
                `${bordereau.expediteur} → ${bordereau.destination}`,
                `généré le ${formatDateHeure(bordereau.createdAt)}`,
                bordereau.createdBy ? `par ${bordereau.createdBy}` : null,
                `${bordereau.nbDelivres} / ${bordereau.nbDocuments} délivré${bordereau.nbDelivres > 1 ? "s" : ""}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {SECTIONS.map(({ type, titre }) => {
              const liste = docs.filter((d) => d.type === type);
              if (!liste.length) return null;
              return (
                <section key={type}>
                  <h3 className="mb-1.5 text-[13px] font-semibold">
                    {titre} <span className="font-normal text-muted-foreground">({liste.length})</span>
                  </h3>
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {liste.map((doc) => (
                      <li key={doc.cle} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium">
                            {nomAgent(doc.personnel)}
                            <span className="font-normal text-muted-foreground"> — {doc.stationName}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[doc.personnel?.matricule, `${TYPES[doc.type].libelleDate} le ${formatDate(doc.date)}`]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <StatusBadge kind="suivi" value={doc.statutGestion} />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-bleu hover:bg-bleu-subtle hover:text-bleu"
                          asChild
                        >
                          <Link href={TYPES[doc.type].details(doc._id)} title="Voir le document">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Voir le document</span>
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
            {!docs.length && (
              <p className="text-[13px] text-muted-foreground">Aucun document de ce bordereau n’est chargé.</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" asChild>
              <a href={`/envoi/cbr/imprimer/${bordereau._id}`} target="_blank" rel="noopener noreferrer">
                <Printer className="mr-1.5 h-4 w-4" />
                Bordereau
              </a>
            </Button>
            {bordereau.nbDelivres < bordereau.nbDocuments && (
              <Button disabled={enCours} onClick={onDelivrer}>
                <CheckCheck className="mr-1.5 h-4 w-4" />
                Délivrer au CBR
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

/**
 * Suivi du circuit Agence COM Oran → District CBR (gestionnaire et
 * administrateur) : documents réceptionnés, à transmettre, envoyés par
 * bordereau CBR ou délivrés, et historique des bordereaux CBR.
 */
export function SuiviCbr({ donnees, recharger }) {
  const [bordereaux, setBordereaux] = useState([]);
  const [chargementBordereaux, setChargementBordereaux] = useState(true);
  const [filtres, setFiltres] = useState(FILTRES_INITIAUX);
  const [tri, setTri] = useState("date_recente");
  const [limite, setLimite] = useState(PAGE_DOCUMENTS);
  const [limiteBordereaux, setLimiteBordereaux] = useState(PAGE_BORDEREAUX);
  const [selection, setSelection] = useState(() => new Set());
  const [detailsId, setDetailsId] = useState(null);
  const [aDelivrer, setADelivrer] = useState(null);
  const [enCours, setEnCours] = useState(false);
  // Documents et bordereaux CBR ne sont jamais affichés ensemble.
  const [vue, setVue] = useState("documents");

  const chargerBordereaux = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/bordereaux-cbr`, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(data)) {
        throw new Error((data && data.message) || "Impossible de charger les bordereaux CBR.");
      }
      setBordereaux(data);
    } catch (err) {
      toast.error(err.message, { duration: 3500, position: "bottom-left" });
    } finally {
      setChargementBordereaux(false);
    }
  }, []);

  useEffect(() => {
    chargerBordereaux();
  }, [chargerBordereaux]);

  // Seuls les documents réceptionnés entrent dans ce circuit.
  const documents = useMemo(
    () => (donnees.documents || []).filter((d) => d.envoye && d.statutGestion !== "non_recu"),
    [donnees.documents]
  );

  const comptes = useMemo(() => {
    const c = { total: documents.length, non_delivre: 0, delivre: 0 };
    documents.forEach((d) => {
      c[d.statutGestion === "delivre" ? "delivre" : "non_delivre"] += 1;
    });
    return c;
  }, [documents]);

  const stations = useMemo(
    () =>
      [...new Set(documents.map((d) => d.stationName).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "fr", { numeric: true })
      ),
    [documents]
  );

  const visibles = useMemo(() => {
    const terme = filtres.recherche.trim().toLowerCase();
    const liste = documents.filter((doc) => {
      if (filtres.type !== "tous" && doc.type !== filtres.type) return false;
      if (filtres.statut !== "tous" && doc.statutGestion !== filtres.statut) return false;
      if (filtres.station !== "toutes" && doc.stationName !== filtres.station) return false;
      if (filtres.contrat !== "tous" && libelleContrat(doc) !== filtres.contrat) return false;
      if (!terme) return true;
      const p = doc.personnel || {};
      return `${p.lastName || ""} ${p.firstName || ""} ${p.matricule || ""} ${doc.stationName || ""}`
        .toLowerCase()
        .includes(terme);
    });
    const nom = (d) => nomAgent(d.personnel);
    switch (tri) {
      case "date_ancienne":
        return liste.sort((a, b) => temps(a.date) - temps(b.date));
      case "station":
        return liste.sort((a, b) => parStation(a, b) || nom(a).localeCompare(nom(b), "fr"));
      case "employe":
        return liste.sort((a, b) => nom(a).localeCompare(nom(b), "fr") || temps(b.date) - temps(a.date));
      default:
        return liste.sort((a, b) => temps(b.date) - temps(a.date));
    }
  }, [documents, filtres, tri]);

  // Filtres modifiés : on repart de la première page.
  useEffect(() => {
    setLimite(PAGE_DOCUMENTS);
  }, [filtres, tri]);

  // Seuls les documents d'un bordereau CBR changent de statut ici.
  useEffect(() => {
    const valides = new Set(documents.filter((d) => d.bordereauCbr).map((d) => d.cle));
    setSelection((prev) => {
      const next = new Set([...prev].filter((k) => valides.has(k)));
      return next.size === prev.size ? prev : next;
    });
  }, [documents]);

  const affiches = visibles.slice(0, limite);
  const selectionnables = affiches.filter((d) => d.bordereauCbr).map((d) => d.cle);
  const nbCoches = selectionnables.filter((k) => selection.has(k)).length;
  const toutCoche = selectionnables.length > 0 && nbCoches === selectionnables.length;

  const cocher = (cles, valeur) =>
    setSelection((prev) => {
      const next = new Set(prev);
      cles.forEach((k) => (valeur ? next.add(k) : next.delete(k)));
      return next;
    });

  const changerStatut = async (statut, docs) => {
    if (!docs.length) return;
    const corps = { statut, absences: [], reprises: [], conges: [] };
    docs.forEach((d) => corps[CHAMP_TYPE[d.type]].push(d._id));
    setEnCours(true);
    try {
      const r = await appelSuivi("/statut", { method: "PATCH", body: corps });
      toast.success(
        `${pluriel(r.modifies, "document")} : ${statut === "delivre" ? "Délivré" : "Non délivré"}` +
          (r.ignores ? ` · ${r.ignores} ignoré${r.ignores > 1 ? "s" : ""}` : ""),
        { duration: 3000, position: "bottom-left" }
      );
      setSelection(new Set());
      setDetailsId(null);
      await Promise.all([recharger({ silencieux: true }), chargerBordereaux()]);
    } catch (err) {
      toast.error(err.message, { duration: 3500, position: "bottom-left" });
    } finally {
      setEnCours(false);
    }
  };

  // « Délivrer au CBR » : tous les documents du bordereau passent à « Délivré ».
  const delivrerBordereau = async () => {
    if (!aDelivrer) return;
    setEnCours(true);
    try {
      const res = await fetch(`${API}/api/bordereaux-cbr/${aDelivrer._id}/delivrer`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Échec de la remise du bordereau");
      toast.success(
        `Bordereau N° ${aDelivrer.reference} : ${pluriel(data.modifies, "document délivré", "documents délivrés")}`,
        { duration: 3000, position: "bottom-left" }
      );
      setADelivrer(null);
      await Promise.all([recharger({ silencieux: true }), chargerBordereaux()]);
    } catch (err) {
      toast.error(err.message, { duration: 3500, position: "bottom-left" });
    } finally {
      setEnCours(false);
    }
  };

  const maj = (champ) => (value) => setFiltres((f) => ({ ...f, [champ]: value }));
  const nbFiltres = Object.keys(FILTRES_INITIAUX).filter((k) => filtres[k] !== FILTRES_INITIAUX[k]).length;
  const details = bordereaux.find((b) => String(b._id) === String(detailsId)) || null;
  const selectionnes = documents.filter((d) => selection.has(d.cle));

  return (
    <div className="space-y-6">
      <div
        role="radiogroup"
        aria-label="Affichage"
        className="inline-flex w-fit flex-wrap rounded-md border border-border bg-card p-0.5"
      >
        {[
          { value: "documents", label: "Documents réceptionnés", compteur: comptes.non_delivre },
          { value: "bordereaux", label: "Bordereaux CBR", compteur: bordereaux.filter((b) => b.nbDelivres < b.nbDocuments).length },
        ].map((v) => (
          <button
            key={v.value}
            type="button"
            role="radio"
            aria-checked={vue === v.value}
            onClick={() => setVue(v.value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded px-3 text-[13px] font-medium transition-colors",
              vue === v.value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
            {v.compteur > 0 && (
              <span className="rounded-full bg-warning px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-white">
                {v.compteur}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bordereaux CBR */}
      {vue === "bordereaux" && (
      <Card className="bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-bleu-subtle">
              <Send aria-hidden className="h-4 w-4 text-bleu" />
            </span>
            <div>
              <p className="text-[14px] font-semibold">Bordereaux d’envoi au District CBR</p>
              <p className="text-[13px] text-muted-foreground">
                {chargementBordereaux
                  ? "Chargement…"
                  : bordereaux.length
                    ? `${pluriel(bordereaux.length, "bordereau", "bordereaux")} · ${pluriel(
                        bordereaux.filter((b) => b.nbDelivres < b.nbDocuments).length,
                        "en attente de remise",
                        "en attente de remise"
                      )}`
                    : "Aucun bordereau généré"}
              </p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link href="/envoi?circuit=cbr">
              <Plus className="mr-1.5 h-4 w-4" />
              Nouveau bordereau
            </Link>
          </Button>
        </div>

        {chargementBordereaux ? (
          <TableSkeleton />
        ) : (
          bordereaux.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bordereau</TableHead>
                    <TableHead>Stations</TableHead>
                    <TableHead>Délivrés</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bordereaux.slice(0, limiteBordereaux).map((b) => (
                    <TableRow key={b._id}>
                      {/* N°, date et contenu détaillé : voir « Détails ». */}
                      <TableCell>
                        <span className="font-medium tabular-nums">N° {b.reference}</span>
                        <div className="text-xs tabular-nums text-muted-foreground">{formatDate(b.createdAt)}</div>
                      </TableCell>
                      <TableCell className="max-w-[240px]">
                        <span className="block truncate" title={b.stations.join(", ")}>
                          {b.stations.join(", ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          kind="suivi"
                          value={b.nbDocuments > 0 && b.nbDelivres === b.nbDocuments ? "delivre" : "non_delivre"}
                          label={`${b.nbDelivres} / ${b.nbDocuments}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => setDetailsId(b._id)}>
                            <Eye className="mr-1.5 h-4 w-4" />
                            Détails
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={`/envoi/cbr/imprimer/${b._id}`} target="_blank" rel="noopener noreferrer">
                              <Printer className="mr-1.5 h-4 w-4" />
                              Imprimer
                            </a>
                          </Button>
                          {b.nbDelivres < b.nbDocuments && (
                            <Button size="sm" disabled={enCours} onClick={() => setADelivrer(b)}>
                              <CheckCheck className="mr-1.5 h-4 w-4" />
                              Délivrer au CBR
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {bordereaux.length > limiteBordereaux && (
                <div className="border-t border-border px-4 py-2 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setLimiteBordereaux((n) => n + PAGE_BORDEREAUX)}>
                    Afficher plus ({bordereaux.length - limiteBordereaux} restant
                    {bordereaux.length - limiteBordereaux > 1 ? "s" : ""})
                  </Button>
                </div>
              )}
            </div>
          )
        )}
      </Card>
      )}

      {vue === "documents" && (
      <>
      {/* Filtres */}
      <Card className="bg-card shadow-xs">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-80">
              <Input
                placeholder="Rechercher un employé, un matricule, une station..."
                value={filtres.recherche}
                onChange={(e) => maj("recherche")(e.target.value)}
                className="pl-10"
                aria-label="Rechercher"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" size={18} />
            </div>
            <div className="inline-flex w-fit flex-wrap rounded-md border border-border bg-card p-0.5">
              {FILTRES_TYPE.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filtres.type === f.value}
                  onClick={() => maj("type")(f.value)}
                  className={cn(
                    "inline-flex h-8 items-center rounded px-2.5 text-[13px] font-medium transition-colors",
                    filtres.type === f.value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ChoixSelect id="cbr-statut" label="Statut" value={filtres.statut} onChange={maj("statut")} options={STATUTS_CBR} />
            <ChoixSelect
              id="cbr-station"
              label="Station"
              value={filtres.station}
              onChange={maj("station")}
              options={[{ value: "toutes", label: "Toutes les stations" }, ...stations.map((s) => ({ value: s, label: s }))]}
            />
            <ChoixSelect
              id="cbr-contrat"
              label="Contrat"
              value={filtres.contrat}
              onChange={maj("contrat")}
              options={[
                { value: "tous", label: "Tous" },
                { value: "CDD", label: "Temporaire (CDD)" },
                { value: "CDI", label: "Permanent (CDI)" },
              ]}
            />
            <ChoixSelect id="cbr-tri" label="Trier par" value={tri} onChange={setTri} options={TRIS_CBR} />
          </div>
          {nbFiltres > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setFiltres(FILTRES_INITIAUX)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Réinitialiser les filtres ({nbFiltres})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Documents réceptionnés */}
      <Card className={cn("bg-card shadow-xs", selection.size > 0 && "mb-24")}>
        <CardContent className="p-0">
          {visibles.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
              <FileStack size={40} />
              {documents.length === 0
                ? "Aucun document réceptionné des stations"
                : "Aucun document ne correspond aux filtres"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={toutCoche}
                        indeterminate={nbCoches > 0 && !toutCoche}
                        onChange={(v) => cocher(selectionnables, v)}
                        disabled={!selectionnables.length}
                        label="Sélectionner les documents envoyés affichés"
                      />
                    </TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiches.map((doc) => {
                    const type = TYPES[doc.type];
                    const Icon = TYPE_ICONS[doc.type];
                    const coche = selection.has(doc.cle);
                    return (
                      <TableRow key={doc.cle} data-state={coche ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={coche}
                            onChange={(v) => cocher([doc.cle], v)}
                            disabled={!doc.bordereauCbr}
                            title={doc.bordereauCbr ? undefined : "Pas encore dans un bordereau CBR"}
                            label={`Sélectionner ${type.label} — ${nomAgent(doc.personnel)}`}
                          />
                        </TableCell>
                        {/* Date dans le document, station sous l'employé : pas de colonnes dédiées. */}
                        <TableCell>
                          <span className="inline-flex items-center gap-2 text-[13.5px] font-medium">
                            <Icon aria-hidden className="h-4 w-4 text-muted-foreground" />
                            {type.label}
                          </span>
                          <div className="text-xs tabular-nums text-muted-foreground">
                            {type.libelleDate} le {formatDate(doc.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {nomAgent(doc.personnel)}
                          <div className="text-xs text-muted-foreground">
                            {doc.stationName ? (
                              <Link href={lienStation(doc.stationName)} className="text-bleu hover:underline">
                                {doc.stationName}
                              </Link>
                            ) : (
                              "—"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge kind="suivi" value={doc.statutGestion} />
                          {doc.bordereauCbr && (
                            <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                              N° {doc.bordereauCbr.reference}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-bleu hover:bg-bleu-subtle hover:text-bleu"
                              asChild
                            >
                              <Link href={type.details(doc._id)} title="Voir le document">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Voir le document</span>
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={enCours}>
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Changer le statut</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Statut</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup
                                  value={doc.statutGestion}
                                  onValueChange={(value) => value !== doc.statutGestion && changerStatut(value, [doc])}
                                >
                                  <DropdownMenuRadioItem value="non_delivre">Non délivré</DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="delivre" disabled={!doc.bordereauCbr}>
                                    Délivré
                                  </DropdownMenuRadioItem>
                                </DropdownMenuRadioGroup>
                                {!doc.bordereauCbr && (
                                  <p className="max-w-52 px-2 py-1.5 text-xs text-muted-foreground">
                                    « Délivré » nécessite un bordereau d’envoi au District CBR.
                                  </p>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-[13px] text-muted-foreground">
                <span>
                  {affiches.length} sur {pluriel(visibles.length, "document")}
                </span>
                {visibles.length > limite && (
                  <Button variant="ghost" size="sm" onClick={() => setLimite((n) => n + PAGE_DOCUMENTS)}>
                    Afficher plus
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selection.size > 0 && (
        <div className="sticky bottom-4 z-10 mx-auto flex max-w-3xl flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13.5px]">
            <span className="font-semibold tabular-nums">{pluriel(selection.size, "document")}</span>{" "}
            {selection.size > 1 ? "sélectionnés" : "sélectionné"}
            <span className="text-muted-foreground"> · marquer comme :</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={enCours} onClick={() => changerStatut("non_delivre", selectionnes)}>
              Non délivré
            </Button>
            <Button size="sm" disabled={enCours} onClick={() => changerStatut("delivre", selectionnes)}>
              Délivré
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelection(new Set())}>
              <X className="mr-1 h-4 w-4" />
              Effacer
            </Button>
          </div>
        </div>
      )}
      </>
      )}

      <CustomAlertDialog
        open={Boolean(aDelivrer)}
        onOpenChange={(open) => !open && !enCours && setADelivrer(null)}
        title={`Délivrer le bordereau N° ${aDelivrer?.reference || ""} au District CBR ?`}
        description={
          aDelivrer
            ? `${pluriel(aDelivrer.nbDocuments - aDelivrer.nbDelivres, "document")} de ce bordereau ${
                aDelivrer.nbDocuments - aDelivrer.nbDelivres > 1 ? "passeront" : "passera"
              } à « Délivré ».`
            : ""
        }
        confirmText="Délivrer au CBR"
        cancelText="Retour"
        loading={enCours}
        onConfirm={delivrerBordereau}
      />

      <DetailsBordereauCbr
        bordereau={details}
        documents={documents}
        onFermer={() => setDetailsId(null)}
        onDelivrer={() => {
          setADelivrer(details);
          setDetailsId(null);
        }}
        enCours={enCours}
      />
    </div>
  );
}
