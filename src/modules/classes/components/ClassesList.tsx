"use client";

import { useAuth } from "@/lib/auth/context";
import { IClass } from "@/types";
import { useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { useTeacherClasses } from "../hooks";
import { ClassCard } from "./ClassCard";
import { TeacherUpdateClassModal } from "./TeacherUpdateClassModal";

export function TeacherClassesList() {
  const { session } = useAuth();
  const {
    data: classes,
    isLoading,
    error,
  } = useTeacherClasses(session?.user?.id || "");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<IClass | null>(null);

  const handleOpenModal = (classItem: IClass) => {
    setSelectedClass(classItem);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedClass(null);
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-4 border border-border rounded-lg shadow-sm animate-pulse"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
        <FiAlertCircle className="w-5 h-5 mr-3" />
        <p>Đã có lỗi xảy ra khi tải danh sách lớp học.</p>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return <p className="text-muted">Bạn chưa có lớp học nào.</p>;
  }

  return (
    <>
      <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {classes.map((classData) => (
          <ClassCard
            key={classData.id}
            classItem={classData}
            onUpdateClick={() => handleOpenModal(classData)}
          />
        ))}
      </div>
      {selectedClass && (
        <TeacherUpdateClassModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          classItem={selectedClass}
        />
      )}
    </>
  );
}

export function StudentClassesList() {
  const { session } = useAuth();
  const {
    data: classes,
    isLoading,
    error,
  } = useTeacherClasses(session?.user?.id || "");

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-4 border border-border rounded-lg shadow-sm animate-pulse"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mr-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
        <FiAlertCircle className="w-5 h-5 mr-3" />
        <p>Đã có lỗi xảy ra khi tải danh sách lớp học.</p>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return <p className="text-muted">Bạn chưa có lớp học nào.</p>;
  }

  return (
    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {classes.map((classData) => (
        <ClassCard key={classData.id} classItem={classData} />
      ))}
    </div>
  );
}
