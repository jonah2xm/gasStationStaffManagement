"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, FileText, Loader2, ArrowLeft, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DetailItem, DetailList, DetailSection, DetailSkeleton, DocumentLink, PageError } from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";


// Operation types with their display names and colors
const operationTypes = {
  avisAbsence: { label: "Avis Absence", color: "border-destructive-border bg-destructive-subtle text-destructive-text" },
  avisReprise: { label: "Avis de Reprise", color: "border-success-border bg-success-subtle text-success-text" },
};

export default function AbsenceAIDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /absence/ai/[id]

  const [absence, setAbsence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [normalizedDocument, setNormalizedDocument] = useState("");

  // Fetch absence details using the absence id from the URL
  useEffect(() => {
    if (!id) return;

    const fetchAbsenceDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAI/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des détails de l'absence");
        }
        const data = await response.json();
        console.log("data", data);
        setAbsence(data);
        if (data.document) {
          setNormalizedDocument(data.document.replace(/\\/g, "/"));
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching absence details:", err);
        setError(err.message);
        toast.error(err.message, {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAbsenceDetails();
  }, [id]);

  // Helper function to format dates in French style
  const formatDate = (dateStr) => {
    if (!dateStr) return "Non défini";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return (
      <PageError
        title="Impossible de charger cet avis"
        message={error}
        backHref="/absence/ai"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!absence) return null;

  const isReprise = absence.operationType === "avisReprise";
  const formatDateTime = (value) =>
    new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/absence/ai"
        backLabel="Absences AI"
        title={isReprise ? "Détails de l'avis de reprise" : "Détails de l'avis d'absence"}
        meta={
          <>
            <StatusBadge kind="absenceAI" value={absence.operationType} />
            {!absence.endDate && <StatusBadge kind="period" value="en cours" label="Ouvert" />}
          </>
        }
        actions={
          <Button onClick={() => router.push(`/absence/ai/edit/${absence._id}`)}>
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <DetailSection>
        <EmployeeIdentity
          firstName={absence.personnel?.firstName}
          lastName={absence.personnel?.lastName}
          matricule={absence.personnel?.matricule}
          meta={[absence.personnel?.poste, absence.personnel?.stationName].filter(Boolean).join(" · ")}
          size="lg"
          highlighted
        />
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSection title="Avis" className="xl:col-span-2">
          <DetailList>
            <DetailItem label="Type d'avis">
              <StatusBadge kind="absenceAI" value={absence.operationType} />
            </DetailItem>
            <DetailItem label="Station">{absence.personnel?.stationName}</DetailItem>
            <DetailItem label="Date de début">{formatDate(absence.startDate)}</DetailItem>
            <DetailItem label={isReprise ? "Date de reprise" : "Date de fin"}>
              {absence.endDate ? formatDate(absence.endDate) : <span className="text-muted-foreground">Pas encore de reprise</span>}
            </DetailItem>
            <DetailItem label="Description" full>
              {absence.description}
            </DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Justificatif">
          {absence.document ? (
            <DocumentLink href={`/document/${encodeURIComponent(normalizedDocument)}`} />
          ) : (
            <p className="text-[13.5px] text-muted-foreground">Aucun document joint.</p>
          )}
          <dl className="mt-5 space-y-4 border-t border-border pt-4">
            <DetailItem label="Enregistré le">{formatDateTime(absence.createdAt)}</DetailItem>
            {absence.updatedAt && absence.updatedAt !== absence.createdAt && (
              <DetailItem label="Dernière modification">{formatDateTime(absence.updatedAt)}</DetailItem>
            )}
          </dl>
        </DetailSection>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
