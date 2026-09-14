"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Building, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import {
  ComputedValue,
  EmployeeIdentity,
  Field,
  FormActions,
  FormSection,
  FormSkeleton,
} from "@/components/ui/form-layout";
import { StatusDialog } from "@/components/ui/status-dialog";
import { DocumentVerrouillePage } from "@/components/document-verrouille";
import { bordereauVerrou } from "@/lib/bordereau";
import {
  ABSENCE_MOTIFS,
  DUREE_MAX,
  MOTIF_NON_AUTORISE,
  dateRetourEstimee,
  dureeValide,
  valeurChampDate,
} from "@/lib/absence-motifs";

export default function EditAbsencePage() {
  const router = useRouter();
  const { id } = useParams();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [absence, setAbsence] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    personnelId: "",
    date: "",
    duree: "",
    motif: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [existingDocument, setExistingDocument] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchAbsence = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) throw new Error("Absence introuvable");

        const data = await response.json();
        setAbsence(data);
        setFormData({
          personnelId: data.personnel?._id || "",
          // <input type="date"> attend un format YYYY-MM-DD, pris dans le
          // fuseau local (toISOString décalerait d'un jour à Alger).
          date: valeurChampDate(data.date),
          duree: data.duree ? String(data.duree) : "",
          motif: data.motif || "",
          description: data.description || "",
        });
        setExistingDocument(data.document || "");
      } catch (err) {
        console.error("Error fetching absence:", err);
        toast.error("Impossible de charger l'absence", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAbsence();
  }, [id, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (!touched[name]) setTouched((prev) => ({ ...prev, [name]: true }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (value, field) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (!touched[field]) setTouched((prev) => ({ ...prev, [field]: true }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.date) nextErrors.date = "La date d'absence est requise";
    if (!formData.motif) nextErrors.motif = "Le motif est requis";
    if (!dureeValide(formData.duree)) {
      nextErrors.duree = `Nombre entier de jours, de 1 à ${DUREE_MAX}`;
    }
    setErrors(nextErrors);
    setTouched({ date: true, motif: true, duree: true });
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire", {
        duration: 3000,
        position: "bottom-left",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        personnelId: formData.personnelId,
        date: formData.date,
        duree: formData.duree === "" ? null : Number(formData.duree),
        motif: formData.motif,
        description: formData.description,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de la mise à jour");
      }

      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Error updating absence:", err);
      setErrorMessage(err.message);
      setShowErrorDialog(true);
      toast.error(err.message, { duration: 3000, position: "bottom-left" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <FormSkeleton />;

  if (!absence) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
        <PageHeader
          backHref="/absence"
          backLabel="Absences"
          title="Absence introuvable"
        />
      </div>
    );
  }

  const nonAutorisee = formData.motif === MOTIF_NON_AUTORISE;

  // Document déjà envoyé sur un bordereau : pas de formulaire.
  const verrou = bordereauVerrou(absence);
  if (verrou) {
    return (
      <DocumentVerrouillePage
        verrou={verrou}
        title="Modifier l'absence"
        backHref={`/absence/details/${id}`}
        backLabel="Détails de l'absence"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/absence"
        backLabel="Absences"
        title="Modifier l'absence"
        description="L'employé concerné ne peut pas être changé ; supprimez et recréez l'absence si nécessaire."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card shadow-xs"
      >
        <FormSection title="Employé">
          <Field label="Employé" full>
            <EmployeeIdentity
              firstName={absence.personnel?.firstName}
              lastName={absence.personnel?.lastName}
              matricule={absence.personnel?.matricule}
            />
          </Field>
          <Field label="Station">
            <ComputedValue icon={Building} tag="Automatique">
              {absence.personnel?.stationName}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection
          title="Absence"
          description="Date et motif. « Non autorisée » est le seul motif irrégulier."
        >
          <Field
            label="Date d'absence"
            htmlFor="date"
            required
            error={touched.date && errors.date}
          >
            <Input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              disabled={loading}
              aria-invalid={!!(touched.date && errors.date)}
              className="tabular-nums"
            />
          </Field>
          <Field
            label="Motif"
            htmlFor="motif"
            required
            error={touched.motif && errors.motif}
          >
            <Select
              value={formData.motif}
              onValueChange={(value) => handleSelectChange(value, "motif")}
              disabled={loading}
            >
              <SelectTrigger id="motif" aria-invalid={!!(touched.motif && errors.motif)}>
                <SelectValue placeholder="Sélectionner un motif" />
              </SelectTrigger>
              <SelectContent>
                {ABSENCE_MOTIFS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Durée (jours)"
            htmlFor="duree"
            error={touched.duree && errors.duree}
            hint="Optionnel — jours calendaires, jour d'absence compris."
          >
            <Input
              type="number"
              id="duree"
              name="duree"
              min={1}
              max={DUREE_MAX}
              step={1}
              inputMode="numeric"
              value={formData.duree}
              onChange={handleInputChange}
              disabled={loading}
              aria-invalid={!!(touched.duree && errors.duree)}
              placeholder="Ex : 3"
              className="tabular-nums"
            />
          </Field>
          <Field label="Date retour estimé">
            <ComputedValue
              tag="Automatique"
              placeholder="Renseignez la date et la durée"
            >
              {dateRetourEstimee(formData)?.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </ComputedValue>
          </Field>

          {nonAutorisee && (
            <div className="col-span-full flex items-start gap-3 rounded-md border border-destructive-border bg-destructive-subtle px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-[13px] text-destructive-text">
                Cette absence est enregistrée comme{" "}
                <span className="font-semibold">non autorisée</span> et sera
                signalée si elle dépasse 48 heures sans avis de reprise.
              </p>
            </div>
          )}

          <Field label="Description" htmlFor="description" full hint="Optionnel.">
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              rows={3}
            />
          </Field>
        </FormSection>

        {/* Justificatif téléversé avant la génération automatique de l'avis. */}
        {existingDocument && (
          <FormSection
            title="Justificatif d'origine"
            description="Document téléversé lors de l'enregistrement de cette absence."
          >
            <Field label="Document" full>
              <a
                href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/document/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13.5px] text-foreground underline underline-offset-2"
              >
                Ouvrir le document
              </a>
            </Field>
          </FormSection>
        )}

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/absence")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mise à jour…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Absence mise à jour"
        description="Les modifications ont bien été enregistrées."
        onAction={() => {
          setShowSuccessDialog(false);
          router.push(`/absence/details/${id}`);
        }}
      />
      <StatusDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        variant="error"
        title="Échec de la mise à jour"
        description={errorMessage}
        actionLabel="Fermer"
        onAction={() => setShowErrorDialog(false)}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}
