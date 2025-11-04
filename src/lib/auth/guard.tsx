"use client";

import { Button } from "@/components/ui/Button";
import { MiluLoading } from "@/components/ui/LoadingSpinner";
import MagicDoor from "@/modules/home/components/MagicDoor";
import { ShieldAlert, UserCircle } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "./context";
import type { UserRole } from "./types";
import { translateRole } from "./utils";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const [showMagicDoor, setShowMagicDoor] = useState(false);

  if (loading)
    return (
      <div className="p-6">
        <MiluLoading />
      </div>
    );

  if (!session?.user) {
    return (
      <>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
          <UserCircle className="w-16 h-16 text-slate-400 mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">
            Yêu cầu đăng nhập
          </h1>
          <p className="mt-2 text-slate-600 max-w-sm">
            Vui lòng đăng nhập để có thể truy cập vào trang này và sử dụng các
            tính năng của hệ thống.
          </p>
          <div className="mt-6">
            <Button onClick={() => setShowMagicDoor(true)}>
              Mở Cánh Cửa Thần Kỳ
            </Button>
          </div>
        </div>

        <MagicDoor
          isOpen={showMagicDoor}
          onClose={() => setShowMagicDoor(false)}
          onLogin={() => setShowMagicDoor(false)}
        />
      </>
    );
  }
  return <>{children}</>;
}

export function RequireRole({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="p-6">Loading...</div>;

  const userRole = profile?.role;

  if (!userRole || !roles.includes(userRole)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800">
          Vai trò không phù hợp
        </h1>
        <p className="mt-2 text-slate-600 max-w-sm">
          Trang này yêu cầu vai trò{" "}
          <span className="font-semibold text-slate-900">
            {roles.map(translateRole).join(" hoặc ")}
          </span>
          , nhưng bạn đang đăng nhập với vai trò{" "}
          <span className="font-semibold text-slate-900">
            {translateRole(userRole)}
          </span>
          .
        </p>
        <div className="mt-6 flex gap-4">
          <Link href="/dashboard">
            <Button variant="secondary">Về Dashboard</Button>
          </Link>
          <Link href="/">
            <Button>Về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
