"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { TeacherClassesList } from "@/modules/classes/components/ClassesList";
export default function TeacherClassesPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.TEACHER]}>
        <main>
          <div className="text-center">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
              Lớp học của tôi
            </h1>
          </div>
          <TeacherClassesList />
        </main>
      </RequireRole>
    </RequireAuth>
  );
}
