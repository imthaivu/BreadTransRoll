"use client";

import { IClassMember } from "@/types";
import { useState, useEffect } from "react";
import { FiEdit, FiUsers } from "react-icons/fi";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  AdminForm,
  AdminFormField,
  AdminModal,
} from "@/modules/admin/components/common";
import {
  useStudent,
  useUpdateStudent,
} from "@/modules/admin/hooks/useStudentManagement";
import { useAuth } from "@/lib/auth/context";
import { getStorageBucket } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { UpdateStudentData } from "@/modules/admin/services/student.service";
import { compressAndResizeImage } from "@/utils/image";

type StudentWithExtras = IClassMember & {
  displayName?: string;
  phone?: string;
  address?: string;
  streakCount?: number;
  parentEmail?: string;
  parentPhone?: string;
  grade?: string;
  school?: string;
  dateOfBirth?: Date;
  avatarUrl?: string;
  note?: string;
  rank?: "dong" | "bac" | "vang" | "kim cuong" | "cao thu";
  badges?: string[];
  mvpWins?: number;
  mvpLosses?: number;
};

interface TeacherEditStudentModalProps {
  member: IClassMember;
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherEditStudentModal({
  member,
  isOpen,
  onClose,
}: TeacherEditStudentModalProps) {
  const { session, profile } = useAuth();
  const { data: studentProfile } = useStudent(member.id);
  const { mutateAsync: updateStudent, isPending: isUpdating } = useUpdateStudent();
  
  const [activeStudent, setActiveStudent] = useState<StudentWithExtras | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Sync activeStudent with studentProfile when it loads
  useEffect(() => {
    if (studentProfile && isOpen) {
      setActiveStudent({
        ...member,
        ...studentProfile,
        badges: studentProfile.badges || [],
      } as StudentWithExtras);
    }
  }, [studentProfile, member, isOpen]);

  const handleUpdateStudent = async (studentData: {
    displayName?: string;
    email?: string;
    phone?: string;
    address?: string;
    parentPhone?: string;
    dateOfBirth?: Date | string;
    avatarUrl?: string;
    streakCount?: number | string;
    note?: string;
    rank?: string;
    badges?: string[];
    mvpWins?: number | string;
    mvpLosses?: number | string;
  }) => {
    if (!activeStudent) return;

    try {
      // Convert dateOfBirth string to Date if needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...studentData };
      if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }
      
      // Convert streakCount to number if it is a string
      if (updateData.streakCount !== undefined) {
        updateData.streakCount = typeof updateData.streakCount === 'string' 
          ? Number(updateData.streakCount) 
          : updateData.streakCount;
      }
      
      // Convert mvpWins and mvpLosses to numbers if they are strings
      if (updateData.mvpWins !== undefined) {
        updateData.mvpWins = typeof updateData.mvpWins === 'string' 
          ? Number(updateData.mvpWins) 
          : updateData.mvpWins;
      }
      if (updateData.mvpLosses !== undefined) {
        updateData.mvpLosses = typeof updateData.mvpLosses === 'string' 
          ? Number(updateData.mvpLosses) 
          : updateData.mvpLosses;
      }
      
      // Handle rank: if empty string, set to undefined
      if (updateData.rank === "") {
        updateData.rank = undefined;
      }
      
      await updateStudent({
        studentId: activeStudent.id,
        studentData: updateData as UpdateStudentData,
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleAvatarUpload = async (file: File | null, studentId: string) => {
    if (!file || !studentId) return;

    // Check authentication
    if (!session?.user?.id) {
      toast.error("Bạn cần tham gia để upload ảnh.");
      return;
    }

    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      toast.error("Bạn không có quyền upload ảnh cho học sinh.");
      return;
    }

    const toastId = toast.loading("Đang xử lý và tải ảnh lên...");
    setAvatarUploading(true);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error("File phải là ảnh");
      }

      // Compress and resize image before upload (400x400, quality 0.85)
      const compressedFile = await compressAndResizeImage(file, 400, 400, 0.85);

      const storage = getStorageBucket();
      if (!storage) {
        throw new Error("Không thể kết nối với Firebase Storage. Vui lòng kiểm tra cấu hình.");
      }

      // Delete all old avatar files in the folder before uploading new one
      const avatarFolderRef = ref(storage, `users/${studentId}/avatar`);
      try {
        const oldFiles = await listAll(avatarFolderRef);
        if (oldFiles.items.length > 0) {
          const deletePromises = oldFiles.items.map((item) => deleteObject(item));
          await Promise.all(deletePromises);
        }
      } catch (deleteError: unknown) {
        // Ignore errors - folder might not exist or already empty
      }

      // Use fixed filename to ensure only one avatar exists (always jpg after compression)
      const path = `users/${studentId}/avatar/avatar.jpg`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      
      // Update active student state immediately (optimistic update)
      if (activeStudent?.id === studentId) {
        setActiveStudent({ ...activeStudent, avatarUrl: url });
      }
      
      // Update student with new avatar URL
      await updateStudent({
        studentId: studentId,
        studentData: {
          avatarUrl: url,
        },
      });
      
      toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
    } catch (error) {
      console.error("Avatar upload error:", error);
      
      let errorMessage = "Đã có lỗi xảy ra khi tải ảnh.";
      if (error instanceof Error) {
        if (error.message.includes("storage/unauthorized") || error.message.includes("403")) {
          errorMessage = "Không có quyền upload. Vui lòng kiểm tra Firebase Storage rules.";
        } else if (error.message.includes("storage/quota-exceeded")) {
          errorMessage = "Storage quota đã hết. Vui lòng liên hệ admin.";
        } else if (error.message.includes("storage/unauthenticated")) {
          errorMessage = "Bạn cần tham gia để upload ảnh.";
        } else if (error.message.includes("network")) {
          errorMessage = "Lỗi kết nối mạng. Vui lòng thử lại.";
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Edit form fields (without totalBanhRan)
  const editFormFields: AdminFormField[] = [
    {
      name: "displayName",
      label: "Tên học sinh",
      type: "text",
      required: true,
      validation: {
        required: "Tên học sinh là bắt buộc",
        minLength: {
          value: 2,
          message: "Tên học sinh phải có ít nhất 2 ký tự",
        },
      },
    },
    {
      name: "email",
      label: "Email học sinh",
      type: "email",
      required: true,
      validation: {
        required: "Email học sinh là bắt buộc",
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
      placeholder: "0123456789",
      validation: {
        pattern: {
          value: /^[0-9]{10}$/,
          message: "Số điện thoại phải có 10 chữ số",
        },
      },
    },
    {
      name: "address",
      label: "Địa chỉ",
      type: "textarea",
      rows: 3,
    },
    {
      name: "parentPhone",
      label: "Số điện thoại phụ huynh",
      type: "text",
      placeholder: "0123456789",
      validation: {
        pattern: {
          value: /^[0-9]{10}$/,
          message: "Số điện thoại phải có 10 chữ số",
        },
      },
    },
    {
      name: "dateOfBirth",
      label: "Ngày sinh",
      type: "date",
    },
    {
      name: "avatarUrl",
      label: "URL ảnh đại diện",
      type: "text",
      placeholder: "https://example.com/avatar.jpg",
      validation: {
        pattern: {
          value: /^https?:\/\/.+/i,
          message: "URL phải bắt đầu bằng http:// hoặc https://",
        },
      },
    },
    {
      name: "streakCount",
      label: "Streak",
      type: "number",
      validation: {
        min: {
          value: 0,
          message: "Streak không thể âm",
        },
      },
    },
    {
      name: "note",
      label: "Ghi chú",
      type: "textarea",
      rows: 4,
      placeholder: "Nhập ghi chú về học sinh...",
    },
    {
      name: "rank",
      label: "Rank",
      type: "select",
      options: [
        { value: "", label: "Chưa có rank" },
        { value: "dong", label: "Đồng" },
        { value: "bac", label: "Bạc" },
        { value: "vang", label: "Vàng" },
        { value: "kim cuong", label: "Kim cương" },
        { value: "cao thu", label: "Cao thủ" },
      ],
    },
    {
      name: "mvpWins",
      label: "Số lần MVP thắng",
      type: "number",
      validation: {
        min: {
          value: 0,
          message: "Số lần MVP thắng không thể âm",
        },
      },
    },
    {
      name: "mvpLosses",
      label: "Số lần MVP thua",
      type: "number",
      validation: {
        min: {
          value: 0,
          message: "Số lần MVP thua không thể âm",
        },
      },
    },
  ];

  if (!activeStudent) {
    return null;
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sửa thông tin học sinh"
      size="lg"
    >
      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-4 sm:mb-6">
        <div className="relative">
          {activeStudent.avatarUrl ? (
            <Image
              src={activeStudent.avatarUrl}
              alt={activeStudent.name || "Avatar"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <FiUsers className="w-12 h-12 text-green-600" />
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              const fileInput = document.getElementById(`avatar-upload-${activeStudent.id}`) as HTMLInputElement;
              fileInput?.click();
            }}
            disabled={avatarUploading}
            title="Đổi ảnh đại diện"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            {avatarUploading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <FiEdit className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>
        <input
          type="file"
          accept="image/*"
          id={`avatar-upload-${activeStudent.id}`}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && activeStudent.id) {
              handleAvatarUpload(file, activeStudent.id);
            }
          }}
        />
      </div>

      {/* Badges Section */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Huy hiệu (tối đa 5)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { name: "Fast Learner", image: "fast.png" },
            { name: "Never Missed", image: "never.png" },
            { name: "Master of Words", image: "master.png" },
            { name: "Pronunciation Pro", image: "pronun.png" },
            { name: "Grammar Guardian", image: "gramar.png" },
          ].map(({ name: badge, image }) => {
            const isSelected = activeStudent?.badges?.includes(badge) || false;
            return (
              <label
                key={badge}
                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? " bg-primary/10 border-primary/30"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (!activeStudent) return;
                    
                    const currentBadges = activeStudent.badges || [];
                    let newBadges: string[];
                    if (e.target.checked) {
                      // Max 5 badges
                      if (currentBadges.length >= 5) {
                        toast.error("Tối đa 5 huy hiệu");
                        e.target.checked = false;
                        return;
                      }
                      newBadges = [...currentBadges, badge];
                    } else {
                      newBadges = currentBadges.filter((b) => b !== badge);
                    }
                    
                    setActiveStudent({
                      ...activeStudent,
                      badges: newBadges,
                    } as StudentWithExtras);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <div className="relative w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                  <Image
                    src={`/assets/rank/${image}`}
                    alt={badge}
                    width={24}
                    height={24}
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                  />
                </div>
                <span className="text-xs sm:text-sm text-gray-700">{badge}</span>
              </label>
            );
          })}
        </div>
      </div>

      <AdminForm
        fields={editFormFields}
        defaultValues={{
          displayName: activeStudent?.name || activeStudent?.displayName || "",
          email: activeStudent?.email || "",
          phone: activeStudent?.phone || "",
          address: activeStudent?.address || "",
          parentPhone: activeStudent?.parentPhone || "",
          dateOfBirth: activeStudent?.dateOfBirth
            ? (() => {
                try {
                  const date = activeStudent.dateOfBirth instanceof Date 
                    ? activeStudent.dateOfBirth 
                    : new Date(activeStudent.dateOfBirth);
                  if (isNaN(date.getTime())) return "";
                  return date.toISOString().split("T")[0];
                } catch {
                  return "";
                }
              })()
            : "",
          avatarUrl: activeStudent?.avatarUrl || "",
          streakCount: activeStudent?.streakCount || 0,
          note: activeStudent?.note || "",
          rank: activeStudent?.rank || "",
          mvpWins: activeStudent?.mvpWins || 0,
          mvpLosses: activeStudent?.mvpLosses || 0,
        }}
        onSubmit={async (data) => {
          await handleUpdateStudent({
            ...data,
            badges: activeStudent?.badges || [],
          } as {
            displayName?: string;
            email?: string;
            phone?: string;
            address?: string;
            parentPhone?: string;
            dateOfBirth?: Date | string;
            avatarUrl?: string;
            streakCount?: number | string;
            note?: string;
            rank?: string;
            badges?: string[];
            mvpWins?: number | string;
            mvpLosses?: number | string;
          });
        }}
        isLoading={isUpdating}
        onCancel={onClose}
      />
    </AdminModal>
  );
}

