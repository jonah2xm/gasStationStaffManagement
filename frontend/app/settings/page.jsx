"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  Info,
  KeyRound,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusDialog } from "@/components/ui/status-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { DetailSection } from "@/components/ui/detail-layout";
import {
  EmployeeIdentity,
  Field,
  FormActions,
  FormSection,
  InputWithIcon,
  formatDateFr,
} from "@/components/ui/form-layout";

const STATIONS = [
  "GD R3120", "GD R3121", "GD R3122", "GD R3124", "GD R3125",
  "GD R3126", "GD R3127", "GD R3128", "GD R3130", "GD R3132",
  "GD R3133", "GD R3134", "GD R3135", "GD R3136", "GD R3137",
  "GD R3138"
];

const ROLE_OPTIONS = [
  { value: "gestionnaire", label: "Gestionnaire" },
  { value: "chef station", label: "Chef station" },
  { value: "administrateur", label: "Administrateur" },
];

// Password field with a lock icon and a show/hide toggle. Visibility is
// controlled when `visible` is passed, local otherwise.
function PasswordInput({ visible, onToggleVisible, invalid, className, ...props }) {
  const [localVisible, setLocalVisible] = useState(false);
  const isVisible = visible ?? localVisible;
  const toggle = onToggleVisible ?? (() => setLocalVisible((value) => !value));

  return (
    <div className="relative">
      <Lock aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
      <Input
        type={isVisible ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={cn("pl-9 pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[6px] text-ink-600 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-12 text-center">
      <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        <Icon aria-hidden className="h-5 w-5 text-ink-600" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint && <p className="max-w-[44ch] text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AccountItem({ label, children }) {
  const empty = children === undefined || children === null || children === "";
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="break-words text-sm text-foreground">{empty ? <span className="text-ink-500">—</span> : children}</div>
    </div>
  );
}

function ConfirmDialog({ open, onOpenChange, tone = "destructive", icon: Icon, title, description, confirmLabel, onConfirm }) {
  const destructive = tone === "destructive";
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              destructive ? "bg-destructive-subtle" : "bg-warning-subtle"
            )}
          >
            <Icon aria-hidden className={cn("h-[18px] w-[18px]", destructive ? "text-destructive" : "text-warning-text")} />
          </span>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive-hover" : undefined}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CredentialRow({ label, value, emphasis }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copie impossible, notez la valeur manuellement");
    }
  };

  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5">
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd
          className={cn(
            "truncate font-mono text-foreground",
            emphasis ? "text-2xl font-semibold tracking-[0.18em]" : "text-base font-medium"
          )}
        >
          {value || "—"}
        </dd>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={copy}
        disabled={!value}
        aria-label={`Copier : ${label}`}
        title="Copier"
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Shows the generated clock-in credentials once, with copy buttons.
function CredentialsDialog({ open, onOpenChange, title, description, identifier, password, passwordLabel, actionLabel }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success-subtle">
            <CheckCircle2 aria-hidden className="h-[18px] w-[18px] text-success" />
          </span>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <dl className="divide-y divide-border rounded-md border border-border bg-background">
          <CredentialRow label="Identifiant (matricule)" value={identifier} />
          <CredentialRow label={passwordLabel} value={password} emphasis />
        </dl>
        <p className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-subtle px-3 py-2 text-[13px] text-warning-text">
          <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          Notez ce mot de passe maintenant : il ne sera plus affiché.
        </p>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>{actionLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="mx-auto w-full max-w-6xl space-y-6 p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-80" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="space-y-2">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-10 w-full rounded-md" />
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card shadow-xs">
          <div className="space-y-2 border-b border-border px-5 py-4">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-64" />
          </div>
          <TableSkeleton rows={4} columns={4} />
        </div>
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState({});
  const [activeSection, setActiveSection] = useState(null);

  // User management state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Add user form state
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: process.env.NEXT_PUBLIC_DEFAULT_PASSWORD,
    role: "gestionnaire",
    occupiedStation: "",
  });
  const [addingUser, setAddingUser] = useState(false);
  const [errors, setErrors] = useState({});

  // Edit user state
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updatingUser, setUpdatingUser] = useState(false);

  // Reset password state
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordTouched, setPasswordTouched] = useState({});

  // Personnel account state
  const [availablePersonnel, setAvailablePersonnel] = useState([]);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [showPersonnelAccountDialog, setShowPersonnelAccountDialog] = useState(false);
  const [showPersonnelSuccessDialog, setShowPersonnelSuccessDialog] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [creatingPersonnelAccount, setCreatingPersonnelAccount] = useState(false);
  const [personnelSearchTerm, setPersonnelSearchTerm] = useState("");
  const [personnelStationFilter, setPersonnelStationFilter] = useState("all");
  const [personnelView, setPersonnelView] = useState("available"); // "available" or "active"
  const [showResetSuccessDialog, setShowResetSuccessDialog] = useState(false);
  const [personnelToReset, setPersonnelToReset] = useState(null);

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
      if (!user || (user.role !== "administrateur" && user.role !== "chef station")) return;

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

  useEffect(() => {
    const fetchAvailablePersonnel = async () => {
      if (!user || (user.role !== "administrateur" && user.role !== "chef station")) return;

      setPersonnelLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/available-personnel`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch available personnel");
        }

        const data = await res.json();
        setAvailablePersonnel(data || []);
      } catch (err) {
        console.error("Error fetching personnel:", err);
        toast.error("Erreur lors du chargement des personnels disponibles");
      } finally {
        setPersonnelLoading(false);
      }
    };

    if (user) {
      fetchAvailablePersonnel();
    }
  }, [user]);

  const refreshPersonnel = async () => {
    if (!user || (user.role !== "administrateur" && user.role !== "chef station")) return;

    setPersonnelLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/available-personnel`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Fetch failed");

      const data = await res.json();
      setAvailablePersonnel(data || []);
      toast.success("Liste actualisée");
    } catch (err) {
      toast.error("Erreur d'actualisation");
    } finally {
      setPersonnelLoading(false);
    }
  };

  const generateSimplePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous characters
    let pass = "";
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreatePersonnelAccount = async (personnel) => {
    const password = generateSimplePassword();
    setGeneratedPassword(password);
    setSelectedPersonnel(personnel);
    setCreatingPersonnelAccount(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/create-personnel-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            matricule: personnel.matricule,
            password: password,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la création");
      }

      setShowPersonnelAccountDialog(false);
      setShowPersonnelSuccessDialog(true);
      // Remove from available list
      setAvailablePersonnel(prev => prev.filter(p => p.matricule !== personnel.matricule));
      toast.success("Compte créé avec succès");
    } catch (err) {
      console.error("Error creating personnel account:", err);
      toast.error(err.message || "Erreur lors de la création du compte");
    } finally {
      setCreatingPersonnelAccount(false);
    }
  };

  const handleResetPersonnelPassword = async (userAccount) => {
    const password = generateSimplePassword();
    setGeneratedPassword(password);
    setSelectedPersonnel({
      matricule: userAccount.username,
      firstName: "",
      lastName: userAccount.username
    });
    setCreatingPersonnelAccount(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/reset-password/${userAccount._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            newPassword: password,
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la réinitialisation");
      }

      setShowResetSuccessDialog(true);
      toast.success("Mot de passe réinitialisé");
    } catch (err) {
      console.error("Error resetting personnel password:", err);
      toast.error(err.message || "Erreur lors de la réinitialisation");
    } finally {
      setCreatingPersonnelAccount(false);
    }
  };

  const filteredPersonnel = availablePersonnel.filter(p => {
    const matchesSearch =
      p.firstName.toLowerCase().includes(personnelSearchTerm.toLowerCase()) ||
      p.lastName.toLowerCase().includes(personnelSearchTerm.toLowerCase()) ||
      p.matricule.toLowerCase().includes(personnelSearchTerm.toLowerCase());

    const matchesStation = personnelStationFilter === "all" || p.stationName === personnelStationFilter;

    return matchesSearch && matchesStation;
  });

  const activePersonnelAccounts = users.filter(u => {
    const isPersonnel = u.role === "personnel";
    const matchesSearch = u.username.toLowerCase().includes(personnelSearchTerm.toLowerCase());
    const matchesStation = personnelStationFilter === "all" || u.occupiedStation === personnelStationFilter;
    return isPersonnel && matchesSearch && matchesStation;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredUsers = users.filter((u) => {
    const isNotPersonnel = u.role !== "personnel";
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return isNotPersonnel && matchesSearch && matchesRole;
  });

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
    newUser.password = process.env.NEXT_PUBLIC_DEFAULT_PASSWORD + '_' + newUser.username;

    if (!newUser.role) {
      newErrors.role = "Le rôle est requis";
    }

    if (newUser.role === "chef station" && !newUser.occupiedStation) {
      newErrors.occupiedStation = "La station occupée est requise pour un chef station";
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
        occupiedStation: "",
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

  const handleUpdateUser = async () => {
    if (!editingUser.username || !editingUser.email) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setUpdatingUser(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${editingUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(editingUser),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour");
      }

      const data = await res.json();
      setUsers(users.map(u => u._id === editingUser._id ? data.user : u));
      setShowEditUser(false);
      setEditingUser(null);
      toast.success("Utilisateur mis à jour avec succès");

      // Refresh data if the updated user is the current user
      if ((user?._id ?? user?.id) === editingUser._id) {
        // This will trigger the checkAuth effect or we can manually update local user state
        setUser({ ...user, ...data.user });
      }
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error(err.message || "Erreur lors de la mise à jour");
    } finally {
      setUpdatingUser(false);
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
      return { strength, label: "Faible", color: "text-destructive-text" };
    if (strength <= 3)
      return { strength, label: "Moyen", color: "text-warning-text" };
    if (strength <= 4)
      return { strength, label: "Fort", color: "text-success-text" };
    return { strength, label: "Très fort", color: "text-success-text" };
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

    setChangingPassword(true);

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
      setChangingPassword(false);
    }
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  if (loading) {
    return <SettingsSkeleton />;
  }

  const isAdmin = user?.role === "administrateur";
  const canManagePersonnel = isAdmin || user?.role === "chef station";

  const sections = [
    isAdmin && { id: "utilisateurs", label: "Utilisateurs", hint: "Accès au portail", icon: Users },
    canManagePersonnel && { id: "pointage", label: "Comptes de pointage", hint: "Pointage des employés", icon: Fingerprint },
    { id: "securite", label: "Sécurité", hint: "Votre mot de passe", icon: Shield },
  ].filter(Boolean);
  const currentSection = sections.find((section) => section.id === activeSection)?.id ?? sections[0].id;

  const personnelAccountCount = users.filter((u) => u.role === "personnel").length;
  const personnelFiltered = personnelSearchTerm !== "" || personnelStationFilter !== "all";

  const stationSelect = (className) => (
    <Select value={personnelStationFilter} onValueChange={setPersonnelStationFilter}>
      <SelectTrigger className={className} aria-label="Filtrer par station">
        <SelectValue placeholder="Toutes les stations" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toutes les stations</SelectItem>
        {STATIONS.map((station) => (
          <SelectItem key={station} value={station}>{station}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const passwordChecks = [
    [passwordData.newPassword.length >= 8, "Au moins 8 caractères"],
    [/[a-z]/.test(passwordData.newPassword), "Une lettre minuscule"],
    [/[A-Z]/.test(passwordData.newPassword), "Une lettre majuscule"],
    [/\d/.test(passwordData.newPassword), "Un chiffre"],
    [/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword), "Un caractère spécial (recommandé)"],
  ];
  const strengthBarColor =
    passwordStrength.strength <= 2 ? "bg-destructive" : passwordStrength.strength <= 3 ? "bg-warning" : "bg-success";

  const usersPanel = (
    <DetailSection
      title="Utilisateurs"
      description="Administrateurs, gestionnaires et chefs de station ayant accès au portail."
      actions={
        <Button onClick={() => setShowAddUser(true)}>
          <UserPlus className="h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      }
      bodyClassName="p-0"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <InputWithIcon icon={Search}>
            <Input
              placeholder="Rechercher par nom ou email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              aria-label="Rechercher un utilisateur"
            />
          </InputWithIcon>
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par rôle">
            <SelectValue placeholder="Filtrer par rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!usersLoading && (
          <p className="whitespace-nowrap text-[13px] tabular-nums text-muted-foreground sm:ml-auto">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {usersLoading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun utilisateur trouvé"
          hint={searchTerm || selectedRole !== "all" ? "Modifiez la recherche ou le filtre de rôle." : "Ajoutez un premier utilisateur pour lui donner accès au portail."}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-14 pr-5">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((userItem) => {
              const isSelf = userItem._id === (user?._id ?? user?.id);
              return (
                <TableRow key={userItem._id}>
                  <TableCell className="pl-5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                          isSelf ? "bg-info text-primary" : "bg-ink-250 text-ink-800"
                        )}
                      >
                        {(userItem.username || "?").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium text-foreground">
                          <span className="truncate">{userItem.username}</span>
                          {isSelf && (
                            <span className="rounded-[4px] bg-info-subtle px-1.5 text-[11px] font-medium text-info-text">Vous</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{userItem.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="role" value={userItem.role} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {userItem.role === "chef station" && userItem.occupiedStation ? (
                      userItem.occupiedStation
                    ) : (
                      <span className="text-ink-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground" title={userItem.createdAt ? formatDate(userItem.createdAt) : undefined}>
                    {formatDateFr(userItem.createdAt)}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions pour ${userItem.username}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={() => {
                            setEditingUser({ ...userItem });
                            setShowEditUser(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onSelect={() => {
                            setResetPasswordUser(userItem);
                            setNewPassword("");
                          }}
                        >
                          <KeyRound className="h-4 w-4" />
                          Réinitialiser le mot de passe
                        </DropdownMenuItem>
                        {!isSelf && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-destructive-text focus:bg-destructive-subtle focus:text-destructive-text"
                              onSelect={() => setUserToDelete(userItem)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </DetailSection>
  );

  const personnelPanel = (
    <DetailSection
      title="Comptes de pointage"
      description="Comptes restreints qui permettent aux employés de pointer. L'identifiant est le matricule."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={refreshPersonnel}
            disabled={personnelLoading}
            aria-label="Actualiser la liste"
            title="Actualiser"
          >
            <RefreshCw className={cn("h-4 w-4", personnelLoading && "animate-spin")} />
          </Button>
          <Button onClick={() => setShowPersonnelAccountDialog(true)}>
            <Plus className="h-4 w-4" />
            Créer un compte
          </Button>
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="flex flex-col gap-3 border-b border-border px-5 py-3 xl:flex-row xl:items-center">
        <div role="tablist" aria-label="Liste affichée" className="inline-flex w-fit shrink-0 rounded-md bg-muted p-0.5">
          {[
            { value: "available", label: "Sans compte", count: availablePersonnel.length },
            { value: "active", label: "Comptes actifs", count: personnelAccountCount },
          ].map((tab) => {
            const selected = personnelView === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setPersonnelView(tab.value)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-[6px] px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "bg-card font-medium text-foreground shadow-xs" : "text-ink-750 hover:text-foreground"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                    selected ? "bg-primary text-primary-foreground" : "bg-ink-250 text-ink-750"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
          <div className="w-full sm:max-w-xs">
            <InputWithIcon icon={Search}>
              <Input
                placeholder={personnelView === "available" ? "Nom, prénom ou matricule…" : "Rechercher un matricule…"}
                value={personnelSearchTerm}
                onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                className="pl-9"
                aria-label="Rechercher un employé"
              />
            </InputWithIcon>
          </div>
          {isAdmin && stationSelect("w-full sm:w-48")}
        </div>
      </div>

      {personnelLoading ? (
        <TableSkeleton rows={5} columns={4} />
      ) : personnelView === "available" ? (
        filteredPersonnel.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title={personnelFiltered ? "Aucun résultat" : "Tous les employés ont un compte"}
            hint={personnelFiltered ? "Modifiez la recherche ou le filtre de station." : "Les nouveaux employés apparaîtront ici."}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Employé</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Station</TableHead>
                <TableHead className="pr-5">
                  <span className="sr-only">Action</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel.map((person) => (
                <TableRow key={person._id}>
                  <TableCell className="pl-5">
                    <EmployeeIdentity firstName={person.firstName} lastName={person.lastName} matricule={person.matricule} size="sm" />
                  </TableCell>
                  <TableCell>{person.poste || <span className="text-ink-500">—</span>}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{person.stationName || <span className="text-ink-500">—</span>}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreatePersonnelAccount(person)}
                      disabled={creatingPersonnelAccount}
                    >
                      {creatingPersonnelAccount && selectedPersonnel?.matricule === person.matricule ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="h-3.5 w-3.5" />
                      )}
                      Créer le compte
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      ) : activePersonnelAccounts.length === 0 ? (
        <EmptyState
          icon={Fingerprint}
          title={personnelFiltered ? "Aucun résultat" : "Aucun compte de pointage actif"}
          hint={personnelFiltered ? "Modifiez la recherche ou le filtre de station." : "Créez un compte depuis l'onglet « Sans compte »."}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Identifiant</TableHead>
              <TableHead>Station</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="pr-5">
                <span className="sr-only">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activePersonnelAccounts.map((account) => (
              <TableRow key={account._id}>
                <TableCell className="pl-5">
                  <span className="rounded-[5px] border border-border bg-muted px-2 py-0.5 font-mono text-[13px] font-medium text-foreground">
                    {account.username}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">{account.occupiedStation || <span className="text-ink-500">—</span>}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDateFr(account.createdAt)}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPersonnelToReset(account)}
                    disabled={creatingPersonnelAccount}
                  >
                    {creatingPersonnelAccount && selectedPersonnel?.matricule === account.username ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Réinitialiser
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DetailSection>
  );

  const securityPanel = (
    <form onSubmit={handlePasswordSubmit} noValidate className="rounded-lg border border-border bg-card shadow-xs">
      <FormSection title="Compte" description="Le compte avec lequel vous êtes connecté.">
        <AccountItem label="Nom d'utilisateur">{user?.username}</AccountItem>
        <AccountItem label="Adresse email">{user?.email}</AccountItem>
        <AccountItem label="Rôle">{user?.role && <StatusBadge kind="role" value={user.role} />}</AccountItem>
        {user?.role === "chef station" && <AccountItem label="Station">{user?.occupiedStation}</AccountItem>}
      </FormSection>

      <FormSection
        title="Mot de passe"
        description="Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre."
      >
        <Field
          label="Mot de passe actuel"
          htmlFor="currentPassword"
          required
          full
          error={passwordTouched.currentPassword && passwordErrors.currentPassword}
        >
          <div className="sm:max-w-[calc(50%-0.625rem)]">
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              value={passwordData.currentPassword}
              onChange={handlePasswordInputChange}
              onBlur={() => validatePasswordField("currentPassword")}
              visible={showCurrentPassword}
              onToggleVisible={() => setShowCurrentPassword(!showCurrentPassword)}
              invalid={!!(passwordTouched.currentPassword && passwordErrors.currentPassword)}
              disabled={changingPassword}
            />
          </div>
        </Field>

        <Field
          label="Nouveau mot de passe"
          htmlFor="newPassword"
          required
          error={passwordTouched.newPassword && passwordErrors.newPassword}
        >
          <PasswordInput
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            value={passwordData.newPassword}
            onChange={handlePasswordInputChange}
            onBlur={() => validatePasswordField("newPassword")}
            visible={showNewPassword}
            onToggleVisible={() => setShowNewPassword(!showNewPassword)}
            invalid={!!(passwordTouched.newPassword && passwordErrors.newPassword)}
            disabled={changingPassword}
          />
        </Field>

        <Field
          label="Confirmer le nouveau mot de passe"
          htmlFor="confirmPassword"
          required
          error={passwordTouched.confirmPassword && passwordErrors.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordInputChange}
            onBlur={() => validatePasswordField("confirmPassword")}
            visible={showConfirmPassword}
            onToggleVisible={() => setShowConfirmPassword(!showConfirmPassword)}
            invalid={!!(passwordTouched.confirmPassword && passwordErrors.confirmPassword)}
            disabled={changingPassword}
          />
        </Field>

        {passwordData.newPassword && (
          <div className="rounded-md border border-border bg-background px-4 py-3 sm:col-span-2">
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-muted-foreground">Robustesse du mot de passe</span>
              <span className={cn("font-medium", passwordStrength.color)}>{passwordStrength.label}</span>
            </div>
            <div aria-hidden className="mt-2 grid grid-cols-5 gap-1">
              {[0, 1, 2, 3, 4].map((index) => (
                <span
                  key={index}
                  className={cn("h-1.5 rounded-full transition-colors", index < passwordStrength.strength ? strengthBarColor : "bg-ink-250")}
                />
              ))}
            </div>
            <ul className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
              {passwordChecks.map(([ok, label]) => (
                <li key={label} className={cn("flex items-center gap-1.5", ok ? "text-success-text" : "text-muted-foreground")}>
                  {ok ? (
                    <Check aria-hidden className="h-3.5 w-3.5 shrink-0 text-success" />
                  ) : (
                    <X aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                  )}
                  {label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </FormSection>

      <FormActions>
        <Button type="submit" disabled={changingPassword}>
          {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {changingPassword ? "Mise à jour…" : "Mettre à jour le mot de passe"}
        </Button>
      </FormActions>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6 lg:p-8">
      <PageHeader
        title="Paramètres"
        description={
          sections.length > 1
            ? "Gérez les accès au portail, les comptes de pointage et la sécurité de votre compte."
            : "Gérez la sécurité de votre compte."
        }
      />

      <div className={cn("grid gap-6", sections.length > 1 && "xl:grid-cols-[220px_minmax(0,1fr)] xl:items-start")}>
        {sections.length > 1 && (
          <nav
            aria-label="Sections des paramètres"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0 xl:pb-0"
          >
            {sections.map(({ id, label, hint, icon: Icon }) => {
              const active = id === currentSection;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-card font-medium text-foreground shadow-xs ring-1 ring-border"
                      : "text-ink-750 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon aria-hidden className={cn("h-4 w-4 shrink-0", active ? "text-foreground" : "text-ink-600")} />
                  <span className="flex min-w-0 flex-col">
                    <span className="whitespace-nowrap">{label}</span>
                    <span className="hidden text-xs font-normal text-muted-foreground xl:block">{hint}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        <div className="min-w-0">
          {currentSection === "utilisateurs" && usersPanel}
          {currentSection === "pointage" && personnelPanel}
          {currentSection === "securite" && securityPanel}
        </div>
      </div>

      {/* Add user */}
      <Dialog open={showAddUser} onOpenChange={(open) => { if (!addingUser) setShowAddUser(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>Le compte aura accès au portail selon le rôle choisi.</DialogDescription>
          </DialogHeader>
          <form
            id="add-user-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleAddUser();
            }}
            className="grid gap-4"
          >
            <Field label="Nom d'utilisateur" htmlFor="username" required error={errors.username}>
              <Input
                id="username"
                autoComplete="off"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                aria-invalid={!!errors.username || undefined}
                disabled={addingUser}
              />
            </Field>
            <Field label="Adresse email" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                aria-invalid={!!errors.email || undefined}
                disabled={addingUser}
              />
            </Field>
            <Field label="Rôle" htmlFor="role" required error={errors.role}>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                disabled={addingUser}
              >
                <SelectTrigger id="role" className={errors.role ? "border-destructive" : undefined}>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {newUser.role === "chef station" && (
              <Field label="Station occupée" htmlFor="occupiedStation" required error={errors.occupiedStation}>
                <Select
                  value={newUser.occupiedStation}
                  onValueChange={(value) => setNewUser({ ...newUser, occupiedStation: value })}
                  disabled={addingUser}
                >
                  <SelectTrigger id="occupiedStation" className={errors.occupiedStation ? "border-destructive" : undefined}>
                    <SelectValue placeholder="Sélectionner une station" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATIONS.map((station) => (
                      <SelectItem key={station} value={station}>{station}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <p className="flex items-start gap-2 rounded-md border border-info-border bg-info-subtle px-3 py-2 text-xs text-info-text">
              <Info aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
              Un mot de passe initial est attribué automatiquement. L'utilisateur pourra le changer dans Paramètres → Sécurité.
            </p>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddUser(false)} disabled={addingUser}>
              Annuler
            </Button>
            <Button type="submit" form="add-user-form" disabled={addingUser}>
              {addingUser && <Loader2 className="h-4 w-4 animate-spin" />}
              {addingUser ? "Création…" : "Créer l'utilisateur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user */}
      <Dialog
        open={showEditUser}
        onOpenChange={(open) => {
          if (!open && !updatingUser) {
            setShowEditUser(false);
            setEditingUser(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>Mettez à jour les informations et le rôle du compte.</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form
              id="edit-user-form"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser();
              }}
              className="grid gap-4"
            >
              <Field label="Nom d'utilisateur" htmlFor="edit-username" required>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  disabled={updatingUser}
                />
              </Field>
              <Field label="Adresse email" htmlFor="edit-email" required>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  disabled={updatingUser}
                />
              </Field>
              <Field label="Rôle" htmlFor="edit-role" required>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                  disabled={updatingUser}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {editingUser.role === "chef station" && (
                <Field label="Station occupée" htmlFor="edit-station">
                  <Select
                    value={editingUser.occupiedStation || ""}
                    onValueChange={(value) => setEditingUser({ ...editingUser, occupiedStation: value })}
                    disabled={updatingUser}
                  >
                    <SelectTrigger id="edit-station">
                      <SelectValue placeholder="Sélectionner une station" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATIONS.map((station) => (
                        <SelectItem key={station} value={station}>{station}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditUser(false);
                setEditingUser(null);
              }}
              disabled={updatingUser}
            >
              Annuler
            </Button>
            <Button type="submit" form="edit-user-form" disabled={updatingUser}>
              {updatingUser && <Loader2 className="h-4 w-4 animate-spin" />}
              {updatingUser ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset a portal user's password */}
      <Dialog
        open={!!resetPasswordUser}
        onOpenChange={(open) => {
          if (!open && !resettingPassword) setResetPasswordUser(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pr-8">
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe pour{" "}
              <span className="font-medium text-foreground">{resetPasswordUser?.username}</span>, puis communiquez-le à
              l'utilisateur.
            </DialogDescription>
          </DialogHeader>
          <form
            id="reset-password-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPassword();
            }}
          >
            <Field label="Nouveau mot de passe" htmlFor="reset-new-password" required hint="Au moins 6 caractères.">
              <PasswordInput
                id="reset-new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resettingPassword}
              />
            </Field>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetPasswordUser(null)} disabled={resettingPassword}>
              Annuler
            </Button>
            <Button type="submit" form="reset-password-form" disabled={resettingPassword}>
              {resettingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
              {resettingPassword ? "Réinitialisation…" : "Réinitialiser"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
        icon={Trash2}
        title="Supprimer l'utilisateur ?"
        description={
          <>
            Le compte <span className="font-medium text-foreground">{userToDelete?.username}</span> sera supprimé et ne
            pourra plus se connecter. Cette action est irréversible.
          </>
        }
        confirmLabel="Supprimer"
        onConfirm={() => handleDeleteUser(userToDelete._id)}
      />

      <ConfirmDialog
        open={!!personnelToReset}
        onOpenChange={(open) => {
          if (!open) setPersonnelToReset(null);
        }}
        tone="warning"
        icon={RotateCcw}
        title="Réinitialiser le mot de passe ?"
        description={
          <>
            Un nouveau mot de passe sera généré pour le compte{" "}
            <span className="font-mono font-medium text-foreground">{personnelToReset?.username}</span>. L'ancien ne
            fonctionnera plus.
          </>
        }
        confirmLabel="Réinitialiser"
        onConfirm={() => handleResetPersonnelPassword(personnelToReset)}
      />

      {/* Pick an employee to create a clock-in account */}
      <Dialog open={showPersonnelAccountDialog} onOpenChange={setShowPersonnelAccountDialog}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-6 py-5 pr-12">
            <DialogTitle>Créer un compte de pointage</DialogTitle>
            <DialogDescription>
              Choisissez un employé sans compte. Son matricule sert d'identifiant et un mot de passe temporaire est généré.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 border-b border-border px-6 py-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <InputWithIcon icon={Search}>
                <Input
                  placeholder="Rechercher par nom ou matricule…"
                  value={personnelSearchTerm}
                  onChange={(e) => setPersonnelSearchTerm(e.target.value)}
                  className="pl-9"
                  aria-label="Rechercher un employé"
                />
              </InputWithIcon>
            </div>
            {isAdmin && stationSelect("w-full sm:w-48")}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {filteredPersonnel.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="Aucun employé disponible"
                hint={personnelFiltered ? "Modifiez la recherche ou le filtre de station." : "Tous les employés ont déjà un compte de pointage."}
              />
            ) : (
              <ul className="divide-y divide-ink-150">
                {filteredPersonnel.map((person) => (
                  <li key={person._id} className="flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-ink-50">
                    <EmployeeIdentity
                      firstName={person.firstName}
                      lastName={person.lastName}
                      matricule={person.matricule}
                      meta={person.stationName}
                      size="sm"
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreatePersonnelAccount(person)}
                      disabled={creatingPersonnelAccount}
                    >
                      {creatingPersonnelAccount && selectedPersonnel?._id === person._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <KeyRound className="h-3.5 w-3.5" />
                      )}
                      Créer
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex justify-end border-t border-border px-6 py-3">
            <Button variant="outline" onClick={() => setShowPersonnelAccountDialog(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CredentialsDialog
        open={showPersonnelSuccessDialog}
        onOpenChange={setShowPersonnelSuccessDialog}
        title="Compte de pointage créé"
        description={
          <>
            Transmettez ces identifiants à{" "}
            <span className="font-medium text-foreground">
              {selectedPersonnel?.firstName} {selectedPersonnel?.lastName}
            </span>
            .
          </>
        }
        identifier={selectedPersonnel?.matricule}
        password={generatedPassword}
        passwordLabel="Mot de passe temporaire"
        actionLabel="J'ai noté le mot de passe"
      />

      <CredentialsDialog
        open={showResetSuccessDialog}
        onOpenChange={setShowResetSuccessDialog}
        title="Mot de passe réinitialisé"
        description={
          <>
            Le compte <span className="font-mono font-medium text-foreground">{selectedPersonnel?.matricule}</span> garde son
            identifiant ; seul le mot de passe change.
          </>
        }
        identifier={selectedPersonnel?.matricule}
        password={generatedPassword}
        passwordLabel="Nouveau mot de passe"
        actionLabel="J'ai noté le nouveau mot de passe"
      />

      <StatusDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Mot de passe modifié"
        description="Utilisez votre nouveau mot de passe lors de votre prochaine connexion."
        onAction={() => setShowSuccessDialog(false)}
      />

      <StatusDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        variant="error"
        title="Échec du changement de mot de passe"
        description={errorMessage}
        actionLabel="Fermer"
        onAction={() => setShowErrorDialog(false)}
      />

      <Toaster position="bottom-left" />
    </div>
  );
}
