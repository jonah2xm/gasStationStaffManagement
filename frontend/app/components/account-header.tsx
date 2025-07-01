import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, ChevronDown, Settings, LogOut } from "lucide-react";

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string; // e.g. "2h ago"
}

interface AccountHeaderProps {
  name: string;
  role: string;
  avatarUrl?: string;
}

export function AccountHeader({ name, role, avatarUrl }: AccountHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  // Sample notifications
  const notifications: Notification[] = [
    {
      id: 1,
      title: "New message from Alice",
      description: "Hey, are you free tomorrow?",
      time: "1h ago",
    },
    {
      id: 2,
      title: "Server rebooted",
      description: "Your server was rebooted successfully.",
      time: "3h ago",
    },
    {
      id: 3,
      title: "Payment received",
      description: "$120 credited to your account.",
      time: "Yesterday",
    },
  ];

  // Close dropdowns when clicking outside
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications((v) => !v)}
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 text-[10px] font-medium text-white bg-red-600 rounded-full">
                  {notifications.length}
                </span>
              )}
            </Button>
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 shadow-lg rounded-md z-10">
                <h3 className="px-4 py-2 text-sm font-medium border-b border-gray-100">
                  Notifications
                </h3>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-800">
                          {n.title}
                        </span>
                        <span className="text-xs text-gray-400">{n.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{n.description}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      No new notifications.
                    </p>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      /* e.g. navigate to /notifications */
                      setShowNotifications(false);
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
                    console.log("Settings clicked");
                    setDropdownOpen(false);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-700">Settings</span>
                </div>
                <div
                  className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    console.log("Log out clicked");
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
