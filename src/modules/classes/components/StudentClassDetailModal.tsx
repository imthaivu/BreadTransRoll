"use client";

import { AdminModal } from "@/modules/admin";
import { IClass } from "@/modules/admin";
import { useClassMembers } from "../hooks";
import { IClassMember } from "@/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface StudentClassDetailModalProps {
  classItem: IClass;
  isOpen: boolean;
  onClose: () => void;
}

function ClassMemberList({ classId }: { classId: string }) {
  const { data: members = [], isLoading, isError } = useClassMembers(classId);

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
      {members.map((member: IClassMember) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {member.name}
            </div>
            <div className="text-sm text-gray-600">
              {member.phone || "-"}
            </div>
          </div>
        </div>
      ))}
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
