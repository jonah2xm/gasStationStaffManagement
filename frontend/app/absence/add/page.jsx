"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Building, AlertTriangle, Eye } from "lucide-react";
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
  Field,
  FormActions,
  FormSection,
} from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { StatusDialog } from "@/components/ui/status-dialog";
import {
  ABSENCE_MOTIFS,
  DUREE_MAX,
  MOTIF_NON_AUTORISE,
  dateRetourEstimee,
  dureeValide,
  motifLabel,
} from "@/lib/absence-motifs";
import AvisDocumentPreview from "@/components/avis-document-preview";

export default function AddAbsencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    date: "",
    duree: "",
    motif: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  useEffect(() => {
    const fetchPersonnel = async () => {
      setFetchingPersonnel(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) throw new Error("Failed to fetch personnel");
        setPersonnel(await response.json());
      } catch (err) {
        console.error("Error fetching personnel:", err);
        toast.error("Impossible de charger la liste du personnel", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setFetchingPersonnel(false);
      }
    };

    fetchPersonnel();
  }, [router]);

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

    if (!selectedPersonnel) {
      nextErrors.personnel = "Veuillez sélectionner un employé";
    }
    if (!formData.date) {
      nextErrors.date = "La date d'absence est requise";
    }
    if (!formData.motif) {
      nextErrors.motif = "Le motif est requis";
    }
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
        personnelId: selectedPersonnel._id,
        date: formData.date,
        duree: formData.duree === "" ? null : Number(formData.duree),
        motif: formData.motif,
        description: formData.description,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.message || "Erreur lors de l'enregistrement de l'absence"
        );
      }

      const saved = await response.json().catch(() => ({}));
      setCreatedId(saved._id || null);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Error recording absence:", err);
      setErrorMessage(err.message);
      setShowErrorDialog(true);
      toast.error(err.message, { duration: 3000, position: "bottom-left" });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    router.push("/absence");
  };

  // Ouvre la vue d'impression de l'avis qui vient d'être enregistré.
  const handlePrintCreated = () => {
    setShowSuccessDialog(false);
    router.push(createdId ? `/absence/imprimer/${createdId}` : "/absence");
  };

  const nonAutorisee = formData.motif === MOTIF_NON_AUTORISE;

  // Avis tel qu'il sera imprimé, construit depuis le formulaire.
  const previewAvis = {
    type: "absence",
    dateEmission: new Date(),
    nom: selectedPersonnel?.lastName,
    prenom: selectedPersonnel?.firstName,
    structure: selectedPersonnel?.stationName,
    motif: formData.motif ? motifLabel(formData.motif) : "",
    fonction: selectedPersonnel?.poste,
    dateAbsence: formData.date,
    dateReprise: "",
    observation: formData.description,
  };

  const handlePreview = () => {
    if (!selectedPersonnel) {
      setErrors((prev) => ({
        ...prev,
        personnel: "Veuillez sélectionner un employé",
      }));
      toast.error("Sélectionnez un employé pour voir l'aperçu", {
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
        backHref="/absence"
        backLabel="Absences"
        title="Nouvelle absence"
        description="Une absence porte une seule date. Le motif détermine si elle est autorisée ou non."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card shadow-xs"
      >
        <FormSection
          title="Employé"
          description="L'agent concerné. Sa station est reprise automatiquement."
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
              people={personnel}
              selected={selectedPersonnel}
              onSelect={(person) => {
                setSelectedPersonnel(person);
                setOpenCombobox(false);
                setErrors((prev) => ({ ...prev, personnel: "" }));
              }}
              disabled={loading}
              invalid={!!errors.personnel}
              loading={fetchingPersonnel}
            />
          </Field>
          <Field label="Station">
            <ComputedValue
              icon={Building}
              tag="Automatique"
              placeholder="Sélectionnez un employé"
            >
              {selectedPersonnel?.stationName}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection
          title="Absence"
          description="Date et motif. « Non autorisée » est le seul motif irrégulier : tous les autres sont des absences autorisées."
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
                Cette absence sera enregistrée comme{" "}
                <span className="font-semibold">non autorisée</span> et sera
                signalée si elle dépasse 48 heures sans avis de reprise.
              </p>
            </div>
          )}

          <Field
            label="Description"
            htmlFor="description"
            full
            hint="Optionnel — précisions sur le motif."
          >
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={loading}
              rows={3}
              placeholder="Ex : certificat médical de 2 jours remis le matin même"
            />
          </Field>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/absence")}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={loading}
          >
            <Eye className="h-4 w-4" />
            Aperçu de l'avis
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer l'absence
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Absence enregistrée"
        description={`L'absence de ${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""
          } a bien été enregistrée. Vous pouvez imprimer l'avis d'absence.`}
        actionLabel="Imprimer l'avis"
        onAction={handlePrintCreated}
        secondaryLabel="Plus tard"
        onSecondary={handleSuccessConfirm}
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
