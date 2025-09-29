"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopBar from "./AdminTopBar";
import { UserRole } from "@/lib/auth/types";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.ADMIN]}>
        <div className="relative w-screen h-[calc(100vh-64px)] overflow-hidden">
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <AdminSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          <div className="fixed top-[64px] left-0 lg:left-64 right-0 bottom-0 overflow-y-auto z-10">
            <AdminTopBar setSidebarOpen={setSidebarOpen} />

            <main className="p-6 min-h-[calc(100vh-64px)] overflow-x-hidden">
              {children}
            </main>
          </div>
        </div>
      </RequireRole>
    </RequireAuth>
  );
}
