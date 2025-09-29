"use client";

import { Button } from "@/components/ui/Button";
import { IProfile } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { FiCalendar, FiUser, FiUsers } from "react-icons/fi";

export interface AdminUserDetailProps {
  user: IProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminUserDetail({
  user,
  isOpen,
  onClose,
}: AdminUserDetailProps) {
  if (!isOpen) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "teacher":
        return "Giáo viên";
      case "student":
        return "Học sinh";
      default:
        return role;
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FiUser className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user.displayName || "Chưa có tên"}
              </h2>
              <p className="text-sm md:text-base text-gray-600">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                Thông tin cơ bản
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm md:text-base font-medium text-gray-600">
                    ID:
                  </span>
                  <span className="text-sm md:text-base text-gray-900 font-mono">
                    {user.id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm md:text-base font-medium text-gray-600">
                    Tên hiển thị:
                  </span>
                  <span className="text-sm md:text-base text-gray-900">
                    {user.displayName || "Chưa có tên"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm md:text-base font-medium text-gray-600">
                    Email:
                  </span>
                  <span className="text-sm md:text-base text-gray-900">
                    {user.email}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm md:text-base font-medium text-gray-600">
                    Vai trò:
                  </span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FiCalendar className="w-5 h-5" />
                Thông tin bổ sung
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm md:text-base font-medium text-gray-600">
                    Ngày tạo:
                  </span>
                  <span className="text-sm md:text-base text-gray-900">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Avatar */}
          {user.avatarUrl && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-3">
                <FiUsers className="w-5 h-5" />
                Avatar
              </h3>
              <div className="flex items-center gap-4">
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName || "User Avatar"}
                  className="rounded-full object-cover"
                  width={80}
                  height={80}
                />
                <div>
                  <p className="text-sm md:text-base text-gray-600">
                    Ảnh đại diện
                  </p>
                  <a
                    href={user.avatarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm md:text-base text-blue-600 hover:text-blue-800"
                  >
                    Xem ảnh gốc
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
