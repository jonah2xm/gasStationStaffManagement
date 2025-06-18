"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  CardHeader,
  CardTitle,
  CardDescription,
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
  { id: "deces", label: "Décès d'un proche" },
  { id: "marriage", label: "Mariage" },
  { id: "naissance", label: "Naissance" },
  { id: "pilgrimage", label: "Pèlerinage" },
  { id: "examen", label: "Examen" },
  { id: "autre", label: "Autre" },
];

export default function ModifyAbsenceAAPage() {
  const router = useRouter();
  const { id } = useParams();

  // Form state
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openPersonnelCombobox, setOpenPersonnelCombobox] = useState(false);
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

  // Fetch personnel list (for combobox)
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch personnel");
        const data = await response.json();
        setPersonnel(data);
      } catch (err) {
        console.error("Error fetching personnel:", err);
        toast.error("Impossible de charger la liste du personnel", {
          duration: 3000,
          position: "bottom-left",
        });
      }
    };
    fetchPersonnel();
  }, []);

  // Fetch existing absence data to pre-populate the form
  useEffect(() => {
    if (!id) return;

    const fetchAbsence = async () => {
      setFetching(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA/${id}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch absence");
        const data = await response.json();

        // Pre-fill form state
        setFormData({
          startDate: data.startDate.slice(0, 10), // assuming ISO string
          endDate: data.endDate.slice(0, 10),
          absenceType: data.absenceType,
          description: data.description || "",
        });
        setSelectedPersonnel(data.personnel);
      } catch (err) {
        console.error("Error fetching absence:", err);
        toast.error(err.message || "Erreur lors du chargement de l'absence");
      } finally {
        setFetching(false);
      }
    };
    fetchAbsence();
  }, [id]);

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

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

  const validateField = (field) => {
    let errorMsg = "";
    if (field === "startDate" && !formData.startDate) {
      errorMsg = "La date de début est requise";
    }
    if (field === "endDate") {
      if (!formData.endDate) {
        errorMsg = "La date de fin est requise";
      } else if (
        formData.startDate &&
        new Date(formData.endDate) < new Date(formData.startDate)
      ) {
        errorMsg = "La date de fin doit être postérieure à la date de début";
      }
    }
    if (field === "absenceType" && !formData.absenceType) {
      errorMsg = "Le type d'absence est requis";
    }
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    return !errorMsg;
  };

  const validateForm = () => {
    let isValid = true;
    ["startDate", "endDate", "absenceType"].forEach((field) => {
      if (!validateField(field)) isValid = false;
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

      // Send PUT request to update existing absence record
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA/${id}`,
        {
          method: "PUT", // or "PATCH" based on your backend design
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de la modification de l'absence"
        );
      }
      toast.success("Absence modifiée avec succès", {
        duration: 3000,
        position: "bottom-left",
      });
      router.push("/absence/aa");
    } catch (error) {
      console.error("Error updating absence:", error);
      toast.error(
        error.message || "Erreur lors de la modification de l'absence",
        {
          duration: 3000,
          position: "bottom-left",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate duration (days between dates)
  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return null;
  };

  // For filtering the personnel search
  const filteredPersonnel = personnel.filter(
    (person) =>
      person.firstName?.toLowerCase().includes("") ||
      person.lastName?.toLowerCase().includes("") ||
      person.matricule?.toLowerCase().includes("")
  );

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Chargement...</p>
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
        <h1 className="text-3xl font-bold text-gray-800">
          Modifier une Absence Autorisée
        </h1>
        <Button variant="outline" onClick={() => router.push("/absence/aa")}>
          Retour à la liste
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Modifier l'Absence Autorisée</CardTitle>
          <CardDescription>
            Mettez à jour les informations relatives à l'absence autorisée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personnel selection */}
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
                    disabled={loading}
                  >
                    {selectedPersonnel ? (
                      <div className="flex items-center bg-gray-50">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                            {selectedPersonnel.firstName.charAt(0)}
                            {selectedPersonnel.lastName.charAt(0)}
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
                        <span>Rechercher un employé...</span>
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
                    onBlur={() => validateField("startDate")}
                    disabled={loading}
                    className={`pl-10 ${
                      errors.startDate ? "border-red-500" : ""
                    }`}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {errors.startDate && (
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
                    onBlur={() => validateField("endDate")}
                    disabled={loading}
                    className={`pl-10 ${
                      errors.endDate ? "border-red-500" : ""
                    }`}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-red-500 text-sm">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Duration display */}
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
                  formData.absenceType || validateField("absenceType")
                }
                disabled={loading}
              >
                <SelectTrigger
                  className={errors.absenceType ? "border-red-500" : ""}
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
              {errors.absenceType && (
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
                    Mettre à jour l'absence
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Toaster position="bottom-left" />
    </div>
  );
}
