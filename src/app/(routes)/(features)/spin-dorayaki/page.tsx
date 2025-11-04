"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { SpinningWheel } from "@/modules/spin-dorayaki/components/SpinningWheel";

export default function SpinDorayakiPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.STUDENT]}>
        <div className="text-center">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Vòng quay bánh mì
              </h1>
            </div>
        <SpinningWheel />
      </RequireRole>
    </RequireAuth>
  );
}
