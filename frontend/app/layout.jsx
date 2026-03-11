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
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { AccountHeader } from "./components/account-header";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

function Sidebar() {
  const pathname = usePathname();

  // collapsed: persisted in localStorage so user choice survives refresh
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("NSC.sidebar.collapsed")) ?? false;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("NSC.sidebar.collapsed", JSON.stringify(collapsed));
    } catch { }
  }, [collapsed]);

  // control which dropdowns are open (absence, affectation, ... )
  const [open, setOpen] = useState({
    absence: false,
    affectation: false,
  });

  const toggleOpen = (key) => setOpen((s) => ({ ...s, [key]: !s[key] }));

  // exact selected yellow and selected text size
  const SELECTED_BG = "#ffeb10";
  const SELECTED_COLOR = "#000"; // black for contrast

  const navItemClass = (isActive) =>
    `flex items-center gap-3 w-full p-2 rounded-md transition-colors duration-150 ${isActive ? "font-medium text-base" : "text-gray-700 hover:bg-gray-100 text-sm"
    }`;

  const navStyle = (isActive) =>
    isActive ? { backgroundColor: SELECTED_BG, color: SELECTED_COLOR } : {};

  return (
    <aside
      className={`flex flex-col h-full bg-white/80 backdrop-blur-sm border-r border-gray-100 shadow-sm
        ${collapsed ? "w-20" : "w-64"} transition-all duration-200`}
      aria-label="Sidebar"
    >
      {/* Top: Brand + collapse */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center rounded-md p-2 ${collapsed ? "w-8 h-8" : "w-10 h-10"
              } ring-1 ring-gray-100`}
          >
            <Image
              src="/naftalLogo.png"
              alt="Naftal Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <h2 className="text-lg font-semibold text-gray-800">NSC</h2>
              <p className="text-xs text-gray-500">Portal Management</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1 rounded-md hover:bg-gray-100"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronDown className="w-4 h-4 rotate-90" /> : <ChevronDown className="w-4 h-4 -rotate-90" />}
        </button>
      </div>



      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto" aria-label="Main navigation">
        <ul className="space-y-1">
          <li>
            <Link
              href="/dashboard"
              className={navItemClass(pathname === "/dashboard")}
              style={navStyle(pathname === "/dashboard")}
              title={collapsed ? "Dashboard" : undefined}
            >
              <Home className="w-5 h-5" style={pathname === "/dashboard" ? { color: SELECTED_COLOR } : undefined} />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>

          <li>
            <Link
              href="/notifications"
              className={navItemClass(pathname === "/notifications")}
              style={navStyle(pathname === "/notifications")}
              title={collapsed ? "Notifications" : undefined}
            >
              <Bell className="w-5 h-5" style={pathname === "/notifications" ? { color: SELECTED_COLOR } : undefined} />
              {!collapsed && <span>Notifications</span>}
            </Link>
          </li>

          <li>
            <Link
              href="/stations"
              className={navItemClass(pathname.startsWith("/stations"))}
              style={navStyle(pathname.startsWith("/stations"))}
              title={collapsed ? "Stations" : undefined}
            >
              <FuelIcon
                className="w-5 h-5"
                style={pathname.startsWith("/stations") ? { color: SELECTED_COLOR } : undefined}
              />
              {!collapsed && (
                <>
                  <span>Stations</span>
                </>
              )}
            </Link>
          </li>

          <li>
            <Link
              href="/personnel"
              className={navItemClass(pathname.startsWith("/personnel"))}
              style={navStyle(pathname.startsWith("/personnel"))}
              title={collapsed ? "Personnel" : undefined}
            >
              <Users className="w-5 h-5" style={pathname.startsWith("/personnel") ? { color: SELECTED_COLOR } : undefined} />
              {!collapsed && <span>Personnel</span>}
            </Link>
          </li>

          <li>
            <Link
              href="/pointage-list"
              className={navItemClass(pathname.startsWith("/pointage-list"))}
              style={navStyle(pathname.startsWith("/pointage-list"))}
              title={collapsed ? "Pointages" : undefined}
            >
              <Clock className="w-5 h-5" style={pathname.startsWith("/pointage-list") ? { color: SELECTED_COLOR } : undefined} />
              {!collapsed && <span>Pointages</span>}
            </Link>
          </li>

          <li>
            <Link
              href="/conges"
              className={navItemClass(pathname.startsWith("/conges"))}
              style={navStyle(pathname.startsWith("/conges"))}
              title={collapsed ? "Conges" : undefined}
            >
              <Plane className="w-5 h-5" style={pathname.startsWith("/conges") ? { color: SELECTED_COLOR } : undefined} />
              {!collapsed && <span>Congés</span>}
            </Link>
          </li>

          <li>
            <Link
              href="/recuperations"
              className={navItemClass(pathname.startsWith("/recuperations"))}
              style={navStyle(pathname.startsWith("/recuperations"))}
              title={collapsed ? "Recuperations" : undefined}
            >
              <Bed className="w-5 h-5" style={pathname.startsWith("/recuperations") ? { color: SELECTED_COLOR } : undefined} />
              {!collapsed && <span>Récupérations</span>}
            </Link>
          </li>

          {/* Absence: collapsible submenu */}
          <li>
            <button
              onClick={() => toggleOpen("absence")}
              aria-expanded={open.absence}
              className={`flex items-center justify-between w-full p-2 rounded-md transition-colors duration-150 ${pathname.startsWith("/absence") ? "font-medium" : "text-gray-700 hover:bg-gray-100 text-sm"
                }`}
              style={pathname.startsWith("/absence") ? { backgroundColor: SELECTED_BG, color: SELECTED_COLOR } : undefined}
              title={collapsed ? "Absence" : undefined}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={pathname.startsWith("/absence") ? { color: SELECTED_COLOR } : undefined} />
                {!collapsed && <span>Absence</span>}
              </div>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${open.absence ? "rotate-180" : ""}`} />
            </button>

            {/* submenu */}
            <div
              className={`overflow-hidden transition-[max-height] duration-200 ${open.absence ? "max-h-40 mt-1" : "max-h-0"}`}
            >
              <ul className="pl-10 space-y-1">
                <li>
                  <Link
                    href="/absence/aa"
                    className="block p-2 rounded-md text-sm"
                    style={pathname.startsWith("/absence/aa") ? { backgroundColor: SELECTED_BG, color: SELECTED_COLOR, fontWeight: 600, fontSize: "1rem" } : undefined}
                    title={collapsed ? "Absence AA" : undefined}
                  >
                    {!collapsed ? "Absence AA" : <span className="sr-only">Absence AA</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/absence/ai"
                    className="block p-2 rounded-md text-sm"
                    style={pathname.startsWith("/absence/ai") ? { backgroundColor: SELECTED_BG, color: SELECTED_COLOR, fontWeight: 600, fontSize: "1rem" } : undefined}
                    title={collapsed ? "Absence AI" : undefined}
                  >
                    {!collapsed ? "Absence AI" : <span className="sr-only">Absence AI</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          {/* Affectation */}
          <li>
            <button
              onClick={() => toggleOpen("affectation")}
              aria-expanded={open.affectation}
              className={`flex items-center justify-between w-full p-2 rounded-md transition-colors duration-150 ${pathname.startsWith("/affectation") ? "font-medium" : "text-gray-700 hover:bg-gray-100 text-sm"
                }`}
              style={pathname.startsWith("/affectation") ? { backgroundColor: SELECTED_BG, color: SELECTED_COLOR } : undefined}
              title={collapsed ? "Affectation" : undefined}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" style={pathname.startsWith("/affectation") ? { color: SELECTED_COLOR } : undefined} />
                {!collapsed && <span>Affectation</span>}
              </div>
              <ChevronDown className={`w-4 h-4 transform transition-transform ${open.affectation ? "rotate-180" : ""}`} />
            </button>

            <div className={`overflow-hidden transition-[max-height] duration-200 ${open.affectation ? "max-h-32 mt-1" : "max-h-0"}`}>
              <ul className="pl-10 space-y-1">
                <li>
                  <Link
                    href="/affectation/definitif"
                    className="block p-2 rounded-md text-sm"
                    style={pathname.startsWith("/affectation/definitif") ? { backgroundColor: SELECTED_BG, color: SELECTED_COLOR, fontWeight: 600, fontSize: "1rem" } : undefined}
                    title={collapsed ? "Définitif" : undefined}
                  >
                    {!collapsed ? "Définitif" : <span className="sr-only">Définitif</span>}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/affectation/temporaire"
                    className="block p-2 rounded-md text-sm"
                    style={pathname.startsWith("/affectation/temporaire") ? { backgroundColor: SELECTED_BG, color: SELECTED_COLOR, fontWeight: 600, fontSize: "1rem" } : undefined}
                    title={collapsed ? "Temporaire" : undefined}
                  >
                    {!collapsed ? "Temporaire" : <span className="sr-only">Temporaire</span>}
                  </Link>
                </li>
              </ul>
            </div>
          </li>

          {/* Settings */}
          <li>
            <Link
              href="/settings"
              className={navItemClass(pathname === "/settings")}
              style={navStyle(pathname === "/settings")}
              title={collapsed ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5" style={pathname === "/settings" ? { color: SELECTED_COLOR } : undefined} />
              {!collapsed && <span>Paramétres</span>}
            </Link>
          </li>
        </ul>
      </nav>

    </aside>
  );
}



export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isPointagePage = pathname === "/pointage";
  const isLandingPage = pathname === "/";
  const isPublicPage = isLoginPage || isPointagePage || isLandingPage;

  return (
    <html lang="en">
      <body className={" overflow-y-hidden"}>
        <div
          className={`flex h-screen bg-gray-100 ${isPublicPage ? "" : "flex"}`}
        >
          {!isPublicPage && <Sidebar />}

          <main
            className={`${isPublicPage ? "w-full" : "flex-1"
              } overflow-y-auto bg-gray-50`}
          >
            {!isPublicPage && <div className="container mx-auto p-6 text-gray-800"> <AccountHeader /> </div>}
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
