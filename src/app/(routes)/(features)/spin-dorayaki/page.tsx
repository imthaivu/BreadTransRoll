"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { SpinningWheel } from "@/modules/spin-dorayaki/components/SpinningWheel";

export default function SpinDorayakiPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.STUDENT]}>
        <SpinningWheel />
      </RequireRole>
    </RequireAuth>
  );
}
