"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Edit, AlertTriangle, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  DetailItem,
  DetailList,
  DetailSection,
  DetailSkeleton,
  DocumentLink,
  PageError,
} from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerrouNotice } from "@/components/document-verrouille";
import { bordereauVerrou } from "@/lib/bordereau";
import { isAutorisee, isSignaled48h } from "@/lib/absence-motifs";

export default function AbsenceDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  const [absence, setAbsence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchAbsence = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erreur lors du chargement de l'absence");
        }
        setAbsence(await response.json());
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

    fetchAbsence();
  }, [id, router]);

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "Non défini";

  const formatDateTime = (value) =>
    new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <PageError
        title="Impossible de charger cette absence"
        message={error}
        backHref="/absence"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!absence) return null;

  const autorisee = isAutorisee(absence.motif);
  const signaled = isSignaled48h(absence);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/absence"
        backLabel="Absences"
        title="Détails de l'absence"
        meta={
          <>
            <StatusBadge kind="absence" value={absence.motif} />
            <span className="text-[13px] text-muted-foreground">
              {autorisee ? "Absence autorisée" : "Absence non autorisée"}
            </span>
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/absence/imprimer/${absence._id}`)}
            >
              <Printer className="h-4 w-4" />
              Imprimer l&apos;avis
            </Button>
            <Button
              disabled={Boolean(bordereauVerrou(absence))}
              onClick={() => router.push(`/absence/edit/${absence._id}`)}
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </>
        }
      />

      <VerrouNotice verrou={bordereauVerrou(absence)} />

      {signaled && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive-border bg-destructive-subtle px-4 py-3">
          <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-destructive" />
          <p className="text-[13.5px] text-destructive-text">
            Cette absence non autorisée dépasse 48 heures et reste signalée tant
            qu'aucun avis de reprise n'a été enregistré.
          </p>
        </div>
      )}

      <DetailSection>
        <EmployeeIdentity
          firstName={absence.personnel?.firstName}
          lastName={absence.personnel?.lastName}
          matricule={absence.personnel?.matricule}
          meta={[absence.personnel?.poste, absence.personnel?.stationName]
            .filter(Boolean)
            .join(" · ")}
          size="lg"
          highlighted
        />
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSection title="Absence" className="xl:col-span-2">
          <DetailList>
            <DetailItem label="Motif">
              <StatusBadge kind="absence" value={absence.motif} />
            </DetailItem>
            <DetailItem label="Nature">
              {autorisee ? "Autorisée" : "Non autorisée"}
            </DetailItem>
            <DetailItem label="Date d'absence">
              {formatDate(absence.date)}
            </DetailItem>
            <DetailItem label="Station">
              {absence.personnel?.stationName}
            </DetailItem>
            <DetailItem label="Description">
              {absence.description || "—"}
            </DetailItem>
            <DetailItem label="Reprise">
              {absence.reprise ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/reprise/details/${absence.reprise._id}`)
                  }
                  className="text-left text-[13.5px] text-foreground underline underline-offset-2"
                >
                  Clôturée le {formatDate(absence.reprise.dateReprise)}
                </button>
              ) : (
                "Ouverte — aucun avis de reprise"
              )}
            </DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Justificatif">
          {absence.document ? (
            <DocumentLink
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absences/document/${absence._id}`}
            />
          ) : (
            <p className="text-[13.5px] text-muted-foreground">
              Aucun document joint.
            </p>
          )}
          <dl className="mt-5 space-y-4 border-t border-border pt-4">
            <DetailItem label="Enregistrée le">
              {formatDateTime(absence.createdAt)}
            </DetailItem>
            {absence.updatedAt && absence.updatedAt !== absence.createdAt && (
              <DetailItem label="Dernière modification">
                {formatDateTime(absence.updatedAt)}
              </DetailItem>
            )}
          </dl>
        </DetailSection>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
