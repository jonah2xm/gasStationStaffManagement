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
  Users,
  User,
  Trash2,
  RotateCcw,
  Plus,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  // User management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Add user form state
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD,
    role: "gestionnaire",
  });
  const [addingUser, setAddingUser] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset password state
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

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
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user || user.role !== "administrateur") return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await res.json();
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
        toast.error("Erreur lors du chargement des utilisateurs");
      } finally {
        setUsersLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const getRoleBadge = (role) => {
    const roleConfig = {
      administrateur: {
        label: "Administrateur",
        color: "bg-red-100 text-red-800",
      },
      gestionnaire: {
        label: "gestionnaire",
        color: "bg-blue-100 text-blue-800",
      },
      "chef station": {
        label: "Chef Station",
        color: "bg-green-100 text-green-800",
      },
    };

    const config = roleConfig[role] || {
      label: role,
      color: "bg-gray-100 text-gray-800",
    };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredUsers = users; /*.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })*/

  const validateNewUser = () => {
    const newErrors = {};

    if (!newUser.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (newUser.username.length < 3) {
      newErrors.username =
        "Le nom d'utilisateur doit contenir au moins 3 caractères";
    }

    if (!newUser.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      newErrors.email = "Format d'email invalide";
    }

    /* if (!newUser.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (newUser.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"
    }*/
    newUser.password = process.env.NEXT_PUBLIC_DEFAULT_PASSWORD+'_'+newUser.username;

    if (!newUser.role) {
      newErrors.role = "Le rôle est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateNewUser()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setAddingUser(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(newUser),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Erreur lors de la création de l'utilisateur"
        );
      }

      const data = await res.json();
      setUsers([...users, data.user]);
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "gestionnaire",
      });
      setShowAddUser(false);
      setErrors({});
      toast.success("Utilisateur créé avec succès!");
    } catch (err) {
      console.error("Error adding user:", err);
      toast.error(err.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setAddingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setResettingPassword(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/reset-password/${resetPasswordUser._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ newPassword }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message ||
            "Erreur lors de la réinitialisation du mot de passe"
        );
      }

      setResetPasswordUser(null);
      setNewPassword("");
      toast.success("Mot de passe réinitialisé avec succès!");
    } catch (err) {
      console.error("Error resetting password:", err);
      toast.error(
        err.message || "Erreur lors de la réinitialisation du mot de passe"
      );
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Erreur lors de la suppression de l'utilisateur"
        );
      }

      setUsers(users.filter((user) => user._id !== userId));
      toast.success("Utilisateur supprimé avec succès!");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error(
        err.message || "Erreur lors de la suppression de l'utilisateur"
      );
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (!passwordTouched[name]) {
      setPasswordTouched((prev) => ({ ...prev, [name]: true }));
    }

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

      setShowSuccessDialog(true);

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

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Retour
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* User Management Section - Only for Administrators */}
        {user?.role === "administrateur" && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Gestion des Utilisateurs
                </CardTitle>
                <Button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter Utilisateur</span>
                </Button>
              </div>
              <CardDescription>
                Gérer les utilisateurs du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par nom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filtrer par rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="administrateur">
                      Administrateur
                    </SelectItem>
                    <SelectItem value="gestionnaire">gestionnaire</SelectItem>
                    <SelectItem value="chef station">Chef Station</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Date de création</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userItem) => (
                        <TableRow key={userItem._id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium">
                                {userItem.username}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{userItem.email}</TableCell>
                          <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {formatDate(userItem.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setResetPasswordUser(userItem);
                                  setNewPassword("");
                                }}
                                className="flex items-center space-x-1"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Reset</span>
                              </Button>
                              {userItem._id !== user._id && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="flex items-center space-x-1"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Supprimer</span>
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Confirmer la suppression
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Êtes-vous sûr de vouloir supprimer
                                        l'utilisateur "{userItem.username}" ?
                                        Cette action est irréversible.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Annuler
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteUser(userItem._id)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Supprimer
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Aucun utilisateur trouvé
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Change Password */}
        <Card className="bg-white">
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

      {/* Add User Dialog */}
      <AlertDialog open={showAddUser} onOpenChange={setShowAddUser}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Ajouter un nouvel utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Remplissez les informations pour créer un nouveau compte
              utilisateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
                className={errors.username ? "border-red-500" : ""}
                disabled={addingUser}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className={errors.email ? "border-red-500" : ""}
                disabled={addingUser}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) =>
                  setNewUser({ ...newUser, role: value })
                }
                disabled={addingUser}
              >
                <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestionnaire">gestionnaire</SelectItem>
                  <SelectItem value="chef station">Chef Station</SelectItem>
                  <SelectItem value="administrateur">Administrateur</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-red-500">{errors.role}</p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={addingUser}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddUser} disabled={addingUser}>
              {addingUser ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {addingUser ? "Création..." : "Créer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog
        open={!!resetPasswordUser}
        onOpenChange={() => setResetPasswordUser(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
            <AlertDialogDescription>
              Définir un nouveau mot de passe pour {resetPasswordUser?.username}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                disabled={resettingPassword}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resettingPassword}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={resettingPassword}
            >
              {resettingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {resettingPassword ? "Réinitialisation..." : "Réinitialiser"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
