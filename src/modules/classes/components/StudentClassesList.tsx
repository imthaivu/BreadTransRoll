"use client";

import { MiluLoading } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/lib/auth/context";
import { IClass } from "@/modules/admin";
import { useEffect, useState } from "react";
import { useStudentClasses } from "../hooks";
import { StudentClassCard } from "./StudentClassCard";
import { StudentClassDetailModal } from "./StudentClassDetailModal";

export function StudentClassesList() {
  const { session } = useAuth();
  const {
    data: classes,
    isLoading,
    isFetching,
    error,
  } = useStudentClasses(session?.user?.id);
  const [loading, setLoading] = useState(true);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<IClass | null>(null);

  useEffect(() => {
    // 2s delay to show loading spinner
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleOpenDetailModal = (classItem: IClass) => {
    setSelectedClass(classItem);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setSelectedClass(null);
    setIsDetailModalOpen(false);
  };

  if (isLoading || isFetching || loading) {
    return (
      <MiluLoading text="Chờ xíu nha, mình đang tìm lớp học của bạn..." />
    );
  }

  if (error) {
    return (
      <p className="text-red-500">Đã xảy ra lỗi khi tải danh sách lớp học.</p>
    );
  }

  if (!classes || classes.length === 0) {
    return <p>Bạn hiện chưa tham gia lớp học nào.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {classes.map((classItem) => (
          <StudentClassCard
            key={classItem.id}
            classItem={classItem}
            onViewDetail={() => handleOpenDetailModal(classItem)}
          />
        ))}
      </div>

      {selectedClass && (
        <StudentClassDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetailModal}
          classItem={selectedClass}
        />
      )}
    </>
  );
}
