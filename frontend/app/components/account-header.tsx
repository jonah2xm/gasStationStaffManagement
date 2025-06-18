import React, { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, ChevronDown, Settings, LogOut } from "lucide-react";

interface AccountHeaderProps {
  name: string;
  role: string;
  avatarUrl?: string;
}

export function AccountHeader({ name, role, avatarUrl }: AccountHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown if click occurs outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Card className="mb-6 text-gray-800">
      <CardContent className="flex items-center justify-between p-4">
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
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          {/* Wrap the Account button and dropdown in a relative container */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="outline"
              className="text-gray-300 flex items-center"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              Account <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-md z-10">
                <div
                  className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    console.log("Settings clicked");
                    // Add your settings navigation logic here
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
                    // Add your logout logic here (e.g., clear token and redirect)
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
