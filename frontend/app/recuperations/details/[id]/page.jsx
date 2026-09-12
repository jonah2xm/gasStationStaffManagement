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
  Edit,
  Plane,
  User,
  File,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { DetailItem, DetailList, DetailSection, DetailSkeleton, DocumentLink, PageError } from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";


// Recovery types with their display names and colors
const recoveryTypes = {
  heures_supplementaires: {
    label: "Heures supplémentaires",
    color: "border-border bg-muted text-ink-750",
  },
  travail_weekend: {
    label: "Travail weekend",
    color: "border-border bg-muted text-ink-750",
  },
  jour_ferie: {
    label: "Jour férié travaillé",
    color: "border-border bg-muted text-ink-750",
  },
  mission_prolongee: {
    label: "Mission prolongée",
    color: "border-border bg-muted text-ink-750",
  },
  astreinte: {
    label: "Astreinte",
    color: "border-border bg-muted text-ink-750",
  },
};

export default function RecuperationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /recuperations/[id]

  const [recuperation, setRecuperation] = useState(null);
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
  // Fetch récupération details using the id from the URL
  useEffect(() => {
    if (!id) return;

    const fetchRecuperationDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recuperations/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error(
            "Erreur lors du chargement des détails de la récupération"
          );
        }
        const data = await response.json();

        setRecuperation(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching récupération details:", err);
        setError(err.message);
        toast.error(err.message, {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecuperationDetails();
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

  // Calculate remaining days
  const calculateRemainingDays = (dateDebut, duree) => {
    const startDate = new Date(dateDebut);
    const today = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Number.parseInt(duree));

    if (today < startDate) {
      // Recovery hasn't started yet
      return Number.parseInt(duree);
    } else if (today > endDate) {
      // Recovery has ended
      return 0;
    } else {
      // Recovery is in progress
      const diffTime = endDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return (
      <PageError
        title="Impossible de charger cette récupération"
        message={error}
        backHref="/recuperations"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!recuperation) return null;

  const remainingDays = calculateRemainingDays(recuperation.dateDebut, recuperation.dureeRecuperation);
  // The API stores the end as dateRetour; older records may still carry dateFin.
  const endDate = recuperation.dateRetour || recuperation.dateFin;
  const today = new Date();
  const periodStatus =
    today < new Date(recuperation.dateDebut) ? "a venir" : endDate && today <= new Date(endDate) ? "en cours" : "termine";
  const unit = recuperation.typeRecuperation === "heure" ? "heure" : "jour";
  const documentHref = recuperation.documentPath
    ? `/document/${encodeURIComponent(String(recuperation.documentPath).replace(/\\/g, "/"))}`
    : null;
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
        backHref="/recuperations"
        backLabel="Récupérations"
        title="Détails de la récupération"
        meta={<StatusBadge kind="period" value={periodStatus} />}
        actions={
          <Button onClick={() => router.push(`/recuperations/edit/${recuperation._id}`)}>
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <DetailSection>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <EmployeeIdentity
            firstName={recuperation.personnelId?.firstName}
            lastName={recuperation.personnelId?.lastName}
            matricule={recuperation.personnelId?.matricule}
            meta={[recuperation.personnelId?.poste, recuperation.stationName].filter(Boolean).join(" · ")}
            size="lg"
            highlighted
          />
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Jours restants</p>
            <p className="text-[28px] font-semibold leading-8 tracking-tight tabular-nums text-foreground">
              {remainingDays} j
            </p>
          </div>
        </div>
      </DetailSection>

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSection title="Période" className="xl:col-span-2">
          <DetailList>
            <DetailItem label="Type">
              <StatusBadge kind="recuperation" value={recuperation.typeRecuperation || "jour"} />
            </DetailItem>
            <DetailItem label="Durée">
              {recuperation.dureeRecuperation} {unit}
              {Number.parseInt(recuperation.dureeRecuperation) > 1 ? "s" : ""}
            </DetailItem>
            <DetailItem label="Date de début">{formatDate(recuperation.dateDebut)}</DetailItem>
            <DetailItem label="Date de retour">{endDate ? formatDate(endDate) : ""}</DetailItem>
            <DetailItem label="Station">{recuperation.stationName}</DetailItem>
            {recuperation.lieuSejour && <DetailItem label="Lieu de séjour">{recuperation.lieuSejour}</DetailItem>}
          </DetailList>
        </DetailSection>

        <DetailSection title="Justificatif">
          {documentHref ? (
            <DocumentLink href={documentHref} />
          ) : recuperation.documents?.length > 0 ? (
            <div className="space-y-2">
              {recuperation.documents.map((document) => (
                <DocumentLink
                  key={document._id}
                  href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${document.filename}`}
                  title={document.originalname}
                />
              ))}
            </div>
          ) : (
            <p className="text-[13.5px] text-muted-foreground">Aucun document joint.</p>
          )}
          <dl className="mt-5 space-y-4 border-t border-border pt-4">
            <DetailItem label="Enregistrée le">{formatDateTime(recuperation.createdAt)}</DetailItem>
            {recuperation.updatedAt && recuperation.updatedAt !== recuperation.createdAt && (
              <DetailItem label="Dernière modification">{formatDateTime(recuperation.updatedAt)}</DetailItem>
            )}
          </dl>
        </DetailSection>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
