"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { StudentClassesList } from "@/modules/classes/components/StudentClassesList";

export default function StudentClassesPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.STUDENT]}>
        <main>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              Lớp học của tôi
            </h1>
            <p className="text-muted mt-1">
              Đây là danh sách các lớp học bạn đang tham gia.
            </p>
          </div>
          <StudentClassesList />
        </main>
      </RequireRole>
    </RequireAuth>
  );
}
