"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Save, Building, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import {
  ComputedValue,
  EmployeeIdentity,
  Field,
  FormActions,
  FormSection,
  FormSkeleton,
} from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusDialog } from "@/components/ui/status-dialog";
import { DocumentVerrouillePage } from "@/components/document-verrouille";
import { bordereauVerrou } from "@/lib/bordereau";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "—";

export default function EditReprisePage() {
  const router = useRouter();
  const { id } = useParams();

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [reprise, setReprise] = useState(null);
  const [dateReprise, setDateReprise] = useState("");
  const [error, setError] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchReprise = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) throw new Error("Avis de reprise introuvable");

        const data = await response.json();
        setReprise(data);
        setDateReprise(
          data.dateReprise
            ? new Date(data.dateReprise).toISOString().split("T")[0]
            : ""
        );
      } catch (err) {
        console.error("Error fetching reprise:", err);
        toast.error("Impossible de charger l'avis de reprise", {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setInitialLoading(false);
      }
    };

    fetchReprise();
  }, [id, router]);

  if (initialLoading) return <FormSkeleton />;

  if (!reprise) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
        <PageHeader
          backHref="/reprise"
          backLabel="Avis de reprise"
          title="Avis de reprise introuvable"
        />
      </div>
    );
  }

  const absences = [...(reprise.absences || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const premiere = absences[0];
  const derniere = absences[absences.length - 1];

  const dateTropTot =
    dateReprise && derniere && new Date(dateReprise) < new Date(derniere.date);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dateReprise) {
      setError("La date de reprise est requise");
      return;
    }
    if (dateTropTot) {
      setError(
        "La date de reprise doit être postérieure ou égale à la dernière absence"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ dateReprise }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Erreur lors de la mise à jour");
      }

      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Error updating reprise:", err);
      setErrorMessage(err.message);
      setShowErrorDialog(true);
      toast.error(err.message, { duration: 3000, position: "bottom-left" });
    } finally {
      setLoading(false);
    }
  };

  // Document déjà envoyé sur un bordereau : pas de formulaire.
  const verrou = bordereauVerrou(reprise);
  if (verrou) {
    return (
      <DocumentVerrouillePage
        verrou={verrou}
        title="Modifier l'avis de reprise"
        backHref={`/reprise/details/${id}`}
        backLabel="Détails de l'avis de reprise"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/reprise"
        backLabel="Avis de reprise"
        title="Modifier l'avis de reprise"
        description="Seule la date de reprise est modifiable. Pour changer les absences clôturées, supprimez l'avis et recréez-le."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-card shadow-xs"
      >
        <FormSection title="Agent">
          <Field label="Employé" full>
            <EmployeeIdentity
              firstName={reprise.personnel?.firstName}
              lastName={reprise.personnel?.lastName}
              matricule={reprise.personnel?.matricule}
            />
          </Field>
          <Field label="Station">
            <ComputedValue icon={Building} tag="Automatique">
              {reprise.personnel?.stationName}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection
          title="Avis d'absence"
          description="Absences clôturées par cet avis."
        >
          <Field label="Motif">
            <ComputedValue tag="Avis d'absence">
              {premiere ? (
                <StatusBadge kind="absence" value={premiere.motif} />
              ) : null}
            </ComputedValue>
          </Field>
          <Field label="Absence depuis">
            <ComputedValue tag="Avis d'absence">
              {formatDate(premiere?.date)}
            </ComputedValue>
          </Field>
          <Field label="Jours clôturés">
            <ComputedValue tag="Avis d'absence">
              {absences.length} jour{absences.length > 1 ? "s" : ""}
            </ComputedValue>
          </Field>
        </FormSection>

        <FormSection title="Reprise">
          <Field
            label="Date de reprise"
            htmlFor="dateReprise"
            required
            error={error}
          >
            <Input
              type="date"
              id="dateReprise"
              value={dateReprise}
              onChange={(e) => {
                setDateReprise(e.target.value);
                setError("");
              }}
              disabled={loading}
              aria-invalid={!!error}
              className="tabular-nums"
            />
          </Field>
        </FormSection>

        {dateTropTot && (
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-start gap-3 rounded-md border border-destructive-border bg-destructive-subtle px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <p className="text-[13px] text-destructive-text">
                La dernière absence clôturée est datée du{" "}
                {formatDate(derniere?.date)} : la reprise ne peut pas lui être
                antérieure.
              </p>
            </div>
          </div>
        )}

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/reprise")}
            disabled={loading}
          >
            Annuler
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
        title="Avis de reprise mis à jour"
        description="La date de reprise a bien été enregistrée."
        onAction={() => {
          setShowSuccessDialog(false);
          router.push(`/reprise/details/${id}`);
        }}
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
