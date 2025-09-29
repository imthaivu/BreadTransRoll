"use client";

import { cn } from "@/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiDollarSign,
  FiLayers,
  FiSettings,
  FiShield,
  FiUserPlus,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { SIDEBAR_ITEMS } from "../constants/sidebar";

const ICON_MAP = {
  dashboard: FiSettings,
  users: FiUsers,
  classes: FiLayers,
  teachers: FiUserPlus,
  students: FiShield,
  currency: FiDollarSign,
} as const;

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  className?: string;
}

export default function AdminSidebar({
  sidebarOpen,
  setSidebarOpen,
  className = "",
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed top-[64px] lg:h-[calc(100vh-64px)] inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0 lg:static lg:inset-0 h-screen",
        className
      )}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          {SIDEBAR_ITEMS.map((item) => {
            const IconComponent = ICON_MAP[item.id as keyof typeof ICON_MAP];
            const isActive = pathname === item.href;

            return (
              <Link
                className={cn(
                  "flex items-center px-3 py-2 text-sm md:text-base font-medium rounded-lg transition-colors mb-1",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                )}
                key={item.id}
                href={item.href}
              >
                <span className="mr-3">
                  <IconComponent
                    className={cn(
                      "w-4 h-4",
                      isActive ? "text-blue-700" : "text-gray-500"
                    )}
                  />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
