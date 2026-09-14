"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarX2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Eye,
  FileStack,
  Inbox,
  LogIn,
  MoreHorizontal,
  Plane,
  Printer,
  RotateCcw,
  Search,
  Undo2,
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
import { cn } from "@/lib/utils";
import {
  FILTRES_TYPE,
  FILTRES_VIDES,
  GROUPES,
  STATUTS_CHEF,
  STATUTS_GESTION,
  TRIS,
  TYPES,
  URGENCES,
  compter,
  filtrerDocuments,
  filtresActifs,
  formatDate,
  formatDateHeure,
  grouperParAgent,
  libelleEcheance,
  lienStation,
  nomAgent,
  pluriel,
  noteStatut,
  statutDe,
  statutPossible,
  tempsRestant,
} from "@/lib/suivi";
import { AlertesSuivi, filtresAlerte } from "./alertes-suivi";
import { Onglets, useOngletUrl } from "./onglets";
import { appelSuivi } from "./use-suivi";

const TYPE_ICONS = { absence: CalendarX2, reprise: LogIn, conge: Plane };

const TEXTE_URGENCE = {
  en_retard: "text-destructive-text",
  proche: "text-warning-text",
  dans_les_delais: "text-muted-foreground",
  delivre: "text-muted-foreground",
};

const CHAMP_TYPE = { absence: "absences", reprise: "reprises", conge: "conges" };

/* ------------------------------------------------------------ éléments */

/** Case à cocher native, avec l'état intermédiaire. */
export function Checkbox({ checked, indeterminate = false, onChange, label, disabled, title }) {
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
      title={title}
      disabled={disabled}
    />
  );
}

