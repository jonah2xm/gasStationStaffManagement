"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  Clock,
  Building,
  MapPin,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DetailItem, DetailList, DetailSection, DetailSkeleton, DocumentLink, PageError, TransferRoute } from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";


// Status types with their display names and colors
const statusTypes = {
  active: {
    label: "En cours",
    color: "border-info-border bg-info-subtle text-info-text",
  },
  upcoming: {
    label: "À venir",
    color: "border-input bg-card text-ink-750",
  },
  completed: {
    label: "Terminée",
    color: "border-border bg-muted text-ink-600",
  },
};

export default function AffectationTemporaireDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /affectation-temporaire/[id]

  const [affectation, setAffectation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  // Fetch affectation details using the id from the URL
  useEffect(() => {
    if (!id) return;

    const fetchAffectationDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationTemp/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch personnel");
        }
        const data = await response.json();

        setAffectation(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching affectation details:", err);
        setError(err.message);
        toast.error(err.message, {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAffectationDetails();
  }, [id, user]);

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
        title="Impossible de charger cette affectation"
        message={error}
        backHref="/affectation/temporaire"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!affectation) return null;

  // Same rule as the list: the period decides the status.
  const today = new Date();
  const statusKey =
    affectation.status && statusTypes[affectation.status]
      ? affectation.status
      : today < new Date(affectation.startDate)
        ? "upcoming"
        : today <= new Date(affectation.endDate)
          ? "active"
          : "completed";
  const status = statusTypes[statusKey];
  const durationDays = Math.round(
    (new Date(affectation.endDate) - new Date(affectation.startDate)) / (1000 * 60 * 60 * 24)
  );
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
        backHref="/affectation/temporaire"
        backLabel="Affectations temporaires"
        title="Détails de l'affectation temporaire"
        meta={<Badge className={status.color}>{status.label}</Badge>}
        actions={
          <Button onClick={() => router.push(`/affectation/temporaire/edit/${affectation._id}`)}>
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <DetailSection>
        <EmployeeIdentity
          firstName={affectation.personnel?.firstName}
          lastName={affectation.personnel?.lastName}
          matricule={affectation.personnel?.matricule}
          meta={affectation.personnel?.poste}
          size="lg"
          highlighted
        />
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSection title="Affectation" className="xl:col-span-2">
          <div className="space-y-5">
            <TransferRoute
              from={affectation.originStation?.name || affectation.stationOrigin}
              to={affectation.affectedStation?.name || affectation.temporaryStation}
              toLabel="Station temporaire"
            />
            <DetailList>
              <DetailItem label="Date de début">{formatDate(affectation.startDate)}</DetailItem>
              <DetailItem label="Date de fin">{formatDate(affectation.endDate)}</DetailItem>
              <DetailItem label="Durée">
                {durationDays > 0 ? `${durationDays} jour${durationDays > 1 ? "s" : ""}` : ""}
              </DetailItem>
              <DetailItem label="Statut">
                <Badge className={status.color}>{status.label}</Badge>
              </DetailItem>
              <DetailItem label="Motif" full>
                {affectation.reason || affectation.description}
              </DetailItem>
            </DetailList>
          </div>
        </DetailSection>

        <DetailSection title="Justificatif">
          {affectation.document ? (
            <DocumentLink
              href={`/document/${encodeURIComponent(String(affectation.document).replace(/\\/g, "/"))}`}
            />
          ) : (
            <p className="text-[13.5px] text-muted-foreground">Aucun document joint.</p>
          )}
          <dl className="mt-5 space-y-4 border-t border-border pt-4">
            <DetailItem label="Enregistrée le">{formatDateTime(affectation.createdAt)}</DetailItem>
            {affectation.updatedAt && affectation.updatedAt !== affectation.createdAt && (
              <DetailItem label="Dernière modification">{formatDateTime(affectation.updatedAt)}</DetailItem>
            )}
          </dl>
        </DetailSection>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
