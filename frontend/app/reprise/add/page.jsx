"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Building, AlertTriangle, CalendarX2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  ComputedValue,
  Field,
  FormActions,
  FormSection,
} from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusDialog } from "@/components/ui/status-dialog";
import { motifLabel } from "@/lib/absence-motifs";
import AvisDocumentPreview from "@/components/avis-document-preview";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "—";

export default function AddReprisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingEligibles, setFetchingEligibles] = useState(true);
  // Agents ayant au moins une absence ouverte, avec leurs absences.
  const [eligibles, setEligibles] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [dateReprise, setDateReprise] = useState("");
  const [errors, setErrors] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  useEffect(() => {
    const fetchEligibles = async () => {
      setFetchingEligibles(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises/eligibles`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) throw new Error("Échec du chargement");
        setEligibles(await response.json());
      } catch (err) {
        console.error("Error fetching eligible personnel:", err);
        toast.error("Impossible de charger les agents en absence", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setFetchingEligibles(false);
      }
    };

    fetchEligibles();
  }, [router]);

  // Données reprises de l'avis d'absence de l'agent sélectionné.
  const absences = useMemo(
    () =>
      [...(selectedPersonnel?.absencesOuvertes || [])].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      ),
    [selectedPersonnel]
  );

  const premiereAbsence = absences[0];
  const derniereAbsence = absences[absences.length - 1];

  // Seules les absences antérieures ou égales à la reprise seront clôturées.
  const closedCount = dateReprise
    ? absences.filter((a) => new Date(a.date) <= new Date(dateReprise)).length
    : absences.length;

  const dateTropTot =
    dateReprise &&
    derniereAbsence &&
    new Date(dateReprise) < new Date(derniereAbsence.date);

  const validate = () => {
    const next = {};
    if (!selectedPersonnel) {
      next.personnel = "Veuillez sélectionner un agent en absence";
    }
    if (!dateReprise) {
      next.dateReprise = "La date de reprise est requise";
    } else if (dateTropTot) {
      next.dateReprise =
        "La date de reprise doit être postérieure ou égale à la dernière absence";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire", {
        duration: 3000,
        position: "bottom-left",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            personnelId: selectedPersonnel._id,
            dateReprise,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || "Erreur lors de l'enregistrement de l'avis de reprise"
        );
      }

      const saved = await response.json().catch(() => ({}));
      setCreatedId(saved._id || null);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Error recording reprise:", err);
      setErrorMessage(err.message);
      setShowErrorDialog(true);
      toast.error(err.message, { duration: 3000, position: "bottom-left" });
    } finally {
      setLoading(false);
    }
  };

  const noEligibles = !fetchingEligibles && eligibles.length === 0;

  // Avis tel qu'il sera imprimé : les données viennent de l'avis d'absence,
  // seule la date de reprise est saisie ici.
  const previewAvis = {
    type: "reprise",
    dateEmission: new Date(),
    nom: selectedPersonnel?.lastName,
    prenom: selectedPersonnel?.firstName,
    structure: selectedPersonnel?.stationName,
    motif: premiereAbsence ? motifLabel(premiereAbsence.motif) : "",
    fonction: selectedPersonnel?.poste,
    dateAbsence: premiereAbsence?.date,
    dateReprise,
    observation: premiereAbsence?.description,
  };

  const handlePreview = () => {
    if (!selectedPersonnel) {
      setErrors((prev) => ({
        ...prev,
        personnel: "Veuillez sélectionner un agent en absence",
      }));
      toast.error("Sélectionnez un agent pour voir l'aperçu", {
        duration: 3000,
        position: "bottom-left",
      });
      return;
    }
    setShowPreview(true);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/reprise"
        backLabel="Avis de reprise"
        title="Nouvel avis de reprise"
        description="Sélectionnez un agent en absence : les données de son avis d'absence sont reprises automatiquement."
      />

      {noEligibles && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted px-4 py-3">
          <CalendarX2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-600" />
          <p className="text-[13.5px] text-ink-750">
            Aucun agent n&apos;a d&apos;absence en attente de reprise. Un avis de
            reprise ne peut être enregistré que pour un agent ayant un avis
            d&apos;absence ouvert.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card shadow-xs"
      >
        <FormSection
          title="Agent en absence"
          description="Seuls les agents ayant un avis d'absence non clôturé sont proposés."
        >
          <Field
            label="Employé"
            htmlFor="personnel"
            required
            full
            error={errors.personnel}
          >
            <EmployeeCombobox
              id="personnel"
              open={openCombobox}
              onOpenChange={setOpenCombobox}
              people={eligibles}
              selected={selectedPersonnel}
              onSelect={(person) => {
                setSelectedPersonnel(person);
                setOpenCombobox(false);
                setErrors((prev) => ({ ...prev, personnel: "" }));
              }}
              disabled={loading || noEligibles}
              invalid={!!errors.personnel}
              loading={fetchingEligibles}
              placeholder="Rechercher un agent en absence…"
            />
          </Field>
          <Field label="Station">
            <ComputedValue
              icon={Building}
              tag="Automatique"
              placeholder="Sélectionnez un agent"
            >
              {selectedPersonnel?.stationName}
            </ComputedValue>
          </Field>
        </FormSection>

        {/* Données reprises de l'avis d'absence */}
        {selectedPersonnel && (
          <FormSection
            title="Avis d'absence"
            description="Repris de l'absence enregistrée pour cet agent. Ces informations ne sont pas modifiables ici."
          >
            <Field label="Motif">
              <ComputedValue tag="Avis d'absence">
                {premiereAbsence ? (
                  <StatusBadge kind="absence" value={premiereAbsence.motif} />
                ) : null}
              </ComputedValue>
            </Field>
            <Field label="Date d'absence">
              <ComputedValue tag="Avis d'absence">
                {formatDate(premiereAbsence?.date)}
              </ComputedValue>
            </Field>
            {absences.length > 1 && (
              <Field
                label="Jours d'absence ouverts"
                hint={`Du ${formatDate(premiereAbsence?.date)} au ${formatDate(
                  derniereAbsence?.date
                )}.`}
              >
                <ComputedValue tag="Avis d'absence">
                  {absences.length} jour{absences.length > 1 ? "s" : ""}
                </ComputedValue>
              </Field>
            )}
            {premiereAbsence?.description && (
              <Field label="Description" full>
                <ComputedValue tag="Avis d'absence">
                  {premiereAbsence.description}
                </ComputedValue>
              </Field>
            )}
          </FormSection>
        )}

        <FormSection
          title="Reprise"
          description="Date à laquelle l'agent a repris son service."
        >
          <Field
            label="Date de reprise"
            htmlFor="dateReprise"
            required
            error={errors.dateReprise}
            hint={
              selectedPersonnel && !errors.dateReprise
                ? `${closedCount} absence${closedCount > 1 ? "s" : ""} ${closedCount > 1 ? "seront clôturées" : "sera clôturée"
                }, et l'agent repassera « Actif ».`
                : undefined
            }
          >
            <Input
              type="date"
              id="dateReprise"
              value={dateReprise}
              onChange={(e) => {
                setDateReprise(e.target.value);
                setErrors((prev) => ({ ...prev, dateReprise: "" }));
              }}
              disabled={loading || noEligibles}
              aria-invalid={!!errors.dateReprise}
              className="tabular-nums"
            />
          </Field>
        </FormSection>

        {dateTropTot && (
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-start gap-3 rounded-md border border-destructive-border bg-destructive-subtle px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-[13px] text-destructive-text">
                La dernière absence ouverte est datée du{" "}
                {formatDate(derniereAbsence?.date)} : la reprise ne peut pas lui
                être antérieure.
              </p>
            </div>
          </div>
        )}

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/reprise")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={loading || noEligibles}
          >
            <Eye className="h-4 w-4" />
            Aperçu de l&apos;avis
          </Button>
          <Button type="submit" disabled={loading || noEligibles}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer la reprise
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Reprise enregistrée"
        description={`${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""
          } a repris son service et repasse au statut « Actif ». Vous pouvez imprimer l'avis de reprise.`}
        actionLabel="Imprimer l'avis"
        onAction={() => {
          setShowSuccessDialog(false);
          router.push(createdId ? `/reprise/imprimer/${createdId}` : "/reprise");
        }}
        secondaryLabel="Plus tard"
        onSecondary={() => {
          setShowSuccessDialog(false);
          router.push("/reprise");
        }}
      />

      <AvisDocumentPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        avis={previewAvis}
      />
      <StatusDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        variant="error"
        title="Échec de l'enregistrement"
        description={errorMessage}
        actionLabel="Fermer"
        onAction={() => setShowErrorDialog(false)}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}
