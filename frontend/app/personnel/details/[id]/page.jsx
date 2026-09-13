"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  Clock,
  Building,
  User,
  FileText,
  Briefcase,
  CreditCard,
  MapPin,
  Edit,
  UserCheck,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarX2, Plane } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DetailItem, DetailList, DetailSection, DetailSkeleton, PageError } from "@/components/ui/detail-layout";
import { EmployeeIdentity } from "@/components/ui/form-layout";
import { StatusBadge } from "@/components/ui/status-badge";

// Contract types with their display names and colors
const contractTypes = {
  cdi: {
    label: "CDI",
    color: "border-border bg-muted text-ink-750",
  },
  cdd: {
    label: "CDD",
    color: "border-border bg-muted text-ink-750",
  },
  stage: {
    label: "Stage",
    color: "border-border bg-muted text-ink-750",
  },
  interim: {
    label: "Intérim",
    color: "border-border bg-muted text-ink-750",
  },
};

// Status types with their colors
const statusColors = {
  actif: "border-success-border bg-success-subtle text-success-text",
  conge: "border-info-border bg-info-subtle text-info-text",
  "en congé": "border-info-border bg-info-subtle text-info-text",
  recuperation: "border-teal-border bg-teal-subtle text-teal-text",
  ai: "border-destructive-border bg-destructive-subtle text-destructive-text",
  aa: "border-warning-border bg-warning-subtle text-warning-text",
  "en formation": "border-border bg-muted text-ink-750",
  inactif: "border-border bg-muted text-ink-750",
};

export default function PersonnelDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /personnel/[id]

  const [personnel, setPersonnel] = useState(null);
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
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error("Not authenticated");
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.warn("User not logged in or error:", err.message);
        setUser(null);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  // Fetch personnel details using the id from the URL
  useEffect(() => {
    if (!id || !user) return;

    const fetchPersonnelDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/personnel/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des détails du personnel");
        }
        const data = await response.json();
        console.log('personnel data', data);
        setPersonnel(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching personnel details:", err);
        setError(err.message);
        toast.error(err.message, {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPersonnelDetails();
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

  // Calculate years of service
  const calculateYearsOfService = (hireDate) => {
    if (!hireDate) return "Non défini";
    const hire = new Date(hireDate);
    const today = new Date();
    const diffTime = Math.abs(today - hire);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365.25);
    const months = Math.floor((diffDays % 365.25) / 30.44);
    
    if (years === 0) {
      return `${months} mois`;
    } else if (months === 0) {
      return `${years} an${years > 1 ? 's' : ''}`;
    } else {
      return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
    }
  };

  // Calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return "Non défini";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return `${age} ans`;
  };

  if (loading) {
    return <DetailSkeleton />;
  }

  if (error) {
    return (
      <PageError
        title="Impossible de charger cette fiche"
        message={error}
        backHref="/personnel"
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!personnel) return null;

  const contractLabel = contractTypes[personnel.contractType?.toLowerCase()]?.label || personnel.contractType;
  const formatDateTime = (value) =>
    new Date(value).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const facts = [
    { label: "Ancienneté", value: calculateYearsOfService(personnel.hireDate) },
    { label: "Âge", value: calculateAge(personnel.birthDate) },
    {
      label: "Congés restants",
      value:
        personnel.holidaysLeft !== undefined && personnel.holidaysLeft !== null
          ? `${personnel.holidaysLeft} jour${personnel.holidaysLeft > 1 ? "s" : ""}`
          : "—",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <PageHeader
        backHref="/personnel"
        backLabel="Personnel"
        title="Fiche agent"
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/conges/add")}>
              <Plane className="h-4 w-4" />
              Nouveau congé
            </Button>
            <Button variant="outline" onClick={() => router.push("/absence/add")}>
              <CalendarX2 className="h-4 w-4" />
              Nouvelle absence
            </Button>
            <Button onClick={() => router.push(`/personnel/edit-personnel/${personnel._id}`)}>
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          </>
        }
      />

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <EmployeeIdentity
            firstName={personnel.firstName}
            lastName={personnel.lastName}
            matricule={personnel.matricule}
            meta={[personnel.poste, personnel.stationName].filter(Boolean).join(" · ")}
            size="lg"
            highlighted
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind="personnel" value={personnel.status || "Actif"} />
            {contractLabel && (
              <span className="inline-flex h-6 items-center rounded-sm border border-border bg-muted px-[9px] text-xs font-medium text-ink-750">
                {contractLabel}
              </span>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-1 divide-y divide-border border-t border-border bg-ink-50 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {facts.map((fact) => (
            <div key={fact.label} className="px-5 py-3.5">
              <dt className="text-xs font-medium text-muted-foreground">{fact.label}</dt>
              <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSection title="Informations personnelles">
          <DetailList>
            <DetailItem label="Matricule">{personnel.matricule}</DetailItem>
            <DetailItem label="Nom complet">
              {personnel.firstName} {personnel.lastName}
            </DetailItem>
            <DetailItem label="Date de naissance">{formatDate(personnel.birthDate)}</DetailItem>
            <DetailItem label="Âge">{calculateAge(personnel.birthDate)}</DetailItem>
          </DetailList>
        </DetailSection>

        <DetailSection title="Poste et affectation">
          <DetailList>
            <DetailItem label="Poste">{personnel.poste}</DetailItem>
            <DetailItem label="Type de contrat">{contractLabel}</DetailItem>
            <DetailItem label="Station">{personnel.stationName}</DetailItem>
            <DetailItem label="Statut">
              <StatusBadge kind="personnel" value={personnel.status || "Actif"} />
            </DetailItem>
            <DetailItem label="Date d'embauche">{formatDate(personnel.hireDate)}</DetailItem>
            <DetailItem label="Décision">{personnel.decision}</DetailItem>
          </DetailList>
        </DetailSection>
      </div>

      <DetailSection title="Informations système">
        <DetailList>
          <DetailItem label="Créée le">{formatDateTime(personnel.createdAt)}</DetailItem>
          {personnel.updatedAt && personnel.updatedAt !== personnel.createdAt && (
            <DetailItem label="Dernière modification">{formatDateTime(personnel.updatedAt)}</DetailItem>
          )}
        </DetailList>
      </DetailSection>

      <Toaster position="bottom-left" />
    </div>
  );
}
