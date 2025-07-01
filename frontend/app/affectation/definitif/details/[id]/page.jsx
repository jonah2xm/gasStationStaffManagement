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
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AccountHeader } from "@/components/account-header";

// Status types with their display names and colors
const statusTypes = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-800",
  },
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
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
          onClick={() => router.push("/affectation-definitive")}
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
      : "bg-gradient-to-r from-yellow-500 to-yellow-600";

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      {/* Account header */}
      <AccountHeader
        name={user?.username || "Utilisateur"}
        role={user?.role || "Invité"}
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/affectation-definitive")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de l'Affectation Définitive
          </h1>
          <div></div>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className={`${headerGradient} p-6 rounded-t-lg`}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                Affectation Définitive
              </CardTitle>
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

              {/* Poste */}
              {affectation.personnel?.poste && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Poste
                  </Label>
                  <p className="mt-1 text-lg text-gray-800">
                    {affectation.personnel.poste}
                  </p>
                </div>
              )}

              {/* Stations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Station d'origine
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Building className="mr-2 h-5 w-5 text-gray-500" />
                    {affectation.originStation?.name ||
                      affectation.originStation}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Station d'affectation
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    {affectation.affectedStation?.name ||
                      affectation.affectedStation}
                  </div>
                </div>
              </div>

              {/* Date d'affectation */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Date d'affectation
                </Label>
                <div className="mt-1 flex items-center text-lg text-gray-800">
                  <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                  {formatDate(affectation.startDate)}
                </div>
              </div>

              {/* Reason */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Motif de l'affectation
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {affectation.description || "Aucun motif fourni"}
                </p>
              </div>

              {/* Document */}
              {affectation.document && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Document justificatif
                  </Label>
                  <a
                    href={
                      affectation.document.url ||
                      `/affectation-definitive/document/${encodeURIComponent(
                        affectation.document
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-lg text-blue-600 hover:underline"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    {affectation.document.originalName || "Voir le document"}
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
                  router.push(`/affectation-definitive/edit/${affectation._id}`)
                }
                className="flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => router.push("/affectation-definitive")}
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
