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
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Contract types with their display names and colors
const contractTypes = {
  cdi: {
    label: "CDI",
    color: "bg-green-100 text-green-800",
  },
  cdd: {
    label: "CDD",
    color: "bg-orange-100 text-orange-800",
  },
  stage: {
    label: "Stage",
    color: "bg-blue-100 text-blue-800",
  },
  interim: {
    label: "Intérim",
    color: "bg-purple-100 text-purple-800",
  },
};

// Status types with their colors
const statusColors = {
  actif: "bg-green-100 text-green-800",
  "en congé": "bg-yellow-100 text-yellow-800",
  "en formation": "bg-blue-100 text-blue-800",
  inactif: "bg-red-100 text-red-800",
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
          onClick={() => router.push("/personnel")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour à la liste
        </Button>
      </div>
    );
  }

  if (!personnel) return null;

  // Determine the gradient color based on status
  const headerGradient = "bg-blue-500";

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/personnel")}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Détails du Personnel</h1>
          <div></div>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl">
          <CardHeader className={`${headerGradient} p-6 rounded-t-lg`}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white">
                {personnel.firstName} {personnel.lastName}
              </CardTitle>
              <div className="flex space-x-2">
                <Badge
                  className={`${
                    statusColors[personnel.status?.toLowerCase()] ||
                    "bg-gray-200 text-gray-800"
                  } text-sm px-3 py-1`}
                >
                  {personnel.status || "Non défini"}
                </Badge>
                <Badge
                  className={`${
                    contractTypes[personnel.contractType?.toLowerCase()]?.color ||
                    "bg-gray-200 text-gray-800"
                  } text-sm px-3 py-1`}
                >
                  {contractTypes[personnel.contractType?.toLowerCase()]?.label || personnel.contractType}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 bg-white">
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="mr-2 h-5 w-5 text-blue-500" />
                  Informations Personnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Matricule
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
                      {personnel.matricule}
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Nom Complet
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <User className="mr-2 h-5 w-5 text-gray-500" />
                      {personnel.firstName} {personnel.lastName}
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Date de Naissance
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                      {formatDate(personnel.birthDate)}
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Âge
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <UserCheck className="mr-2 h-5 w-5 text-green-500" />
                      {calculateAge(personnel.birthDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-blue-500" />
                  Informations Professionnelles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Poste
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <Briefcase className="mr-2 h-5 w-5 text-gray-500" />
                      {personnel.poste}
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Type de Contrat
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <FileText className="mr-2 h-5 w-5 text-gray-500" />
                      {contractTypes[personnel.contractType?.toLowerCase()]?.label || personnel.contractType}
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Station
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <Building className="mr-2 h-5 w-5 text-gray-500" />
                      {personnel.stationName || "Non défini"}
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Statut
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <UserCheck className="mr-2 h-5 w-5 text-green-500" />
                      {personnel.status || "Non défini"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                  Détails de l'Emploi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Date d'Embauche
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                      {formatDate(personnel.hireDate)}
                    </div>
                  </div>
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Ancienneté
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <Clock className="mr-2 h-5 w-5 text-green-500" />
                      {calculateYearsOfService(personnel.hireDate)}
                    </div>
                  </div>
                  {personnel.decision && (
                    <div>
                      <Label className="block text-sm font-semibold text-gray-600">
                        Décision
                      </Label>
                      <div className="mt-1 flex items-center text-lg text-gray-800">
                        <FileText className="mr-2 h-5 w-5 text-gray-500" />
                        {personnel.decision}
                      </div>
                    </div>
                  )}
                  {personnel.holidaysLeft !== undefined && (
                    <div>
                      <Label className="block text-sm font-semibold text-gray-600">
                        Congés Restants
                      </Label>
                      <div className="mt-1 flex items-center text-lg text-gray-800">
                        <CalendarDays className="mr-2 h-5 w-5 text-orange-500" />
                        {personnel.holidaysLeft} jour{personnel.holidaysLeft > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-blue-500" />
                  Informations Système
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="block text-sm font-semibold text-gray-600">
                      Créé le
                    </Label>
                    <div className="mt-1 flex items-center text-lg text-gray-800">
                      <Clock className="mr-2 h-5 w-5 text-blue-500" />
                      {new Date(personnel.createdAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {personnel.updatedAt && personnel.updatedAt !== personnel.createdAt && (
                    <div>
                      <Label className="block text-sm font-semibold text-gray-600">
                        Dernière Modification
                      </Label>
                      <div className="mt-1 flex items-center text-lg text-gray-800">
                        <Clock className="mr-2 h-5 w-5 text-orange-500" />
                        {new Date(personnel.updatedAt).toLocaleString("fr-FR", {
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
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/personnel/edit-personnel/${personnel._id}`)}
                className="flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={() => router.push("/personnel")}
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