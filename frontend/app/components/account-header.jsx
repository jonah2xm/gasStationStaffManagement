"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Settings, LogOut, User, ChevronDown, ChevronRight, Check } from "lucide-react"
import { getSocket } from "@/utils/socket";

// Breadcrumb labels per route segment; segments without a label (record ids, file names) are skipped.
const SEGMENT_LABELS = {
  dashboard: "Tableau de bord",
  notifications: "Notifications",
  stations: "Stations",
  personnel: "Personnel",
  "pointage-list": "Pointages",
  conges: "Congés",
  absence: "Absences",
  aa: "Absences AA",
  ai: "Absences AI",
  affectation: "Affectations",
  definitif: "Définitives",
  temporaire: "Temporaires",
  settings: "Paramètres",
  profile: "Profil",
  document: "Document",
  add: "Ajouter",
  "add-personnel": "Ajouter",
  "add-station": "Ajouter",
  edit: "Modifier",
  "edit-personnel": "Modifier",
  "edit-station": "Modifier",
  details: "Détails",
  reprise: "Avis de reprise",
  envoi: "Envois",
  suivi: "Suivi des documents",
  station: "Station",
}

// Sidebar section each module belongs to, shown as the first crumb.
const SECTION_LABELS = {
  dashboard: "Vue d'ensemble",
  notifications: "Vue d'ensemble",
  stations: "Organisation",
  personnel: "Organisation",
  "pointage-list": "Présence",
  conges: "Mouvements & absences",
  absence: "Mouvements & absences",
  affectation: "Mouvements & absences",
  reprise: "Mouvements & absences",
  envoi: "Mouvements & absences",
  suivi: "Mouvements & absences",
  settings: "Administration",
  profile: "Mon compte",
}

// Crumbs only link to routes that have a page of their own.
const LINKABLE_PATHS = new Set([
  "/dashboard",
  "/notifications",
  "/stations",
  "/personnel",
  "/pointage-list",
  "/conges",
  "/absence",
  "/reprise",
  "/envoi",
  "/suivi",
  "/affectation/definitif",
  "/affectation/temporaire",
  "/settings",
  "/profile",
])

const ROLE_LABELS = {
  administrateur: "Administrateur",
  gestionnaire: "Gestionnaire",
  "chef station": "Chef station",
  personnel: "Personnel",
}

const NOTIFICATION_TYPE_LABELS = {
  Absence: "Absence",
  // Types hérités, encore portés par les notifications déjà en base.
  AbsenceAA: "Absence AA",
  AbsenceAI: "Absence AI",
  AffectationTemporaire: "Affectation temporaire",
  AffectationDefinitive: "Affectation définitive",
  Conge: "Congé",
  CongeDays: "Jours de congé",
  Recuperation: "Récupération",
  MonthlyAccrual: "Acquisition mensuelle",
  SuiviConge: "Suivi des congés",
  SuiviAbsence: "Suivi des absences et reprises",
}

function buildCrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean)
  const crumbs = []
  const section = SECTION_LABELS[segments[0]]
  if (section) crumbs.push({ label: section })

  let path = ""
  for (const segment of segments) {
    path += `/${segment}`
    const label = SEGMENT_LABELS[segment]
    if (!label) continue
    crumbs.push({ label, href: LINKABLE_PATHS.has(path) ? path : undefined })
  }
  return crumbs
}

