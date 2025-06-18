"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  RefreshCw,
  FileText,
  Settings,
  FuelIcon,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">PMS</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/mutations"
                className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <RefreshCw className="mr-3 h-5 w-5" />
                Mutations
              </Link>
            </li>
            <li>
              <Link
                href="/stations"
                className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <FuelIcon className="mr-3 h-5 w-5" />
                Stations
              </Link>
            </li>
            <li>
              <Link
                href="/personnel"
                className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <Users className="mr-3 h-5 w-5" />
                Personnel
              </Link>
            </li>
            <li>
              <Link
                href="/reports"
                className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
              >
                <FileText className="mr-3 h-5 w-5" />
                Reports
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="absolute bottom-0 w-full p-4">
        <Link
          href="/settings"
          className="flex items-center p-2 text-gray-700 hover:bg-gray-100 rounded transition-colors duration-200"
        >
          <Settings className="mr-3 h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

export default function Layout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto ">{children}</main>
    </div>
  );
}
