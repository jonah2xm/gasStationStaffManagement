"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
  ArrowLeft,
  Building,
  Clock,
  File,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, EmployeeIdentity, Field, FileDropzone, FormActions, FormSection, FormSkeleton, UnitInput, formatDateFr } from "@/components/ui/form-layout";
import { StatusDialog } from "@/components/ui/status-dialog";

export default function EditRecuperationPage() {
  const router = useRouter();
  const params = useParams();
  const recuperationId = params.id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingStations, setFetchingStations] = useState(true);
  const [stations, setStations] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    stationName: "",
    dureeRecuperation: "",
    dateDebut: "",
    dateRetour: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [nombreJourRestant, setNombreJourRestant] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
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
  // Fetch récupération data
  useEffect(() => {
    const fetchRecuperation = async () => {
      if (!recuperationId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recuperations/${recuperationId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch récupération");
        }
        const data = await response.json();
        console.log("data", data);
        setOriginalData(data);

        // Pre-populate form data
        setFormData({
          stationName: data.stationName,
          dureeRecuperation: data.dureeRecuperation.toString(),
          dateDebut: data.dateDebut
            ? new Date(data.dateDebut).toISOString().split("T")[0]
            : "",
          dateRetour: data.dateRetour
            ? new Date(data.dateRetour).toISOString().split("T")[0]
            : "",
        });

        setSelectedPersonnel(data.personnelId);
        setNombreJourRestant(data.nombreJourRestant || 0);
        setExistingDocument(data.document || null);
      } catch (err) {
        console.error("Error fetching récupération:", err);
        toast.error("Impossible de charger les données de la récupération", {
          duration: 3000,
          position: "bottom-left",
        });
        router.push("/recuperations");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchRecuperation();
  }, [recuperationId, router]);

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
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration); // Add duration to start date
        setFormData((prev) => ({
          ...prev,
          dateRetour: endDate.toISOString().split("T")[0],
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

    // Check if document is provided (either existing or new file)
    if (!existingDocument && !selectedFile) {
      toast.error("Un document justificatif est requis", {
        duration: 3000,
        position: "bottom-left",
      });
      isValid = false;
    }

    return isValid;
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
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
      const dataToSend = new FormData();
      dataToSend.append("stationName", formData.stationName);
      dataToSend.append(
        "dureeRecuperation",
        Number.parseInt(formData.dureeRecuperation).toString()
      );
      dataToSend.append("dateDebut", formData.dateDebut);
      dataToSend.append("dateRetour", formData.dateRetour);

      if (selectedFile) {
        dataToSend.append("document", selectedFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recuperations/${recuperationId}`,
        {
          method: "PUT",
          body: dataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            "Erreur lors de la mise à jour de la récupération"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating récupération:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de la mise à jour de la récupération"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message || "Erreur lors de la mise à jour de la récupération",
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
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Helper to extract file name from path
  const getFileName = (path) => path?.split(/[/\\]/).pop();

  if (initialLoading) {
    return <FormSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/recuperations"
        backLabel="Récupérations"
        title="Modifier la récupération"
        description={
          selectedPersonnel
            ? `${selectedPersonnel.firstName} ${selectedPersonnel.lastName} · ${selectedPersonnel.matricule}`
            : "Modifiez les informations relatives à la récupération de l'employé."
        }
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Employé" description="L'employé et sa station ne peuvent pas être modifiés.">
          <Field label="Employé" full>
            <div className="flex min-h-11 items-center rounded-md border border-dashed border-input bg-background px-2.5 py-1.5">
              <EmployeeIdentity
                firstName={selectedPersonnel?.firstName}
                lastName={selectedPersonnel?.lastName}
                matricule={selectedPersonnel?.matricule}
                meta={selectedPersonnel?.poste}
                size="sm"
                highlighted
              />
            </div>
          </Field>
          <Field label="Station" full>
            <ComputedValue icon={Building} tag="Automatique">
              {formData.stationName}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Période" description="Durée et date de départ. La fin est calculée.">
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
          <Field label="Date de fin" hint="Date de début + durée.">
            <ComputedValue icon={CalendarClock}>{formatDateFr(formData.dateRetour)}</ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Justificatif" description="Conservez le document actuel ou remplacez-le par un nouveau PDF.">
          <Field label="Document" htmlFor="document" required full>
            <FileDropzone
              id="document"
              file={selectedFile}
              onFileChange={handleFileChange}
              onRemove={() => setSelectedFile(null)}
              disabled={loading}
              currentFileHref={existingDocument ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${existingDocument}` : undefined}
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
        title="Récupération mise à jour"
        description={`La récupération de ${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""} a bien été mise à jour.`}
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
