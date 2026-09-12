"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Bell,
  CalendarX2,
  ChevronDown,
  Clock,
  Fuel,
  History,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Settings,
  Users,
} from "lucide-react";
import { AccountHeader } from "./components/account-header";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const SIDEBAR_COLLAPSED_KEY = "NSC.sidebar.collapsed";

const PUBLIC_PATHS = ["/", "/login", "/pointage"];

const NAV_SECTIONS = [
  {
    label: "Vue d'ensemble",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/stations", label: "Stations", icon: Fuel },
      { href: "/personnel", label: "Personnel", icon: Users },
    ],
  },
  {
    label: "Présence",
    items: [{ href: "/pointage-list", label: "Pointages", icon: Clock }],
  },
  {
    label: "Mouvements & absences",
    items: [
      { href: "/conges", label: "Congés", icon: Plane },
      { href: "/recuperations", label: "Récupérations", icon: History },
      {
        label: "Absences",
        icon: CalendarX2,
        children: [
          { href: "/absence/aa", label: "Absences AA" },
          { href: "/absence/ai", label: "Absences AI" },
        ],
      },
      {
        label: "Affectations",
        icon: ArrowLeftRight,
        children: [
          { href: "/affectation/definitif", label: "Définitives" },
          { href: "/affectation/temporaire", label: "Temporaires" },
        ],
      },
    ],
  },
  {
    label: "Administration",
    items: [{ href: "/settings", label: "Paramètres", icon: Settings }],
  },
];

const navItemBase =
  "flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-[13px] font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring";
const navItemIdle = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
// Weight changes but size does not, so the menu never jumps.
const navItemActive = "bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground";

function isActivePath(pathname, href) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ icon: Icon }) {
  return <Icon aria-hidden className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />;
}

function NavLink({ href, label, icon, active, collapsed }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(navItemBase, active ? navItemActive : navItemIdle, collapsed && "justify-center px-0")}
    >
      <NavIcon icon={icon} />
      {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
    </Link>
  );
}

function NavGroup({ item, pathname, collapsed }) {
  const hasActiveChild = item.children.some((child) => isActivePath(pathname, child.href));
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  // Collapsed: the group icon links straight to its first page.
  if (collapsed) {
    return (
      <NavLink
        href={item.children[0].href}
        label={item.label}
        icon={item.icon}
        active={hasActiveChild}
        collapsed
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          navItemBase,
          hasActiveChild ? "text-sidebar-accent-foreground hover:bg-sidebar-accent" : navItemIdle
        )}
      >
        <NavIcon icon={item.icon} />
        <span className="truncate">{item.label}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "ml-auto h-4 w-4 shrink-0 text-sidebar-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <ul className="ml-[21px] mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2.5">
          {item.children.map((child) => {
            const active = isActivePath(pathname, child.href);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(navItemBase, "h-8 px-2.5", active ? navItemActive : navItemIdle)}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  // Collapsed state survives refreshes; read it after mount so server and client markup match.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)) === true);
    } catch { }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(next));
    } catch { }
  };

  return (
    <aside
      aria-label="Barre latérale"
      className={cn(
        // nowrap + overflow-hidden keep labels on one line while the width animates
        "flex h-full shrink-0 flex-col overflow-hidden whitespace-nowrap border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border",
          collapsed ? "justify-center" : "px-4"
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card p-1">
          <Image src="/naftalLogo.png" alt="Naftal" width={28} height={28} className="object-contain" />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-semibold text-foreground">NSC Portal</p>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
              Naftal Staff Connect
            </p>
          </div>
        )}
      </div>

      <nav
        aria-label="Navigation principale"
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 [scrollbar-color:rgb(var(--sidebar-border))_transparent] [scrollbar-width:thin]"
      >
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.label}>
            {collapsed ? (
              <div aria-hidden className={cn("mx-2 h-px", index === 0 ? "my-2" : "my-3 bg-sidebar-border")} />
            ) : (
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.label}>
                  {item.children ? (
                    <NavGroup item={item} pathname={pathname} collapsed={collapsed} />
                  ) : (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={isActivePath(pathname, item.href)}
                      collapsed={collapsed}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
          title={collapsed ? "Déplier le menu" : undefined}
          className={cn(navItemBase, navItemIdle, collapsed && "justify-center px-0")}
        >
          <NavIcon icon={collapsed ? PanelLeftOpen : PanelLeftClose} />
          {!collapsed && (
            <>
              <span>Réduire le menu</span>
              <span className="ml-auto text-[11px] tabular-nums text-sidebar-muted">v2.4.0</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  return (
    <html lang="fr" className={inter.variable}>
      <body className="overflow-hidden">
        {isPublicPage ? (
          <main className="h-screen overflow-y-auto">{children}</main>
        ) : (
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <AccountHeader />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