export function AccountHeader({ name, role, avatarUrl }) {
  const router = useRouter()
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState({ username: "", role: "", district: "", structure: "" })
  const menuRef = useRef(null)
  const bellRef = useRef(null)

  // 1) On mount: fetch overview (total & unread)
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/overview`, {
        credentials: "include",
      })
      const json = await res.json()
      if (json.success && json.data) setUnreadCount(json.data.unread || 0)
    } catch (err) {
      console.error("Overview fetch error:", err)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include", // 👈 IMPORTANT: needed to send cookies
        })

        if (!res.ok) {
          router.push("/login");
          throw new Error("Not authenticated")
        }

        const data = await res.json()
        if (data.user) {
          // normalize id field so code can reference user.id or user._id
          setUser({ ...data.user, id: data.user._id || data.user.id });
        } else {
          setUser({ username: "", role: "", district: "", structure: "" })
        }
      } catch (err) {
        console.warn("User not logged in or error:", err.message)
        setUser({ username: "", role: "", district: "", structure: "" })
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  // 2) Fetch detailed notifications when bell is clicked
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/latest`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success) {
        // map backend 'seen' to frontend 'isRead' so UI logic stays consistent
        const mapped = (json.data || []).map((n) => ({
          ...n,
          isRead: !!n.seen,
          createdAt: n.createdAt || n.date || n.createdAt,
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  };

  // SOCKET: join user room and listen for events (new + read)
  useEffect(() => {
    const userId = user && (user._id || user.id);
    if (!userId) return;

    const socket = getSocket();

    // connect if needed
    if (!socket.connected) socket.connect?.();

    socket.emit("join", userId);

    // NEW notification
    const onNewNotification = (payload) => {
      try {
        const inc = Number(payload.countIncrement || 1);

        setUnreadCount((prev) => Math.max(0, prev + inc));

        setNotifications((prev) => [
          {
            _id: payload._id || payload.reference || `socket-${Date.now()}`,
            title: payload.title || "Nouvelle notification",
            message: payload.message,
            type: payload.type || "info",
            createdAt: payload.createdAt || payload.date || new Date().toISOString(),
            isRead: false,
            detailsUrl: payload.detailsUrl,
            reference: payload.reference,
          },
          ...prev,
        ]);

        // keep authoritative value in sync (useful for multi-tabs)
        fetchOverview().catch((e) => console.warn("fetchOverview after new notif failed:", e));
      } catch (err) {
        console.error("onNewNotification handler error:", err);
      }
    };

    // SINGLE notification marked read (payload: { id: "<notifId>" } or { _id: "..."} )
    const onNotificationRead = (payload) => {
      try {
        const ids = payload && (payload.ids || payload.id || payload._id)
          ? Array.isArray(payload.ids)
            ? payload.ids
            : [payload.id || payload._id]
          : [];

        if (ids.length === 0) {
          // nothing to do; optional resync
          fetchOverview().catch(() => { });
          return;
        }

        // Update notifications and unreadCount
        setNotifications((prev) => {
          const idSet = new Set(ids.map(String));
          let decremented = 0;
          const next = prev.map((n) => {
            if (idSet.has(String(n._id)) && !n.isRead) {
              decremented++
              return { ...n, isRead: true }
            }
            return n
          })
          // adjust unreadCount based on how many we flipped from unread -> read
          setUnreadCount((prevCount) => Math.max(0, prevCount - decremented))
          return next
        });

        // optional: re-sync authoritative unread count
        fetchOverview().catch(() => { });
      } catch (err) {
        console.error("onNotificationRead handler error:", err);
      }
    };

    // MARK ALL read event (payload may be { all: true } or no payload)
    const onMarkAllRead = (payload) => {
      try {
        // mark all locally as read
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        // re-sync just in case
        fetchOverview().catch(() => { });
      } catch (err) {
        console.error("onMarkAllRead handler error:", err);
      }
    };

    socket.on("notification:new", onNewNotification);
    socket.on("notification:read", onNotificationRead);
    socket.on("notification:markAllRead", onMarkAllRead);
    socket.on("notification:allRead", onMarkAllRead); // alternate event name

    return () => {
      try {
        socket.off("notification:new", onNewNotification);
        socket.off("notification:read", onNotificationRead);
        socket.off("notification:markAllRead", onMarkAllRead);
        socket.off("notification:allRead", onMarkAllRead);
        socket.emit("leave", userId);
      } catch (err) {
        console.warn("Socket cleanup error:", err);
      }
    };
  }, [user, fetchOverview]);


  // 3) Mark notification as read (client -> server)
  const markAsRead = async (notificationId) => {
    try {
      // optimistic update: mark locally
      setNotifications((prev) => prev.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true } : notif)));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${notificationId}/mark-read`, {
        method: "PATCH",
        credentials: "include",
      })
      if (!res.ok) {
        // rollback if server failed - re-fetch state
        console.warn("Mark as read server returned", res.status);
        await fetchOverview();
        await fetchNotifications();
      } else {
        // server may broadcast a notification:read event — if it doesn't, the optimistic update keeps UI correct
      }
    } catch (err) {
      console.error("Mark as read error:", err)
      // fallback resync
      await fetchOverview().catch(() => { })
      await fetchNotifications().catch(() => { })
    }
  }

  // 4) Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // optimistic local change
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/mark-all-read`, {
        method: "PATCH",
        credentials: "include",
      })
      if (!res.ok) {
        console.warn("Mark all as read server returned", res.status);
        await fetchOverview();
        await fetchNotifications();
      } else {
        // server should broadcast notification:markAllRead to notify other tabs/devices
      }
    } catch (err) {
      console.error("Mark all as read error:", err)
      await fetchOverview().catch(() => { })
      await fetchNotifications().catch(() => { })
    }
  }

  // 5) Handle logout
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login")
    }
  }

  // 6) Handle notification bell click
  const handleNotificationClick = () => {
    if (!showNotifications) {
      fetchNotifications()
    }
    setShowNotifications(!showNotifications)
  }

  const openAllNotifications = () => {
    setShowNotifications(false)
    router.push("/notifications")
  }

  // small helpers
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `Il y a ${diffInHours} h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Il y a ${diffInDays} j`

    return date.toLocaleDateString("fr-FR")
  }

  const displayName = name || user.username || "Utilisateur"
  const rawRole = role || user.role || ""
  const displayRole = ROLE_LABELS[rawRole] || rawRole || "Invité"
  const crumbs = buildCrumbs(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
      <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-450" />}
              {isLast ? (
                <span aria-current="page" className="truncate font-medium text-foreground">{crumb.label}</span>
              ) : crumb.href ? (
                <Link href={crumb.href} className="truncate transition-colors hover:text-foreground">{crumb.label}</Link>
              ) : (
                <span className="truncate">{crumb.label}</span>
              )}
            </span>
          )
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        {/* Notifications */}
        <Popover open={showNotifications} onOpenChange={setShowNotifications}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleNotificationClick}
              ref={bellRef}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lues` : "Notifications"}
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold tabular-nums text-primary-foreground ring-2 ring-card">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0" align="end">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-[15px] font-semibold text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs tabular-nums text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Tout marquer comme lu
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
                    <Bell className="h-5 w-5 text-ink-700" strokeWidth={1.8} />
                  </span>
                  <p className="text-sm font-semibold text-foreground">Aucune notification</p>
                  <p className="text-[13px] text-muted-foreground">Vous êtes à jour.</p>
                </div>
              ) : (
                <ul>
                  {notifications.map((notification) => (
                    <li
                      key={notification._id}
                      className="flex gap-3 border-b border-ink-150 px-4 py-3 transition-colors last:border-0 hover:bg-ink-50"
                    >
                      <span
                        aria-hidden
                        className={`mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full ${notification.isRead ? "" : "border border-primary-strong bg-primary"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-600">
                          {NOTIFICATION_TYPE_LABELS[notification.type] || notification.type}
                        </p>
                        {notification.title && (
                          <p className="mt-0.5 text-[13.5px] font-medium text-foreground">{notification.title}</p>
                        )}
                        <p className={`mt-0.5 text-[13px] leading-[19px] ${notification.isRead ? "text-muted-foreground" : "text-ink-800"}`}>
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs tabular-nums text-ink-600">{formatNotificationDate(notification.createdAt)}</p>
                      </div>
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification._id)}
                          className="h-7 w-7 shrink-0"
                          aria-label="Marquer comme lue"
                          title="Marquer comme lue"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-border p-[5px]">
              <Button variant="ghost" size="sm" className="w-full" onClick={openAllNotifications}>
                Voir toutes les notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <span aria-hidden className="mx-1 h-6 w-px bg-border" />

        {/* User Menu */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2.5 pl-1.5 pr-2" ref={menuRef}>
              <Avatar className="h-8 w-8">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-info text-primary">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <span className="hidden flex-col items-start leading-tight sm:flex">
                <span className="text-[13.5px] font-medium text-foreground">{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">{displayRole}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-ink-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <div className="px-2.5 pb-2">
              <p className="truncate text-[13.5px] font-medium text-foreground">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {[displayRole, user.occupiedStation].filter(Boolean).join(" · ")}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4 text-ink-750" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4 text-ink-750" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive-text focus:bg-destructive-subtle focus:text-destructive-text">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
