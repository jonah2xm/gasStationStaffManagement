"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormActions, FormSection } from "@/components/ui/form-layout";
import { StatusDialog } from "@/components/ui/status-dialog";

const stationTypes = ["Urbaine", "Rurale", "Autoroute", "Airport"];

export default function AddStation() {
  const router = useRouter();
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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(stationData),
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
            errorData.message || "Erreur lors de l'ajout de la station"
          );
        }

        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Error adding station:", error);
        setErrorMessage(
          error.message || "Erreur lors de l'ajout de la station"
        );
        setShowErrorDialog(true);
        toast.error(error.message || "Erreur lors de l'ajout de la station", {
          duration: 5000,
          position: "bottom-left",
        });
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

  const stationTypeLabels = { Airport: "Aéroport" };
  const fieldError = (field) => (touched[field] && errors[field]) || undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/stations"
        backLabel="Stations"
        title="Nouvelle station"
        description="Enregistrez une station-service : code, nom, localisation et type."
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
              placeholder="Ex : GD-R3120"
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
              placeholder="Ex : GD R3120"
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
              placeholder="Ex : Béjaïa"
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
              placeholder="Ex : Béjaïa"
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
          <Button type="button" variant="outline" onClick={() => router.push("/stations")} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ajout en cours…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Ajouter la station
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Station ajoutée"
        description={`La station ${stationData.name} est maintenant disponible dans la liste des stations.`}
        actionLabel="Voir les stations"
        onAction={handleSuccessConfirm}
      />
      <StatusDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        variant="error"
        title="Échec de l'ajout"
        description={errorMessage}
        actionLabel="Fermer"
        onAction={() => setShowErrorDialog(false)}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}
