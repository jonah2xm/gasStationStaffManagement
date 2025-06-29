"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Shield,
  Bell,
  Globe,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountHeader } from "@/components/account-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState({});
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});

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
        setUser(data.user); // Adjust based on backend response structure
      } catch (err) {
        console.warn("User not logged in or error:", err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    if (!passwordTouched[name]) {
      setPasswordTouched((prev) => ({ ...prev, [name]: true }));
    }

    // Clear error when user types
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validatePasswordField = (field) => {
    const newErrors = { ...passwordErrors };

    switch (field) {
      case "currentPassword":
        if (!passwordData.currentPassword) {
          newErrors.currentPassword = "Le mot de passe actuel est requis";
        } else {
          delete newErrors.currentPassword;
        }
        break;
      case "newPassword":
        if (!passwordData.newPassword) {
          newErrors.newPassword = "Le nouveau mot de passe est requis";
        } else if (passwordData.newPassword.length < 8) {
          newErrors.newPassword =
            "Le mot de passe doit contenir au moins 8 caractères";
        } else if (
          !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)
        ) {
          newErrors.newPassword =
            "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre";
        } else if (passwordData.newPassword === passwordData.currentPassword) {
          newErrors.newPassword =
            "Le nouveau mot de passe doit être différent de l'ancien";
        } else {
          delete newErrors.newPassword;
        }
        break;
      case "confirmPassword":
        if (!passwordData.confirmPassword) {
          newErrors.confirmPassword =
            "La confirmation du mot de passe est requise";
        } else if (passwordData.confirmPassword !== passwordData.newPassword) {
          newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      default:
        break;
    }

    setPasswordErrors(newErrors);
    return !newErrors[field];
  };

  const validatePasswordForm = () => {
    const fields = ["currentPassword", "newPassword", "confirmPassword"];
    const newTouched = {};
    fields.forEach((field) => {
      newTouched[field] = true;
    });
    setPasswordTouched(newTouched);

    let isValid = true;
    fields.forEach((field) => {
      if (!validatePasswordField(field)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password),
    ];

    strength = checks.filter(Boolean).length;

    if (strength <= 2)
      return { strength, label: "Faible", color: "text-red-500" };
    if (strength <= 3)
      return { strength, label: "Moyen", color: "text-yellow-500" };
    if (strength <= 4)
      return { strength, label: "Fort", color: "text-green-500" };
    return { strength, label: "Très fort", color: "text-green-600" };
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire", {
        duration: 3000,
        position: "bottom-left",
      });
      return;
    }

    setLoading(true);

    try {
      // In a real application, you would call your API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/updatePassword`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Erreur lors du changement de mot de passe"
        );
      }

      // Simulate API call for demo
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setShowSuccessDialog(true);

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordTouched({});
      setPasswordErrors({});
    } catch (error) {
      console.error("Error changing password:", error.message);
      setErrorMessage(
        error.message || "Erreur lors du changement de mot de passe"
      );
      setShowErrorDialog(true);
      toast.error(
        error.message || "Erreur lors du changement de mot de passe",
        {
          duration: 3000,
          position: "bottom-left",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Profil mis à jour avec succès", {
        duration: 3000,
        position: "bottom-left",
      });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du profil", {
        duration: 3000,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <AccountHeader
        name={user?.username || "Utilisateur"}
        role={user?.role || "Invité"}
        avatarUrl="/placeholder.svg?height=40&width=40"
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Changer le mot de passe
            </CardTitle>
            <CardDescription>
              Modifiez votre mot de passe pour sécuriser votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel*</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    onBlur={() => validatePasswordField("currentPassword")}
                    disabled={loading}
                    className={`pl-10 pr-10 ${
                      passwordTouched.currentPassword &&
                      passwordErrors.currentPassword
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                {passwordTouched.currentPassword &&
                  passwordErrors.currentPassword && (
                    <p className="text-red-500 text-sm">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe*</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    onBlur={() => validatePasswordField("newPassword")}
                    disabled={loading}
                    className={`pl-10 pr-10 ${
                      passwordTouched.newPassword && passwordErrors.newPassword
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Force du mot de passe:
                      </span>
                      <span
                        className={`text-sm font-medium ${passwordStrength.color}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength <= 2
                            ? "bg-red-500"
                            : passwordStrength.strength <= 3
                            ? "bg-yellow-500"
                            : passwordStrength.strength <= 4
                            ? "bg-green-500"
                            : "bg-green-600"
                        }`}
                        style={{
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-2">
                        {passwordData.newPassword.length >= 8 ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span>Au moins 8 caractères</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/[a-z]/.test(passwordData.newPassword) ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span>Une lettre minuscule</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/[A-Z]/.test(passwordData.newPassword) ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span>Une lettre majuscule</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/\d/.test(passwordData.newPassword) ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        <span>Un chiffre</span>
                      </div>
                    </div>
                  </div>
                )}

                {passwordTouched.newPassword && passwordErrors.newPassword && (
                  <p className="text-red-500 text-sm">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le nouveau mot de passe*
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    onBlur={() => validatePasswordField("confirmPassword")}
                    disabled={loading}
                    className={`pl-10 pr-10 ${
                      passwordTouched.confirmPassword &&
                      passwordErrors.confirmPassword
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                {passwordTouched.confirmPassword &&
                  passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-sm">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changement en cours...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Changer le mot de passe
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <AlertTriangle className="inline-block mr-1" size={16} />
        Les champs marqués avec * sont obligatoires.
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-green-600 flex items-center gap-2">
              <Check className="h-6 w-6" />
              Mot de passe changé avec succès
            </AlertDialogTitle>
            <AlertDialogDescription>
              Votre mot de passe a été modifié avec succès. Vous pouvez
              maintenant utiliser votre nouveau mot de passe pour vous
              connecter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Erreur
            </AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Fermer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-left" />
    </div>
  );
}
