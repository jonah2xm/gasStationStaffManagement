"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
  X,
  ArrowLeft,
  Building,
  MapPin,
  Upload,
  FileText,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function EditAffectationDefinitivePage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState({
    originalStationId: "",
    affectedStation: "",
    startDate: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
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
  // Fetch assignment data
  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationDef/${assignmentId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch assignment");
        }
        const data = await response.json();
        console.log("data", data);
        setOriginalData(data);

        // Pre-populate form data
        setFormData({
          originalStationId: data.originStation._id,
          affectedStation: data.affectedStation._id,
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          description: data.description || "",
        });

        setSelectedPersonnel(data.personnel);
        setExistingDocument(data.document);
      } catch (err) {
        console.error("Error fetching assignment:", err);
        toast.error("Impossible de charger les données de l'affectation", {
          duration: 3000,
          position: "bottom-left",
        });
        // router.push("/affectation-definitive");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, router, user]);

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
  }, [user]);

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
      case "affectedStation":
        if (!formData.affectedStation) {
          newErrors.affectedStation = "La station d'affectation est requise";
        } else if (formData.affectedStation === formData.originalStationId) {
          newErrors.affectedStation =
            "La station d'affectation doit être différente de la station d'origine";
        } else {
          delete newErrors.affectedStation;
        }
        break;
      case "startDate":
        if (!formData.startDate) {
          newErrors.startDate = "La date d'affectation est requise";
        } else {
          delete newErrors.startDate;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const validateForm = () => {
    const fields = ["affectedStation", "startDate"];
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
      formDataToSend.append("affectedStation", formData.affectedStation);
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("description", formData.description);
      if (file) {
        formDataToSend.append("document", file);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationDef/${assignmentId}`,
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
            "Erreur lors de la mise à jour de l'affectation définitive"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating affectation:", error.message);
      setErrorMessage(
        error.message ||
          "Erreur lors de la mise à jour de l'affectation définitive"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message ||
          "Erreur lors de la mise à jour de l'affectation définitive",
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
    router.push("/affectation/definitif");
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

  if (initialLoading) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8" />
          <span className="ml-2">Chargement des données...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">


      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Modifier l'Affectation Définitive
        </h1>
        <Button
          variant="outline"
          onClick={() => router.push("/affectation/definitive")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto bg-white">
        <CardHeader>
          <CardTitle>Modifier l'Affectation Définitive</CardTitle>
          <CardDescription>
            Modifiez les informations relatives à l'affectation définitive de
            l'employé.
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

            {/* Stations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="originalStation">Station d'origine</Label>
                <div className="relative">
                  <Input
                    id="originalStation"
                    value={
                      stations.find((s) => s._id === formData.originalStationId)
                        ?.name || ""
                    }
                    className="pl-10 bg-gray-50"
                    disabled={true}
                  />
                  <Building
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  La station d'origine ne peut pas être modifiée.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="affectedStation">Station d'affectation*</Label>
                <div className="relative">
                  <Select
                    value={formData.affectedStation}
                    onValueChange={(value) =>
                      handleSelectChange(value, "affectedStation")
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={`pl-10 ${
                        touched.affectedStation && errors.affectedStation
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Sélectionner une station" />
                    </SelectTrigger>
                    <SelectContent>
                      {stations
                        .filter(
                          (station) =>
                            station._id !== formData.originalStationId
                        )
                        .map((station) => (
                          <SelectItem key={station._id} value={station._id}>
                            {station.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.affectedStation && errors.affectedStation && (
                  <p className="text-red-500 text-sm">
                    {errors.affectedStation}
                  </p>
                )}
              </div>
            </div>

            {/* Date and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date d'affectation*</Label>
                <div className="relative">
                  <Input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("startDate")}
                    disabled={loading}
                    className={`pl-10 ${
                      touched.startDate && errors.startDate
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.startDate && errors.startDate && (
                  <p className="text-red-500 text-sm">{errors.startDate}</p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Motif de l'affectation (optionnel)
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Précisez le motif de cette affectation définitive..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label htmlFor="document">Document justificatif (PDF)</Label>

              {/* Show existing document if available */}
              {existingDocument && !file && (
                <div className="flex items-center p-3 border rounded-md bg-blue-50">
                  <FileText className="text-blue-500 mr-2" size={16} />
                  <span className="text-sm text-blue-700">
                    Document existant: {existingDocument.originalName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-blue-600 hover:text-blue-800"
                    onClick={() => window.open(existingDocument.url, "_blank")}
                  >
                    Voir
                  </Button>
                </div>
              )}

              <div className="flex items-center">
                <label
                  htmlFor="document"
                  className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                    fileError
                      ? "border-red-500 text-red-500"
                      : "text-gray-700 hover:bg-gray-50"
                  } cursor-pointer`}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {file
                    ? "Changer de fichier"
                    : existingDocument
                    ? "Remplacer le document"
                    : "Télécharger un PDF"}
                </label>
                <input
                  id="document"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                {file && (
                  <div className="ml-4 flex items-center bg-gray-100 px-3 py-1 rounded-md">
                    <FileText className="text-blue-500 mr-2" size={16} />
                    <span className="text-sm truncate max-w-[200px]">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
              <p className="text-xs text-gray-500">
                Formats acceptés: PDF uniquement. Taille maximale: 5MB
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/affectation-definitive")}
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
                    Mettre à jour l'affectation
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
              Affectation Définitive Mise à Jour avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              L'affectation définitive a été mise à jour avec succès pour{" "}
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
