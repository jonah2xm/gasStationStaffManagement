"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Search,
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Check,
  ArrowLeft,
  Building,
  MapPin,
  Upload,
  FileText,
  Eye,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function EditAffectationTemporairePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Get the affectation ID from the URL

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
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
  const [formData, setFormData] = useState({
    originalStationId: "",
    temporaryStation: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [existingDocument, setExistingDocument] = useState(null);
  const [fileError, setFileError] = useState("");
  const [notFound, setNotFound] = useState(false);
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
  // Fetch affectation data
  useEffect(() => {
    const fetchAffectationData = async () => {
      setFetchingData(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp/${id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            setNotFound(true);
            throw new Error("Affectation non trouvée");
          }
          throw new Error("Erreur lors du chargement des données");
        }

        const data = await response.json();
        console.log("data", data.originStation.name);
        // Set form data
        setFormData({
          originalStationId: data.originStation || "",
          temporaryStation: data.affectedStation || "",
          startDate: data.startDate
            ? new Date(data.startDate).toISOString().split("T")[0]
            : "",
          endDate: data.endDate
            ? new Date(data.endDate).toISOString().split("T")[0]
            : "",
          reason: data.reason || "",
        });

        // Set personnel data
        if (data.personnel) {
          setSelectedPersonnel(data.personnel);
        }

        // Set document data if exists
        if (data.document) {
          setExistingDocument(data.document);
        }
      } catch (err) {
        console.error("Error fetching affectation data:", err);
        toast.error("Impossible de charger les données de l'affectation", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setFetchingData(false);
      }
    };

    if (id) {
      fetchAffectationData();
    }
  }, [id, user]);

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
  }, []);

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
  }, []);

  // Update original station when personnel changes
  useEffect(() => {
    if (selectedPersonnel && selectedPersonnel.station) {
      setFormData((prev) => ({
        ...prev,
        originalStationId: selectedPersonnel.station,
      }));

      // Clear any errors for originalStation since it's automatically set
      if (errors.originalStation) {
        setErrors((prev) => ({
          ...prev,
          originalStation: "",
        }));
      }

      // Mark as touched to avoid validation errors
      if (!touched.originalStationId) {
        setTouched((prev) => ({
          ...prev,
          originalStationId: true,
        }));
      }
    }
  }, [selectedPersonnel]);

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
      case "originalStationId":
        if (!formData.originalStationId && !selectedPersonnel) {
          newErrors.originalStation = "La station d'origine est requise";
        } else {
          delete newErrors.originalStationId;
        }
        break;
      case "temporaryStation":
        if (!formData.temporaryStation) {
          newErrors.temporaryStation = "La station temporaire est requise";
        } else if (
          formData.temporaryStation._id === formData.originalStationId._id
        ) {
          newErrors.temporaryStation =
            "La station temporaire doit être différente de la station d'origine";
        } else {
          delete newErrors.temporaryStation;
        }
        break;
      case "startDate":
        if (!formData.startDate) {
          newErrors.startDate = "La date de début est requise";
        } else {
          delete newErrors.startDate;
        }
        break;
      case "endDate":
        if (!formData.endDate) {
          newErrors.endDate = "La date de fin est requise";
        } else if (
          formData.startDate &&
          new Date(formData.endDate) <= new Date(formData.startDate)
        ) {
          newErrors.endDate =
            "La date de fin doit être postérieure à la date de début";
        } else {
          delete newErrors.endDate;
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
      "originalStationId",
      "temporaryStation",
      "startDate",
      "endDate",
    ];
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

    if (!selectedPersonnel) {
      setErrors((prev) => ({
        ...prev,
        personnel: "Veuillez sélectionner un employé",
      }));
      isValid = false;
    }
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
      formDataToSend.append("personnelId", selectedPersonnel._id);
      formDataToSend.append("originStation", formData.originalStationId._id);
      formDataToSend.append("affectedStation", formData.temporaryStation._id);
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("reason", formData.reason);

      if (file) {
        formDataToSend.append("document", file);
      } else if (existingDocument) {
        formDataToSend.append("keepExistingDocument", "true");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp/${id}`,
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
            "Erreur lors de la mise à jour de l'affectation temporaire"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating affectation:", error.message);
      setErrorMessage(
        error.message ||
          "Erreur lors de la mise à jour de l'affectation temporaire"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message ||
          "Erreur lors de la mise à jour de l'affectation temporaire",
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
    router.push("/affectation-temporaire");
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

  // Show loading state while fetching data
  if (fetchingData) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  // Show not found state
  if (notFound) {
    return (
      <div className="container mx-auto p-6 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Affectation non trouvée
        </h1>
        <p className="text-gray-600 mb-6">
          L'affectation que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <Button
          onClick={() => router.push("/affectation-temporaire")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name={user?.username || "Utilisateur"}
        role={user?.role || "Invité"}
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Modifier une Affectation Temporaire
        </h1>
        <Button
          variant="outline"
          onClick={() => router.push("/affectation-temporaire")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Modifier une Affectation Temporaire</CardTitle>
              <CardDescription>
                Modifiez les informations relatives à l'affectation temporaire
                d'un employé.
              </CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-800">Modification</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personnel Selection - Now Editable */}
            <div className="space-y-2">
              <Label htmlFor="personnel">Employé*</Label>
              <Popover
                open={openPersonnelCombobox}
                onOpenChange={setOpenPersonnelCombobox}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPersonnelCombobox}
                    className={`w-full justify-between ${
                      errors.personnel ? "border-red-500" : ""
                    }`}
                    disabled={loading} // No longer disabled in edit mode
                  >
                    {selectedPersonnel ? (
                      <div className="flex items-center bg-gray-50">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                            {getInitials(
                              `${selectedPersonnel.firstName} ${selectedPersonnel.lastName}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium text-gray-800">
                            {selectedPersonnel.firstName}{" "}
                            {selectedPersonnel.lastName}
                          </span>
                          <span className="text-xs text-gray-800">
                            {selectedPersonnel.matricule}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-muted-foreground">
                        <Search className="mr-2 h-4 w-4" />
                        Rechercher un employé...
                      </div>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0 bg-gray-50"
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Rechercher par nom ou matricule..."
                      className="h-9"
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Aucun employé trouvé.
                          </p>
                        </div>
                      </CommandEmpty>
                      <CommandGroup heading="Employés">
                        {filteredPersonnel.map((person) => (
                          <CommandItem
                            key={person._id}
                            value={`${person.firstName} ${person.lastName} ${person.matricule}`}
                            onSelect={() => {
                              setSelectedPersonnel(person);
                              setOpenPersonnelCombobox(false);
                              if (errors.personnel) {
                                setErrors((prev) => ({
                                  ...prev,
                                  personnel: "",
                                }));
                              }
                            }}
                            className="flex items-center py-3 text-gray-800"
                          >
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-blue-100 text-blue-800">
                                {getInitials(
                                  `${person.firstName} ${person.lastName}`
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-800">
                                {person.firstName} {person.lastName}
                              </span>
                              <span className="text-xs text-gray-800">
                                {person.matricule} •{" "}
                                {person.poste || "Non défini"}
                              </span>
                            </div>
                            {selectedPersonnel?._id === person._id && (
                              <Check className="ml-auto h-4 w-4 text-green-500" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.personnel && (
                <p className="text-red-500 text-sm">{errors.personnel}</p>
              )}
            </div>

            {/* Stations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="originalStation">Station d'origine*</Label>
                <div className="relative">
                  <Input
                    id="originalStation"
                    value={
                      selectedPersonnel?.stationName ||
                      stations.find(
                        (s) => s._id === formData.originalStationId._id
                      )?.name ||
                      "Station non trouvée"
                    }
                    className="pl-10 bg-gray-50"
                    disabled={true}
                    placeholder="Chargement..."
                  />
                  <Building
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.originalStation && errors.originalStation && (
                  <p className="text-red-500 text-sm">
                    {errors.originalStationId}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="temporaryStation">Station temporaire*</Label>
                <div className="relative">
                  <Select
                    value={formData.temporaryStation._id}
                    onValueChange={(value) =>
                      handleSelectChange(value, "temporaryStation")
                    }
                    disabled={loading}
                  >
                    <SelectTrigger
                      className={`pl-10 ${
                        touched.temporaryStation && errors.temporaryStation
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Sélectionner une station">
                        {stations.find(
                          (s) => s._id === formData.temporaryStation._id
                        )?.name || "Sélectionner une station"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {stations
                        .filter(
                          (station) =>
                            station._id !== formData.originalStationId._id
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
                {touched.temporaryStation && errors.temporaryStation && (
                  <p className="text-red-500 text-sm">
                    {errors.temporaryStation}
                  </p>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début*</Label>
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

              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin*</Label>
                <div className="relative">
                  <Input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("endDate")}
                    disabled={loading}
                    className={`pl-10 ${
                      touched.endDate && errors.endDate ? "border-red-500" : ""
                    }`}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.endDate && errors.endDate && (
                  <p className="text-red-500 text-sm">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motif de l'affectation (optionnel)</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Précisez le motif de cette affectation temporaire..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label htmlFor="document">Document justificatif (PDF)</Label>
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
                  {file || existingDocument
                    ? "Changer de fichier"
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
                {!file && existingDocument && (
                  <div className="ml-4 flex items-center bg-gray-100 px-3 py-1 rounded-md">
                    <FileText className="text-blue-500 mr-2" size={16} />
                    <span className="text-sm truncate max-w-[200px]">
                      Document existant
                    </span>
                    <a
                      href={`/affectation-temporaire/document/${encodeURIComponent(
                        existingDocument
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      <Eye size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => setExistingDocument(null)}
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
                onClick={() => router.push("/affectation-temporaire")}
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
                    Enregistrement...
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
              Modifications Enregistrées avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              Les modifications de l'affectation temporaire ont été enregistrées
              avec succès pour {selectedPersonnel?.firstName}{" "}
              {selectedPersonnel?.lastName} de{" "}
              {stations.find((s) => s._id === formData.originalStationId._id)
                ?.name || "station d'origine"}{" "}
              vers{" "}
              {stations.find((s) => s._id === formData.temporaryStation._id)
                ?.name || "station temporaire"}
              .
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
