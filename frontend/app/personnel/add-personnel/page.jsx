"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Field, FormActions, FormSection, FormSkeleton, UnitInput } from "@/components/ui/form-layout";


const educationLevels = [
  "Baccalauréat",
  "Licence",
  "Master",
  "Doctorat",
  "Autre",
];

const posts = [
  "Pompiste Encaisseur",
  "Laveur Graisseur",
  "Agent Prevention Intervention",
  "Chef d'equipe",
  "Chef de station",
];
const contractTypes = ["CDD", "CDI"];

const statuses = ["Actif", "En congé", "En formation", "Inactif"];

export default function AddPersonnel() {
  const router = useRouter();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingStations, setFetchingStations] = useState(true);
  const [personnelData, setPersonnelData] = useState({
    matricule: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    hireDate: "",
    poste: "",
    contractType: "",
    decision: "",
    station: "", // This will store the station ID
    stationName: "",
    holidaysLeft: 0,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [user, setUser] = useState({});


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
  }, [user]);

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
        console.log("personal data", personnelData);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(personnelData),
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to add personnel");
        } else {
          toast.success("Personnel ajouté avec succès!", {
            duration: 3000,
            position: "bottom-left",
            style: {
              background: "#4BB543",
              color: "#fff",
              borderRadius: "10px",
            },
          });

          // Wait a moment for the toast to be visible before redirecting
          setTimeout(() => {
            router.push("/personnel");
          }, 1000);
        }
      } catch (error) {
        console.error("Error adding personnel:", error);
        toast.error(error.message || "Erreur lors de l'ajout du personnel", {
          duration: 3000,
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

  if (fetchingStations) {
    return <FormSkeleton />;
  }

  const fieldError = (field) => (touched[field] && errors[field]) || undefined;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/personnel"
        backLabel="Personnel"
        title="Nouvel agent"
        description="Enregistrez un agent, son poste, sa station et son solde de congés."
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
              placeholder="Ex : R3120-04"
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
            />
          </Field>
        </FormSection>

        <FormSection title="Poste et affectation" description="Poste occupé, contrat, décision et station de rattachement.">
          <Field label="Poste" htmlFor="poste" required error={fieldError("poste")}>
            <Select
              onValueChange={(value) => handleSelectChange(value, "poste")}
              value={personnelData.poste}
              onOpenChange={() => !personnelData.poste && handleBlur("poste")}
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
              className="tabular-nums"
            />
          </Field>
        </FormSection>

        <FormSection title="Congés" description="Solde de congés disponible à la création de la fiche.">
          <Field label="Congés restants" htmlFor="holidaysLeft" required error={fieldError("holidaysLeft")}>
            <UnitInput
              unit="jours"
              type="number"
              id="holidaysLeft"
              name="holidaysLeft"
              value={personnelData.holidaysLeft}
              onChange={handleInputChange}
              onBlur={() => handleBlur("holidaysLeft")}
              invalid={!!fieldError("holidaysLeft")}
              placeholder="Ex : 30"
              min="0"
            />
          </Field>
        </FormSection>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push("/personnel")} disabled={loading}>
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
                Ajouter l'agent
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <Toaster position="bottom-left" />
    </div>
  );
}
