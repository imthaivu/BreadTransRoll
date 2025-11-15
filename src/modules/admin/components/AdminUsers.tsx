"use client";

import { Button } from "@/components/ui/Button";
import { IProfile } from "@/types";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FiTrash2, FiUsers } from "react-icons/fi";
import {
  AdminModal,
  AdminTable,
  AdminTableColumn,
} from "./common";
import { useUserManagement } from "../hooks/useUserManagement";
import { UserRole } from "@/lib/auth/types";
import toast from "react-hot-toast";

type UserWithOptionalPhone = IProfile & { phone?: string };

export default function AdminUsers() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IProfile | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">(UserRole.GUEST);

  // Use the user management hook
  const {
    users,
    isLoading,
    error,
    updateUser,
    deleteUser,
    isUpdating,
    isDeleting,
  } = useUserManagement();

  // Apply filters
  const filteredUsers = useMemo(() => {
    const normalize = (v?: string) => (v || "").toLowerCase();
    const searchLower = normalize(searchFilter);

    return users.filter((user) => {
      // Search filter - matches name, email, or phone
      const searchMatch =
        !searchFilter ||
        normalize(user.displayName).includes(searchLower) ||
        normalize(user.email).includes(searchLower) ||
        (user as UserWithOptionalPhone).phone?.includes(searchFilter);

      // Role filter
      const roleMatch = roleFilter === "all" || user.role === roleFilter;

      return searchMatch && roleMatch;
    });
  }, [users, searchFilter, roleFilter]);


  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const openDeleteModal = (user: IProfile) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setIsDeleteModalOpen(false);
  };

  // Table columns configuration
  const columns: AdminTableColumn<IProfile>[] = [
    {
      key: "user",
      title: "Người dùng",
      render: (_, user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full  bg-primary/10 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm md:text-base font-medium text-gray-900">
              {user.displayName || "Chưa có tên"}
            </div>
            <div className="text-sm md:text-base text-gray-500">
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      title: "Vai trò",
      render: (_, user) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.role === "admin"
              ? "bg-red-100 text-red-800"
              : user.role === "teacher"
              ? " bg-primary/10 text-primary"
              : "bg-green-100 text-green-800"
          }`}
        >
          {user.role === "admin"
            ? "Admin"
            : user.role === "teacher"
            ? "Giáo viên"
            : user.role === "student"
            ? "Học sinh"
            : "Vãng lai"}
        </span>
      ),
    },
    {
      key: "phone",
      title: "Số điện thoại",
      render: (_, user) => (
        <span className="text-sm md:text-base text-gray-900">
          {(user as UserWithOptionalPhone).phone || "Chưa có"}
        </span>
      ),
    },
    {
      key: "createdAt",
      title: "Ngày tham gia",
      render: (_, user) => (
        <span className="text-sm md:text-base text-gray-500">
          {user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("vi-VN")
            : "Không rõ"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, user) => (
        <div className="flex items-center gap-2">
          <select
            value={user.role}
            onChange={async (e) => {
              const newRole = e.target.value as UserRole;
              try {
                await updateUser(user.id, {
                  displayName: user.displayName || "",
                  email: user.email || "",
                  role: newRole,
                  phone: (user as UserWithOptionalPhone).phone,
                });
                toast.success(`Đã chuyển ${user.displayName || user.email} sang ${newRole === "admin" ? "Admin" : newRole === "teacher" ? "Giáo viên" : newRole === "student" ? "Học sinh" : "Vãng lai"}`);
              } catch (error) {
                console.error("Error updating user role:", error);
                toast.error("Chuyển vai trò thất bại. Vui lòng thử lại.");
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="admin">Admin</option>
            <option value="teacher">Giáo viên</option>
            <option value="student">Học sinh</option>
            <option value="guest">Vãng lai</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(user);
            }}
          >
            <FiTrash2 className="w-3 h-3" />
            Xóa
          </Button>
        </div>
      ),
    },
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Quản lý người dùng
          </h1>
          
        </div>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          type="text"
          placeholder="Tìm theo tên, email hoặc số điện thoại..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="teacher">Giáo viên</option>
          <option value="student">Học sinh</option>
          <option value="guest">Vãng lai</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm md:text-base font-medium text-red-800">
                Có lỗi xảy ra khi tải dữ liệu
              </h3>
              <div className="mt-2 text-sm md:text-base text-red-700">
                <p>{error.message || "Vui lòng thử lại sau"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <AdminTable
        columns={columns}
        data={filteredUsers}
        loading={isLoading}
        emptyMessage="Không có người dùng nào"
        showCheckbox={false}
      />

      {/* Delete Confirmation Modal */}
      {selectedUser && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Xác nhận xóa người dùng"
          subtitle={`Bạn có chắc chắn muốn xóa người dùng "${selectedUser.displayName}" không? Hành động này không thể hoàn tác.`}
          size="sm"
        >
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeDeleteModal}>
              Hủy
            </Button>
            <Button
              variant="outline"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
