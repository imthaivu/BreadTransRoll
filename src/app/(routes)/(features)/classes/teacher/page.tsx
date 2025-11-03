"use client";

import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { TeacherClassesList } from "@/modules/classes/components/ClassesList";
import Image from "next/image";
export default function TeacherClassesPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.TEACHER]}>
        <main>
          <div className="text-center pt-4 mb-4 sm:pt-8 sm:mb-8">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
              Lớp học của tôi
            </h1>
          </div>
          <a
            href="https://imthaivu.github.io/sgkTiengAnh/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* căn giữa */}
            <div className="flex justify-center items-center">
              <Image
                src="/assets/images/ebook.png"
                alt="Ebook"
                height={48}
                className="inline-block ml-1"
              />
            </div>
          </a>
          <TeacherClassesList />
        </main>
      </RequireRole>
    </RequireAuth>
  );
}
