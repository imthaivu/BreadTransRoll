"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { StudentClassesList } from "@/modules/classes/components/StudentClassesList";

export default function StudentClassesPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.STUDENT]}>
        <main>
          <div className="text-center pt-4 mb-4 sm:pt-8 sm:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Lớp học của tôi
              </h1>
            </div>
          <StudentClassesList />
        </main>
      </RequireRole>
    </RequireAuth>
  );
}
