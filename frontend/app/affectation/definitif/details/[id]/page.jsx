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
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { DetailItem, DetailList, DetailSection, DetailSkeleton, DocumentLink, PageError, TransferRoute } from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";

// Status types with their display names and colors
const statusTypes = {
  active: {
    label: "Active",
    color: "border-success-border bg-success-subtle text-success-text",
  },
  pending: {
    label: "En attente",
    color: "border-input bg-card text-ink-750",
  },
};

export default function AffectationDefinitiveDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /affectation-definitive/[id]

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
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/affectationDef/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error(
            "Erreur lors du chargement des détails de l'affectation"
          );
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
        backHref="/affectation/definitif"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!affectation) return null;

  const status = statusTypes[affectation.status] || statusTypes.pending;
  const documentHref =
    affectation.document?.url ||
    (affectation.document
      ? `/document/${encodeURIComponent(String(affectation.document).replace(/\\/g, "/"))}`
      : null);
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
        backHref="/affectation/definitif"
        backLabel="Affectations définitives"
        title="Détails de l'affectation définitive"
        meta={<Badge className={status.color}>{status.label}</Badge>}
        actions={
          <Button onClick={() => router.push(`/affectation/definitif/edit/${affectation._id}`)}>
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
              from={affectation.originStation?.name || affectation.originStation}
              to={affectation.affectedStation?.name || affectation.affectedStation}
            />
            <DetailList>
              <DetailItem label="Date d'affectation">{formatDate(affectation.startDate)}</DetailItem>
              <DetailItem label="Statut">
                <Badge className={status.color}>{status.label}</Badge>
              </DetailItem>
              <DetailItem label="Motif" full>
                {affectation.description}
              </DetailItem>
            </DetailList>
          </div>
        </DetailSection>

        <DetailSection title="Justificatif">
          {documentHref ? (
            <DocumentLink href={documentHref} title={affectation.document?.originalName || "Document justificatif"} />
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
