"use client";

import { Button } from "@/components/ui/Button";
import { IProfile } from "@/types";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FiEdit, FiEye, FiTrash2, FiUsers } from "react-icons/fi";
import {
  AdminForm,
  AdminFormField,
  AdminModal,
  AdminTable,
  AdminTableColumn,
} from "./common";
import { useUserManagement } from "../hooks/useUserManagement";
import { UserRole } from "@/lib/auth/types";

type UserWithOptionalPhone = IProfile & { phone?: string };

export default function AdminUsers() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IProfile | null>(null);
  const [isDetailEditOpen, setIsDetailEditOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<IProfile | null>(null);

  // Filters
  const [userFilter, setUserFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">(
    UserRole.GUEST
  );

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
    return users.filter((user) => {
      const userMatch =
        !userFilter ||
        user.displayName?.toLowerCase().includes(userFilter.toLowerCase()) ||
        user.email?.toLowerCase().includes(userFilter.toLowerCase());

      const phoneMatch =
        !phoneFilter ||
        (user as UserWithOptionalPhone).phone?.includes(phoneFilter);

      const roleMatch = roleFilter === "all" || user.role === roleFilter;

      return userMatch && phoneMatch && roleMatch;
    });
  }, [users, userFilter, phoneFilter, roleFilter]);

  const handleUpdateUser = async (userData: {
    displayName: string;
    email: string;
    role: UserRole;
    phone?: string;
  }) => {
    if (!(activeUser || selectedUser)) return;

    try {
      const target = activeUser || selectedUser!;
      await updateUser(target.id, userData);
      setIsDetailEditOpen(false);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setActiveUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

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

  const openDetailEditModal = (user: IProfile) => {
    setActiveUser(user);
    setIsDetailEditOpen(true);
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
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-blue-600" />
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
              ? "bg-blue-100 text-blue-800"
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
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              openDetailEditModal(user);
            }}
          >
            <FiEye className="w-3 h-3" />
            Chi tiết/Sửa
          </Button>
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

  // Form fields configuration
  const editFormFields: AdminFormField[] = [
    {
      name: "displayName",
      label: "Tên hiển thị",
      type: "text",
      required: true,
      validation: {
        required: "Tên hiển thị là bắt buộc",
        minLength: {
          value: 2,
          message: "Tên hiển thị phải có ít nhất 2 ký tự",
        },
      },
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      validation: {
        required: "Email là bắt buộc",
        pattern: {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: "Email không hợp lệ",
        },
      },
    },
    {
      name: "phone",
      label: "Số điện thoại",
      type: "text",
      validation: {
        pattern: {
          value: /^[0-9]{10}$/,
          message: "Số điện thoại phải có 10 chữ số",
        },
      },
    },
    {
      name: "role",
      label: "Vai trò",
      type: "select",
      required: true,
      validation: {
        required: "Vai trò là bắt buộc",
      },
      options: [
        { value: "admin", label: "Admin" },
        { value: "teacher", label: "Giáo viên" },
        { value: "student", label: "Học sinh" },
        {
          value: "guest",
          label: "Vãng lai",
        },
      ],
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
          <p className="text-gray-600 mt-2">
            Quản lý tài khoản người dùng trong hệ thống
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Lọc theo tên hoặc email..."
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <input
          type="text"
          placeholder="Lọc theo số điện thoại..."
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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

      {/* Unified Detail/Edit Modal */}
      {activeUser && (
        <AdminModal
          isOpen={isDetailEditOpen}
          onClose={() => {
            setIsDetailEditOpen(false);
            setActiveUser(null);
          }}
          title="Chi tiết / Sửa người dùng"
          size="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Details */}
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-1">Thông tin chi tiết</h4>
              <div className="text-sm space-y-2">
                <div className="text-gray-700">
                  <span className="font-medium">Tên:</span>{" "}
                  {activeUser.displayName || "(Chưa có tên)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Email:</span> {activeUser.email}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {(activeUser as UserWithOptionalPhone).phone || "(chưa có)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Vai trò:</span>{" "}
                  {activeUser.role}
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-2">Sửa thông tin</h4>
              <AdminForm
                fields={editFormFields}
                defaultValues={{
                  displayName: activeUser?.displayName || "",
                  email: activeUser?.email || "",
                  phone: (activeUser as UserWithOptionalPhone)?.phone || "",
                  role: activeUser?.role || "",
                }}
                onSubmit={async (data) => {
                  await handleUpdateUser(
                    data as {
                      displayName: string;
                      email: string;
                      role: UserRole;
                      phone?: string;
                    }
                  );
                }}
                isLoading={isUpdating}
                onCancel={() => {
                  setIsDetailEditOpen(false);
                  setActiveUser(null);
                }}
              />
            </div>
          </div>
        </AdminModal>
      )}

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
