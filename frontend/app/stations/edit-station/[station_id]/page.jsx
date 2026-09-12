"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Loader2, ArrowLeft, Save } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormActions, FormSection, FormSkeleton } from "@/components/ui/form-layout";
import { PageError } from "@/components/ui/detail-layout";
import { StatusDialog } from "@/components/ui/status-dialog";

const stationTypes = ["Urbaine", "Rurale", "Autoroute", "Airport"];
export default function EditStation() {
  const router = useRouter();
  const params = useParams();
  const stationId = params.station_id;
  console.log(params.station_id);

  const [stationData, setStationData] = useState({
    code: "",
    name: "",
    address: "",
    city: "",
    state: "",
    type: "",
    notes: "",
    isActive: true,
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingStation, setFetchingStation] = useState(true);
  const [touched, setTouched] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchStationData = async () => {
      setFetchingStation(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations/${stationId}`,
          {
            method: "GET",
          }
        );
        if (response.status === 401) {
          toast.error("Session expired. Redirecting to login...");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch station data");
        }

        const data = await response.json();
        setStationData({
          code: data.code || "",
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          type: data.type || "",
          notes: data.notes || "",
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
        setOriginalData(data);
        setFetchError(null);
      } catch (error) {
        console.error("Error fetching station:", error);
        setFetchError(
          error.message ||
            "Failed to load station data. Please try again later."
        );
        toast.error("Erreur lors du chargement des données de la station");
      } finally {
        setFetchingStation(false);
      }
    };

    if (stationId) {
      fetchStationData();
    }
  }, [stationId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStationData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Mark field as touched
    if (!touched[name]) {
      setTouched((prev) => ({ ...prev, [name]: true }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
    }
  };

  const handleSelectChange = (value) => {
    setStationData((prevData) => ({
      ...prevData,
      type: value,
    }));

    // Mark field as touched
    if (!touched.type) {
      setTouched((prev) => ({ ...prev, type: true }));
    }

    // Clear error when user selects
    if (errors.type) {
      setErrors((prevErrors) => ({ ...prevErrors, type: "" }));
    }
  };

  const handleSwitchChange = (checked) => {
    setStationData((prevData) => ({
      ...prevData,
      isActive: checked,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

    switch (field) {
      case "code":
        if (!stationData.code.trim()) {
          newErrors.code = "Le code de la station est requis";
        } else if (!/^[A-Za-z0-9-]+$/.test(stationData.code)) {
          newErrors.code =
            "Le code ne doit contenir que des lettres, des chiffres et des tirets";
        } else {
          delete newErrors.code;
        }
        break;
      case "name":
        if (!stationData.name.trim()) {
          newErrors.name = "Le nom de la station est requis";
        } else {
          delete newErrors.name;
        }
        break;
      case "address":
        if (!stationData.address.trim()) {
          newErrors.address = "L'adresse est requise";
        } else {
          delete newErrors.address;
        }
        break;
      case "city":
        if (!stationData.city.trim()) {
          newErrors.city = "La ville est requise";
        } else {
          delete newErrors.city;
        }
        break;
      case "state":
        if (!stationData.state.trim()) {
          newErrors.state = "La wilaya est requise";
        } else {
          delete newErrors.state;
        }
        break;
      case "type":
        if (!stationData.type) {
          newErrors.type = "Le type de station est requis";
        } else {
          delete newErrors.type;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const validateForm = () => {
    const fields = ["code", "name", "address", "city", "state", "type"];

    // Mark all fields as touched
    const newTouched = {};
    fields.forEach((field) => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Validate all fields
    let isValid = true;
    fields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations/${stationId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...stationData,
              _id: stationId, // Include the ID in the request body
            }),
            credentials: "include",
          }
        );
        if (response.status === 401) {
          toast.error("Session expired. Redirecting to login...");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Erreur lors de la mise à jour de la station"
          );
        }

        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Error updating station:", error);
        setErrorMessage(
          error.message || "Erreur lors de la mise à jour de la station"
        );
        setShowErrorDialog(true);
        toast.error(
          error.message || "Erreur lors de la mise à jour de la station",
          {
            duration: 5000,
            position: "bottom-left",
          }
        );
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Veuillez corriger les erreurs dans le formulaire", {
        duration: 3000,
        position: "bottom-left",
      });
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessDialog(false);
    router.push("/stations");
  };

  const hasChanges = () => {
    return (
      stationData.code !== originalData.code ||
      stationData.name !== originalData.name ||
      stationData.address !== originalData.address ||
      stationData.city !== originalData.city ||
      stationData.state !== originalData.state ||
      stationData.type !== originalData.type ||
      stationData.notes !== originalData.notes ||
      stationData.isActive !== originalData.isActive
    );
  };

  if (fetchingStation) {
    return <FormSkeleton />;
  }

  if (fetchError) {
    return (
      <PageError
        title="Impossible de charger cette station"
        message={fetchError}
        backHref="/stations"
        onRetry={() => window.location.reload()}
      />
    );
  }

  const stationTypeLabels = { Airport: "Aéroport" };
  const fieldError = (field) => (touched[field] && errors[field]) || undefined;
  const changed = hasChanges();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/stations"
        backLabel="Stations"
        title="Modifier la station"
        description={[stationData.code, stationData.name].filter(Boolean).join(" · ")}
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Identification" description="Le code ne contient que des lettres, des chiffres et des tirets.">
          <Field label="Code station" htmlFor="code" required error={fieldError("code")}>
            <Input
              type="text"
              id="code"
              name="code"
              value={stationData.code}
              onChange={handleInputChange}
              onBlur={() => handleBlur("code")}
              aria-invalid={!!fieldError("code")}
              placeholder="Entrez le code de la station"
              disabled={loading}
              className="tabular-nums"
            />
          </Field>
          <Field label="Nom de la station" htmlFor="name" required error={fieldError("name")}>
            <Input
              type="text"
              id="name"
              name="name"
              value={stationData.name}
              onChange={handleInputChange}
              onBlur={() => handleBlur("name")}
              aria-invalid={!!fieldError("name")}
              placeholder="Entrez le nom de la station"
              disabled={loading}
            />
          </Field>
          <Field label="Type de station" htmlFor="type" required error={fieldError("type")}>
            <Select
              onValueChange={handleSelectChange}
              value={stationData.type}
              onOpenChange={() => !stationData.type && handleBlur("type")}
              disabled={loading}
            >
              <SelectTrigger id="type" aria-invalid={!!fieldError("type")}>
                <SelectValue placeholder="Sélectionnez le type de station" />
              </SelectTrigger>
              <SelectContent>
                {stationTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {stationTypeLabels[type] || type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FormSection>

        <FormSection title="Localisation" description="Adresse complète de la station.">
          <Field label="Adresse" htmlFor="address" required full error={fieldError("address")}>
            <Input
              type="text"
              id="address"
              name="address"
              value={stationData.address}
              onChange={handleInputChange}
              onBlur={() => handleBlur("address")}
              aria-invalid={!!fieldError("address")}
              placeholder="Entrez l'adresse"
              disabled={loading}
            />
          </Field>
          <Field label="Ville" htmlFor="city" required error={fieldError("city")}>
            <Input
              type="text"
              id="city"
              name="city"
              value={stationData.city}
              onChange={handleInputChange}
              onBlur={() => handleBlur("city")}
              aria-invalid={!!fieldError("city")}
              placeholder="Entrez la ville"
              disabled={loading}
            />
          </Field>
          <Field label="Wilaya" htmlFor="state" required error={fieldError("state")}>
            <Input
              type="text"
              id="state"
              name="state"
              value={stationData.state}
              onChange={handleInputChange}
              onBlur={() => handleBlur("state")}
              aria-invalid={!!fieldError("state")}
              placeholder="Entrez la wilaya"
              disabled={loading}
            />
          </Field>
        </FormSection>

        <FormSection title="Notes" description="Informations utiles pour les gestionnaires.">
          <Field label="Notes additionnelles" htmlFor="notes" full hint="Optionnel.">
            <Textarea
              id="notes"
              name="notes"
              value={stationData.notes}
              onChange={handleInputChange}
              placeholder="Travaux, horaires particuliers…"
              rows={4}
              disabled={loading}
            />
          </Field>
        </FormSection>

        <FormActions>
          {!changed && <span className="text-xs text-muted-foreground">Aucune modification à enregistrer.</span>}
          <Button type="button" variant="outline" onClick={() => router.push("/stations")} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading || !changed}>
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
        title="Station mise à jour"
        description={`Les informations de la station ${stationData.name} ont bien été enregistrées.`}
        actionLabel="Voir les stations"
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
