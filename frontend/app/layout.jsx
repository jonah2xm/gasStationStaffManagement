"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Bell,
  Settings,
  FuelIcon,
  Calendar,
  ChevronDown,
  Plane,
  Bed,
} from "lucide-react";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

function Sidebar() {
  const pathname = usePathname();
  // State for controlling dropdown menus
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [affectationOpen, setAffectationOpen] = useState(false);
  const [aiSubmenuOpen, setAiSubmenuOpen] = useState(false);

  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">PMS</h2>
        <nav>
          <ul className="space-y-2">
            {/* Dashboard */}
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname === "/dashboard" ? "bg-gray-100 font-medium" : ""
                }`}
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            {/*Notifications */}
            <li>
              <Link
                href="/notifications"
                className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname === "/notifications" ? "bg-gray-100 font-medium" : ""
                }`}
              >
                <Bell className="mr-3 h-5 w-5" />
                Notifications
              </Link>
            </li>
            {/* Stations */}
            <li>
              <Link
                href="/stations"
                className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname.startsWith("/stations")
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                <FuelIcon className="mr-3 h-5 w-5" />
                Stations
              </Link>
            </li>
            {/* Personnel */}
            <li>
              <Link
                href="/personnel"
                className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname.startsWith("/personnel")
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                <Users className="mr-3 h-5 w-5" />
                Personnel
              </Link>
            </li>
            {/* Conge Dropdown */}
            <li>
              <Link
                href="/conges"
                className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname.startsWith("/conges")
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                <Plane className="mr-3 h-5 w-5" />
                Conges
              </Link>
            </li>

            {/* Recuperation Dropdown */}
            <li>
              <Link
                href="/recuperations"
                className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname.startsWith("/recuperations")
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                <Bed className="mr-3 h-5 w-5" />
                Recuperations
              </Link>
            </li>

            {/* Absence Dropdown */}
            <li className="relative">
              <button
                onClick={() => setAbsenceOpen(!absenceOpen)}
                className={`flex items-center justify-between w-full p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname.startsWith("/absence")
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="mr-3 h-5 w-5" />
                  Absence
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    absenceOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {absenceOpen && (
                <ul className="pl-6 mt-1 space-y-1">
                  {/* Absence AA */}
                  <li>
                    <Link
                      href="/absence/aa"
                      className={`block p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                        pathname === "/absence/aa" ||
                        pathname === "/absence/aa/add" ||
                        pathname === "/absence/aa/edit"
                          ? "bg-gray-100 font-medium"
                          : ""
                      }`}
                    >
                      Absence AA
                    </Link>
                  </li>
                  {/* Absence AI with Nested Submenu */}
                  <li className="relative">
                    <Link
                      href="/absence/ai"
                      className={`block p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                        pathname === "/absence/ai" ||
                        pathname === "/absence/ai/add" ||
                        pathname === "/absence/ai/edit"
                          ? "bg-gray-100 font-medium"
                          : ""
                      }`}
                    >
                      Absence AI
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            {/*Affectation*/}
            <li>
              <button
                onClick={() => setAffectationOpen(!affectationOpen)}
                className={`flex items-center justify-between w-full p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname.startsWith("/affectation")
                    ? "bg-gray-100 font-medium"
                    : ""
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="mr-3 h-5 w-5" />
                  Affectation
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    affectationOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {affectationOpen && (
                <ul className="pl-6 mt-1 space-y-1">
                  {/* Absence AA */}
                  <li>
                    <Link
                      href="/affectation/definitif"
                      className={`block p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                        pathname === "/affectation/definitif" ||
                        pathname === "/affectation/definitif" ||
                        pathname === "/affectation/definitif"
                          ? "bg-gray-100 font-medium"
                          : ""
                      }`}
                    >
                      Definitif
                    </Link>
                  </li>
                  <Link
                    href="/affectation/temporaire"
                    className={`block p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                      pathname === "/affectation/temporaire" ||
                      pathname === "/affectation/temporaire" ||
                      pathname === "/affectation/temporaire"
                        ? "bg-gray-100 font-medium"
                        : ""
                    }`}
                  >
                    Temporaire
                  </Link>
                </ul>
              )}
            </li>

            {/* Settings */}
            <li>
              <Link
                href="/settings"
                className={`flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200 ${
                  pathname === "/settings" ? "bg-gray-100 font-medium" : ""
                }`}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <html lang="en">
      <body className={" overflow-y-hidden"}>
        <div
          className={`flex h-screen bg-gray-100 ${isLoginPage ? "" : "flex"}`}
        >
          {!isLoginPage && <Sidebar />}
          <main
            className={`${
              isLoginPage ? "w-full" : "flex-1"
            } overflow-y-auto bg-gray-50`}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
