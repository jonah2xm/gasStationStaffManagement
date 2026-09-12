"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Check,
  ArrowLeft,
  Building,
  MapPin,
  Upload,
  FileText,
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
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, Field, FileDropzone, FormActions, FormSection } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { StatusDialog } from "@/components/ui/status-dialog";

export default function AddAffectationDefinitivePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
  const [fetchingStations, setFetchingStations] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [stations, setStations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openPersonnelCombobox, setOpenPersonnelCombobox] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    originalStationId: "",
    affectedStation: "",
    startDate: "",
    reason: "",
    status: "active", // Default status is active
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [user, setUser] = useState({});
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include", // 👈 IMPORTANT: needed to send cookies
          }
        );

        if (!res.ok) {
          // router.push("/login");
          throw new Error("Not authenticated");
        }

        const data = await res.json();
        console.log("data", data);
        setUser(data.user); // Adjust based on backend response structure
      } catch (err) {
        console.warn("User not logged in or error:", err.message);
        setUser(null);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
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
  }, [user]);

  // Fetch stations data
  useEffect(() => {
    const fetchStations = async () => {
      setFetchingStations(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations`
        );
        if (response.status === 401) {
          toast.error("Session expired. Redirecting to login...");
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch stations");
        }
        const data = await response.json();
        setStations(data);
      } catch (err) {
        console.error(err.message);
        toast.error("Impossible de charger les stations", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setFetchingStations(false);
      }
    };

    fetchStations();
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

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

    switch (field) {
      case "originalStationId":
        if (!formData.originalStationId && !selectedPersonnel) {
          newErrors.originalStation = "La station d'origine est requise";
        } else {
          delete newErrors.originalStationId;
        }
        break;
      case "affectedStation":
        if (!formData.affectedStation) {
          newErrors.affectedStation = "La station d'affectation est requise";
        } else if (formData.affectedStation === formData.originalStationId) {
          newErrors.affectedStation =
            "La station d'affectation doit être différente de la station d'origine";
        } else {
          delete newErrors.affectedStation;
        }
        break;
      case "startDate":
        if (!formData.startDate) {
          newErrors.startDate = "La date d'affectation est requise";
        } else {
          delete newErrors.startDate;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const validateForm = () => {
    const fields = ["originalStationId", "affectedStation", "startDate"];
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
    console.log("im going to australia");
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("personnelId", selectedPersonnel._id);
      formDataToSend.append("originStation", formData.originalStationId);
      formDataToSend.append("affectedStation", formData.affectedStation);
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("description", formData.reason);
      console.log("im going back to 505 ");
      if (file) {
        formDataToSend.append("document", file);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationDef`,
        {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Erreur lors de l'enregistrement de l'affectation définitive"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error recording affectation:", error.message);
      setErrorMessage(
        error.message ||
          "Erreur lors de l'enregistrement de l'affectation définitive"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message ||
          "Erreur lors de l'enregistrement de l'affectation définitive",
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
    router.push("/affectation/definitif");

    // Reset form
    setSelectedPersonnel(null);
    setFormData({
      originalStationId: "",
      affectedStation: "",
      startDate: "",
      reason: "",
      status: "active",
    });
    setFile(null);
    setFileError("");
    setTouched({});
    setErrors({});
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

  // When an employee is selected, set their current station as the original station
  useEffect(() => {
    if (selectedPersonnel && selectedPersonnel.stationName) {
      setFormData((prev) => ({
        ...prev,
        originalStationId: selectedPersonnel.station,
      }));

      // Clear any errors for originalStation since it's automatically set
      if (errors.originalStation) {
        setErrors((prev) => ({
          ...prev,
          originalStation: "",
        }));
      }

      // Mark as touched to avoid validation errors
      if (!touched.originalStationId) {
        setTouched((prev) => ({
          ...prev,
          originalStationId: true,
        }));
      }
    }
  }, [selectedPersonnel]);

  const originStationName = stations.find((s) => s._id === formData.originalStationId)?.name;
  const affectedStationName = stations.find((s) => s._id === formData.affectedStation)?.name;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/affectation/definitif"
        backLabel="Affectations définitives"
        title="Nouvelle affectation définitive"
        description="Transférez définitivement un agent de sa station actuelle vers une autre station."
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Employé" description="Sa station actuelle devient la station d'origine.">
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

        <FormSection title="Affectation" description="Station de destination et date d'effet.">
          <Field label="Station d'origine" required error={errors.originalStation}>
            <ComputedValue
              icon={Building}
              tag="Automatique"
              placeholder={selectedPersonnel ? "Chargement…" : "Sélectionnez d'abord un employé"}
            >
              {originStationName}
            </ComputedValue>
          </Field>
          <Field
            label="Station d'affectation"
            htmlFor="affectedStation"
            required
            error={touched.affectedStation && errors.affectedStation}
            hint={!formData.originalStationId ? "Disponible après le choix de l'employé." : undefined}
          >
            <Select
              value={formData.affectedStation}
              onValueChange={(value) => handleSelectChange(value, "affectedStation")}
              disabled={loading || !formData.originalStationId}
            >
              <SelectTrigger id="affectedStation" aria-invalid={!!(touched.affectedStation && errors.affectedStation)}>
                <SelectValue placeholder={fetchingStations ? "Chargement des stations…" : "Sélectionner une station"} />
              </SelectTrigger>
              <SelectContent>
                {stations
                  .filter((station) => station._id !== formData.originalStationId)
                  .map((station) => (
                    <SelectItem key={station._id} value={station._id}>
                      {station.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date d'affectation" htmlFor="startDate" required error={touched.startDate && errors.startDate}>
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
          <Field label="Motif" htmlFor="reason" full hint="Optionnel.">
            <Textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Précisez le motif de cette affectation définitive…"
              rows={3}
              disabled={loading}
            />
          </Field>
        </FormSection>

        <FormSection title="Justificatif" description="Décision d'affectation, si disponible.">
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
          <Button type="button" variant="outline" onClick={() => router.push("/affectation/definitif")} disabled={loading}>
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
                Enregistrer l'affectation
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Affectation enregistrée"
        description={`${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""} est affecté(e) de ${originStationName ?? "—"} vers ${affectedStationName ?? "—"}.`}
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
