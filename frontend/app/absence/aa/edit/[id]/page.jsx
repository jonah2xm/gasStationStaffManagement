"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CardHeader,
  CardTitle,
  CardDescription,
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
import { ComputedValue, Field, FileDropzone, FormActions, FormSection, FormSkeleton } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";

// Types of authorized absences
const absenceTypes = [
  { id: "maladie", label: "Maladie" },
  { id: "deces", label: "Décès d'un proche" },
  { id: "marriage", label: "Mariage" },
  { id: "naissance", label: "Naissance" },
  { id: "pilgrimage", label: "Pèlerinage" },
  { id: "examen", label: "Examen" },
  { id: "autre", label: "Autre" },
];

export default function ModifyAbsenceAAPage() {
  const router = useRouter();
  const { id } = useParams();

  // Form state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openPersonnelCombobox, setOpenPersonnelCombobox] = useState(false);
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

  // Fetch personnel list (for combobox)
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch personnel");
        const data = await response.json();
        setPersonnel(data);
      } catch (err) {
        console.error("Error fetching personnel:", err);
        toast.error("Impossible de charger la liste du personnel", {
          duration: 3000,
          position: "bottom-left",
        });
      }
    };
    fetchPersonnel();
  }, []);

  // Fetch existing absence data to pre-populate the form
  useEffect(() => {
    if (!id) return;

    const fetchAbsence = async () => {
      setFetching(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA/${id}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch absence");
        const data = await response.json();

        // Pre-fill form state
        setFormData({
          startDate: data.startDate.slice(0, 10), // assuming ISO string
          endDate: data.endDate.slice(0, 10),
          absenceType: data.absenceType,
          description: data.description || "",
        });
        setSelectedPersonnel(data.personnel);
      } catch (err) {
        console.error("Error fetching absence:", err);
        toast.error(err.message || "Erreur lors du chargement de l'absence");
      } finally {
        setFetching(false);
      }
    };
    fetchAbsence();
  }, [id]);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

  const validateField = (field) => {
    let errorMsg = "";
    if (field === "startDate" && !formData.startDate) {
      errorMsg = "La date de début est requise";
    }
    if (field === "endDate") {
      if (!formData.endDate) {
        errorMsg = "La date de fin est requise";
      } else if (
        formData.startDate &&
        new Date(formData.endDate) < new Date(formData.startDate)
      ) {
        errorMsg = "La date de fin doit être postérieure à la date de début";
      }
    }
    if (field === "absenceType" && !formData.absenceType) {
      errorMsg = "Le type d'absence est requis";
    }
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    return !errorMsg;
  };

  const validateForm = () => {
    let isValid = true;
    ["startDate", "endDate", "absenceType"].forEach((field) => {
      if (!validateField(field)) isValid = false;
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

      // Send PUT request to update existing absence record
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA/${id}`,
        {
          method: "PUT", // or "PATCH" based on your backend design
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de la modification de l'absence"
        );
      }
      toast.success("Absence modifiée avec succès", {
        duration: 3000,
        position: "bottom-left",
      });
      router.push("/absence/aa");
    } catch (error) {
      console.error("Error updating absence:", error);
      toast.error(
        error.message || "Erreur lors de la modification de l'absence",
        {
          duration: 3000,
          position: "bottom-left",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate duration (days between dates)
  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return null;
  };

  // For filtering the personnel search
  const filteredPersonnel = personnel.filter(
    (person) =>
      person.firstName?.toLowerCase().includes("") ||
      person.lastName?.toLowerCase().includes("") ||
      person.matricule?.toLowerCase().includes("")
  );

  if (fetching) {
    return <FormSkeleton />;
  }

  const duration = calculateDuration();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/absence/aa"
        backLabel="Absences AA"
        title="Modifier l'absence autorisée"
        description={
          selectedPersonnel
            ? `${selectedPersonnel.firstName} ${selectedPersonnel.lastName} · ${selectedPersonnel.matricule}`
            : "Mettez à jour les informations relatives à l'absence autorisée."
        }
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
              onSelect={(person) => {
                setSelectedPersonnel(person);
                setOpenPersonnelCombobox(false);
                if (errors.personnel) {
                  setErrors((prev) => ({ ...prev, personnel: "" }));
                }
              }}
              disabled={loading}
              invalid={!!errors.personnel}
            />
          </Field>
        </FormSection>

        <FormSection title="Période" description="La date de fin doit être égale ou postérieure à la date de début.">
          <Field label="Date de début" htmlFor="startDate" required error={errors.startDate}>
            <Input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              onBlur={() => validateField("startDate")}
              disabled={loading}
              aria-invalid={!!errors.startDate}
              className="tabular-nums"
            />
          </Field>
          <Field label="Date de fin" htmlFor="endDate" required error={errors.endDate}>
            <Input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              onBlur={() => validateField("endDate")}
              disabled={loading}
              aria-invalid={!!errors.endDate}
              className="tabular-nums"
            />
          </Field>
          <Field label="Durée" hint="Jours calendaires, début et fin inclus.">
            <ComputedValue icon={CalendarClock} placeholder="Renseignez les deux dates">
              {duration ? `${duration} jour${duration > 1 ? "s" : ""}` : ""}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Motif" description="Le type d'absence et, si utile, des précisions.">
          <Field label="Type d'absence" htmlFor="absenceType" required error={errors.absenceType}>
            <Select
              onValueChange={(value) => handleSelectChange(value, "absenceType")}
              value={formData.absenceType}
              onOpenChange={() => formData.absenceType || validateField("absenceType")}
              disabled={loading}
            >
              <SelectTrigger id="absenceType" aria-invalid={!!errors.absenceType}>
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

        <FormSection title="Justificatif" description="Ajoutez un nouveau PDF pour remplacer le justificatif existant.">
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
                Enregistrer les modifications
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <Toaster position="bottom-left" />
    </div>
  );
}
