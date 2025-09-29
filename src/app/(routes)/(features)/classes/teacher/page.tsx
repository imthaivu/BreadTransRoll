"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { TeacherClassesList } from "@/modules/classes/components/ClassesList";

export default function TeacherClassesPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.TEACHER]}>
        <main>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              Lớp học của tôi
            </h1>
            <p className="text-muted mt-1">
              Chọn một lớp học để xem chi tiết và quản lý học sinh.
            </p>
          </div>
          <TeacherClassesList />
        </main>
      </RequireRole>
    </RequireAuth>
  );
}
