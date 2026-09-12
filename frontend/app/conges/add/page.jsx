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
  Upload,
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
import { ComputedValue, Field, FileDropzone, FormActions, FormSection, InputWithIcon, UnitInput, formatDateFr } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { StatusDialog } from "@/components/ui/status-dialog";

export default function AddCongePage() {
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
    stationId: "",
    typeConge: "ordinaire",
    dureeConge: "",
    dateDebut: "",
    dateRetour: "",
    lieuSejour: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [nombreJourRestant] = useState(0); // Always starts at 0
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
    if (formData.dateDebut && formData.dureeConge) {
      const startDate = new Date(formData.dateDebut);
      const duration = Number.parseInt(formData.dureeConge);
      if (!isNaN(duration) && duration > 0) {
        const returnDate = new Date(startDate);
        returnDate.setDate(startDate.getDate() + duration);
        setFormData((prev) => ({
          ...prev,
          dateRetour: returnDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [formData.dateDebut, formData.dureeConge]);

  // inside AddCongePage component
const handleSelectById = (id) => {
  const person = personnel.find((p) => p._id === id);
  if (!person) return;
  setSelectedPersonnel(person);
  setOpenPersonnelCombobox(false);
  if (errors.personnel) {
    setErrors((prev) => ({ ...prev, personnel: "" }));
  }
};

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
      case "dureeConge":
        if (!formData.dureeConge) {
          newErrors.dureeConge = "La durée du congé est requise";
        } else if (Number.parseInt(formData.dureeConge) <= 0) {
          newErrors.dureeConge = "La durée doit être supérieure à 0";
        } else {
          delete newErrors.dureeConge;
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
    const fields = ["dureeConge", "dateDebut"];
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
    console.log(
      "nombreJourRestant",
      nombreJourRestant,
      "dureeConge",
      formData.dureeConge
    );
    if (selectedPersonnel.holidaysLeft - parseInt(formData.dureeConge) < 0) {
      toast.error("Le nombre de jours restants est insuffisant pour ce congé", {
        duration: 3000,
        position: "bottom-left",
      });
      return;
    }

    setLoading(true);
    console.log("formData", formData.stationId);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("personnelId", selectedPersonnel._id);
      formDataToSend.append("stationName", formData.stationName);
      formDataToSend.append("typeConge", formData.typeConge);
      formDataToSend.append("dureeConge", Number.parseInt(formData.dureeConge));
      formDataToSend.append("dateDebut", formData.dateDebut);
      formDataToSend.append("dateRetour", formData.dateRetour);
      formDataToSend.append("lieuSejour", formData.lieuSejour);
      formDataToSend.append("nombreJourRestant", nombreJourRestant.toString());
      formDataToSend.append("document", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`,
        {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de l'enregistrement du congé"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error recording congé:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de l'enregistrement du congé"
      );
      setShowErrorDialog(true);
      toast.error(error.message || "Erreur lors de l'enregistrement du congé", {
        duration: 3000,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    router.push("/conges");

    // Reset form
    setSelectedPersonnel(null);
    setFormData({
      stationId: "",
      typeConge: "ordinaire",
      dureeConge: "",
      dateDebut: "",
      dateRetour: "",
      lieuSejour: "",
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
      console.log("stationId", selectedPersonnel);
      setFormData((prev) => ({
        ...prev,
        stationName: selectedPersonnel.stationName,
      }));

      // Clear any errors for station since it's automatically set
      if (errors.stationId) {
        setErrors((prev) => ({
          ...prev,
          stationId: "",
        }));
      }

      // Mark as touched to avoid validation errors
      if (!touched.stationId) {
        setTouched((prev) => ({
          ...prev,
          stationId: true,
        }));
      }
    } else console.log("no its  not working", selectedPersonnel);
  }, [selectedPersonnel]);
useEffect(() => {
  if (!openPersonnelCombobox) return;

  const onPointerDownCapture = (e) => {
    // find closest element that carries our data attribute
    const el = e.target.closest && e.target.closest('[data-employee-id]');
    if (!el) return;
    // stop other handlers from interfering
    e.preventDefault?.();
    e.stopPropagation?.();
    const id = el.getAttribute('data-employee-id');
    if (id) {
      // invoke your selection
      handleSelectById(id);
    }
  };

  // capture phase: runs before other handlers
  document.addEventListener('pointerdown', onPointerDownCapture, true);

  return () => {
    document.removeEventListener('pointerdown', onPointerDownCapture, true);
  };
}, [openPersonnelCombobox, personnel]); // include any deps you need

  const holidaysLeft = selectedPersonnel ? Number(selectedPersonnel.holidaysLeft ?? 0) : null;
  const requestedDays = Number.parseInt(formData.dureeConge);
  const balanceAfter = holidaysLeft !== null && !Number.isNaN(requestedDays) ? holidaysLeft - requestedDays : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/conges"
        backLabel="Congés"
        title="Nouveau congé"
        description="Enregistrez un congé et son justificatif. La date de retour est calculée automatiquement."
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection
          title="Employé"
          description="L'agent concerné. Sa station et son solde de congés sont repris automatiquement."
        >
          <Field label="Employé" htmlFor="personnel" required full error={errors.personnel}>
            <EmployeeCombobox
              id="personnel"
              open={openPersonnelCombobox}
              onOpenChange={setOpenPersonnelCombobox}
              people={filteredPersonnel}
              selected={selectedPersonnel}
              onSelect={(person) => handleSelectById(person._id)}
              disabled={loading}
              invalid={!!errors.personnel}
              loading={fetchingPersonnel}
            />
          </Field>
          <Field label="Station">
            <ComputedValue icon={Building} tag="Automatique" placeholder="Sélectionnez un employé">
              {selectedPersonnel?.stationName}
            </ComputedValue>
          </Field>
          <Field
            label="Solde de congés"
            error={balanceAfter !== null && balanceAfter < 0 ? "Solde insuffisant pour cette durée" : undefined}
            hint={
              balanceAfter !== null
                ? `Après ce congé : ${balanceAfter} jour${Math.abs(balanceAfter) > 1 ? "s" : ""}`
                : "Mis à jour automatiquement pendant la durée du congé."
            }
          >
            <ComputedValue icon={Plane} tag="Actuel" placeholder="—">
              {holidaysLeft !== null ? `${holidaysLeft} jour${holidaysLeft > 1 ? "s" : ""}` : ""}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Période" description="Type, durée et date de départ. Le retour est calculé.">
          <Field label="Type de congé" htmlFor="typeConge" required>
            <Select
              value={formData.typeConge}
              onValueChange={(value) => handleSelectChange(value, "typeConge")}
              disabled={loading}
            >
              <SelectTrigger id="typeConge">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinaire">Ordinaire</SelectItem>
                <SelectItem value="anticipe">Anticipé</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Durée" htmlFor="dureeConge" required error={touched.dureeConge && errors.dureeConge}>
            <UnitInput
              unit="jours"
              type="number"
              id="dureeConge"
              name="dureeConge"
              value={formData.dureeConge}
              onChange={handleInputChange}
              onBlur={() => handleBlur("dureeConge")}
              disabled={loading}
              invalid={!!(touched.dureeConge && errors.dureeConge)}
              placeholder="Ex : 15"
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
          <Field label="Lieu de séjour" htmlFor="lieuSejour" full hint="Optionnel.">
            <InputWithIcon icon={MapPin}>
              <Input
                id="lieuSejour"
                name="lieuSejour"
                value={formData.lieuSejour}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ex : Béjaïa"
                className="pl-9"
              />
            </InputWithIcon>
          </Field>
        </FormSection>

        <FormSection title="Justificatif" description="Demande ou décision signée, au format PDF.">
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
          <Button type="button" variant="outline" onClick={() => router.push("/conges")} disabled={loading}>
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
                Enregistrer le congé
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Congé enregistré"
        description={`Le congé de ${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""} a bien été enregistré.`}
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
