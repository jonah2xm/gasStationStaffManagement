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
import toast, { Toaster } from "react-hot-toast";

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

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Modifier la Station
        </h1>
        <Button variant="outline" onClick={() => router.push("/stations")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au Tableau de Bord
        </Button>
      </div>

      {fetchingStation ? (
        <div className="flex justify-center items-center h-64 ">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">
            Chargement des données de la station...
          </span>
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-lg mb-4">{fetchError}</p>
          <Button
            variant="outline"
            onClick={() => router.push("/stations")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au Tableau de Bord
          </Button>
        </div>
      ) : (
        <Card className="max-w-4xl mx-auto bg-white">
          <CardHeader>
            <CardTitle>Détails de la Station</CardTitle>
            <CardDescription>
              Modifiez les détails de la station ci-dessous.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code">Code Station*</Label>
                  <Input
                    type="text"
                    id="code"
                    name="code"
                    value={stationData.code}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("code")}
                    className={
                      touched.code && errors.code ? "border-red-500" : ""
                    }
                    placeholder="Entrez le code de la station"
                    disabled={loading}
                  />
                  {touched.code && errors.code && (
                    <p className="text-red-500 text-sm">{errors.code}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nom Station*</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={stationData.name}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("name")}
                    className={
                      touched.name && errors.name ? "border-red-500" : ""
                    }
                    placeholder="Entrez le nom de la station"
                    disabled={loading}
                  />
                  {touched.name && errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse*</Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    value={stationData.address}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("address")}
                    className={
                      touched.address && errors.address ? "border-red-500" : ""
                    }
                    placeholder="Entrez l'adresse"
                    disabled={loading}
                  />
                  {touched.address && errors.address && (
                    <p className="text-red-500 text-sm">{errors.address}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville*</Label>
                  <Input
                    type="text"
                    id="city"
                    name="city"
                    value={stationData.city}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("city")}
                    className={
                      touched.city && errors.city ? "border-red-500" : ""
                    }
                    placeholder="Entrez la ville"
                    disabled={loading}
                  />
                  {touched.city && errors.city && (
                    <p className="text-red-500 text-sm">{errors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Wilaya*</Label>
                  <Input
                    type="text"
                    id="state"
                    name="state"
                    value={stationData.state}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("state")}
                    className={
                      touched.state && errors.state ? "border-red-500" : ""
                    }
                    placeholder="Entrez la wilaya"
                    disabled={loading}
                  />
                  {touched.state && errors.state && (
                    <p className="text-red-500 text-sm">{errors.state}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type Station*</Label>
                  <Select
                    onValueChange={handleSelectChange}
                    value={stationData.type}
                    onOpenChange={() => !stationData.type && handleBlur("type")}
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={
                        touched.type && errors.type ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Sélectionnez le type de station" />
                    </SelectTrigger>
                    <SelectContent>
                      {stationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {touched.type && errors.type && (
                    <p className="text-red-500 text-sm">{errors.type}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes Additionnelles</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={stationData.notes}
                  onChange={handleInputChange}
                  placeholder="Entrez des informations supplémentaires sur la station"
                  rows={4}
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/stations")}
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
              Station Mise à Jour avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              La station a été mise à jour avec succès. Vous pouvez maintenant
              retourner au tableau de bord des stations.
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
