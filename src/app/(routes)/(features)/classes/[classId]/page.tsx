"use client";

import { useAuth } from "@/lib/auth/context";
import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { ClassDetail } from "@/modules/classes/components/ClassDetail";
import { useClassMembers } from "@/modules/classes/hooks";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.classId as string;
  const { data: members } = useClassMembers(classId);
  const { session } = useAuth();

  if (
    session?.user.role !== "teacher" &&
    !members?.some((member) => member.id === session?.user.id)
  ) {
    return (
      <main>
        <h1>Bạn không có quyền truy cập trang này</h1>
      </main>
    );
  }

  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.TEACHER]}>
        <main>
          <div className="mb-6">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <FiArrowLeft />
              <span>Quay lại danh sách lớp</span>
            </Link>
          </div>
          {classId && <ClassDetail classId={classId} />}
        </main>
      </RequireRole>
    </RequireAuth>
  );
}
