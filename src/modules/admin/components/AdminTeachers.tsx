"use client";

import { Button } from "@/components/ui/Button";
import { IProfile } from "@/types";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FiEdit, FiEye, FiTrash2, FiUsers } from "react-icons/fi";
import { useTeacherManagement } from "../hooks/useTeacherManagement";
import {
  AdminForm,
  AdminFormField,
  AdminModal,
  AdminTable,
  AdminTableColumn,
} from "./common";

// Extended interface for Teacher
interface ITeacher extends IProfile {
  phone?: string;
  address?: string;
  specialization?: string;
  experience?: number;
}

export default function AdminTeachers() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<ITeacher | null>(null); // For delete modal
  const [isDetailEditOpen, setIsDetailEditOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState<ITeacher | null>(null); // For detail/edit modal

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");

  // Use the teacher management hook
  const {
    teachers,
    isLoading,
    error,
    updateTeacher,
    deleteTeacher,
    isUpdating,
    isDeleting,
  } = useTeacherManagement();

  // Apply filters
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const nameMatch =
        !nameFilter ||
        teacher.displayName?.toLowerCase().includes(nameFilter.toLowerCase());

      const emailMatch =
        !emailFilter ||
        teacher.email?.toLowerCase().includes(emailFilter.toLowerCase());

      const phoneMatch =
        !phoneFilter || (teacher.phone && teacher.phone.includes(phoneFilter));

      return nameMatch && emailMatch && phoneMatch;
    });
  }, [teachers, nameFilter, emailFilter, phoneFilter]);

  const handleUpdateTeacher = async (teacherData: {
    displayName: string;
    email: string;
    phone?: string;
    address?: string;
    specialization?: string;
    experience?: number;
  }) => {
    if (!activeTeacher) return;

    try {
      await updateTeacher(activeTeacher.id, teacherData);
      setIsDetailEditOpen(false);
      setActiveTeacher(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return;

    try {
      await deleteTeacher(selectedTeacher.id);
      setIsDeleteModalOpen(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const openDetailEditModal = (teacher: ITeacher) => {
    setActiveTeacher(teacher);
    setIsDetailEditOpen(true);
  };

  const openDeleteModal = (teacher: ITeacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedTeacher(null);
    setIsDeleteModalOpen(false);
  };

  // Table columns configuration
  const columns: AdminTableColumn<ITeacher>[] = [
    {
      key: "teacher",
      title: "Giáo viên",
      render: (_, teacher) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm md:text-base font-medium text-gray-900">
              {teacher.displayName || "Chưa có tên"}
            </div>
            <div className="text-sm md:text-base text-gray-500">
              {teacher.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "specialization",
      title: "Chuyên môn",
      render: (_, teacher) => (
        <span className="text-sm md:text-base text-gray-900">
          {teacher.specialization || "Chưa có"}
        </span>
      ),
    },
    {
      key: "experience",
      title: "Kinh nghiệm",
      render: (_, teacher) => (
        <span className="text-sm md:text-base text-gray-900">
          {teacher.experience ? `${teacher.experience} năm` : "Chưa có"}
        </span>
      ),
    },
    {
      key: "phone",
      title: "Số điện thoại",
      render: (_, teacher) => (
        <span className="text-sm md:text-base text-gray-900">
          {teacher.phone || "Chưa có"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, teacher) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              openDetailEditModal(teacher);
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
              openDeleteModal(teacher);
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
      name: "specialization",
      label: "Chuyên môn",
      type: "text",
    },
    {
      name: "experience",
      label: "Kinh nghiệm (năm)",
      type: "number",
      validation: {
        min: {
          value: 0,
          message: "Kinh nghiệm không thể âm",
        },
        max: {
          value: 50,
          message: "Kinh nghiệm không thể quá 50 năm",
        },
      },
    },
    {
      name: "address",
      label: "Địa chỉ",
      type: "textarea",
      rows: 2,
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
            Quản lý giáo viên
          </h1>
          <p className="text-gray-600 mt-2">
            Quản lý tài khoản giáo viên trong hệ thống
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Lọc theo tên..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <input
          type="text"
          placeholder="Lọc theo email..."
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <input
          type="text"
          placeholder="Lọc theo số điện thoại..."
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
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

      {/* Teachers Table */}
      <AdminTable
        columns={columns}
        data={filteredTeachers}
        loading={isLoading}
        emptyMessage="Không có giáo viên nào"
        showCheckbox={false}
      />

      {/* Unified Detail/Edit Modal */}
      {activeTeacher && (
        <AdminModal
          isOpen={isDetailEditOpen}
          onClose={() => {
            setIsDetailEditOpen(false);
            setActiveTeacher(null);
          }}
          title="Chi tiết / Sửa giáo viên"
          size="xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Details */}
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-1">Thông tin chi tiết</h4>
              <div className="text-sm space-y-2">
                <div className="text-gray-700">
                  <span className="font-medium">Tên:</span>{" "}
                  {activeTeacher.displayName || "(Chưa có tên)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Email:</span>{" "}
                  {activeTeacher.email}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {activeTeacher.phone || "(chưa có)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Chuyên môn:</span>{" "}
                  {activeTeacher.specialization || "(chưa có)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Kinh nghiệm:</span>{" "}
                  {activeTeacher.experience
                    ? `${activeTeacher.experience} năm`
                    : "(chưa có)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Địa chỉ:</span>{" "}
                  {activeTeacher.address || "(chưa có)"}
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-2">Sửa thông tin</h4>
              <AdminForm
                fields={editFormFields}
                defaultValues={{
                  displayName: activeTeacher?.displayName || "",
                  email: activeTeacher?.email || "",
                  phone: activeTeacher?.phone || "",
                  specialization: activeTeacher?.specialization || "",
                  experience: activeTeacher?.experience || 0,
                  address: activeTeacher?.address || "",
                }}
                onSubmit={async (data) => {
                  await handleUpdateTeacher(data);
                }}
                isLoading={isUpdating}
                onCancel={() => {
                  setIsDetailEditOpen(false);
                  setActiveTeacher(null);
                }}
              />
            </div>
          </div>
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedTeacher && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Xác nhận xóa giáo viên"
          subtitle={`Bạn có chắc chắn muốn xóa giáo viên "${selectedTeacher.displayName}" không? Hành động này không thể hoàn tác.`}
          size="sm"
        >
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeDeleteModal}>
              Hủy
            </Button>
            <Button
              variant="warning"
              onClick={handleDeleteTeacher}
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
