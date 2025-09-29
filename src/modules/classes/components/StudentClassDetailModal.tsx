"use client";

import { AdminModal } from "@/modules/admin";
import { IClass } from "@/modules/admin";
import { FiCalendar, FiLink, FiUsers } from "react-icons/fi";
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

  return (
    <div className="space-y-3">
      {members.map((member: IClassMember) => (
        <div
          key={member.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
        >
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {(member.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {member.name}
            </div>
            <div
              className={`text-xs font-semibold ${
                member.role === "teacher" ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {member.role === "teacher" ? "Giáo viên" : "Học sinh"}
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
  const [activeTab, setActiveTab] = useState<"info" | "members">("info");
  const { data: members = [] } = useClassMembers(classItem.id);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thông tin lớp: ${classItem.name}`}
      size="lg"
    >
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("info")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "info"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Thông tin
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "members"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Thành viên ({members.length})
        </button>
      </div>

      {activeTab === "info" && (
        <div className="space-y-4 p-2">
          {/* Header overview */}
          <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-3">
            <h3 className="text-xl font-bold text-gray-900 truncate">
              {classItem.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span
                className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                  classItem.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {classItem.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
              </span>
            </div>

            {/* Teacher chip */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {(classItem.teacher?.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {classItem.teacher?.name || "(Chưa có giáo viên)"}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  Giáo viên phụ trách
                </div>
              </div>
            </div>
          </div>

          {/* Read-only details */}
          <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white">
            <h4 className="text-base font-semibold">Chi tiết lớp học</h4>
            <div className="text-sm space-y-3">
              <div className="flex items-center gap-2">
                <FiUsers className="text-gray-500 flex-shrink-0" />
                <span className="font-medium">Sĩ số:</span>
                <span className="text-gray-700">
                  {members.filter((m) => m.role === "student").length} học sinh
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiLink className="text-gray-500 flex-shrink-0" />
                <span className="font-medium">Zalo:</span>
                {classItem.links?.zalo ? (
                  <a
                    href={classItem.links.zalo}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {classItem.links.zalo}
                  </a>
                ) : (
                  <span className="text-gray-500">(chưa có)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FiLink className="text-gray-500 flex-shrink-0" />
                <span className="font-medium">Meet:</span>
                {classItem.links?.meet ? (
                  <a
                    href={classItem.links.meet}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {classItem.links.meet}
                  </a>
                ) : (
                  <span className="text-gray-500">(chưa có)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-500 flex-shrink-0" />
                <span className="font-medium">Ngày tạo:</span>
                <span className="text-gray-700">
                  {classItem.createdAt?.toLocaleDateString?.("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <div className="p-2">
          <ClassMemberList classId={classItem.id} />
        </div>
      )}
    </AdminModal>
  );
}
