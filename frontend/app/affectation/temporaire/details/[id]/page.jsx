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
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AccountHeader } from "@/components/account-header";

// Status types with their display names and colors
const statusTypes = {
  active: {
    label: "En cours",
    color: "bg-green-100 text-green-800",
  },
  upcoming: {
    label: "À venir",
    color: "bg-blue-100 text-blue-800",
  },
  completed: {
    label: "Terminée",
    color: "bg-gray-100 text-gray-800",
  },
};

export default function AffectationTemporaireDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /affectation-temporaire/[id]

  const [affectation, setAffectation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
        <span className="mt-4 text-lg text-gray-500">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <p className="text-xl mb-4">{error}</p>
        <Button
          onClick={() => router.push("/affectation-temporaire")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    );
  }

  if (!affectation) return null;

  // Determine the gradient color based on status
  const headerGradient =
    affectation.status === "active"
      ? "bg-gradient-to-r from-green-500 to-green-600"
      : affectation.status === "upcoming"
      ? "bg-gradient-to-r from-blue-500 to-blue-600"
      : "bg-gradient-to-r from-gray-500 to-gray-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Account header */}
      <AccountHeader
        name="John Doe"
        role="HR Manager"
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/affectation-temporaire")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de l'Affectation Temporaire
          </h1>
          <div></div>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className={`${headerGradient} p-6 rounded-t-lg`}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                Affectation Temporaire
              </CardTitle>
              <Badge
                className={`${
                  statusTypes[affectation.status]?.color ||
                  "bg-gray-200 text-gray-800"
                } text-sm px-3 py-1`}
              >
                {statusTypes[affectation.status]?.label || "Statut inconnu"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <div className="space-y-6">
              {/* Employé Info */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Employé
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {affectation.personnel?.firstName}{" "}
                  {affectation.personnel?.lastName}
                </p>
              </div>

              {/* Matricule */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Matricule
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {affectation.personnel?.matricule}
                </p>
              </div>

              {/* Stations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Station d'origine
                  </Label>
                  <div className="mt-1 flex items-center sdtext-lg text-gray-800">
                    <Building className="mr-2 h-5 w-5 text-gray-500" />
                    {affectation.stationOrigin}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Station temporaire
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    {affectation.temporaryStation}
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date de début
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    {formatDate(affectation.startDate)}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date de fin
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    {formatDate(affectation.endDate)}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Motif de l'affectation
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {affectation.reason || "Aucun motif fourni"}
                </p>
              </div>

              {/* Document */}
              {affectation.document && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Document justificatif
                  </Label>
                  <a
                    href={`/affectation-temporaire/document/${encodeURIComponent(
                      affectation.document
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-lg text-blue-600 hover:underline"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Voir le document
                  </a>
                </div>
              )}

              {/* Date d'enregistrement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Enregistrée le
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    {new Date(affectation.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {affectation.updatedAt &&
                  affectation.updatedAt !== affectation.createdAt && (
                    <div>
                      <Label className="block text-sm font-semibold text-gray-600">
                        Dernière modification
                      </Label>
                      <div className="mt-1 flex items-center text-lg text-gray-800">
                        <Clock className="mr-2 h-5 w-5 text-blue-500" />
                        {new Date(affectation.updatedAt).toLocaleString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/affectation-temporaire/edit/${affectation._id}`)
                }
                className="flex items-center"
              >
                <FileText className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => router.push("/affectation-temporaire")}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
