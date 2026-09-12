"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, FileText, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DetailItem, DetailList, DetailSection, DetailSkeleton, DocumentLink, PageError } from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";


export default function AbsenceAADetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /absence/aa/[id]

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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA/${id}`,
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
        setNormalizedDocument(data.document.replace(/\\/g, "/"));
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
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return (
      <PageError
        title="Impossible de charger cette absence"
        message={error}
        backHref="/absence/aa"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!absence) return null;

  const today = new Date();
  const periodStatus =
    today < new Date(absence.startDate) ? "a venir" : today <= new Date(absence.endDate) ? "en cours" : "termine";
  const durationDays =
    Math.ceil(Math.abs(new Date(absence.endDate) - new Date(absence.startDate)) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/absence/aa"
        backLabel="Absences AA"
        title="Détails de l'absence autorisée"
        meta={
          <>
            <StatusBadge kind="absenceAA" value={absence.absenceType} />
            <StatusBadge kind="period" value={periodStatus} />
          </>
        }
        actions={
          <Button onClick={() => router.push(`/absence/aa/edit/${absence._id}`)}>
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
        <DetailSection title="Absence" className="xl:col-span-2">
          <DetailList>
            <DetailItem label="Motif">
              <StatusBadge kind="absenceAA" value={absence.absenceType} />
            </DetailItem>
            <DetailItem label="Durée">
              {durationDays} jour{durationDays > 1 ? "s" : ""}
            </DetailItem>
            <DetailItem label="Date de début">{formatDate(absence.startDate)}</DetailItem>
            <DetailItem label="Date de fin">{formatDate(absence.endDate)}</DetailItem>
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
          <dl className="mt-5 border-t border-border pt-4">
            <DetailItem label="Enregistrée le">
              {new Date(absence.createdAt).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </DetailItem>
          </dl>
        </DetailSection>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
