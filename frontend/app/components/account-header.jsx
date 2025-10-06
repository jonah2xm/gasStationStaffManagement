"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Settings, LogOut, User, ChevronDown, Check, Building, MapPin } from "lucide-react"
import { getSocket } from "@/utils/socket";


export function AccountHeader({ name, role, avatarUrl, district, structure }) {
  const router = useRouter()
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
          console.log('data',data)
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
          fetchOverview().catch(() => {});
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
        fetchOverview().catch(() => {});
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
        fetchOverview().catch(() => {});
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
      await fetchOverview().catch(()=>{})
      await fetchNotifications().catch(()=>{})
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
      await fetchOverview().catch(()=>{})
      await fetchNotifications().catch(()=>{})
    }
  }

  // 5) Handle logout
  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, {
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

  // small helpers
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))

    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `Il y a ${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Il y a ${diffInDays}j`

    return date.toLocaleDateString("fr-FR")
  }

  const getNotificationTypeColor = (type) => {
    const colors = {
      info: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      success: "bg-green-100 text-green-800",
    }
    return colors[type] || colors.info
  }

  const displayName = name || user.username || "Utilisateur"
  const displayRole = role || user.role || "Invité"
  const displayDistrict = district || user.district || ""
  const displayStructure = structure || user.structure || ""

  return (
    <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b border-gray-200 mb-6 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName} />
            <AvatarFallback className="bg-blue-500 text-white font-semibold">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{displayName}</h2>
            <p className="text-sm text-gray-600">{displayRole}</p>
            {(displayDistrict || displayStructure) && (
              <div className="flex items-center space-x-3 mt-1">
                {displayDistrict && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{displayDistrict}</span>
                  </div>
                )}
                {displayStructure && (
                  <div className="flex items-center space-x-1">
                    <Building className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">{displayStructure}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Popover open={showNotifications} onOpenChange={setShowNotifications}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative" onClick={handleNotificationClick} ref={bellRef}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-blue-600 hover:text-blue-800">
                  Tout marquer comme lu
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getNotificationTypeColor(notification.type)}>{notification.type}</Badge>
                            {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                          </div>
                          <p className="text-sm font-medium text-gray-800 mb-1">{notification.title}</p>
                          <p className="text-xs text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{formatNotificationDate(notification.createdAt)}</p>
                        </div>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification._id)}
                            className="ml-2 p-1 h-auto"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2" ref={menuRef}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={displayName} />
                <AvatarFallback className="bg-blue-500 text-white text-sm">{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem  onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}