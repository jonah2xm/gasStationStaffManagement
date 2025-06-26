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
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AccountHeader } from "@/components/account-header";

// Recovery types with their display names and colors
const recoveryTypes = {
  heures_supplementaires: {
    label: "Heures supplémentaires",
    color: "bg-blue-100 text-blue-800",
  },
  travail_weekend: {
    label: "Travail weekend",
    color: "bg-green-100 text-green-800",
  },
  jour_ferie: {
    label: "Jour férié travaillé",
    color: "bg-purple-100 text-purple-800",
  },
  mission_prolongee: {
    label: "Mission prolongée",
    color: "bg-orange-100 text-orange-800",
  },
  astreinte: {
    label: "Astreinte",
    color: "bg-red-100 text-red-800",
  },
};

export default function RecuperationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /recuperations/[id]

  const [recuperation, setRecuperation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          onClick={() => router.push("/recuperations")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    );
  }

  if (!recuperation) return null;

  // Determine the gradient color
  const headerGradient = "bg-blue-500";

  const remainingDays = calculateRemainingDays(
    recuperation.dateDebut,
    recuperation.dureeRecuperation
  );

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
            onClick={() => router.push("/recuperations")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de la Récupération
          </h1>
          <div></div>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className={`${headerGradient} p-6 rounded-t-lg`}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                Récupération
              </CardTitle>
              <div className="flex space-x-2">
                <Badge
                  className={`${
                    recoveryTypes[recuperation.typeRecuperation]?.color ||
                    "bg-gray-200 text-gray-800"
                  } text-sm px-3 py-1`}
                >
                  {recoveryTypes[recuperation.typeRecuperation]?.label ||
                    "Type inconnu"}
                </Badge>
              </div>
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
                  {recuperation.personnelId?.firstName}{" "}
                  {recuperation.personnelId?.lastName}
                </p>
              </div>

              {/* Matricule */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Matricule
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {recuperation.personnelId?.matricule}
                </p>
              </div>

              {/* Poste */}
              {recuperation.personnelId?.poste && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Poste
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <User className="mr-2 h-5 w-5 text-gray-500" />
                    {recuperation.personnelId.poste}
                  </div>
                </div>
              )}

              {/* Station */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Station
                </Label>
                <div className="mt-1 flex items-center text-lg text-gray-800">
                  <Building className="mr-2 h-5 w-5 text-gray-500" />
                  {recuperation.stationName || "Non défini"}
                </div>
              </div>

              {/* Type and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Durée de la récupération
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    {recuperation.dureeRecuperation} jour
                    {Number.parseInt(recuperation.dureeRecuperation) > 1
                      ? "s"
                      : ""}
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
                    {formatDate(recuperation.dateDebut)}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date de retour
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-green-500" />
                    {formatDate(recuperation.dateFin)}
                  </div>
                </div>
              </div>

              {/* Lieu de séjour */}
              {recuperation.lieuSejour && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Lieu de séjour
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    {recuperation.lieuSejour}
                  </div>
                </div>
              )}

              {/* Nombre de jours restant */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Nombre de jours restant
                </Label>
                <div className="mt-1 flex items-center text-lg">
                  <Plane className="mr-2 h-5 w-5 text-blue-500" />
                  <span className="font-medium text-blue-600">
                    {remainingDays} jour{remainingDays > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Documents */}
              {recuperation.documents && recuperation.documents.length > 0 && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Documents
                  </Label>
                  <ul className="mt-2 space-y-2">
                    {recuperation.documents.map((document) => (
                      <li key={document._id} className="flex items-center">
                        <File className="mr-2 h-5 w-5 text-gray-500" />
                        <a
                          href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${document.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {document.originalname}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Date d'enregistrement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Enregistré le
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    {new Date(recuperation.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {recuperation.updatedAt &&
                  recuperation.updatedAt !== recuperation.createdAt && (
                    <div>
                      <Label className="block text-sm font-semibold text-gray-600">
                        Dernière modification
                      </Label>
                      <div className="mt-1 flex items-center text-lg text-gray-800">
                        <Clock className="mr-2 h-5 w-5 text-blue-500" />
                        {new Date(recuperation.updatedAt).toLocaleString(
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
                  router.push(`/recuperations/edit/${recuperation._id}`)
                }
                className="flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => router.push("/recuperations")}
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
