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
  Eye,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

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
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ComputedValue, EmployeeIdentity, Field, FormActions, FormSection, FormSkeleton, InputWithIcon, UnitInput, formatDateFr } from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusDialog } from "@/components/ui/status-dialog";
import CongeDocumentPreview from "@/components/conge-document-preview";
import { DocumentVerrouillePage } from "@/components/document-verrouille";
import { bordereauVerrou } from "@/lib/bordereau";

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
    agentInterimaire: "",
    personnelId: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [nombreJourRestant, setNombreJourRestant] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
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
          agentInterimaire: data.agentInterimaire || "",
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

    return isValid;
  };

  // Document tel qu'il sera imprimé, construit depuis le formulaire.
  const previewConge = {
    personnel: selectedPersonnel || {},
    stationName: formData.stationName,
    typeConge: formData.typeConge,
    dureeConge: formData.dureeConge,
    dateDebut: formData.dateDebut,
    dateRetour: formData.dateRetour,
    lieuSejour: formData.lieuSejour,
    agentInterimaire: formData.agentInterimaire,
    nombreJourRestant,
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
      dataToSend.append("agentInterimaire", formData.agentInterimaire);
      dataToSend.append("personnelId", formData.personnelId);

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
    return <FormSkeleton />;
  }

  // Demande déjà envoyée sur un bordereau : pas de formulaire.
  const verrou = bordereauVerrou(originalData);
  if (verrou) {
    return (
      <DocumentVerrouillePage
        verrou={verrou}
        title="Modifier le congé"
        backHref={`/conges/details/${congeId}`}
        backLabel="Détails du congé"
      />
    );
  }

  const holidaysLeft = selectedPersonnel ? Number(selectedPersonnel.holidaysLeft ?? 0) : null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/conges"
        backLabel="Congés"
        title="Modifier le congé"
        meta={<StatusBadge kind="conge" value={formData.typeConge} />}
        description={
          selectedPersonnel
            ? `${selectedPersonnel.firstName} ${selectedPersonnel.lastName} · ${selectedPersonnel.matricule}`
            : "Modifiez les informations relatives au congé de l'employé."
        }
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card shadow-xs">
        <FormSection title="Employé" description="L'employé et sa station ne peuvent pas être modifiés.">
          <Field label="Employé" full>
            <div className="flex min-h-11 items-center rounded-md border border-dashed border-input bg-background px-2.5 py-1.5">
              <EmployeeIdentity
                firstName={selectedPersonnel?.firstName}
                lastName={selectedPersonnel?.lastName}
                matricule={selectedPersonnel?.matricule}
                meta={selectedPersonnel?.poste}
                size="sm"
                highlighted
              />
            </div>
          </Field>
          <Field label="Station">
            <ComputedValue icon={Building} tag="Automatique">
              {formData.stationName}
            </ComputedValue>
          </Field>
          <Field
            label="Solde de congés"
            hint={
              formData.typeConge === "recuperation"
                ? "Une récupération ne consomme pas le solde de congés."
                : "Mis à jour automatiquement pendant la durée du congé."
            }
          >
            <ComputedValue icon={Plane} tag="Actuel">
              {holidaysLeft !== null ? `${holidaysLeft} jour${holidaysLeft > 1 ? "s" : ""}` : ""}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Période" description="Type, durée et date de départ. Le retour est calculé.">
          <Field label="Type de congé" htmlFor="typeConge" required>
            <Select
              value={formData.typeConge}
              onValueChange={(value) => handleSelectChange(value, "typeConge")}
              disabled={loading}
            >
              <SelectTrigger id="typeConge">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinaire">Ordinaire</SelectItem>
                <SelectItem value="anticipe">Anticipé</SelectItem>
                <SelectItem value="recuperation">Récupération</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Durée" htmlFor="dureeConge" required error={touched.dureeConge && errors.dureeConge}>
            <UnitInput
              unit="jours"
              type="number"
              id="dureeConge"
              name="dureeConge"
              value={formData.dureeConge}
              onChange={handleInputChange}
              onBlur={() => handleBlur("dureeConge")}
              disabled={loading}
              invalid={!!(touched.dureeConge && errors.dureeConge)}
              placeholder="Ex : 15"
              min="1"
            />
          </Field>
          <Field label="Date de début" htmlFor="dateDebut" required error={touched.dateDebut && errors.dateDebut}>
            <Input
              type="date"
              id="dateDebut"
              name="dateDebut"
              value={formData.dateDebut}
              onChange={handleInputChange}
              onBlur={() => handleBlur("dateDebut")}
              disabled={loading}
              aria-invalid={!!(touched.dateDebut && errors.dateDebut)}
              className="tabular-nums"
            />
          </Field>
          <Field label="Date de retour" hint="Date de début + durée.">
            <ComputedValue icon={CalendarClock}>{formatDateFr(formData.dateRetour)}</ComputedValue>
          </Field>
          <Field label="Lieu de séjour" htmlFor="lieuSejour" hint="Adresse exacte, reprise sur la demande.">
            <InputWithIcon icon={MapPin}>
              <Input
                id="lieuSejour"
                name="lieuSejour"
                value={formData.lieuSejour}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ex : Béjaïa"
                className="pl-9"
              />
            </InputWithIcon>
          </Field>
        </FormSection>

        <FormSection
          title="Intérim"
          description="Volet réservé aux postes d'encadrement et de responsabilité. Laissez vide si personne ne remplace l'agent."
        >
          <Field label="Agent intérimaire" htmlFor="agentInterimaire" full hint="Nom et qualité de la personne qui assure l'intérim.">
            <InputWithIcon icon={UserCheck}>
              <Input
                id="agentInterimaire"
                name="agentInterimaire"
                value={formData.agentInterimaire}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Ex : BAHI SOFIANE"
                className="pl-9"
              />
            </InputWithIcon>
          </Field>
          {/* Justificatif téléversé avant la génération automatique. */}
          {existingDocument && (
            <Field label="Justificatif d'origine" full hint="Document téléversé lors de l'enregistrement de ce congé.">
              <a
                href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${existingDocument.replace(/\\/g, "/")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[13.5px] text-foreground underline underline-offset-2"
              >
                <File className="h-4 w-4" />
                Ouvrir le document
              </a>
            </Field>
          )}
        </FormSection>

        <FormActions>
          <Button type="button" variant="outline" onClick={() => router.push("/conges")} disabled={loading}>
            Annuler
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowPreview(true)} disabled={loading}>
            <Eye className="h-4 w-4" />
            Aperçu de la demande
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mise à jour…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </FormActions>
      </form>

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Congé mis à jour"
        description={`Le congé de ${selectedPersonnel?.firstName ?? ""} ${selectedPersonnel?.lastName ?? ""} a bien été mis à jour. Vous pouvez réimprimer la demande.`}
        actionLabel="Imprimer la demande"
        onAction={() => {
          setShowSuccessDialog(false);
          router.push(`/conges/imprimer/${congeId}`);
        }}
        secondaryLabel="Plus tard"
        onSecondary={handleSuccessConfirm}
      />

      <CongeDocumentPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        conge={previewConge}
      />
      <StatusDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        variant="error"
        title="Échec de la mise à jour"
        description={errorMessage}
        actionLabel="Fermer"
        onAction={() => setShowErrorDialog(false)}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}
