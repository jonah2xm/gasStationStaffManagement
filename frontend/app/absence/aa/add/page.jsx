"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Upload,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Check,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, Field, FileDropzone, FormActions, FormSection } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { StatusDialog } from "@/components/ui/status-dialog";

// Types of authorized absences
const absenceTypes = [
  { id: "maladie", label: "Maladie" },
  { id: "decés", label: "Décès d'un proche" },
  { id: "marriage", label: "Mariage" },
  { id: "naissance", label: "Naissance" },
  { id: "pilgrimage", label: "Pèlerinage" },
  { id: "examen", label: "Examen" },
  { id: "autre", label: "Autre" },
];

export default function AddAbsenceAAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openPersonnelCombobox, setOpenPersonnelCombobox] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    absenceType: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Additional state for overlapping dates error (if needed)
  const [overlapError, setOverlapError] = useState("");

  // Fetch personnel data
  useEffect(() => {
    const fetchPersonnel = async () => {
      setFetchingPersonnel(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`,
          {
            credentials: "include",
          }
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
    // Clear the overlap error when user changes a date field
    if (name === "startDate" || name === "endDate") {
      setOverlapError("");
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
        if (!formData.endDate) {
          newErrors.endDate = "La date de fin est requise";
        } else if (
          formData.startDate &&
          new Date(formData.endDate) < new Date(formData.startDate)
        ) {
          newErrors.endDate =
            "La date de fin doit être postérieure à la date de début";
        } else {
          delete newErrors.endDate;
        }
        break;
      case "absenceType":
        if (!formData.absenceType) {
          newErrors.absenceType = "Le type d'absence est requis";
        } else {
          delete newErrors.absenceType;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const validateForm = () => {
    const fields = ["startDate", "endDate", "absenceType"];
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
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("absenceType", formData.absenceType);
      formDataToSend.append("description", formData.description);
      if (file) {
        formDataToSend.append("document", file);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA`,
        {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        }
      );

      // If the response status is 409, it means there is an overlap
      if (response.status === 409) {
        const errorData = await response.json();
        setOverlapError(errorData.message);
        toast.error(errorData.message, {
          duration: 3000,
          position: "bottom-left",
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de l'enregistrement de l'absence"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error recording absence:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de l'enregistrement de l'absence"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message || "Erreur lors de l'enregistrement de l'absence",
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
    router.push("/absence/aa");

    // Reset form
    setSelectedPersonnel(null);
    setFormData({
      startDate: "",
      endDate: "",
      absenceType: "",
      description: "",
    });
    setFile(null);
    setTouched({});
    setErrors({});
    setOverlapError("");
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return null;
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

  const duration = calculateDuration();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/absence/aa"
        backLabel="Absences AA"
        title="Nouvelle absence autorisée"
        description="Enregistrez une absence autorisée, son motif et, si disponible, le justificatif."
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Employé" description="L'agent absent.">
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

        <FormSection title="Période" description="La date de fin doit être égale ou postérieure à la date de début.">
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
          <Field label="Date de fin" htmlFor="endDate" required error={touched.endDate && errors.endDate}>
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
          <Field label="Durée" hint="Jours calendaires, début et fin inclus.">
            <ComputedValue icon={CalendarClock} placeholder="Renseignez les deux dates">
              {duration ? `${duration} jour${duration > 1 ? "s" : ""}` : ""}
            </ComputedValue>
          </Field>
          {overlapError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-md border border-destructive-border bg-destructive-subtle px-3 py-2.5 text-[13.5px] text-destructive-text sm:col-span-2"
            >
              <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{overlapError}</span>
            </div>
          )}
        </FormSection>

        <FormSection title="Motif" description="Le type d'absence et, si utile, des précisions.">
          <Field label="Type d'absence" htmlFor="absenceType" required error={touched.absenceType && errors.absenceType}>
            <Select
              onValueChange={(value) => handleSelectChange(value, "absenceType")}
              value={formData.absenceType}
              onOpenChange={() => formData.absenceType || handleBlur("absenceType")}
              disabled={loading}
            >
              <SelectTrigger id="absenceType" aria-invalid={!!(touched.absenceType && errors.absenceType)}>
                <SelectValue placeholder="Sélectionnez le type d'absence" />
              </SelectTrigger>
              <SelectContent>
                {absenceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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

        <FormSection title="Justificatif" description="Certificat ou attestation, si disponible.">
          <Field label="Document" htmlFor="document" full error={fileError}>
            <FileDropzone
              id="document"
              file={file}
              onFileChange={handleFileChange}
              onRemove={() => setFile(null)}
              disabled={loading}
              invalid={!!fileError}
              hint="PDF uniquement · 5 Mo maximum"
            />
          </Field>
        </FormSection>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push("/absence/aa")} disabled={loading}>
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
        description={`L'absence autorisée de ${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""} a bien été enregistrée.`}
        onAction={handleSuccessConfirm}
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
