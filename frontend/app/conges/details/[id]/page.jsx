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
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";


// Leave types with their display names and colors
const leaveTypes = {
  ordinaire: {
    label: "Ordinaire",
    color: "bg-blue-100 text-blue-800",
  },
  anticipe: {
    label: "Anticipé",
    color: "bg-orange-100 text-orange-800",
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
          onClick={() => router.push("/conges")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    );
  }

  if (!conge) return null;

  // Determine the gradient color based on status
  const headerGradient = "bg-blue-500";

  const remainingDays = calculateRemainingDays(
    conge.dateDebut,
    conge.dureeConge,
    conge.status
  );

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      {/* Account header */}


      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/conges")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Détails du Congé</h1>
          <div></div>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className={`${headerGradient} p-6 rounded-t-lg`}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                Congé
              </CardTitle>
              <div className="flex space-x-2">
                <Badge
                  className={`${
                    leaveTypes[conge.typeConge]?.color ||
                    "bg-gray-200 text-gray-800"
                  } text-sm px-3 py-1`}
                >
                  {leaveTypes[conge.typeConge]?.label || "Type inconnu"}
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
                  {conge.personnel?.firstName} {conge.personnel?.lastName}
                </p>
              </div>

              {/* Matricule */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Matricule
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {conge.personnel?.matricule}
                </p>
              </div>

              {/* Poste */}
              {conge.personnel?.poste && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Poste
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <User className="mr-2 h-5 w-5 text-gray-500" />
                    {conge.personnel.poste}
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
                  {conge.stationName || "Non défini"}
                </div>
              </div>

              {/* Type and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Type de congé
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Plane className="mr-2 h-5 w-5 text-blue-500" />
                    {leaveTypes[conge.typeConge]?.label || "Type inconnu"}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Durée du congé
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    {conge.dureeConge} jour
                    {Number.parseInt(conge.dureeConge) > 1 ? "s" : ""}
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
                    {formatDate(conge.dateDebut)}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date de retour
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-green-500" />
                    {formatDate(conge.dateRetour)}
                  </div>
                </div>
              </div>

              {/* Lieu de séjour */}
              {conge.lieuSejour && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Lieu de séjour
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    {conge.lieuSejour}
                  </div>
                </div>
              )}
              {/* Documents */}
                      {conge.documentPath && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Document justificatif
                  </Label>
                  <a
                    href={`/document/${encodeURIComponent(
                      normalizedDocument
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
                    Enregistré le
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Clock className="mr-2 h-5 w-5 text-blue-500" />
                    {new Date(conge.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {conge.updatedAt && conge.updatedAt !== conge.createdAt && (
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Dernière modification
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <Clock className="mr-2 h-5 w-5 text-blue-500" />
                      {new Date(conge.updatedAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/conges/edit/${conge._id}`)}
                className="flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => router.push("/conges")}
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
