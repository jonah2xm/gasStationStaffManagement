"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Edit, ExternalLink, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  DetailItem,
  DetailList,
  DetailSection,
  DetailSkeleton,
  PageError,
} from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerrouNotice } from "@/components/document-verrouille";
import { bordereauVerrou } from "@/lib/bordereau";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function RepriseDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  const [reprise, setReprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchReprise = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/reprises/${id}`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok) {
          throw new Error("Erreur lors du chargement de l'avis de reprise");
        }
        setReprise(await response.json());
        setError(null);
      } catch (err) {
        console.error("Error fetching reprise:", err);
        setError(err.message);
        toast.error(err.message, { duration: 3000, position: "bottom-left" });
      } finally {
        setLoading(false);
      }
    };

    fetchReprise();
  }, [id, router]);

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "—";

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
        title="Impossible de charger cet avis de reprise"
        message={error}
        backHref="/reprise"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!reprise) return null;

  const absences = [...(reprise.absences || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const premiere = absences[0];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/reprise"
        backLabel="Avis de reprise"
        title="Détails de l'avis de reprise"
        meta={
          <span className="text-[13px] text-muted-foreground">
            Reprise le {formatDate(reprise.dateReprise)}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => router.push(`/reprise/imprimer/${reprise._id}`)}
            >
              <Printer className="h-4 w-4" />
              Imprimer l&apos;avis
            </Button>
            <Button
              disabled={Boolean(reprise.bordereau)}
              onClick={() => router.push(`/reprise/edit/${reprise._id}`)}
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </>
        }
      />

      <VerrouNotice verrou={bordereauVerrou(reprise)} />

      <DetailSection>
        <EmployeeIdentity
          firstName={reprise.personnel?.firstName}
          lastName={reprise.personnel?.lastName}
          matricule={reprise.personnel?.matricule}
          meta={[reprise.personnel?.poste, reprise.personnel?.stationName]
            .filter(Boolean)
            .join(" · ")}
          size="lg"
          highlighted
        />
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSection title="Reprise" className="xl:col-span-2">
          <DetailList>
            <DetailItem label="Date de reprise">
              {formatDate(reprise.dateReprise)}
            </DetailItem>
            <DetailItem label="Motif de l'absence">
              {premiere ? (
                <StatusBadge kind="absence" value={premiere.motif} />
              ) : (
                "—"
              )}
            </DetailItem>
            <DetailItem label="Absence depuis">
              {formatDate(premiere?.date)}
            </DetailItem>
            <DetailItem label="Jours clôturés">
              {absences.length} jour{absences.length > 1 ? "s" : ""}
            </DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Enregistrement">
          <dl className="space-y-4">
            <DetailItem label="Enregistré le">
              {formatDateTime(reprise.createdAt)}
            </DetailItem>
            {reprise.updatedAt && reprise.updatedAt !== reprise.createdAt && (
              <DetailItem label="Dernière modification">
                {formatDateTime(reprise.updatedAt)}
              </DetailItem>
            )}
          </dl>
        </DetailSection>
      </div>

      <DetailSection title="Absences clôturées par cet avis">
        {absences.length === 0 ? (
          <p className="text-[13.5px] text-muted-foreground">
            Aucune absence rattachée à cet avis.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date d&apos;absence</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {absences.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="tabular-nums">
                    {formatDate(a.date)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="absence" value={a.motif} />
                  </TableCell>
                  <TableCell className="text-[13.5px] text-muted-foreground">
                    {a.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/absence/details/${a._id}`)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Voir l&apos;absence
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DetailSection>

      <Toaster position="bottom-left" />
    </div>
  );
}
