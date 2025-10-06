"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  MapPin,
  Plane,
  Building,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Check,
  CheckCheck,
  Loader2,
  AlertTriangle,
  X,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AccountHeader } from "@/components/account-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
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

// Notification types with their display names, colors, and icons
const notificationTypes = {
  AbsenceAA: {
    label: "Absence AA",
    color: "bg-yellow-100 text-yellow-800",
    icon: Calendar,
  },
  AbsenceAI: {
    label: "Absence AI",
    color: "bg-purple-100 text-purple-800",
    icon: Calendar,
  },
  AffectationTemporaire: {
    label: "Affectation Temporaire",
    color: "bg-blue-100 text-blue-800",
    icon: MapPin,
  },
  Conge: {
    label: "Congé",
    color: "bg-green-100 text-green-800",
    icon: Plane,
  },
  CongeDays: {
    label: "Jours de Congé",
    color: "bg-emerald-100 text-emerald-800",
    icon: Calendar,
  },
  AffectationDefinitive: {
    label: "Affectation Définitive",
    color: "bg-indigo-100 text-indigo-800",
    icon: Building,
  },
  Recuperation: {
    label: "Récupération",
    color: "bg-orange-100 text-orange-800",
    icon: Clock,
  },
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState(""); // all, read, unread
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [markAllReadDialogOpen, setMarkAllReadDialogOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [user,setUser]=useState()
  const itemsPerPage = 10;

  const debouncedFetchNotifications = useCallback(
    debounce(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchNotifications();
    }, 500),
    [typeFilter, statusFilter, sortConfig]
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedFetchNotifications();
  };

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
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      if (typeFilter.length > 0) {
        params.append("types", typeFilter.join(","));
      }

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (sortConfig.key) {
        params.append("sortKey", sortConfig.key);
        params.append("sortDir", sortConfig.direction);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/list-notifications?${params}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Session expirée. Redirection vers la connexion...");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch notifications");
      }

      const result = await response.json();

      if (result.success) {
        setNotifications(result.data.notifications);
        setTotalPages(result.data.totalPages);
        setTotalNotifications(result.data.total);
        setError(null);
      } else {
        throw new Error(result.error || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please try again later.");
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    fetchNotifications();
  }, [currentPage, searchTerm, typeFilter, statusFilter, sortConfig]);

  // Format date to French date string
  const formatDate = (dateStr) => {
    if (!dateStr) return "Non défini";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleMarkAsRead = async (notificationId, isRead = true) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${notificationId}/mark-read`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ seen: isRead }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update notification");
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? {
                  ...notif,
                  seen: isRead,
                  seenAt: isRead ? new Date().toISOString() : null,
                }
              : notif
          )
        );

        toast.success(
          isRead
            ? "Notification marquée comme lue"
            : "Notification marquée comme non lue",
          {
            duration: 2000,
            position: "bottom-left",
          }
        );
      } else {
        throw new Error(result.error || "Failed to update notification");
      }
    } catch (error) {
      console.error("Error updating notification:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/mark-all-read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh notifications to get updated data
        await fetchNotifications();

        toast.success("Toutes les notifications ont été marquées comme lues", {
          duration: 3000,
          position: "bottom-left",
        });
        setMarkAllReadDialogOpen(false);
      } else {
        throw new Error(result.error || "Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${notificationToDelete._id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete notification");
      }

      const result = await response.json();

      if (result.success) {
        // Refresh notifications to get updated data
        await fetchNotifications();

        toast.success("Notification supprimée", {
          duration: 2000,
          position: "bottom-left",
        });
        setDeleteDialogOpen(false);
      } else {
        throw new Error(result.error || "Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (notification) => {
    // Mark as read when viewing details
    if (!notification.seen) {
      handleMarkAsRead(notification._id, true);
    }
    router.push(notification.detailsUrl);
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter([]);
    setStatusFilter("");
  };

  const getNotificationIcon = (type) => {
    const IconComponent = notificationTypes[type]?.icon || Bell;
    return IconComponent;
  };

  // Remove these variables as they're no longer needed
  // const filteredNotifications = notifications.filter(...)
  // const sortedNotifications = [...filteredNotifications].sort(...)

  // Use notifications directly
  const currentNotifications = notifications;

  const unreadCount = notifications.filter((n) => !n.seen).length;

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">


      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => setMarkAllReadDialogOpen(true)}
              disabled={actionLoading}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="relative w-full md:w-96">
          <Input
            type="text"
            placeholder="Rechercher dans les notifications..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-full rounded-full bg-white border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
        </div>

        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filtrer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Filtrer par</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Type de notification
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {Object.entries(notificationTypes).map(([key, { label }]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={typeFilter.includes(key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTypeFilter([...typeFilter, key]);
                        } else {
                          setTypeFilter(
                            typeFilter.filter((item) => item !== key)
                          );
                        }
                      }}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Statut</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <DropdownMenuRadioItem value="">
                      Toutes
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unread">
                      Non lues
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="read">
                      Lues
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={clearFilters}
                >
                  Effacer tous les filtres
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Trier
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Trier par</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortConfig.key}
                onValueChange={(key) => handleSort(key)}
              >
                <DropdownMenuRadioItem value="createdAt">
                  Date{" "}
                  {sortConfig.key === "createdAt" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="type">
                  Type{" "}
                  {sortConfig.key === "type" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="seen">
                  Statut{" "}
                  {sortConfig.key === "seen" &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {(typeFilter.length > 0 || statusFilter || searchTerm) && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium">Filtres actifs:</span>

          {typeFilter.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              Type: {notificationTypes[type]?.label || type}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() =>
                  setTypeFilter(typeFilter.filter((t) => t !== type))
                }
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}

          {statusFilter && (
            <Badge variant="secondary" className="text-xs">
              Statut: {statusFilter === "read" ? "Lues" : "Non lues"}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => setStatusFilter("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {searchTerm && (
            <Badge variant="secondary" className="text-xs">
              Recherche: {searchTerm}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-xs bg-transparent"
            onClick={clearFilters}
          >
            Effacer tous les filtres
          </Button>
        </div>
      )}

      <Card className="bg-white shadow-lg mb-8">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">
                Chargement des notifications...
              </span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">
              <AlertTriangle className="h-8 w-8 mr-2" />
              <p>{error}</p>
            </div>
          ) : currentNotifications.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-gray-500">
              <Bell className="h-12 w-12 mb-4 text-gray-400" />
              <p className="text-lg mb-2">Aucune notification trouvée</p>
              <p className="text-sm text-gray-400 mb-4">
                {searchTerm || typeFilter.length > 0 || statusFilter
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Vous n'avez aucune notification pour le moment"}
              </p>
              {searchTerm || typeFilter.length > 0 || statusFilter ? (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center bg-transparent"
                >
                  <X className="mr-2 h-4 w-4" />
                  Effacer les filtres
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {currentNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const typeInfo = notificationTypes[notification.type];

                return (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.seen
                        ? "bg-blue-50 border-l-4 border-l-blue-500"
                        : ""
                    }`}
                    onClick={() => handleViewDetails(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div
                          className={`p-2 rounded-full ${
                            typeInfo?.color || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <IconComponent className="h-4 w-4" />
                          {notification.type === "AbsenceAI" && (
                            <Sparkles className="h-2 w-2 absolute -mt-1 -ml-1 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              className={
                                typeInfo?.color || "bg-gray-100 text-gray-800"
                              }
                              variant="secondary"
                            >
                              {typeInfo?.label || notification.type}
                            </Badge>
                            {!notification.seen && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p
                            className={`text-sm ${
                              !notification.seen
                                ? "font-medium text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(notification)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(
                                  notification._id,
                                  !notification.seen
                                );
                              }}
                            >
                              {notification.seen ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Marquer comme non lue
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Marquer comme lue
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotificationToDelete(notification);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && !error && notifications.length > 0 && (
        <div className="flex justify-between items-center">
          <div>
            Affichage {(currentPage - 1) * itemsPerPage + 1} à{" "}
            {Math.min(currentPage * itemsPerPage, totalNotifications)} sur{" "}
            {totalNotifications} notifications
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
              variant="outline"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette notification ? Cette
              action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotification}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mark All Read Confirmation Dialog */}
      <AlertDialog
        open={markAllReadDialogOpen}
        onOpenChange={setMarkAllReadDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Marquer toutes les notifications comme lues
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir marquer toutes les notifications comme
              lues ? Vous avez {unreadCount} notification
              {unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marquer tout comme lu
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-left" />
    </div>
  );
}
