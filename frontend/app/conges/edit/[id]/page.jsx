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
  MapPin,
  Plane,
  File,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function EditCongePage() {
  const router = useRouter();
  const params = useParams();
  const congeId = params.id;

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
    typeConge: "ordinaire",
    dureeConge: "",
    dateDebut: "",
    dateRetour: "",
    lieuSejour: "",
    personnelId: "",
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
  // Fetch congé data
  useEffect(() => {
    const fetchConge = async () => {
      if (!congeId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges/${congeId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch congé");
        }

        const data = await response.json();
        console.log("Fetched congé data:", data);

        setOriginalData(data);

        // Fetch personnel data using personnel._id
        let personnelData = data.personnel;
        if (personnelData && personnelData._id) {
          try {
            const personnelRes = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel/${personnelData._id}`,
              { credentials: "include" }
            );
            if (personnelRes.ok) {
              personnelData = await personnelRes.json();
            }
          } catch (err) {
            console.warn("Could not fetch personnel details:", err);
          }
        }

        // Pre-populate form data
        setFormData({
          personnelId: personnelData._id || "",
          stationName: data.stationName,
          typeConge: data.typeConge,
          dureeConge: data.dureeConge,
          dateDebut: data.dateDebut
            ? new Date(data.dateDebut).toISOString().split("T")[0]
            : "",
          dateRetour: data.dateRetour
            ? new Date(data.dateRetour).toISOString().split("T")[0]
            : "",
          lieuSejour: data.lieuSejour || "",
        });

        setSelectedPersonnel(personnelData);
        setNombreJourRestant(data.nombreJourRestant || 0);
        setExistingDocument(data.documentPath || null);
      } catch (err) {
        console.error("Error fetching congé:", err);
        toast.error("Impossible de charger les données du congé", {
          duration: 3000,
          position: "bottom-left",
        });
        // router.push("/conges");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchConge();
  }, [congeId, router, user]);

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
      dataToSend.append("typeConge", formData.typeConge);
      dataToSend.append("dureeConge", Number.parseInt(formData.dureeConge));
      dataToSend.append("dateDebut", formData.dateDebut);
      dataToSend.append("dateRetour", formData.dateRetour);
      dataToSend.append("lieuSejour", formData.lieuSejour);
      dataToSend.append("personnelId", formData.personnelId);
      if (selectedFile) {
        dataToSend.append("document", selectedFile);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges/${congeId}`,
        {
          method: "PUT",
          body: dataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de la mise à jour du congé"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating congé:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de la mise à jour du congé"
      );
      setShowErrorDialog(true);
      toast.error(error.message || "Erreur lors de la mise à jour du congé", {
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
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
        <AccountHeader
          name={user?.username || "Utilisateur"}
          role={user?.role || "Invité"}
          avatarUrl="/placeholder.svg?height=40&width=40"
        />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8" />
          <span className="ml-2">Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name="John Doe"
        role="HR Manager"
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Modifier le Congé</h1>
        <Button variant="outline" onClick={() => router.push("/conges")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Modifier le Congé</CardTitle>
          <CardDescription>
            Modifiez les informations relatives au congé de l'employé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personnel Display (Read-only) */}
            <div className="space-y-2">
              <Label>Employé</Label>
              <div className="flex items-center p-3 border rounded-md bg-gray-50">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className="bg-blue-100 text-blue-800">
                    {selectedPersonnel &&
                      getInitials(
                        `${selectedPersonnel.firstName} ${selectedPersonnel.lastName}`
                      )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    {selectedPersonnel?.firstName} {selectedPersonnel?.lastName}
                  </span>
                  <span className="text-sm text-gray-600">
                    {selectedPersonnel?.matricule}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                L'employé ne peut pas être modifié lors de l'édition.
              </p>
            </div>

            {/* Station (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              <div className="relative">
                <Input
                  value={formData.stationName}
                  disabled={true}
                  className="pl-10 bg-gray-50"
                  placeholder="Station de l'employé"
                />
                <Building
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
              <p className="text-xs text-gray-500">
                La station est automatiquement définie selon l'employé.
              </p>
            </div>

            {/* Type and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="typeConge">Type de congé*</Label>
                <Select
                  value={formData.typeConge}
                  onValueChange={(value) =>
                    handleSelectChange(value, "typeConge")
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaire">Ordinaire</SelectItem>
                    <SelectItem value="anticipe">Anticipé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dureeConge">Durée du congé (jours)*</Label>
                <div className="relative">
                  <Input
                    type="number"
                    id="dureeConge"
                    name="dureeConge"
                    value={formData.dureeConge}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("dureeConge")}
                    disabled={loading}
                    className={`pl-10 ${
                      touched.dureeConge && errors.dureeConge
                        ? "border-red-500"
                        : ""
                    }`}
                    placeholder="Ex: 15"
                    min="1"
                  />
                  <Clock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.dureeConge && errors.dureeConge && (
                  <p className="text-red-500 text-sm">{errors.dureeConge}</p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateDebut">Date de début*</Label>
                <div className="relative">
                  <Input
                    type="date"
                    id="dateDebut"
                    name="dateDebut"
                    value={formData.dateDebut}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("dateDebut")}
                    disabled={loading}
                    className={`pl-10 ${
                      touched.dateDebut && errors.dateDebut
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.dateDebut && errors.dateDebut && (
                  <p className="text-red-500 text-sm">{errors.dateDebut}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateRetour">Date de retour</Label>
                <div className="relative">
                  <Input
                    type="date"
                    id="dateRetour"
                    name="dateRetour"
                    value={formData.dateRetour}
                    className="pl-10 bg-gray-50"
                    disabled={true}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Calculée automatiquement selon la date de début et la durée
                </p>
              </div>
            </div>

            {/* Lieu de séjour */}
            <div className="space-y-2">
              <Label htmlFor="lieuSejour">Lieu de séjour (optionnel)</Label>
              <div className="relative">
                <Input
                  id="lieuSejour"
                  name="lieuSejour"
                  value={formData.lieuSejour}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="pl-10"
                  placeholder="Ex: Paris, France"
                />
                <MapPin
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
            </div>

            {/* Nombre de jours restant (display only) */}
            <div className="space-y-2">
              <Label>Nombre de jours restant</Label>
              <div className="flex items-center p-3 border rounded-md bg-gray-50">
                <Plane className="mr-2 h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-600">
                  {selectedPersonnel?.holidaysLeft} jour
                  {selectedPersonnel?.holidaysLeft > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Ce champ est mis à jour automatiquement pendant la durée du
                congé
              </p>
            </div>

            {/* Document Upload (Required) */}
            <div className="space-y-2">
              <Label htmlFor="document">Document justificatif*</Label>
              <Input
                type="file"
                id="document"
                name="document"
                onChange={handleFileChange}
                disabled={loading}
              />
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  Fichier sélectionné: {selectedFile.name} yes
                </p>
              )}
              <p className="text-xs text-gray-500">
                Un document justificatif est requis.
              </p>
            </div>

            {/* Existing Document Display */}
            {existingDocument && (
              <div className="space-y-2">
                <Label>Document Existant</Label>
                <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                  <div className="flex items-center">
                    <File className="mr-2 h-5 w-5 text-blue-500" />
                    <a
                      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${existingDocument}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Document existant
                    </a>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExistingDocument(null)}
                  >
                    Remplacer
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/conges")}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Mettre à jour le congé
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
              Congé Mis à Jour avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le congé a été mis à jour avec succès pour{" "}
              {selectedPersonnel?.firstName} {selectedPersonnel?.lastName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessConfirm}>
              OK
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
