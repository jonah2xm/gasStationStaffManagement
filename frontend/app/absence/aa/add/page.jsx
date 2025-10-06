"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Calendar,
  Upload,
  Clock,
  User,
  FileText,
  AlertTriangle,
  Loader2,
  Save,
  X,
  Check,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Types of authorized absences
const absenceTypes = [
  { id: "maladie", label: "Maladie" },
  { id: "decés", label: "Décès d'un proche" },
  { id: "marriage", label: "Mariage" },
  { id: "naissance", label: "Naissance" },
  { id: "pilgrimage", label: "Pèlerinage" },
  { id: "examen", label: "Examen" },
  { id: "autre", label: "Autre" },
];

export default function AddAbsenceAAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openPersonnelCombobox, setOpenPersonnelCombobox] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    absenceType: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Additional state for overlapping dates error (if needed)
  const [overlapError, setOverlapError] = useState("");

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
    // Clear the overlap error when user changes a date field
    if (name === "startDate" || name === "endDate") {
      setOverlapError("");
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

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

    switch (field) {
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
          new Date(formData.endDate) < new Date(formData.startDate)
        ) {
          newErrors.endDate =
            "La date de fin doit être postérieure à la date de début";
        } else {
          delete newErrors.endDate;
        }
        break;
      case "absenceType":
        if (!formData.absenceType) {
          newErrors.absenceType = "Le type d'absence est requis";
        } else {
          delete newErrors.absenceType;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  const validateForm = () => {
    const fields = ["startDate", "endDate", "absenceType"];
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
      formDataToSend.append("startDate", formData.startDate);
      formDataToSend.append("endDate", formData.endDate);
      formDataToSend.append("absenceType", formData.absenceType);
      formDataToSend.append("description", formData.description);
      if (file) {
        formDataToSend.append("document", file);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA`,
        {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        }
      );

      // If the response status is 409, it means there is an overlap
      if (response.status === 409) {
        const errorData = await response.json();
        setOverlapError(errorData.message);
        toast.error(errorData.message, {
          duration: 3000,
          position: "bottom-left",
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de l'enregistrement de l'absence"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error recording absence:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de l'enregistrement de l'absence"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message || "Erreur lors de l'enregistrement de l'absence",
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
    router.push("/absence/aa");

    // Reset form
    setSelectedPersonnel(null);
    setFormData({
      startDate: "",
      endDate: "",
      absenceType: "",
      description: "",
    });
    setFile(null);
    setTouched({});
    setErrors({});
    setOverlapError("");
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return null;
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

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">


      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Ajouter une Absence Autorisée
        </h1>
        <Button variant="outline" onClick={() => router.push("/absence/aa")}>
          Retour à la liste
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto bg-white">
        <CardHeader>
          <CardTitle>Enregistrer une Absence Autorisée</CardTitle>
          <CardDescription>
            Saisissez les informations relatives à l'absence autorisée d'un
            employé.
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
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openPersonnelCombobox}
                    className={`w-full justify-between bg-gray-50 ${
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
                                {person.firstName.charAt(0)}
                                {person.lastName.charAt(0)}
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

            {/* Absence Dates */}
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

            {/* Show Overlap Error if Present */}
            {overlapError && (
              <div className="bg-red-50 p-3 rounded-md flex items-center">
                <AlertTriangle className="text-red-500 mr-2" size={18} />
                <span className="text-red-700">{overlapError}</span>
              </div>
            )}

            {/* Duration */}
            {calculateDuration() && (
              <div className="bg-blue-50 p-3 rounded-md flex items-center">
                <Clock className="text-blue-500 mr-2" size={18} />
                <span className="text-blue-700">
                  Durée:{" "}
                  <strong>
                    {calculateDuration()} jour
                    {calculateDuration() > 1 ? "s" : ""}
                  </strong>
                </span>
              </div>
            )}

            {/* Absence Type */}
            <div className="space-y-2">
              <Label htmlFor="absenceType">Type d'absence*</Label>
              <Select
                onValueChange={(value) =>
                  handleSelectChange(value, "absenceType")
                }
                value={formData.absenceType}
                onOpenChange={() =>
                  formData.absenceType || handleBlur("absenceType")
                }
                disabled={loading}
              >
                <SelectTrigger
                  className={
                    touched.absenceType && errors.absenceType
                      ? "border-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Sélectionnez le type d'absence" />
                </SelectTrigger>
                <SelectContent>
                  {absenceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched.absenceType && errors.absenceType && (
                <p className="text-red-500 text-sm">{errors.absenceType}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Informations supplémentaires sur l'absence..."
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
                  {file ? "Changer de fichier" : "Télécharger un PDF"}
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
                onClick={() => router.push("/absence/aa")}
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
                    Enregistrer l'absence
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
              Absence Enregistrée avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              L'absence autorisée a été enregistrée avec succès pour{" "}
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
