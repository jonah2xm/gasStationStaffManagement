"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
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

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name={user?.username || "Utilisateur"}
        role={user?.role || "Invité"}
        avatarUrl="/placeholder.svg?height=40&width=40"
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Ajouter un Personnel
        </h1>
        <Button variant="outline" onClick={() => router.push("/personnel")}>
          Retour au Tableau de Bord
        </Button>
      </div>

      {fetchingStations ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Chargement des stations...</span>
        </div>
      ) : (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Détails du Personnel</CardTitle>
            <CardDescription>
              Entrez les informations du nouveau personnel ci-dessous.
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
                <div className="space-y-2">
                  <Label htmlFor="firstName">Conge Restant*</Label>
                  <Input
                    type="number"
                    id="holidaysLeft"
                    name="holidaysLeft"
                    value={personnelData.holidaysLeft}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("holidaysLeft")}
                    className={
                      touched.holidaysLeft && errors.holidaysLeft
                        ? "border-red-500"
                        : ""
                    }
                    placeholder="Entrez Nombre conge"
                  />
                  {touched.holidaysLeft && errors.holidaysLeft && (
                    <p className="text-red-500 text-sm">{errors.firstName}</p>
                  )}
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
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    "Ajouter Personnel"
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
      <Toaster position="bottom-left" />
    </div>
  );
}
