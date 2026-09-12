"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, Field, FileDropzone, FormActions, FormSection, FormSkeleton } from "@/components/ui/form-layout";
import { EmployeeCombobox } from "@/components/ui/employee-combobox";
import { PageError } from "@/components/ui/detail-layout";
import { StatusDialog } from "@/components/ui/status-dialog";

export default function EditAffectationTemporairePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Get the affectation ID from the URL

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
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
    temporaryStation: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [fileError, setFileError] = useState("");
  const [notFound, setNotFound] = useState(false);
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
  // Fetch affectation data
  useEffect(() => {
    const fetchAffectationData = async () => {
      setFetchingData(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp/${id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true);
            throw new Error("Affectation non trouvée");
          }
          throw new Error("Erreur lors du chargement des données");
        }

        const data = await response.json();
        console.log("data", data.originStation.name);
        // Set form data
        setFormData({
          originalStationId: data.originStation || "",
          temporaryStation: data.affectedStation || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().split("T")[0]
            : "",
          reason: data.reason || "",
        });

        // Set personnel data
        if (data.personnel) {
          setSelectedPersonnel(data.personnel);
        }

        // Set document data if exists
        if (data.document) {
          setExistingDocument(data.document);
        }
      } catch (err) {
        console.error("Error fetching affectation data:", err);
        toast.error("Impossible de charger les données de l'affectation", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setFetchingData(false);
      }
    };

    if (id) {
      fetchAffectationData();
    }
  }, [id, user]);

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

  // Update original station when personnel changes
  useEffect(() => {
    if (selectedPersonnel && selectedPersonnel.station) {
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
      case "temporaryStation":
        if (!formData.temporaryStation) {
          newErrors.temporaryStation = "La station temporaire est requise";
        } else if (
          (formData.temporaryStation?._id ?? formData.temporaryStation) === (formData.originalStationId?._id ?? formData.originalStationId)
        ) {
          newErrors.temporaryStation =
            "La station temporaire doit être différente de la station d'origine";
        } else {
          delete newErrors.temporaryStation;
        }
        break;
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
          new Date(formData.endDate) <= new Date(formData.startDate)
        ) {
          newErrors.endDate =
            "La date de fin doit être postérieure à la date de début";
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
    const fields = [
      "originalStationId",
      "temporaryStation",
      "startDate",
      "endDate",
    ];
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

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("personnelId", selectedPersonnel._id);
      formDataToSend.append("originStation", (formData.originalStationId?._id ?? formData.originalStationId));
      formDataToSend.append("affectedStation", (formData.temporaryStation?._id ?? formData.temporaryStation));
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("reason", formData.reason);

      if (file) {
        formDataToSend.append("document", file);
      } else if (existingDocument) {
        formDataToSend.append("keepExistingDocument", "true");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp/${id}`,
        {
          method: "PUT",
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Erreur lors de la mise à jour de l'affectation temporaire"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating affectation:", error.message);
      setErrorMessage(
        error.message ||
          "Erreur lors de la mise à jour de l'affectation temporaire"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message ||
          "Erreur lors de la mise à jour de l'affectation temporaire",
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
    router.push("/affectation/temporaire");
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
        title="Affectation non trouvée"
        message="L'affectation que vous recherchez n'existe pas ou a été supprimée."
        backHref="/affectation/temporaire"
      />
    );
  }

  // Stations arrive populated from the API but become ids once edited.
  const originStationId = formData.originalStationId?._id ?? formData.originalStationId;
  const temporaryStationId = formData.temporaryStation?._id ?? formData.temporaryStation;
  const originStationName =
    selectedPersonnel?.stationName || stations.find((s) => s._id === originStationId)?.name;
  const temporaryStationName = stations.find((s) => s._id === temporaryStationId)?.name;
  const durationDays =
    formData.startDate && formData.endDate
      ? Math.round((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))
      : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/affectation/temporaire"
        backLabel="Affectations temporaires"
        title="Modifier l'affectation temporaire"
        description={
          selectedPersonnel
            ? `${selectedPersonnel.firstName} ${selectedPersonnel.lastName} · ${selectedPersonnel.matricule}`
            : undefined
        }
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

        <FormSection title="Stations" description="La station temporaire doit être différente de la station d'origine.">
          <Field label="Station d'origine" required error={errors.originalStation}>
            <ComputedValue icon={Building} tag="Automatique" placeholder="Station non trouvée">
              {originStationName}
            </ComputedValue>
          </Field>
          <Field
            label="Station temporaire"
            htmlFor="temporaryStation"
            required
            error={touched.temporaryStation && errors.temporaryStation}
          >
            <Select
              value={temporaryStationId || ""}
              onValueChange={(value) =>
                handleSelectChange(stations.find((s) => s._id === value) || value, "temporaryStation")
              }
              disabled={loading}
            >
              <SelectTrigger id="temporaryStation" aria-invalid={!!(touched.temporaryStation && errors.temporaryStation)}>
                <SelectValue placeholder="Sélectionner une station">{temporaryStationName}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {stations
                  .filter((station) => station._id !== originStationId)
                  .map((station) => (
                    <SelectItem key={station._id} value={station._id}>
                      {station.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Période" description="La date de fin doit être postérieure à la date de début.">
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
          <Field label="Durée">
            <ComputedValue icon={CalendarClock} placeholder="Renseignez les deux dates">
              {durationDays > 0 ? `${durationDays} jour${durationDays > 1 ? "s" : ""}` : ""}
            </ComputedValue>
          </Field>
          <Field label="Motif" htmlFor="reason" full hint="Optionnel.">
            <Textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              placeholder="Précisez le motif de cette affectation temporaire…"
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
          <Button type="button" variant="outline" onClick={() => router.push("/affectation/temporaire")} disabled={loading}>
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
        title="Affectation mise à jour"
        description={`${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""} : ${originStationName ?? "station d'origine"} → ${temporaryStationName ?? "station temporaire"}.`}
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
