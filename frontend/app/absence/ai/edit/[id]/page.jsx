"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Calendar,
  Upload,
  FileText,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Check,
  ArrowLeft,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FileDropzone, FormActions, FormSection, FormSkeleton } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { PageError } from "@/components/ui/detail-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusDialog } from "@/components/ui/status-dialog";

export default function EditAbsenceAIPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Get the absence ID from the URL

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openPersonnelCombobox, setOpenPersonnelCombobox] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [fileError, setFileError] = useState("");
  const [operationType, setOperationType] = useState("avisAbsence"); // "avisAbsence" or "avisReprise"
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [notFound, setNotFound] = useState(false);

  // Fetch absence data
  useEffect(() => {
    const fetchAbsenceData = async () => {
      setFetchingData(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI/${id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true);
            throw new Error("Absence non trouvée");
          }
          throw new Error("Erreur lors du chargement des données");
        }

        const data = await response.json();

        // Set form data
        setFormData({
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().split("T")[0]
            : "",
          description: data.description || "",
        });

        setOperationType(data.operationType || "avisAbsence");

        // Set personnel data
        if (data.personnel) {
          setSelectedPersonnel(data.personnel);
        }

        // Set document data if exists
        if (data.document) {
          setExistingDocument(data.document);
        }
      } catch (err) {
        console.error("Error fetching absence data:", err);
        toast.error("Impossible de charger les données de l'absence", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setFetchingData(false);
      }
    };

    if (id) {
      fetchAbsenceData();
    }
  }, [id]);

  // Fetch personnel data
  useEffect(() => {
    const fetchPersonnel = async () => {
      setFetchingPersonnel(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch personnel");
        }
        const data = await response.json();
        setPersonnel(data);
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
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (value, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setFileError("Le fichier doit être au format PDF");
        setFile(null);
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setFileError("La taille du fichier ne doit pas dépasser 5MB");
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setFileError("");
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

    switch (field) {
      case "startDate":
        if (!formData.startDate) {
          newErrors.startDate = "La date de début est requise";
        } else {
          delete newErrors.startDate;
        }
        break;
      case "endDate":
        if (operationType === "avisReprise" && !formData.endDate) {
          newErrors.endDate = "La date de reprise est requise";
        } else {
          delete newErrors.endDate;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const validateForm = () => {
    const fields = ["startDate"];
    const newTouched = {};
    fields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    let isValid = true;
    fields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    if (operationType === "avisReprise") {
      if (!validateField("endDate")) {
        setTouched((prev) => ({ ...prev, endDate: true }));
        isValid = false;
      }
    }

    if (!selectedPersonnel) {
      setErrors((prev) => ({
        ...prev,
        personnel: "Veuillez sélectionner un employé",
      }));
      isValid = false;
    }
    return isValid;
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
      const formDataToSend = new FormData();
      formDataToSend.append("personnelId", selectedPersonnel._id);
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("operationType", operationType);

      if (operationType === "avisReprise") {
        formDataToSend.append("endDate", formData.endDate);
      }

      if (file) {
        formDataToSend.append("document", file);
      } else if (existingDocument) {
        formDataToSend.append("keepExistingDocument", "true");
      }

      // Use PATCH method for updating
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI/${id}`,
        {
          method: "PATCH",
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Erreur lors de la mise à jour de l'absence/reprise"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating absence:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de la mise à jour de l'absence/reprise"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message || "Erreur lors de la mise à jour de l'absence/reprise",
        {
          duration: 3000,
          position: "bottom-left",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    router.push("/absence/ai");
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const filteredPersonnel = personnel.filter(
    (person) =>
      person.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Show loading state while fetching data
  if (fetchingData) {
    return <FormSkeleton />;
  }

  // Show not found state
  if (notFound) {
    return (
      <PageError
        title="Absence non trouvée"
        message="L'absence que vous recherchez n'existe pas ou a été supprimée."
        backHref="/absence/ai"
      />
    );
  }

  const isReprise = operationType === "avisReprise";
  const operationOptions = [
    {
      value: "avisAbsence",
      title: "Avis d'absence",
      description: "L'agent est absent sans autorisation. La reprise sera ajoutée plus tard.",
    },
    {
      value: "avisReprise",
      title: "Avis de reprise",
      description: "L'agent a repris le travail : renseignez la date de reprise.",
    },
  ];

  const handleOperationTypeChange = (value) => {
    setOperationType(value);
    // When switching back to an absence notice, clear the return date and its error
    if (value === "avisAbsence") {
      setFormData((prev) => ({
        ...prev,
        endDate: "",
      }));
      setErrors((prev) => {
        const { endDate, ...rest } = prev;
        return rest;
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/absence/ai"
        backLabel="Absences AI"
        title={isReprise ? "Modifier l'avis de reprise" : "Modifier l'avis d'absence"}
        meta={<StatusBadge kind="absenceAI" value={operationType} />}
        description={
          selectedPersonnel
            ? `${selectedPersonnel.firstName} ${selectedPersonnel.lastName} · ${selectedPersonnel.matricule}`
            : undefined
        }
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Type d'avis" description="Passez en avis de reprise quand l'agent revient.">
          <Field label="Type d'avis" required full>
            <div role="radiogroup" aria-label="Type d'avis" className="grid gap-3 sm:grid-cols-2">
              {operationOptions.map((option) => {
                const checked = operationType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    disabled={loading}
                    onClick={() => handleOperationTypeChange(option.value)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60",
                      checked ? "border-foreground bg-primary-subtle" : "border-input bg-card hover:border-ink-400"
                    )}
                  >
                    <span className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border",
                          checked ? "border-foreground" : "border-ink-400"
                        )}
                      >
                        {checked && <span className="h-2 w-2 rounded-full bg-foreground" />}
                      </span>
                      {option.title}
                    </span>
                    <span className="pl-6 text-xs text-muted-foreground">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        </FormSection>

        <FormSection title="Employé" description="L'agent concerné par l'avis.">
          <Field label="Employé" htmlFor="personnel" required full error={errors.personnel}>
            <EmployeeCombobox
              id="personnel"
              open={openPersonnelCombobox}
              onOpenChange={setOpenPersonnelCombobox}
              people={filteredPersonnel}
              selected={selectedPersonnel}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              onSelect={(person) => {
                setSelectedPersonnel(person);
                setOpenPersonnelCombobox(false);
                if (errors.personnel) {
                  setErrors((prev) => ({ ...prev, personnel: "" }));
                }
              }}
              disabled={loading}
              invalid={!!errors.personnel}
              loading={fetchingPersonnel}
            />
          </Field>
        </FormSection>

        <FormSection
          title="Dates"
          description={isReprise ? "Début de l'absence et date de reprise." : "Premier jour d'absence."}
        >
          <Field label="Date de début" htmlFor="startDate" required error={touched.startDate && errors.startDate}>
            <Input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              onBlur={() => handleBlur("startDate")}
              disabled={loading}
              aria-invalid={!!(touched.startDate && errors.startDate)}
              className="tabular-nums"
            />
          </Field>
          {isReprise && (
            <Field label="Date de reprise" htmlFor="endDate" required error={touched.endDate && errors.endDate}>
              <Input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                onBlur={() => handleBlur("endDate")}
                disabled={loading}
                aria-invalid={!!(touched.endDate && errors.endDate)}
                className="tabular-nums"
              />
            </Field>
          )}
          <Field label="Description" htmlFor="description" full hint="Optionnel.">
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Informations supplémentaires sur l'absence…"
              rows={3}
              disabled={loading}
            />
          </Field>
        </FormSection>

        <FormSection title="Justificatif" description="Conservez, remplacez ou retirez le document.">
          <Field label="Document" htmlFor="document" full error={fileError}>
            <FileDropzone
              id="document"
              file={file}
              onFileChange={handleFileChange}
              onRemove={() => setFile(null)}
              disabled={loading}
              invalid={!!fileError}
              hint="PDF uniquement · 5 Mo maximum"
              currentFileHref={
                existingDocument
                  ? `/document/${encodeURIComponent(String(existingDocument).replace(/\\/g, "/"))}`
                  : undefined
              }
              onRemoveCurrent={() => setExistingDocument(null)}
            />
          </Field>
        </FormSection>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push("/absence/ai")} disabled={loading}>
            Annuler
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
                Enregistrer les modifications
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Modifications enregistrées"
        description={`Les modifications ont été enregistrées pour ${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""}.`}
        onAction={handleSuccessConfirm}
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
