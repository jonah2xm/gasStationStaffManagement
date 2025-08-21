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
import { Bell, Settings, LogOut, User, ChevronDown, Check } from "lucide-react"

export function AccountHeader({ name, role, avatarUrl }) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState({ username: "", role: "" })
  const menuRef = useRef(null)
  const bellRef = useRef(null)

  // 1) On mount: fetch overview (total & unread)
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/overview`, {
        credentials: "include",
      })
      const json = await res.json()
      if (json.success) setUnreadCount(json.data.unread)
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
          // router.push("/login");
          throw new Error("Not authenticated")
        }

        const data = await res.json()

        setUser(data.user) // Adjust based on backend response structure
      } catch (err) {
        console.warn("User not logged in or error:", err.message)
        setUser({ username: "", role: "" })
        router.push("/login")
      } finally {
      }
    }

    checkAuth()
  }, [router])

  // 2) Fetch detailed notifications when bell is clicked
  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/latest`, {
        credentials: "include",
      })
      const json = await res.json()
      console.log("Fetched notifications:", json)
      if (json.success) {
        
        setNotifications(json.data || [])
      }
    } catch (err) {
      console.error("Notifications fetch error:", err)
    }
  }

  // 3) Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/${notificationId}/mark-read`, {
        method: "PATCH",
        credentials: "include",
      })
      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true } : notif)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error("Mark as read error:", err)
    }
  }

  // 4) Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/mark-all-read`, {
        method: "PATCH",
        credentials: "include",
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Mark all as read error:", err)
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

  // 7) Get user initials
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // 8) Format notification date
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

  // 9) Get notification type color
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
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
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
