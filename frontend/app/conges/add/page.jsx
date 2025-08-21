"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  AlertTriangle,
  Loader2,
  Save,
  Check,
  ArrowLeft,
  Building,
  Clock,
  MapPin,
  Plane,
  File,
  X,
  Upload,
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

export default function AddCongePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
    stationId: "",
    typeConge: "ordinaire",
    dureeConge: "",
    dateDebut: "",
    dateRetour: "",
    lieuSejour: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [nombreJourRestant] = useState(0); // Always starts at 0
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
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

  // Calculate return date when start date or duration changes
  useEffect(() => {
    if (formData.dateDebut && formData.dureeConge) {
      const startDate = new Date(formData.dateDebut);
      const duration = Number.parseInt(formData.dureeConge);
      if (!isNaN(duration) && duration > 0) {
        const returnDate = new Date(startDate);
        returnDate.setDate(startDate.getDate() + duration);
        setFormData((prev) => ({
          ...prev,
          dateRetour: returnDate.toISOString().split("T")[0],
        }));
      }
    }
  }, [formData.dateDebut, formData.dureeConge]);

  // inside AddCongePage component
const handleSelectById = (id) => {
  const person = personnel.find((p) => p._id === id);
  if (!person) return;
  setSelectedPersonnel(person);
  setOpenPersonnelCombobox(false);
  if (errors.personnel) {
    setErrors((prev) => ({ ...prev, personnel: "" }));
  }
};

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

    if (!selectedPersonnel) {
      setErrors((prev) => ({
        ...prev,
        personnel: "Veuillez sélectionner un employé",
      }));
      isValid = false;
    }

    if (!file) {
      setFileError("Veuillez télécharger un document");
      isValid = false;
    } else {
      setFileError("");
    }

    return isValid;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setFileError("");
    } else {
      setFile(null);
      setFileError("Seuls les fichiers PDF sont autorisés");
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
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
    console.log(
      "nombreJourRestant",
      nombreJourRestant,
      "dureeConge",
      formData.dureeConge
    );
    if (selectedPersonnel.holidaysLeft - parseInt(formData.dureeConge) < 0) {
      toast.error("Le nombre de jours restants est insuffisant pour ce congé", {
        duration: 3000,
        position: "bottom-left",
      });
      return;
    }

    setLoading(true);
    console.log("formData", formData.stationId);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("personnelId", selectedPersonnel._id);
      formDataToSend.append("stationName", formData.stationName);
      formDataToSend.append("typeConge", formData.typeConge);
      formDataToSend.append("dureeConge", Number.parseInt(formData.dureeConge));
      formDataToSend.append("dateDebut", formData.dateDebut);
      formDataToSend.append("dateRetour", formData.dateRetour);
      formDataToSend.append("lieuSejour", formData.lieuSejour);
      formDataToSend.append("nombreJourRestant", nombreJourRestant.toString());
      formDataToSend.append("document", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges`,
        {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de l'enregistrement du congé"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error recording congé:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de l'enregistrement du congé"
      );
      setShowErrorDialog(true);
      toast.error(error.message || "Erreur lors de l'enregistrement du congé", {
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

    // Reset form
    setSelectedPersonnel(null);
    setFormData({
      stationId: "",
      typeConge: "ordinaire",
      dureeConge: "",
      dateDebut: "",
      dateRetour: "",
      lieuSejour: "",
    });
    setTouched({});
    setErrors({});
    setFile(null);
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

  // When an employee is selected, set their station as default
  useEffect(() => {
    if (selectedPersonnel && selectedPersonnel.stationName) {
      console.log("stationId", selectedPersonnel);
      setFormData((prev) => ({
        ...prev,
        stationName: selectedPersonnel.stationName,
      }));

      // Clear any errors for station since it's automatically set
      if (errors.stationId) {
        setErrors((prev) => ({
          ...prev,
          stationId: "",
        }));
      }

      // Mark as touched to avoid validation errors
      if (!touched.stationId) {
        setTouched((prev) => ({
          ...prev,
          stationId: true,
        }));
      }
    } else console.log("no its  not working", selectedPersonnel);
  }, [selectedPersonnel]);
useEffect(() => {
  if (!openPersonnelCombobox) return;

  const onPointerDownCapture = (e) => {
    // find closest element that carries our data attribute
    const el = e.target.closest && e.target.closest('[data-employee-id]');
    if (!el) return;
    // stop other handlers from interfering
    e.preventDefault?.();
    e.stopPropagation?.();
    const id = el.getAttribute('data-employee-id');
    if (id) {
      // invoke your selection
      handleSelectById(id);
    }
  };

  // capture phase: runs before other handlers
  document.addEventListener('pointerdown', onPointerDownCapture, true);

  return () => {
    document.removeEventListener('pointerdown', onPointerDownCapture, true);
  };
}, [openPersonnelCombobox, personnel]); // include any deps you need

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name={user?.username || "Utilisateur"}
        role={user?.role || "Invité"}
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Ajouter un Congé</h1>
        <Button variant="outline" onClick={() => router.push("/conges")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Enregistrer un Congé</CardTitle>
          <CardDescription>
            Saisissez les informations relatives au congé d'un employé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personnel Selection */}
            <div className="space-y-2">
              <Label htmlFor="personnel">Employé*</Label>
              <Popover
                open={openPersonnelCombobox}
                onOpenChange={setOpenPersonnelCombobox}
              >
                <PopoverTrigger asChild className="bg-gray-50">
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPersonnelCombobox}
                    className={`w-full justify-between ${
                      errors.personnel ? "border-red-500" : ""
                    }`}
                    disabled={loading}
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
                  className="w-[400px] p-0 "
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder="Rechercher par nom ou matricule..."
                      className="h-9"
                  
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <p className="text-sm text-muted-foreground">
                            Aucun employé trouvé.
                          </p>
                        </div>
                      </CommandEmpty>
           
                        {filteredPersonnel.map((person) => (
  <CommandItem
    key={person._id}
    data-employee-id={person._id}           // ← add this
    value={`${person.firstName} ${person.lastName} ${person.matricule}`}
    onSelect={() => handleSelectById(person._id)}
    className="flex items-center py-3 "
  >
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-blue-100 text-blue-800">
                                {getInitials(
                                  `${person.firstName} ${person.lastName}`
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">
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
            
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.personnel && (
                <p className="text-red-500 text-sm">{errors.personnel}</p>
              )}
            </div>

            {/* Station */}
            <div className="space-y-2">
              <Label htmlFor="station">Station</Label>
              <div className="relative">
                <Input
                  type="text"
                  id="station"
                  name="station"
                  value={selectedPersonnel?.stationName || ""}
                  disabled
                  className="pl-10 bg-gray-100 cursor-not-allowed"
                />
                <Building
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
              </div>
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
                Ce champ sera mis à jour automatiquement pendant la durée du
                congé
              </p>
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label htmlFor="document">Document (PDF)*</Label>
              <Input
                type="file"
                id="document"
                name="document"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
              />
              <div className="relative">
                <Button
                  variant="outline"
                  asChild
                  disabled={loading}
             
                >
                  <Label htmlFor="document" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    {file ? "Changer de fichier" : "Télécharger un fichier"}
                  </Label>
                </Button>
                {file && (
                  <div className="absolute top-0 right-0 p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {file ? (
                <div className="flex items-center p-3 border rounded-md bg-gray-50">
                  <File className="mr-2 h-5 w-5 text-blue-500" />
                  <span className="font-medium text-blue-600">{file.name}</span>
                </div>
              ) : null}

              {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
            </div>

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
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer le congé
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
              Congé Enregistré avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le congé a été enregistré avec succès pour{" "}
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
