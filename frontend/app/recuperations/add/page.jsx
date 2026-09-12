"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
  Check,
  ArrowLeft,
  Building,
  Clock,
  MapPin,
  Plane,
  File,
  X,
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
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, Field, FileDropzone, FormActions, FormSection, UnitInput, formatDateFr } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { StatusDialog } from "@/components/ui/status-dialog";

export default function AddRecuperationPage() {
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
    stationName: "",
    dureeRecuperation: "",
    dateDebut: "",
    dateRetour: "",
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
  }, [router]);

  // Calculate return date when start date or duration changes
  useEffect(() => {
    if (formData.dateDebut && formData.dureeRecuperation) {
      const startDate = new Date(formData.dateDebut);
      const duration = Number.parseInt(formData.dureeRecuperation);
      if (!isNaN(duration) && duration > 0) {
        const returnDate = new Date(startDate);
        returnDate.setDate(startDate.getDate() + duration);
        setFormData((prev) => ({
          ...prev,
          dateRetour: returnDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [formData.dateDebut, formData.dureeRecuperation]);

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
      case "dureeRecuperation":
        if (!formData.dureeRecuperation) {
          newErrors.dureeRecuperation =
            "La durée de la récupération est requise";
        } else if (Number.parseInt(formData.dureeRecuperation) <= 0) {
          newErrors.dureeRecuperation = "La durée doit être supérieure à 0";
        } else {
          delete newErrors.dureeRecuperation;
        }
        break;
      case "dateDebut":
        if (!formData.dateDebut) {
          newErrors.dateDebut = "La date de début est requise";
        } else {
          delete newErrors.dateDebut;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const validateForm = () => {
    const fields = ["dureeRecuperation", "dateDebut"];
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

    if (!file) {
      setFileError("Veuillez télécharger un document");
      isValid = false;
    } else {
      setFileError("");
    }

    return isValid;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setFileError("");
    } else {
      setFile(null);
      setFileError("Seuls les fichiers PDF sont autorisés");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
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
      formDataToSend.append("stationName", formData.stationName);
      formDataToSend.append(
        "dureeRecuperation",
        Number.parseInt(formData.dureeRecuperation).toString()
      );
      formDataToSend.append("dateDebut", formData.dateDebut);
      formDataToSend.append("dateRetour", formData.dateRetour);
      formDataToSend.append("document", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recuperations`,
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
            "Erreur lors de l'enregistrement de la récupération"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error recording récupération:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de l'enregistrement de la récupération"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message || "Erreur lors de l'enregistrement de la récupération",
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
    router.push("/recuperations");

    // Reset form
    setSelectedPersonnel(null);
    setFormData({
      stationName: "",
      dureeRecuperation: "",
      dateDebut: "",
      dateRetour: "",
    });
    setTouched({});
    setErrors({});
    setFile(null);
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

  // When an employee is selected, set their station as default
  useEffect(() => {
    if (selectedPersonnel && selectedPersonnel.stationName) {
      setFormData((prev) => ({
        ...prev,
        stationName: selectedPersonnel.stationName,
      }));

      // Clear any errors for station since it's automatically set
      if (errors.stationName) {
        setErrors((prev) => ({
          ...prev,
          stationName: "",
        }));
      }

      // Mark as touched to avoid validation errors
      if (!touched.stationName) {
        setTouched((prev) => ({
          ...prev,
          stationName: true,
        }));
      }
    }
  }, [selectedPersonnel]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/recuperations"
        backLabel="Récupérations"
        title="Nouvelle récupération"
        description="Enregistrez des jours de récupération et leur justificatif. La date de retour est calculée."
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Employé" description="L'agent concerné. Sa station est reprise automatiquement.">
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
          <Field label="Station" full>
            <ComputedValue icon={Building} tag="Automatique" placeholder="Sélectionnez un employé">
              {selectedPersonnel?.stationName}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Période" description="Durée et date de départ. Le retour est calculé.">
          <Field label="Durée" htmlFor="dureeRecuperation" required error={touched.dureeRecuperation && errors.dureeRecuperation}>
            <UnitInput
              unit="jours"
              type="number"
              id="dureeRecuperation"
              name="dureeRecuperation"
              value={formData.dureeRecuperation}
              onChange={handleInputChange}
              onBlur={() => handleBlur("dureeRecuperation")}
              disabled={loading}
              invalid={!!(touched.dureeRecuperation && errors.dureeRecuperation)}
              placeholder="Ex : 2"
              min="1"
            />
          </Field>
          <Field label="Date de début" htmlFor="dateDebut" required error={touched.dateDebut && errors.dateDebut}>
            <Input
              type="date"
              id="dateDebut"
              name="dateDebut"
              value={formData.dateDebut}
              onChange={handleInputChange}
              onBlur={() => handleBlur("dateDebut")}
              disabled={loading}
              aria-invalid={!!(touched.dateDebut && errors.dateDebut)}
              className="tabular-nums"
            />
          </Field>
          <Field label="Date de retour" hint="Date de début + durée.">
            <ComputedValue icon={CalendarClock} placeholder="Renseignez début et durée">
              {formatDateFr(formData.dateRetour)}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Justificatif" description="Document justifiant la récupération, au format PDF.">
          <Field label="Document" htmlFor="document" required full error={fileError}>
            <FileDropzone
              id="document"
              file={file}
              onFileChange={handleFileChange}
              onRemove={handleRemoveFile}
              disabled={loading}
              invalid={!!fileError}
            />
          </Field>
        </FormSection>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push("/recuperations")} disabled={loading}>
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
                Enregistrer la récupération
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Récupération enregistrée"
        description={`La récupération de ${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""} a bien été enregistrée.`}
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
