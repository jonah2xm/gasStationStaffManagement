"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Calendar, FileText, Loader2, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";


export default function AbsenceAADetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /absence/aa/[id]

  const [absence, setAbsence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [normalizedDocument, setNormalizedDocument] = useState("");

  // Fetch absence details using the absence id from the URL
  useEffect(() => {
    if (!id) return;

    const fetchAbsenceDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/absencesAA/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des détails de l'absence");
        }
        const data = await response.json();
        console.log("data", data);
        setAbsence(data);
        setNormalizedDocument(data.document.replace(/\\/g, "/"));
        setError(null);
      } catch (err) {
        console.error("Error fetching absence details:", err);
        setError(err.message);
        toast.error(err.message, {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAbsenceDetails();
  }, [id]);

  // Helper function to format dates in French style
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

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
          onClick={() => router.push("/absence/aa")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    );
  }

  if (!absence) return null;

  return (
    <div className="min-h-screen bg-gray-50">

  

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/absence/aa")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de l'Absence Autorisée
          </h1>
          <div></div>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-white">
              {absence.absenceType.charAt(0).toUpperCase() +
                absence.absenceType.slice(1)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <div className="space-y-6">
              {/* Employé Info */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Employé
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {absence.personnel?.firstName} {absence.personnel?.lastName}
                </p>
              </div>

              {/* Matricule */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Matricule
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {absence.personnel?.matricule}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date de début
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    {formatDate(absence.startDate)}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date de fin
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    {formatDate(absence.endDate)}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Description
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {absence.description || "Aucune description fournie"}
                </p>
              </div>

              {/* Document */}
              {absence.document && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Document justificatif
                  </Label>
                  <a
                    href={`/absence/aa/document/${encodeURIComponent(
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
              <div>
                <Label className="block text-sm font-semibold text-gray-600">
                  Enregistrée le
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {new Date(absence.createdAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Toaster position="bottom-left" />
    </div>
  );
}
