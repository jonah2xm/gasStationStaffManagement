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
  DollarSign,
  User,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AccountHeader } from "@/components/account-header";

// Status types with their display names and colors
const statusTypes = {
  pending: {
    label: "En attente",
    color: "bg-yellow-100 text-yellow-800",
  },
  approved: {
    label: "Approuvée",
    color: "bg-green-100 text-green-800",
  },
  rejected: {
    label: "Rejetée",
    color: "bg-red-100 text-red-800",
  },
  completed: {
    label: "Terminée",
    color: "bg-blue-100 text-blue-800",
  },
};

export default function MutationDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // expects dynamic route: /mutations/[id]

  const [mutation, setMutation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch mutation details using the id from the URL
  useEffect(() => {
    if (!id) return;

    const fetchMutationDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/mutations/${id}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error(
            "Erreur lors du chargement des détails de la mutation"
          );
        }
        const data = await response.json();

        setMutation(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching mutation details:", err);
        setError(err.message);
        toast.error(err.message, {
          duration: 3000,
          position: "bottom-left",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMutationDetails();
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

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount) return "Non défini";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
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
          onClick={() => router.push("/mutations")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    );
  }

  if (!mutation) return null;

  // Determine the gradient color based on status
  const headerGradient =
    mutation.status === "approved"
      ? "bg-gradient-to-r from-green-500 to-green-600"
      : mutation.status === "pending"
      ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
      : mutation.status === "rejected"
      ? "bg-gradient-to-r from-red-500 to-red-600"
      : "bg-gradient-to-r from-blue-500 to-blue-600";

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
            onClick={() => router.push("/mutations")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de la Mutation
          </h1>
          <div></div>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className={`${headerGradient} p-6 rounded-t-lg`}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                Mutation
              </CardTitle>
              <Badge
                className={`${
                  statusTypes[mutation.status]?.color ||
                  "bg-gray-200 text-gray-800"
                } text-sm px-3 py-1`}
              >
                {statusTypes[mutation.status]?.label || "Statut inconnu"}
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
                  {mutation.personnel?.firstName} {mutation.personnel?.lastName}
                </p>
              </div>

              {/* Matricule */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Matricule
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {mutation.personnel?.matricule}
                </p>
              </div>

              {/* Current Position */}
              {mutation.personnel?.poste && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Poste actuel
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <User className="mr-2 h-5 w-5 text-gray-500" />
                    {mutation.personnel.poste}
                  </div>
                </div>
              )}

              {/* Departments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Département actuel
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Building className="mr-2 h-5 w-5 text-gray-500" />
                    {mutation.currentDepartment?.name || "Non défini"}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Nouveau département
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                    {mutation.newDepartment?.name || "Non défini"}
                  </div>
                </div>
              </div>

              {/* Position and Salary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Nouveau poste
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <User className="mr-2 h-5 w-5 text-blue-500" />
                    {mutation.newPosition || "Non défini"}
                  </div>
                </div>
                {mutation.newSalary && (
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Nouveau salaire
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <DollarSign className="mr-2 h-5 w-5 text-green-500" />
                      {formatCurrency(mutation.newSalary)}
                    </div>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date de demande
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                    {formatDate(mutation.requestDate)}
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-semibold text-gray-600">
                    Date d'effet
                  </Label>
                  <div className="mt-1 flex items-center text-lg text-gray-800">
                    <Calendar className="mr-2 h-5 w-5 text-green-500" />
                    {formatDate(mutation.effectiveDate)}
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="border-b pb-4">
                <Label className="block text-sm font-semibold text-gray-600">
                  Motif de la mutation
                </Label>
                <p className="mt-1 text-lg text-gray-800">
                  {mutation.reason || "Aucun motif fourni"}
                </p>
              </div>

              {/* Document */}
              {mutation.document && (
                <div className="border-b pb-4">
                  <Label className="block text-sm font-semibold text-gray-600">
                    Document justificatif
                  </Label>
                  <a
                    href={
                      mutation.document.url ||
                      `/mutations/document/${encodeURIComponent(
                        mutation.document
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center text-lg text-blue-600 hover:underline"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    {mutation.document.originalName || "Voir le document"}
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
                    {new Date(mutation.createdAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                {mutation.updatedAt &&
                  mutation.updatedAt !== mutation.createdAt && (
                    <div>
                      <Label className="block text-sm font-semibold text-gray-600">
                        Dernière modification
                      </Label>
                      <div className="mt-1 flex items-center text-lg text-gray-800">
                        <Clock className="mr-2 h-5 w-5 text-blue-500" />
                        {new Date(mutation.updatedAt).toLocaleString("fr-FR", {
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
                onClick={() => router.push(`/mutations/edit/${mutation._id}`)}
                className="flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => router.push("/mutations")}
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
