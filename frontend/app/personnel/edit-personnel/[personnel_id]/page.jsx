"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle, Loader2, ArrowLeft, Save } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormActions, FormSection, FormSkeleton, UnitInput } from "@/components/ui/form-layout";
import { PageError } from "@/components/ui/detail-layout";
import { StatusDialog } from "@/components/ui/status-dialog";

const educationLevels = [
  "Baccalauréat",
  "Licence",
  "Master",
  "Doctorat",
  "Autre",
];

const posts = [
  "Pompiste Encaisseur",
  "LAveur Graisseur",
  "Chef d'equipe",
  "Chef de station",
];
const contractTypes = ["CDD", "CDI"];

const statuses = ["Actif", "En congé", "En formation", "Inactif"];

export default function EditPersonnel() {
  const router = useRouter();
  const params = useParams();
  const personnelId = params.personnel_id;
  const [user, setUser] = useState({});
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [personnelData, setPersonnelData] = useState({
    matricule: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    hireDate: "",
    poste: "",
    contractType: "",
    decision: "",
    station: "",
    stationName: "",
    holidaysLeft: "",
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fetchError, setFetchError] = useState(null);


  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/stations`,
          {
            credentials: "include",
          }
        );
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
      }
    };

    const fetchPersonnelData = async () => {
      setFetchingData(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel/${personnelId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch personnel data");
        }

        const data = await response.json();
        console.log("data", data);
        // Format dates for input fields (YYYY-MM-DD)
        const formatDate = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        setPersonnelData({
          matricule: data.matricule || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          birthDate: formatDate(data.birthDate),
          hireDate: formatDate(data.hireDate),
          poste: data.poste || "",
          contractType: data.contractType || "",
          decision: data.decision || "",
          station: data.station || "",
          stationName: data.stationName || "",
          holidaysLeft: data.holidaysLeft?.toString() || "",
        });
        setOriginalData(data);
        setFetchError(null);
      } catch (error) {
        console.error("Error fetching personnel:", error);
        setFetchError(
          error.message ||
            "Failed to load personnel data. Please try again later."
        );
        toast.error("Erreur lors du chargement des données du personnel");
      } finally {
        setFetchingData(false);
      }
    };

    fetchStations();
    if (personnelId) {
      fetchPersonnelData();
    }
  }, [personnelId, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonnelData((prevData) => ({
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

  const handleSelectChange = (value, field) => {
    if (field === "station") {
      // When station is selected, find the station object to get both ID and name
      const selectedStation = stations.find((station) => station._id === value);
      if (selectedStation) {
        setPersonnelData((prevData) => ({
          ...prevData,
          station: selectedStation._id,
          stationName: selectedStation.name,
        }));
      }
    } else {
      setPersonnelData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    }

    // Mark field as touched
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }

    // Clear error when user selects
    if (errors[field]) {
      setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

    switch (field) {
      case "matricule":
        if (!personnelData.matricule.trim()) {
          newErrors.matricule = "Matricule est requis";
        } else if (!/^[A-Za-z0-9]+$/.test(personnelData.matricule)) {
          newErrors.matricule =
            "Matricule doit contenir uniquement des lettres et des chiffres";
        } else {
          delete newErrors.matricule;
        }
        break;
      case "firstName":
        if (!personnelData.firstName.trim()) {
          newErrors.firstName = "Nom est requis";
        } else {
          delete newErrors.firstName;
        }
        break;
      case "lastName":
        if (!personnelData.lastName.trim()) {
          newErrors.lastName = "Prénom est requis";
        } else {
          delete newErrors.lastName;
        }
        break;
      case "birthDate":
        if (!personnelData.birthDate) {
          newErrors.birthDate = "Date de naissance est requise";
        } else {
          const birthDate = new Date(personnelData.birthDate);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();

          if (age < 18) {
            newErrors.birthDate = "L'employé doit avoir au moins 18 ans";
          } else if (age > 65) {
            newErrors.birthDate = "L'âge semble incorrect";
          } else {
            delete newErrors.birthDate;
          }
        }
        break;
      case "hireDate":
        if (!personnelData.hireDate) {
          newErrors.hireDate = "Date de recrutement est requise";
        } else {
          const hireDate = new Date(personnelData.hireDate);
          const today = new Date();

          if (hireDate > today) {
            newErrors.hireDate =
              "La date de recrutement ne peut pas être dans le futur";
          } else {
            delete newErrors.hireDate;
          }
        }
        break;
      case "poste":
        if (!personnelData.poste) {
          newErrors.poste = "Poste est requis";
        } else {
          delete newErrors.poste;
        }
        break;
      case "contractType":
        if (!personnelData.contractType) {
          newErrors.contractType = "Type de contrat est requis";
        } else {
          delete newErrors.contractType;
        }
        break;
      case "decision":
        if (!personnelData.decision) {
          newErrors.decision = "Décision est requise";
        } else {
          delete newErrors.decision;
        }
        break;
      case "station":
        if (!personnelData.station) {
          newErrors.station = "Station est requise";
        } else {
          delete newErrors.station;
        }
        break;
      case "holidaysLeft":
        if (!personnelData.holidaysLeft) {
          newErrors.holidaysLeft = "Le congé restant est requis";
        } else if (isNaN(personnelData.holidaysLeft)) {
          newErrors.holidaysLeft = "Le congé restant doit être un nombre";
        } else {
          delete newErrors.holidaysLeft;
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
      "matricule",
      "firstName",
      "lastName",
      "birthDate",
      "hireDate",
      "poste",
      "contractType",
      "decision",
      "station",
      "holidaysLeft",
    ];

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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel/${personnelId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...personnelData,
              _id: personnelId, // Include the ID in the request body
            }),
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update personnel");
        }

        setShowSuccessDialog(true);
      } catch (error) {
        console.error("Error updating personnel:", error);
        setErrorMessage(
          error.message || "Erreur lors de la mise à jour du personnel"
        );
        setShowErrorDialog(true);
        toast.error(
          error.message || "Erreur lors de la mise à jour du personnel",
          {
            duration: 3000,
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
    router.push("/personnel");
  };

  const hasChanges = () => {
    console.log("originalData", originalData);
    return (
      personnelData.matricule !== originalData.matricule ||
      personnelData.firstName !== originalData.firstName ||
      personnelData.lastName !== originalData.lastName ||
      personnelData.birthDate !==
        (originalData.birthDate
          ? new Date(originalData.birthDate).toISOString().split("T")[0]
          : "") ||
      personnelData.hireDate !==
        (originalData.hireDate
          ? new Date(originalData.hireDate).toISOString().split("T")[0]
          : "") ||
      personnelData.poste !== originalData.poste ||
      personnelData.contractType !== originalData.contractType ||
      personnelData.decision !== originalData.decision ||
      personnelData.station !== originalData.station ||
      personnelData.holidaysLeft !== originalData.holidaysLeft.toString()
    );
  };

  if (fetchingData) {
    return <FormSkeleton />;
  }

  if (fetchError) {
    return (
      <PageError
        title="Impossible de charger cette fiche"
        message={fetchError}
        backHref="/personnel"
        onRetry={() => window.location.reload()}
      />
    );
  }

  const fieldError = (field) => (touched[field] && errors[field]) || undefined;
  const changed = hasChanges();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref={`/personnel/details/${personnelId}`}
        backLabel="Fiche agent"
        title="Modifier l'agent"
        description={`${personnelData.firstName} ${personnelData.lastName} · ${personnelData.matricule}`}
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Identité" description="Le matricule doit être unique et ne contenir que des lettres et des chiffres.">
          <Field label="Matricule" htmlFor="matricule" required error={fieldError("matricule")}>
            <Input
              type="text"
              id="matricule"
              name="matricule"
              value={personnelData.matricule}
              onChange={handleInputChange}
              onBlur={() => handleBlur("matricule")}
              aria-invalid={!!fieldError("matricule")}
              placeholder="Entrez le matricule"
              disabled={loading}
              className="tabular-nums"
            />
          </Field>
          <Field label="Date de naissance" htmlFor="birthDate" required error={fieldError("birthDate")}>
            <Input
              type="date"
              id="birthDate"
              name="birthDate"
              value={personnelData.birthDate}
              onChange={handleInputChange}
              onBlur={() => handleBlur("birthDate")}
              aria-invalid={!!fieldError("birthDate")}
              disabled={loading}
              className="tabular-nums"
            />
          </Field>
          <Field label="Nom" htmlFor="firstName" required error={fieldError("firstName")}>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              value={personnelData.firstName}
              onChange={handleInputChange}
              onBlur={() => handleBlur("firstName")}
              aria-invalid={!!fieldError("firstName")}
              placeholder="Entrez le nom"
              disabled={loading}
            />
          </Field>
          <Field label="Prénom" htmlFor="lastName" required error={fieldError("lastName")}>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              value={personnelData.lastName}
              onChange={handleInputChange}
              onBlur={() => handleBlur("lastName")}
              aria-invalid={!!fieldError("lastName")}
              placeholder="Entrez le prénom"
              disabled={loading}
            />
          </Field>
        </FormSection>

        <FormSection title="Poste et affectation" description="Poste occupé, contrat, décision et station de rattachement.">
          <Field label="Poste" htmlFor="poste" required error={fieldError("poste")}>
            <Select
              onValueChange={(value) => handleSelectChange(value, "poste")}
              value={personnelData.poste}
              onOpenChange={() => !personnelData.poste && handleBlur("poste")}
              disabled={loading}
            >
              <SelectTrigger id="poste" aria-invalid={!!fieldError("poste")}>
                <SelectValue placeholder="Sélectionnez le poste" />
              </SelectTrigger>
              <SelectContent>
                {posts.map((poste) => (
                  <SelectItem key={poste} value={poste}>
                    {poste}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type de contrat" htmlFor="contractType" required error={fieldError("contractType")}>
            <Select
              onValueChange={(value) => handleSelectChange(value, "contractType")}
              value={personnelData.contractType}
              onOpenChange={() => !personnelData.contractType && handleBlur("contractType")}
              disabled={loading}
            >
              <SelectTrigger id="contractType" aria-invalid={!!fieldError("contractType")}>
                <SelectValue placeholder="Sélectionnez le type de contrat" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Station" htmlFor="station" required error={fieldError("station")}>
            <Select
              onValueChange={(value) => handleSelectChange(value, "station")}
              value={personnelData.station}
              onOpenChange={() => !personnelData.station && handleBlur("station")}
              disabled={loading}
            >
              <SelectTrigger id="station" aria-invalid={!!fieldError("station")}>
                <SelectValue placeholder="Sélectionnez la station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station._id} value={station._id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Décision" htmlFor="decision" required error={fieldError("decision")}>
            <Select
              onValueChange={(value) => handleSelectChange(value, "decision")}
              value={personnelData.decision}
              onOpenChange={() => !personnelData.decision && handleBlur("decision")}
              disabled={loading}
            >
              <SelectTrigger id="decision" aria-invalid={!!fieldError("decision")}>
                <SelectValue placeholder="Sélectionnez la décision" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station._id} value={station.name}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date de recrutement" htmlFor="hireDate" required error={fieldError("hireDate")}>
            <Input
              type="date"
              id="hireDate"
              name="hireDate"
              value={personnelData.hireDate}
              onChange={handleInputChange}
              onBlur={() => handleBlur("hireDate")}
              aria-invalid={!!fieldError("hireDate")}
              disabled={loading}
              className="tabular-nums"
            />
          </Field>
        </FormSection>

        <FormSection title="Congés" description="Ajustez le solde de congés restant si nécessaire.">
          <Field label="Congés restants" htmlFor="holidaysLeft" required error={fieldError("holidaysLeft")}>
            <UnitInput
              unit="jours"
              type="number"
              id="holidaysLeft"
              name="holidaysLeft"
              value={personnelData.holidaysLeft}
              onChange={handleInputChange}
              invalid={!!fieldError("holidaysLeft")}
              min="0"
              placeholder="Ex : 20"
              disabled={loading}
            />
          </Field>
        </FormSection>

        <FormActions>
          {!changed && <span className="text-xs text-muted-foreground">Aucune modification à enregistrer.</span>}
          <Button type="button" variant="outline" onClick={() => router.push("/personnel")} disabled={loading}>
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
        title="Fiche mise à jour"
        description="Les informations de l'agent ont bien été enregistrées."
        actionLabel="Retour au personnel"
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
