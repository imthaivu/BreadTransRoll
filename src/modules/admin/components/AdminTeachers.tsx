"use client";

import { IProfile } from "@/types";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FiEdit, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { useTeacherManagement } from "../hooks/useTeacherManagement";
import {
  AdminForm,
  AdminFormField,
  AdminModal,
  AdminTable,
  AdminTableColumn,
} from "./common";
import Image from "next/image";
import { getStorageBucket } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

// Extended interface for Teacher
interface ITeacher extends IProfile {
  phone?: string;
  address?: string;
  specialization?: string;
  experience?: number;
  note?: string;
}

export default function AdminTeachers() {
  const [isDetailEditOpen, setIsDetailEditOpen] = useState(false);
  const [activeTeacher, setActiveTeacher] = useState<ITeacher | null>(null); // For detail/edit modal
  const [avatarUploading, setAvatarUploading] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");

  // Use the teacher management hook
  const {
    teachers,
    isLoading,
    error,
    updateTeacher,
    isUpdating,
  } = useTeacherManagement();

  // Apply search filter
  const filteredTeachers = useMemo(() => {
    if (!activeSearchQuery.trim()) {
      return teachers;
    }
    
    const query = activeSearchQuery.toLowerCase().trim();
    return teachers.filter((teacher) => {
      const nameMatch = teacher.displayName
        ?.toLowerCase()
        .includes(query) || false;
      
      const emailMatch = teacher.email?.toLowerCase().includes(query) || false;
      
      const phoneMatch = teacher.phone?.toLowerCase().includes(query) || false;

      return nameMatch || emailMatch || phoneMatch;
    });
  }, [teachers, activeSearchQuery]);

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
  };

  const handleUpdateTeacher = async (teacherData: {
    displayName?: string;
    email?: string;
    phone?: string;
    address?: string;
    specialization?: string;
    note?: string;
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

  const handleAvatarUpload = async (file: File | null, teacherId: string) => {
    if (!file || !teacherId) return;

    const toastId = toast.loading("Đang tải ảnh lên...");
    setAvatarUploading(teacherId);
    try {
      const storage = getStorageBucket();
      const path = `users/${teacherId}/avatar/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Use updateTeacher from hook to ensure data refresh
      await updateTeacher(teacherId, {
        avatarUrl: url,
      });
      
      toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
      
      // Update active teacher state
      if (activeTeacher?.id === teacherId) {
        setActiveTeacher({ ...activeTeacher, avatarUrl: url });
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra khi tải ảnh.", { id: toastId });
    } finally {
      setAvatarUploading(null);
    }
  };

  const openDetailEditModal = (teacher: ITeacher) => {
    setActiveTeacher(teacher);
    setIsDetailEditOpen(true);
  };

  // Table columns configuration
  const columns: AdminTableColumn<ITeacher>[] = [
    {
      key: "teacher",
      title: "Giáo viên",
      render: (_, teacher) => (
        <div className="flex items-center min-w-0">
          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 relative">
            {teacher.avatarUrl ? (
              <Image
                src={teacher.avatarUrl}
                alt={teacher.displayName || "Avatar"}
                width={40}
                height={40}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTeacher(teacher);
                setIsDetailEditOpen(true);
              }}
              title="Sửa giáo viên"
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <FiEdit className="w-2 h-2 sm:w-3 sm:h-3 text-gray-600" />
            </button>
          </div>
          <div className="ml-2 sm:ml-4 min-w-0 flex-1">
            <div className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">
              {teacher.displayName || "Chưa có tên"}
            </div>
            <div className="text-xs sm:text-sm md:text-base text-gray-500 truncate">
              {teacher.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "specialization",
      title: "Chuyên môn",
      className: "hidden sm:table-cell",
      render: (_, teacher) => (
        <span className="text-sm text-gray-900">
          {teacher.specialization || "-"}
        </span>
      ),
    },
    {
      key: "phone",
      title: "Số điện thoại",
      className: "hidden md:table-cell",
      render: (_, teacher) => (
        <span className="text-sm text-gray-900">
          {teacher.phone || "-"}
        </span>
      ),
    },
    {
      key: "note",
      title: "Ghi chú",
      className: "hidden lg:table-cell",
      render: (_, teacher) => (
        <span className="text-xs sm:text-sm text-gray-700 truncate inline-block max-w-[250px]" title={teacher.note || ""}>
          {teacher.note || "-"}
        </span>
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
      placeholder: "Ví dụ: Tiếng Anh, Toán, Văn...",
    },
    {
      name: "address",
      label: "Địa chỉ",
      type: "textarea",
      rows: 2,
    },
    {
      name: "note",
      label: "Ghi chú",
      type: "textarea",
      rows: 4,
      placeholder: "Nhập ghi chú về giáo viên...",
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
          
        </div>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <input
          type="text"
          placeholder="Tìm theo tên, email hoặc SĐT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm col-span-1 sm:col-span-2"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSearch}
            variant="primary"
            className="flex-1"
          >
            Tìm
          </Button>
          {activeSearchQuery && (
            <Button
              onClick={handleClearSearch}
              variant="outline"
              size="sm"
            >
          Reset
            </Button>
          )}
        </div>
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
          title="Sửa giáo viên"
          size="lg"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="relative">
              {activeTeacher.avatarUrl ? (
                <Image
                  src={activeTeacher.avatarUrl}
                  alt={activeTeacher.displayName || "Avatar"}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <FiUsers className="w-12 h-12 text-blue-600" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const fileInput = document.getElementById(`avatar-upload-${activeTeacher.id}`) as HTMLInputElement;
                  fileInput?.click();
                }}
                disabled={avatarUploading === activeTeacher.id}
                title="Đổi ảnh đại diện"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                {avatarUploading === activeTeacher.id ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                ) : (
                  <FiEdit className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>
            <input
              type="file"
              accept="image/*"
              id={`avatar-upload-${activeTeacher.id}`}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && activeTeacher.id) {
                  handleAvatarUpload(file, activeTeacher.id);
                }
              }}
            />
          </div>

          <AdminForm
            fields={editFormFields}
            defaultValues={{
              displayName: activeTeacher?.displayName || "",
              email: activeTeacher?.email || "",
              phone: activeTeacher?.phone || "",
              specialization: activeTeacher?.specialization || "",
              address: activeTeacher?.address || "",
              note: activeTeacher?.note || "",
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
        </AdminModal>
      )}
    </div>
  );
}
