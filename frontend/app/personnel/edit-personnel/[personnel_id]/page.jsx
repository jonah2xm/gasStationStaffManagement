"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle, Loader2, ArrowLeft, Save } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
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
import { AccountHeader } from "@/components/account-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  }, [personnelId]);

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

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name="John Doe"
        role="HR Manager"
        avatarUrl="/placeholder.svg?height=40&width=40"
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Modifier le Personnel
        </h1>
        <Button variant="outline" onClick={() => router.push("/personnel")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Tableau de Bord
        </Button>
      </div>

      {fetchingData ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">
            Chargement des données du personnel...
          </span>
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-lg mb-4">{fetchError}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/personnel")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au Tableau de Bord
          </Button>
        </div>
      ) : (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Détails du Personnel</CardTitle>
            <CardDescription>
              Modifiez les informations du personnel ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="matricule">Matricule*</Label>
                  <Input
                    type="text"
                    id="matricule"
                    name="matricule"
                    value={personnelData.matricule}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("matricule")}
                    className={
                      touched.matricule && errors.matricule
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="Entrez le matricule"
                    disabled={loading}
                  />
                  {touched.matricule && errors.matricule && (
                    <p className="text-red-500 text-sm">{errors.matricule}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">Nom*</Label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={personnelData.firstName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("firstName")}
                    className={
                      touched.firstName && errors.firstName
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="Entrez le nom"
                    disabled={loading}
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-red-500 text-sm">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Prénom*</Label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={personnelData.lastName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("lastName")}
                    className={
                      touched.lastName && errors.lastName
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="Entrez le prénom"
                    disabled={loading}
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-red-500 text-sm">{errors.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">Date de Naissance*</Label>
                  <Input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={personnelData.birthDate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("birthDate")}
                    className={
                      touched.birthDate && errors.birthDate
                        ? "border-red-500"
                        : ""
                    }
                    disabled={loading}
                  />
                  {touched.birthDate && errors.birthDate && (
                    <p className="text-red-500 text-sm">{errors.birthDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hireDate">Date de Recrutement*</Label>
                  <Input
                    type="date"
                    id="hireDate"
                    name="hireDate"
                    value={personnelData.hireDate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("hireDate")}
                    className={
                      touched.hireDate && errors.hireDate
                        ? "border-red-500"
                        : ""
                    }
                    disabled={loading}
                  />
                  {touched.hireDate && errors.hireDate && (
                    <p className="text-red-500 text-sm">{errors.hireDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poste">Poste*</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange(value, "poste")
                    }
                    value={personnelData.poste}
                    onOpenChange={() =>
                      !personnelData.poste && handleBlur("poste")
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={
                        touched.poste && errors.poste ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Sélectionnez le Poste" />
                    </SelectTrigger>
                    <SelectContent>
                      {posts.map((poste) => (
                        <SelectItem key={poste} value={poste}>
                          {poste}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.poste && errors.poste && (
                    <p className="text-red-500 text-sm">{errors.poste}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contractType">Type de contrat*</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange(value, "contractType")
                    }
                    value={personnelData.contractType}
                    onOpenChange={() =>
                      !personnelData.contractType && handleBlur("contractType")
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={
                        touched.contractType && errors.contractType
                          ? "border-red-500"
                          : ""
                      }
                    >
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
                  {touched.contractType && errors.contractType && (
                    <p className="text-red-500 text-sm">
                      {errors.contractType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decision">Decision*</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange(value, "decision")
                    }
                    value={personnelData.decision}
                    onOpenChange={() =>
                      !personnelData.decision && handleBlur("decision")
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={
                        touched.decision && errors.decision
                          ? "border-red-500"
                          : ""
                      }
                    >
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
                  {touched.decision && errors.decision && (
                    <p className="text-red-500 text-sm">{errors.decision}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="station">Station*</Label>
                  <Select
                    onValueChange={(value) =>
                      handleSelectChange(value, "station")
                    }
                    value={personnelData.station}
                    onOpenChange={() =>
                      !personnelData.station && handleBlur("station")
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={
                        touched.station && errors.station
                          ? "border-red-500"
                          : ""
                      }
                    >
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
                  {touched.station && errors.station && (
                    <p className="text-red-500 text-sm">{errors.station}</p>
                  )}
                </div>

                {/* Congé restant (jours) */}
                <div className="space-y-2">
                  <Label htmlFor="holidaysLeft">Congé restant (jours)</Label>
                  <Input
                    type="number"
                    id="holidaysLeft"
                    name="holidaysLeft"
                    value={personnelData.holidaysLeft}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Ex: 20"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    Modifiez le nombre de jours de congé restant pour ce
                    personnel.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/personnel")}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !hasChanges()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour en cours...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        <AlertTriangle className="inline-block mr-1" size={16} />
        Les champs marqués avec * sont obligatoires.
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Personnel Mis à Jour avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les informations du personnel ont été mises à jour avec succès.
              Vous pouvez maintenant retourner au tableau de bord du personnel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessConfirm}>
              Retour au Tableau de Bord
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Erreur
            </AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-left" />
    </div>
  );
}
