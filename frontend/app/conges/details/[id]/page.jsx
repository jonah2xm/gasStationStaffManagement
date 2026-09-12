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
  FileText,
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


// Leave types with their display names and colors
const leaveTypes = {
  ordinaire: {
    label: "Ordinaire",
    color: "border-border bg-muted text-ink-750",
  },
  anticipe: {
    label: "Anticipé",
    color: "border-violet-border bg-violet-subtle text-violet-text",
  },
};

export default function CongeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /conges/[id]

  const [conge, setConge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({});
  const [normalizedDocument,setNormalizedDocument]=useState('')

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
  // Fetch congé details using the id from the URL
  useEffect(() => {
    if (!id) return;

    const fetchCongeDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/conges/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des détails du congé");
        }
        const data = await response.json();
        console.log('data',data)
        setConge(data);
        setNormalizedDocument(data.documentPath.replace(/\\/g, "/"));
        setError(null);
      } catch (err) {
        console.error("Error fetching congé details:", err);
        setError(err.message);
        toast.error(err.message, {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCongeDetails();
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

  // Calculate remaining days
  const calculateRemainingDays = (dateDebut, duree, status) => {
    if (status === "completed" || status === "rejected") return 0;

    const startDate = new Date(dateDebut);
    const today = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + Number.parseInt(duree));

    if (today < startDate) {
      // Leave hasn't started yet
      return Number.parseInt(duree);
    } else if (today > endDate) {
      // Leave has ended
      return 0;
    } else {
      // Leave is in progress
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
        title="Impossible de charger ce congé"
        message={error}
        backHref="/conges"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!conge) return null;

  const remainingDays = calculateRemainingDays(conge.dateDebut, conge.dureeConge, conge.status);
  const today = new Date();
  const periodStatus =
    today < new Date(conge.dateDebut) ? "a venir" : today <= new Date(conge.dateRetour) ? "en cours" : "termine";
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
        backHref="/conges"
        backLabel="Congés"
        title="Détails du congé"
        meta={
          <>
            <StatusBadge kind="conge" value={conge.typeConge} />
            <StatusBadge kind="period" value={periodStatus} />
          </>
        }
        actions={
          <Button onClick={() => router.push(`/conges/edit/${conge._id}`)}>
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
        }
      />

      <DetailSection>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <EmployeeIdentity
            firstName={conge.personnel?.firstName}
            lastName={conge.personnel?.lastName}
            matricule={conge.personnel?.matricule}
            meta={[conge.personnel?.poste, conge.stationName].filter(Boolean).join(" · ")}
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
            <DetailItem label="Type de congé">
              <StatusBadge kind="conge" value={conge.typeConge} />
            </DetailItem>
            <DetailItem label="Durée">
              {conge.dureeConge} jour{Number.parseInt(conge.dureeConge) > 1 ? "s" : ""}
            </DetailItem>
            <DetailItem label="Date de début">{formatDate(conge.dateDebut)}</DetailItem>
            <DetailItem label="Date de retour">{formatDate(conge.dateRetour)}</DetailItem>
            <DetailItem label="Station">{conge.stationName}</DetailItem>
            <DetailItem label="Lieu de séjour">{conge.lieuSejour}</DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Justificatif">
          {conge.documentPath ? (
            <DocumentLink href={`/document/${encodeURIComponent(normalizedDocument)}`} />
          ) : (
            <p className="text-[13.5px] text-muted-foreground">Aucun document joint.</p>
          )}
          <dl className="mt-5 space-y-4 border-t border-border pt-4">
            <DetailItem label="Enregistré le">{formatDateTime(conge.createdAt)}</DetailItem>
            {conge.updatedAt && conge.updatedAt !== conge.createdAt && (
              <DetailItem label="Dernière modification">{formatDateTime(conge.updatedAt)}</DetailItem>
            )}
          </dl>
        </DetailSection>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
