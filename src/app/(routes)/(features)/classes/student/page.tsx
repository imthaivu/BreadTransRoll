"use client";

import { StudentClassesList } from "@/modules/classes/components/StudentClassesList";

export default function StudentClassesPage() {

  return (
    <main>
      <div className="text-center">
        <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
          Lớp học của tôi
        </h1>
      </div>
          
      
      <StudentClassesList />
    </main>
  );
}
