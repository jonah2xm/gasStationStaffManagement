import React, { useState, useRef, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, ChevronDown, Settings, LogOut } from "lucide-react";

interface ApiNotification {
  _id: string;
  message: string;
  detailsUrl: string;
  createdAt: string;
  seen: boolean;
}

interface AccountHeaderProps {
  name: string;
  role: string;
  avatarUrl?: string;
}

export function AccountHeader({ name, role, avatarUrl }: AccountHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // 1) On mount: fetch overview (total & unread)
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/overview`,
        { credentials: "include" }
      );
      const json = await res.json();
      if (json.success) setUnreadCount(json.data.unread);
    } catch (err) {
      console.error("Overview fetch error:", err);
    }
  }, []);
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // 2) Handler: on bell click, fetch latest 3 & mark read
  const handleBellClick = useCallback(async () => {
    setShowNotifications((v) => !v);

    // only fetch if opening
    if (!showNotifications) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/notifications/latest`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (json.success) {
          setNotifications(json.data);
          const newlyRead = json.data.filter((n) => !n.seen).length;
          setUnreadCount((prev) => Math.max(prev - newlyRead, 0));
        }
      } catch (err) {
        console.error("Latest fetch error:", err);
      }

      await fetchOverview();
    }
  }, [showNotifications, fetchOverview]);

  // 3) Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Card className="mb-6 text-gray-800">
      <CardContent className="flex items-center justify-between p-4">
        {/* Left: avatar + name */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>

        {/* Right: bell + account menu */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <div className="relative" ref={bellRef}>
            <Button variant="ghost" size="icon" onClick={handleBellClick}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 text-[10px] font-medium text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg rounded-md z-10">
                <h3 className="px-4 py-2 text-sm font-medium border-b border-gray-100">
                  Notifications
                </h3>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <a
                        key={n._id}
                        href={n.detailsUrl}
                        className="block px-4 py-3 hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </a>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No new notifications.
                    </p>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      setShowNotifications(false);
                      // navigate to full notifications page if desired
                      // e.g. router.push("/notifications");
                    }}
                  >
                    View all
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Account menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="outline"
              className="text-gray-300 flex items-center"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              Account <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-10">
                <div
                  className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    /* e.g. navigate to Settings */
                    setDropdownOpen(false);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-700">Settings</span>
                </div>
                <div
                  className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    /* e.g. perform logout */
                    setDropdownOpen(false);
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-700">Log Out</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
