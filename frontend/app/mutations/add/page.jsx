"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  DollarSign,
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

export default function AddMutationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
  const [fetchingDepartments, setFetchingDepartments] = useState(true);
  const [personnel, setPersonnel] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [openPersonnelCombobox, setOpenPersonnelCombobox] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    currentDepartmentId: "",
    newDepartment: "",
    newPosition: "",
    newSalary: "",
    requestDate: "",
    effectiveDate: "",
    reason: "",
    status: "pending",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

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

  // Fetch departments data
  useEffect(() => {
    const fetchDepartments = async () => {
      setFetchingDepartments(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/departments`
        );
        if (response.status === 401) {
          toast.error("Session expired. Redirecting to login...");
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch departments");
        }
        const data = await response.json();
        setDepartments(data);
      } catch (err) {
        console.error(err.message);
        toast.error("Impossible de charger les départements", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setFetchingDepartments(false);
      }
    };

    fetchDepartments();
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
      case "newDepartment":
        if (!formData.newDepartment) {
          newErrors.newDepartment = "Le nouveau département est requis";
        } else if (formData.newDepartment === formData.currentDepartmentId) {
          newErrors.newDepartment =
            "Le nouveau département doit être différent du département actuel";
        } else {
          delete newErrors.newDepartment;
        }
        break;
      case "newPosition":
        if (!formData.newPosition) {
          newErrors.newPosition = "Le nouveau poste est requis";
        } else {
          delete newErrors.newPosition;
        }
        break;
      case "requestDate":
        if (!formData.requestDate) {
          newErrors.requestDate = "La date de demande est requise";
        } else {
          delete newErrors.requestDate;
        }
        break;
      case "effectiveDate":
        if (!formData.effectiveDate) {
          newErrors.effectiveDate = "La date d'effet est requise";
        } else if (
          formData.requestDate &&
          new Date(formData.effectiveDate) <= new Date(formData.requestDate)
        ) {
          newErrors.effectiveDate =
            "La date d'effet doit être postérieure à la date de demande";
        } else {
          delete newErrors.effectiveDate;
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
      "newDepartment",
      "newPosition",
      "requestDate",
      "effectiveDate",
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
      formDataToSend.append("currentDepartment", formData.currentDepartmentId);
      formDataToSend.append("newDepartment", formData.newDepartment);
      formDataToSend.append("newPosition", formData.newPosition);
      formDataToSend.append("newSalary", formData.newSalary);
      formDataToSend.append("requestDate", formData.requestDate);
      formDataToSend.append("effectiveDate", formData.effectiveDate);
      formDataToSend.append("status", formData.status);
      formDataToSend.append("reason", formData.reason);
      if (file) {
        formDataToSend.append("document", file);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mutations`,
        {
          method: "POST",
          body: formDataToSend,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors de l'enregistrement de la mutation"
        );
      }

      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error recording mutation:", error.message);
      setErrorMessage(
        error.message || "Erreur lors de l'enregistrement de la mutation"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message || "Erreur lors de l'enregistrement de la mutation",
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
    router.push("/mutations");

    // Reset form
    setSelectedPersonnel(null);
    setFormData({
      currentDepartmentId: "",
      newDepartment: "",
      newPosition: "",
      newSalary: "",
      requestDate: "",
      effectiveDate: "",
      reason: "",
      status: "pending",
    });
    setFile(null);
    setFileError("");
    setTouched({});
    setErrors({});
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

  // When an employee is selected, set their current department
  useEffect(() => {
    if (selectedPersonnel && selectedPersonnel.departmentId) {
      setFormData((prev) => ({
        ...prev,
        currentDepartmentId: selectedPersonnel.departmentId,
      }));

      // Clear any errors for currentDepartment since it's automatically set
      if (errors.currentDepartment) {
        setErrors((prev) => ({
          ...prev,
          currentDepartment: "",
        }));
      }

      // Mark as touched to avoid validation errors
      if (!touched.currentDepartmentId) {
        setTouched((prev) => ({
          ...prev,
          currentDepartmentId: true,
        }));
      }
    }
  }, [selectedPersonnel]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name="John Doe"
        role="HR Manager"
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Ajouter une Mutation
        </h1>
        <Button variant="outline" onClick={() => router.push("/mutations")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Enregistrer une Mutation</CardTitle>
          <CardDescription>
            Saisissez les informations relatives à la mutation d'un employé.
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

            {/* Departments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currentDepartment">Département actuel*</Label>
                <div className="relative">
                  <Input
                    id="currentDepartment"
                    value={
                      departments.find(
                        (d) => d._id === formData.currentDepartmentId
                      )?.name || ""
                    }
                    className="pl-10 bg-gray-50"
                    disabled={true}
                    placeholder={
                      selectedPersonnel
                        ? "Chargement..."
                        : "Sélectionnez d'abord un employé"
                    }
                  />
                  <Building
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newDepartment">Nouveau département*</Label>
                <div className="relative">
                  <Select
                    value={formData.newDepartment}
                    onValueChange={(value) =>
                      handleSelectChange(value, "newDepartment")
                    }
                    disabled={loading || !formData.currentDepartmentId}
                  >
                    <SelectTrigger
                      className={`pl-10 ${
                        touched.newDepartment && errors.newDepartment
                          ? "border-red-500"
                          : ""
                      }`}
                    >
                      <SelectValue placeholder="Sélectionner un département" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments
                        .filter(
                          (dept) => dept._id !== formData.currentDepartmentId
                        )
                        .map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.newDepartment && errors.newDepartment && (
                  <p className="text-red-500 text-sm">{errors.newDepartment}</p>
                )}
              </div>
            </div>

            {/* Position and Salary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="newPosition">Nouveau poste*</Label>
                <Input
                  id="newPosition"
                  name="newPosition"
                  value={formData.newPosition}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("newPosition")}
                  disabled={loading}
                  className={
                    touched.newPosition && errors.newPosition
                      ? "border-red-500"
                      : ""
                  }
                  placeholder="Ex: Chef de projet"
                />
                {touched.newPosition && errors.newPosition && (
                  <p className="text-red-500 text-sm">{errors.newPosition}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newSalary">Nouveau salaire (optionnel)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    id="newSalary"
                    name="newSalary"
                    value={formData.newSalary}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="pl-10"
                    placeholder="Ex: 45000"
                  />
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requestDate">Date de demande*</Label>
                <div className="relative">
                  <Input
                    type="date"
                    id="requestDate"
                    name="requestDate"
                    value={formData.requestDate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("requestDate")}
                    disabled={loading}
                    className={`pl-10 ${
                      touched.requestDate && errors.requestDate
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.requestDate && errors.requestDate && (
                  <p className="text-red-500 text-sm">{errors.requestDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Date d'effet*</Label>
                <div className="relative">
                  <Input
                    type="date"
                    id="effectiveDate"
                    name="effectiveDate"
                    value={formData.effectiveDate}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur("effectiveDate")}
                    disabled={loading}
                    className={`pl-10 ${
                      touched.effectiveDate && errors.effectiveDate
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
                {touched.effectiveDate && errors.effectiveDate && (
                  <p className="text-red-500 text-sm">{errors.effectiveDate}</p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange(value, "status")}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motif de la mutation (optionnel)</Label>
              <Textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Précisez le motif de cette mutation..."
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
                onClick={() => router.push("/mutations")}
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
                    Enregistrer la mutation
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
              Mutation Enregistrée avec Succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              La mutation a été enregistrée avec succès pour{" "}
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