function ChoixSelect({ id, label, value, onChange, options, className }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
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

const COLONNES_FILTRES = { 4: "lg:grid-cols-4", 5: "lg:grid-cols-5", 6: "lg:grid-cols-6" };

/**
 * Barre de filtres et de tri, partagée par la vue des stations et la vue des
 * documents d'une station. `avecStatut` / `avecEcheance` masquent un filtre
 * que l'onglet affiché rend inutile.
 */
export function BarreFiltres({
  filtres,
  setFiltres,
  gestion,
  tri,
  setTri,
  tris = TRIS,
  placeholder = "Rechercher un employé, un matricule...",
  avecStatut = true,
  avecEcheance = true,
}) {
  const maj = (champ) => (value) => setFiltres((f) => ({ ...f, [champ]: value }));
  const nbActifs = filtresActifs(filtres);
  const nbChamps = 4 + (avecStatut ? 1 : 0) + (avecEcheance ? 1 : 0);

  return (
    <Card className="bg-card shadow-xs">
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-80">
            <Input
              placeholder={placeholder}
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
                  "inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium transition-colors",
                  filtres.type === f.value
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", COLONNES_FILTRES[nbChamps])}>
          {avecStatut && (
            <ChoixSelect
              id="filtre-statut"
              label="Statut"
              value={filtres.statut}
              onChange={maj("statut")}
              options={[{ value: "tous", label: "Tous les statuts" }, ...(gestion ? STATUTS_GESTION : STATUTS_CHEF)]}
            />
          )}
          {avecEcheance && (
            <ChoixSelect
              id="filtre-echeance"
              label="Échéance"
              value={filtres.urgence}
              onChange={maj("urgence")}
              options={[
                { value: "tous", label: "Toutes" },
                { value: "en_alerte", label: "En alerte" },
                ...URGENCES,
              ]}
            />
          )}
          <ChoixSelect
            id="filtre-contrat"
            label="Contrat"
            value={filtres.contrat}
            onChange={maj("contrat")}
            options={[
              { value: "tous", label: "Tous" },
              { value: "CDD", label: "Temporaire (CDD)" },
              { value: "CDI", label: "Permanent (CDI)" },
            ]}
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor="filtre-du" className="text-xs font-medium text-muted-foreground">
              Date du
            </Label>
            <Input id="filtre-du" type="date" className="h-9" value={filtres.du} max={filtres.au || undefined} onChange={(e) => maj("du")(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="filtre-au" className="text-xs font-medium text-muted-foreground">
              au
            </Label>
            <Input id="filtre-au" type="date" className="h-9" value={filtres.au} min={filtres.du || undefined} onChange={(e) => maj("au")(e.target.value)} />
          </div>
          <ChoixSelect id="tri" label="Trier par" value={tri} onChange={setTri} options={tris} />
        </div>

        {nbActifs > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filtres.groupe !== "tous" && (
              <span className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-bleu-border bg-bleu-subtle pl-2.5 pr-1 text-xs font-medium text-bleu">
                Alerte : {GROUPES[filtres.groupe]?.court}
                <button
                  type="button"
                  onClick={() => setFiltres((f) => ({ ...f, groupe: "tous", urgence: "tous" }))}
                  className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-card"
                  aria-label="Retirer le filtre d’alerte"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={() => setFiltres(FILTRES_VIDES)}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Réinitialiser les filtres ({nbActifs})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------- bordereaux à recevoir */

const SECTIONS_BORDEREAU = [
  { type: "absence", titre: "Avis d’absence" },
  { type: "reprise", titre: "Avis de reprise" },
  { type: "conge", titre: "Demandes de congé" },
];

const contenuBordereau = (b) =>
  [
    b.nbAbsences ? pluriel(b.nbAbsences, "absence") : null,
    b.nbReprises ? pluriel(b.nbReprises, "reprise") : null,
    b.nbConges ? pluriel(b.nbConges, "congé") : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Aucun document";

const nbReceptionnes = (b) => b.nbDocuments - b.nbNonRecus;

// Bordereaux affichés à la fois ; « Afficher plus » ajoute la page suivante.
const PAGE_BORDEREAUX = 10;

/** Détails d'un bordereau d'envoi : ses documents groupés par type, et ses actions. */
function DetailsBordereau({ bordereau, documents, onFermer, onReceptionner, onAnnuler, enCours }) {
  const docs = bordereau
    ? documents.filter((d) => d.bordereau && String(d.bordereau._id) === String(bordereau._id))
    : [];
  const absents = bordereau ? bordereau.nbDocuments - docs.length : 0;

  return (
    <Dialog open={Boolean(bordereau)} onOpenChange={(open) => !open && onFermer()}>
      {bordereau && (
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bordereau d’envoi du {formatDateHeure(bordereau.createdAt)}</DialogTitle>
            <DialogDescription>
              {[
                bordereau.stationName,
                bordereau.createdBy ? `généré par ${bordereau.createdBy}` : null,
                contenuBordereau(bordereau),
                bordereau.nbNonRecus
                  ? `${bordereau.nbNonRecus} à réceptionner`
                  : "réceptionné",
              ]
                .filter(Boolean)
                .join(" · ")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {SECTIONS_BORDEREAU.map(({ type, titre }) => {
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
                          <p className="truncate text-[13.5px] font-medium">{nomAgent(doc.personnel)}</p>
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
            {absents > 0 && (
              <p className="text-xs text-muted-foreground">
                {pluriel(absents, "document")} de ce bordereau concerne{absents > 1 ? "nt" : ""} des
                agents affectés depuis à une autre station.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" asChild>
              <a href={`/envoi/imprimer/${bordereau._id}`} target="_blank" rel="noopener noreferrer">
                <Printer className="mr-1.5 h-4 w-4" />
                Bordereau
              </a>
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              {nbReceptionnes(bordereau) > 0 && !bordereau.nbDansCbr && (
                <Button
                  variant="ghost"
                  className="text-destructive-text"
                  disabled={Boolean(enCours)}
                  onClick={onAnnuler}
                >
                  <Undo2 className="mr-1.5 h-4 w-4" />
                  Annuler la réception
                </Button>
              )}
              {bordereau.nbNonRecus > 0 && (
                <Button disabled={Boolean(enCours)} onClick={onReceptionner}>
                  <Inbox className="mr-1.5 h-4 w-4" />
                  Marquer reçu
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

const FILTRES_BORDEREAU = [
  { value: "a_recevoir", label: "À réceptionner" },
  { value: "recus", label: "Réceptionnés" },
  { value: "tous", label: "Tous" },
];

/**
 * Bordereaux d'envoi d'une station, ou de toutes (`avecStation`, page Suivi).
 * « Marquer reçu » fait passer tous les
 * documents non reçus du bordereau à « Non délivré » ; « Annuler la réception »
 * les remet à « Non reçu » (refusé si l'un d'eux est dans un bordereau CBR).
 */
export function BordereauxReception({ bordereaux, documents, onAction, enCours, avecStation = false }) {
  const [filtre, setFiltre] = useState("a_recevoir");
  const [limite, setLimite] = useState(PAGE_BORDEREAUX);
  const [detailsId, setDetailsId] = useState(null);
  const [confirmation, setConfirmation] = useState(null); // { bordereau, action }

  const tous = bordereaux || [];
  const aRecevoir = tous.filter((b) => b.nbNonRecus > 0);
  const liste =
    filtre === "a_recevoir" ? aRecevoir : filtre === "recus" ? tous.filter((b) => b.nbNonRecus === 0) : tous;
  const details = tous.find((b) => String(b._id) === String(detailsId)) || null;

  const choisir = (valeur) => {
    setFiltre(valeur);
    setLimite(PAGE_BORDEREAUX);
  };

  const demander = (bordereau, action) => {
    setDetailsId(null);
    setConfirmation({ bordereau, action });
  };

  const confirmer = async () => {
    if (!confirmation) return;
    const ok = await onAction(confirmation.bordereau, confirmation.action);
    if (ok) setConfirmation(null);
  };

  const reception = confirmation?.action === "reception";
  const cible = confirmation?.bordereau;

  const messageVide =
    tous.length === 0
      ? "Aucun bordereau d’envoi pour le moment."
      : filtre === "a_recevoir"
        ? "Tous les bordereaux ont été réceptionnés."
        : "Aucun bordereau réceptionné.";

  return (
    <Card className="bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <div
          role="radiogroup"
          aria-label="Bordereaux affichés"
          className="inline-flex w-fit flex-wrap rounded-md border border-border bg-card p-0.5"
        >
          {FILTRES_BORDEREAU.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filtre === f.value}
              onClick={() => choisir(f.value)}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium transition-colors",
                filtre === f.value ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              {f.value === "a_recevoir" && aRecevoir.length > 0 && (
                <span className="rounded-full bg-bleu px-1.5 text-[11px] font-semibold leading-5 tabular-nums text-white">
                  {aRecevoir.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {liste.length === 0 ? (
        <div className="flex h-44 flex-col items-center justify-center gap-2 px-6 text-center text-[13.5px] text-muted-foreground">
          <Inbox size={32} aria-hidden />
          {messageVide}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bordereau</TableHead>
                {avecStation && <TableHead>Station</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liste.slice(0, limite).map((b) => (
                <TableRow key={b._id}>
                  {/* Date, auteur et contenu ; le détail des documents est dans « Détails ». */}
                  <TableCell>
                    <span className="font-medium tabular-nums">Bordereau du {formatDate(b.createdAt)}</span>
                    <div className="text-xs text-muted-foreground">
                      {[b.createdBy ? `par ${b.createdBy}` : null, contenuBordereau(b)].filter(Boolean).join(" · ")}
                    </div>
                  </TableCell>
                  {avecStation && (
                    <TableCell>
                      <Link href={lienStation(b.stationName)} className="font-medium text-bleu hover:underline">
                        {b.stationName}
                      </Link>
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {b.nbNonRecus === 0 && <StatusBadge kind="suivi" value="recu" label="Réceptionné" />}
                      <Button variant="ghost" size="sm" onClick={() => setDetailsId(b._id)}>
                        <Eye className="mr-1.5 h-4 w-4" />
                        Détails
                      </Button>
                      {b.nbNonRecus > 0 ? (
                        <Button size="sm" disabled={Boolean(enCours)} onClick={() => demander(b, "reception")}>
                          <Inbox className="mr-1.5 h-4 w-4" />
                          Marquer reçu
                        </Button>
                      ) : b.nbDansCbr > 0 ? (
                        <span
                          className="inline-flex h-9 items-center px-3 text-[13px] text-muted-foreground"
                          title="Des documents de ce bordereau sont dans un bordereau CBR : annulez-le pour annuler la réception."
                        >
                          Transmis au CBR
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive-text"
                          disabled={Boolean(enCours)}
                          onClick={() => demander(b, "annulation")}
                        >
                          <Undo2 className="mr-1.5 h-4 w-4" />
                          Annuler la réception
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {liste.length > limite && (
            <div className="border-t border-border px-4 py-2 text-center">
              <Button variant="ghost" size="sm" onClick={() => setLimite((n) => n + PAGE_BORDEREAUX)}>
                Afficher plus ({liste.length - limite} restant{liste.length - limite > 1 ? "s" : ""})
              </Button>
            </div>
          )}
        </div>
      )}

      <DetailsBordereau
        bordereau={details}
        documents={documents}
        onFermer={() => setDetailsId(null)}
        onReceptionner={() => demander(details, "reception")}
        onAnnuler={() => demander(details, "annulation")}
        enCours={enCours}
      />

      <CustomAlertDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => !open && !enCours && setConfirmation(null)}
        title={reception ? "Marquer ce bordereau comme reçu ?" : "Annuler la réception de ce bordereau ?"}
        description={
          !cible
            ? ""
            : reception
              ? `${pluriel(cible.nbNonRecus, "document")} du bordereau du ${formatDateHeure(cible.createdAt)} ${
                  cible.nbNonRecus > 1 ? "passeront" : "passera"
                } à « Non délivré ».`
              : `${pluriel(nbReceptionnes(cible), "document réceptionné", "documents réceptionnés")} du bordereau du ${formatDateHeure(
                  cible.createdAt
                )} ${nbReceptionnes(cible) > 1 ? "reviendront" : "reviendra"} à « Non reçu ».`
        }
        confirmText={reception ? "Marquer reçu" : "Annuler la réception"}
        cancelText="Retour"
        variant={reception ? "default" : "destructive"}
        loading={Boolean(enCours)}
        onConfirm={confirmer}
      />
    </Card>
  );
}

/* ------------------------------------------------------ documents par agent */

function initiales(personnel) {
  if (!personnel) return "?";
  return `${(personnel.lastName || "?")[0]}${(personnel.firstName || "")[0] || ""}`.toUpperCase();
}

function LigneDocument({ doc, gestion, maintenant, coche, onCocher, onStatut, enCours }) {
  const type = TYPES[doc.type];
  const Icon = TYPE_ICONS[doc.type];
  const statut = statutDe(doc, gestion);

  // La date du document tient dans le sous-titre : pas de colonne dédiée.
  const sousTitre = [
    `${type.libelleDate} le ${formatDate(doc.date)}`,
    doc.type === "conge"
      ? { anticipe: "Par anticipation", recuperation: "Récupération" }[doc.typeConge] || "Ordinaire"
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TableRow data-state={coche ? "selected" : undefined}>
      {gestion && (
        <TableCell className="w-10">
          <Checkbox
            checked={coche}
            onChange={onCocher}
            disabled={!doc.envoye}
            title={doc.envoye ? undefined : "Pas encore envoyé par la station"}
            label={`Sélectionner ${type.label} — ${nomAgent(doc.personnel)}`}
          />
        </TableCell>
      )}
      <TableCell>
        <span className="inline-flex items-center gap-2 text-[13.5px] font-medium">
          <Icon aria-hidden className="h-4 w-4 text-muted-foreground" />
          {type.label}
        </span>
        <div className="text-xs text-muted-foreground">{sousTitre}</div>
      </TableCell>
      {/* Échéance et délai réunis. Chez le chef, « Délivré » y vaut aussi statut.
          Côté gestionnaire, « délivré » désigne la transmission à la CBR : l'envoi
          par la station s'affiche « Envoyé » pour ne pas confondre les deux. */}
      <TableCell>
        <StatusBadge
          kind="echeance"
          value={doc.urgence}
          label={gestion && doc.urgence === "delivre" ? "Envoyé" : undefined}
        />
        <div
          className={cn("mt-0.5 text-xs tabular-nums", doc.envoye ? "text-muted-foreground" : TEXTE_URGENCE[doc.urgence])}
          title={
            !doc.envoye && doc.periode
              ? `Départs du ${formatDate(doc.periode.debut)} au ${formatDate(doc.periode.fin)}`
              : undefined
          }
        >
          {doc.envoye
            ? doc.bordereau?.createdAt
              ? `le ${formatDate(doc.bordereau.createdAt)}`
              : "par bordereau"
            : `${libelleEcheance(doc)} · ${tempsRestant(doc.echeance, maintenant)}`}
        </div>
      </TableCell>
      {gestion && (
        <TableCell>
          <StatusBadge kind="suivi" value={statut} />
        </TableCell>
      )}
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-bleu hover:bg-bleu-subtle hover:text-bleu" asChild>
            <Link href={type.details(doc._id)} title="Voir le document">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Voir le document</span>
            </Link>
          </Button>
          {gestion && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={Boolean(enCours)}>
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Changer le statut</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Statut</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={statut} onValueChange={(value) => value !== statut && onStatut(value)}>
                  {STATUTS_GESTION.map((s) => (
                    <DropdownMenuRadioItem
                      key={s.value}
                      value={s.value}
                      disabled={!statutPossible(doc, s.value)}
                    >
                      {s.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <p className="max-w-52 px-2 py-1.5 text-xs text-muted-foreground">{noteStatut(doc)}</p>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function CarteAgent({ groupe, gestion, maintenant, ouvert, onBasculer, selection, setSelection, onStatut, enCours }) {
  const { personnel } = groupe;
  const selectionnables = groupe.documents.filter((d) => d.envoye).map((d) => d.cle);
  const nbCoches = selectionnables.filter((k) => selection.has(k)).length;
  const toutCoche = selectionnables.length > 0 && nbCoches === selectionnables.length;

  const cocher = (cles, valeur) =>
    setSelection((prev) => {
      const next = new Set(prev);
      cles.forEach((k) => (valeur ? next.add(k) : next.delete(k)));
      return next;
    });

  return (
    <Card className="overflow-hidden bg-card shadow-xs">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {gestion && (
          <Checkbox
            checked={toutCoche}
            indeterminate={nbCoches > 0 && !toutCoche}
            onChange={(v) => cocher(selectionnables, v)}
            disabled={!selectionnables.length}
            title={selectionnables.length ? undefined : "Aucun document envoyé par la station"}
            label={`Sélectionner les documents de ${nomAgent(personnel)}`}
          />
        )}
        <button
          type="button"
          onClick={onBasculer}
          aria-expanded={ouvert}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-ink-750">
            {initiales(personnel)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold">{nomAgent(personnel)}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {[personnel?.matricule, groupe.contrat === "CDD" ? "Temporaire (CDD)" : "Permanent (CDI)"]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
        </button>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {groupe.pireUrgence !== "delivre" && <StatusBadge kind="echeance" value={groupe.pireUrgence} />}
          {groupe.prochain && (
            <span className="text-[13px] tabular-nums text-ink-800">
              Échéance {libelleEcheance(groupe.prochain)}
            </span>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBasculer} aria-label={ouvert ? "Replier" : "Déplier"}>
            <ChevronDown className={cn("h-4 w-4 transition-transform", ouvert && "rotate-180")} />
          </Button>
        </div>
      </div>

      {ouvert && (
        <div className="overflow-x-auto border-t border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {gestion && <TableHead className="w-10" />}
                <TableHead>Document</TableHead>
                <TableHead>Échéance</TableHead>
                {gestion && <TableHead>Statut</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupe.documents.map((doc) => (
                <LigneDocument
                  key={doc.cle}
                  doc={doc}
                  gestion={gestion}
                  maintenant={maintenant}
                  coche={selection.has(doc.cle)}
                  onCocher={(v) => cocher([doc.cle], v)}
                  onStatut={(statut) => onStatut(statut, [doc])}
                  enCours={enCours}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

/**
 * Réception d'un bordereau d'envoi (« Non reçu » → « Non délivré ») ou
 * annulation de la réception. `actionBordereau` renvoie true en cas de succès,
 * pour fermer la confirmation.
 */
export function useActionBordereau(recharger) {
  const [enCoursBordereau, setEnCours] = useState(null);

  const actionBordereau = async (bordereau, action) => {
    const reception = action === "reception";
    setEnCours(`bordereau:${bordereau._id}`);
    try {
      const r = await appelSuivi(
        `/bordereaux/${bordereau._id}/${reception ? "reception" : "annulation-reception"}`
      );
      toast.success(
        reception
          ? `${pluriel(r.modifies, "document reçu", "documents reçus")} : Non délivré`
          : `Réception annulée : ${pluriel(r.modifies, "document")} à « Non reçu »`,
        { duration: 3000, position: "bottom-left" }
      );
      await recharger({ silencieux: true });
      return true;
    } catch (err) {
      toast.error(err.message, { duration: 3500, position: "bottom-left" });
      return false;
    } finally {
      setEnCours(null);
    }
  };

  return { enCoursBordereau, actionBordereau };
}

/* ------------------------------------------------------------------- vue */

const ONGLETS_CHEF = ["a_delivrer", "delivres"];
const ONGLETS_STATION = ["documents", "bordereaux"];

/**
 * Documents d'une station, regroupés par employé, en deux onglets.
 * Chef de station : « À délivrer » et « Délivrés » (lecture).
 * Gestionnaire et administrateur : « Documents des employés » (changement de
 * statut, à l'unité ou en masse) et « Bordereaux d'envoi » (réception par
 * bordereau). Bordereaux et documents ne sont jamais affichés ensemble.
 */
export function SuiviDocuments({ donnees, gestion, recharger }) {
  const documents = donnees.documents || [];
  const maintenant = donnees.maintenant;

  const [onglet, setOnglet] = useOngletUrl(
    "onglet",
    gestion ? ONGLETS_STATION : ONGLETS_CHEF,
    gestion ? "documents" : "a_delivrer"
  );
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [tri, setTri] = useState("urgence");
  const [selection, setSelection] = useState(() => new Set());
  const [bascules, setBascules] = useState(() => new Map());
  const [enCours, setEnCours] = useState(null);

  // Lien depuis la vue des stations : /suivi/station/X?q=matricule
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) setFiltres((f) => ({ ...f, recherche: q }));
    } catch {}
  }, []);

  // Après rechargement, la sélection ne garde que des documents encore sélectionnables.
  useEffect(() => {
    const valides = new Set(documents.filter((d) => d.envoye).map((d) => d.cle));
    setSelection((prev) => {
      const next = new Set([...prev].filter((k) => valides.has(k)));
      return next.size === prev.size ? prev : next;
    });
  }, [documents]);

  const comptes = useMemo(() => compter(documents), [documents]);
  // Chez le chef, l'onglet tient lieu de filtre de statut.
  const documentsOnglet = useMemo(
    () => (gestion ? documents : documents.filter((d) => (onglet === "delivres" ? d.envoye : !d.envoye))),
    [documents, gestion, onglet]
  );
  const visibles = useMemo(
    () => filtrerDocuments(documentsOnglet, filtres, gestion),
    [documentsOnglet, filtres, gestion]
  );
  const groupes = useMemo(() => grouperParAgent(visibles, tri), [visibles, tri]);

  // Ouverts par défaut : les employés ayant un document en retard ou proche,
  // ou tous quand la liste est courte.
  const ouvertParDefaut = (g) => groupes.length <= 5 || ["en_retard", "proche"].includes(g.pireUrgence);
  const estOuvert = (g) => (bascules.has(g.cle) ? bascules.get(g.cle) : ouvertParDefaut(g));
  const basculer = (g) => setBascules((prev) => new Map(prev).set(g.cle, !estOuvert(g)));
  const toutBasculer = (valeur) => setBascules(new Map(groupes.map((g) => [g.cle, valeur])));
  const tousOuverts = groupes.length > 0 && groupes.every(estOuvert);

  const selectionnablesVisibles = visibles.filter((d) => d.envoye).map((d) => d.cle);
  const nbVisiblesCoches = selectionnablesVisibles.filter((k) => selection.has(k)).length;
  const toutVisibleCoche = selectionnablesVisibles.length > 0 && nbVisiblesCoches === selectionnablesVisibles.length;

  const changerStatut = async (statut, docs) => {
    if (!docs.length) return;
    const corps = { statut, absences: [], reprises: [], conges: [] };
    docs.forEach((d) => corps[CHAMP_TYPE[d.type]].push(d._id));
    const libelle = STATUTS_GESTION.find((s) => s.value === statut)?.label;

    setEnCours(`statut:${statut}`);
    try {
      const r = await appelSuivi("/statut", { method: "PATCH", body: corps });
      toast.success(
        `${pluriel(r.modifies, "document")} : ${libelle}` +
          (r.ignores ? ` · ${r.ignores} ignoré${r.ignores > 1 ? "s" : ""} (statut non permis)` : ""),
        { duration: 3000, position: "bottom-left" }
      );
      setSelection(new Set());
      await recharger({ silencieux: true });
    } catch (err) {
      toast.error(err.message, { duration: 3500, position: "bottom-left" });
    } finally {
      setEnCours(null);
    }
  };

  const { enCoursBordereau, actionBordereau } = useActionBordereau(recharger);

  const selectionnes = documents.filter((d) => selection.has(d.cle));
  const nbBordereauxARecevoir = (donnees.bordereaux || []).filter((b) => b.nbNonRecus > 0).length;

  const onglets = gestion
    ? [
        {
          value: "documents",
          label: "Documents des employés",
          compteur: comptes.enAlerte,
          ton: comptes.enRetard ? "danger" : "warning",
        },
        { value: "bordereaux", label: "Bordereaux d’envoi", compteur: nbBordereauxARecevoir, ton: "bleu" },
      ]
    : [
        {
          value: "a_delivrer",
          label: "À délivrer",
          compteur: comptes.nonDelivres,
          ton: comptes.enRetard ? "danger" : "warning",
        },
        { value: "delivres", label: "Délivrés" },
      ];

  // Les filtres propres à un onglet ne suivent pas dans l'autre.
  const changerOnglet = (valeur) => {
    setOnglet(valeur);
    setFiltres((f) => ({ ...f, groupe: "tous", urgence: "tous", statut: "tous" }));
  };

  const voirAlerte = (alerte) => {
    setOnglet(gestion ? "documents" : "a_delivrer");
    setFiltres({ ...FILTRES_VIDES, ...filtresAlerte(alerte) });
  };

  const messageVide =
    documentsOnglet.length > 0
      ? "Aucun document ne correspond aux filtres"
      : onglet === "a_delivrer" && documents.length > 0
        ? "Tous les documents ont été délivrés"
        : onglet === "delivres"
          ? "Aucun document délivré pour le moment"
          : "Aucun document à suivre";

  return (
    <div className="space-y-5">
      <Onglets label="Suivi des documents" onglets={onglets} valeur={onglet} onChange={changerOnglet} />

      {onglet === "bordereaux" ? (
        <BordereauxReception
          bordereaux={donnees.bordereaux}
          documents={documents}
          onAction={actionBordereau}
          enCours={enCours || enCoursBordereau}
        />
      ) : (
        <>
          {onglet !== "delivres" && <AlertesSuivi alertes={donnees.alertes} onVoir={voirAlerte} />}

          <BarreFiltres
            filtres={filtres}
            setFiltres={setFiltres}
            gestion={gestion}
            tri={tri}
            setTri={setTri}
            avecStatut={gestion}
            avecEcheance={onglet !== "delivres"}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {gestion && (
                <label className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Checkbox
                    checked={toutVisibleCoche}
                    indeterminate={nbVisiblesCoches > 0 && !toutVisibleCoche}
                    onChange={(v) =>
                      setSelection((prev) => {
                        const next = new Set(prev);
                        selectionnablesVisibles.forEach((k) => (v ? next.add(k) : next.delete(k)));
                        return next;
                      })
                    }
                    disabled={!selectionnablesVisibles.length}
                    label="Sélectionner tous les documents envoyés affichés"
                  />
                  Tout sélectionner
                </label>
              )}
              <p className="text-[13px] text-muted-foreground">
                {pluriel(groupes.length, "employé")} · {pluriel(visibles.length, "document")}
              </p>
            </div>
            {groupes.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => toutBasculer(!tousOuverts)}>
                {tousOuverts ? (
                  <>
                    <ChevronsDownUp className="mr-1.5 h-4 w-4" />
                    Tout replier
                  </>
                ) : (
                  <>
                    <ChevronsUpDown className="mr-1.5 h-4 w-4" />
                    Tout déplier
                  </>
                )}
              </Button>
            )}
          </div>

          {groupes.length === 0 ? (
            <Card className="bg-card shadow-xs">
              <CardContent className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileStack size={40} />
                {messageVide}
              </CardContent>
            </Card>
          ) : (
            <div className={cn("space-y-3", gestion && selection.size > 0 && "pb-24")}>
              {groupes.map((g) => (
                <CarteAgent
                  key={g.cle}
                  groupe={g}
                  gestion={gestion}
                  maintenant={maintenant}
                  ouvert={estOuvert(g)}
                  onBasculer={() => basculer(g)}
                  selection={selection}
                  setSelection={setSelection}
                  onStatut={changerStatut}
                  enCours={enCours}
                />
              ))}
            </div>
          )}

          {gestion && selection.size > 0 && (
            <div className="sticky bottom-4 z-10 mx-auto flex max-w-4xl flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg md:flex-row md:items-center md:justify-between">
              <p className="text-[13.5px]">
                <span className="font-semibold tabular-nums">{pluriel(selection.size, "document")}</span>{" "}
                {selection.size > 1 ? "sélectionnés" : "sélectionné"}
                <span className="text-muted-foreground"> · marquer comme :</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUTS_GESTION.map((s) => (
                  <Button
                    key={s.value}
                    size="sm"
                    variant={s.value === "delivre" ? "default" : "outline"}
                    disabled={Boolean(enCours)}
                    onClick={() => changerStatut(s.value, selectionnes)}
                  >
                    {s.label}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setSelection(new Set())}>
                  <X className="mr-1 h-4 w-4" />
                  Effacer
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
