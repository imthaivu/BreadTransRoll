"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { TeacherClassesList } from "@/modules/classes/components/ClassesList";

export default function TeacherClassesPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.TEACHER]}>
        <main>
            <div className="text-center pt-4 mb-4 sm:pt-8 sm:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Lớp học của tôi
              </h1>
              <a className="text-2xl" href="https://imthaivu.github.io/sgkTiengAnh/" target="_blank" rel="noopener noreferrer">Sách giáo khoa <img src={"/assets/images/ebook.png"} alt="" /></a>
            </div>

          <TeacherClassesList />
        </main>
      </RequireRole>
    </RequireAuth>
  );
}
