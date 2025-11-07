"use client";

import { AdminModal } from "@/modules/admin";
import { IClass } from "@/modules/admin";
import { useState } from "react";
import { useClassMembers } from "../hooks";
import { IClassMember } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Image from "next/image";

interface StudentClassDetailModalProps {
  classItem: IClass;
  isOpen: boolean;
  onClose: () => void;
}

function ClassMemberList({ classId }: { classId: string }) {
  const { data: members = [], isLoading, isError } = useClassMembers(classId);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500">
        Không thể tải danh sách thành viên.
      </p>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        Lớp học chưa có thành viên nào.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member: IClassMember) => {
        const avatarUrl = member.avatarUrl;
        const hasAvatar = avatarUrl && 
                         avatarUrl.trim() !== "" && 
                         !imageErrors[member.id];
        
        return (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {hasAvatar && avatarUrl ? (
              <div className="relative h-12 w-12 flex-shrink-0">
                <Image
                  src={avatarUrl}
                  alt={member.name}
                  fill
                  className="rounded-full object-cover"
                  unoptimized
                  onError={() => setImageErrors(prev => ({ ...prev, [member.id]: true }))}
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base font-semibold flex-shrink-0">
                {(member.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-base font-medium text-gray-900 truncate">
                {member.name}
              </div>
              <div
                className={`text-xs font-medium ${
                  member.role === "teacher" ? "text-blue-600" : "text-gray-500"
                }`}
              >
                {member.role === "teacher" ? "Giáo viên" : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StudentClassDetailModal({
  classItem,
  isOpen,
  onClose,
}: StudentClassDetailModalProps) {
  const { data: members = [] } = useClassMembers(classItem.id);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thành viên lớp`}
      size="lg"
    >
      <div className="p-2">
        <ClassMemberList classId={classItem.id} />
      </div>
    </AdminModal>
  );
}
