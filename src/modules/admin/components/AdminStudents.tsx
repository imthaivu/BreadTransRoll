"use client";

import { Button } from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { IProfile } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiEdit, FiEye, FiTrash2, FiUsers } from "react-icons/fi";
import {
  AdminForm,
  AdminFormField,
  AdminModal,
  AdminTable,
  AdminTableColumn,
} from "./common";
import { useStudentManagement } from "../hooks/useStudentManagement";
import { useAuth } from "@/lib/auth/context";
import { useCurrencyManagement } from "../hooks/useCurrencyManagement";
import { useClasses } from "../hooks/useClassManagement";
import toast from "react-hot-toast";
import { useMemo, useEffect } from "react";
import Image from "next/image";
import { getStorageBucket } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { UpdateStudentData } from "../services/student.service";
import { compressAndResizeImage } from "@/utils/image";

type StudentWithExtras = IProfile & {
  phone?: string;
  address?: string;
  totalBanhRan?: number;
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

// Transaction form data type
type CurrencyTxFormData = {
  type: "add" | "subtract";
  amount: number;
  reason: string;
};

export default function AdminStudents() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateTxModalOpen, setIsCreateTxModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentWithExtras | null>(null);

  const [isDetailEditOpen, setIsDetailEditOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<StudentWithExtras | null>(
    null
  );
  const [avatarUploading, setAvatarUploading] = useState<string | null>(null);

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(10);

  // Auth and roles
  const { session, profile } = useAuth();

  // Get classes for filter
  const { data: classes = [], isLoading: classesLoading } = useClasses();

  // Use the student management hook with pagination and search
  const {
    students,
    pagination,
    isLoading,
    error,
    updateStudent,
    deleteStudent,
    isUpdating,
    isDeleting,
  } = useStudentManagement({
    page: currentPage,
    limit: pageLimit,
    classId: selectedClassId || undefined,
    searchKeyword: activeSearchQuery || undefined,
  });

  // Reset to page 1 when search or classId changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchQuery, selectedClassId]);

  // Sync activeStudent with students list when it updates
  // But don't sync when modal is open to preserve local edits (badges, etc.)
  useEffect(() => {
    if (activeStudent && !isDetailEditOpen) {
      const updatedStudent = students.find(s => s.id === activeStudent.id);
      if (updatedStudent) {
        setActiveStudent(updatedStudent as StudentWithExtras);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, isDetailEditOpen, activeStudent?.id]);

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Currency management
  const { createTransaction, isCreating } = useCurrencyManagement();

  const handleUpdateStudent = async (studentData: {
    displayName?: string;
    email?: string;
    phone?: string;
    address?: string;
    parentPhone?: string;
    dateOfBirth?: Date | string;
    avatarUrl?: string;
    totalBanhRan?: number | string;
    streakCount?: number | string;
    note?: string;
    rank?: string;
    badges?: string[];
    mvpWins?: number | string;
    mvpLosses?: number | string;
  }) => {
    const target = activeStudent || selectedStudent;
    if (!target) return;

    try {
      // Convert dateOfBirth string to Date if needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...studentData };
      if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }
      
      // Convert totalBanhRan and streakCount to numbers if they are strings
      if (updateData.totalBanhRan !== undefined) {
        updateData.totalBanhRan = typeof updateData.totalBanhRan === 'string' 
          ? Number(updateData.totalBanhRan) 
          : updateData.totalBanhRan;
      }
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
      
      await updateStudent(target.id, updateData as UpdateStudentData);
      setIsDetailEditOpen(false);
      setActiveStudent(null);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      await deleteStudent(selectedStudent.id);
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const handleCreateTransaction = async (
    transactionData: CurrencyTxFormData
  ) => {
    if (!selectedStudent) return;

    if (
      !session?.user?.id ||
      !session?.user?.name ||
      !session?.user?.email ||
      !profile ||
      profile.role === "guest"
    ) {
      toast.error("Bạn không có quyền thực hiện hành động này.");
      return;
    }

    try {
      const currentBalance = selectedStudent.totalBanhRan || 0;
      if (
        transactionData.type === "subtract" &&
        currentBalance < transactionData.amount
      ) {
        toast.error(
          `Không thể trừ ${transactionData.amount} bánh mì. Số dư hiện tại chỉ có ${currentBalance} bánh mì.`
        );
        return;
      }

      await createTransaction({
        studentId: selectedStudent.id,
        studentName:
          selectedStudent.displayName || selectedStudent.email || "Chưa có tên",
        amount: transactionData.amount,
        reason: transactionData.reason,
        type: transactionData.type,
        userId: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        userRole: profile.role,
      });

      setIsCreateTxModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const openDetailEditModal = (student: StudentWithExtras) => {
    // Ensure badges is always an array
    setActiveStudent({
      ...student,
      badges: student.badges || [],
    });
    setIsDetailEditOpen(true);
  };

  const openDeleteModal = (student: StudentWithExtras) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const openCreateTxModal = (student: StudentWithExtras) => {
    setSelectedStudent(student);
    setIsCreateTxModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedStudent(null);
    setIsDeleteModalOpen(false);
  };

  const handleAvatarUpload = async (file: File | null, studentId: string) => {
    if (!file || !studentId) return;

    // Check authentication and admin role
    if (!session?.user?.id) {
      toast.error("Bạn cần tham gia để upload ảnh.");
      return;
    }

    if (!profile || profile.role !== "admin") {
      toast.error("Chỉ admin mới có quyền upload ảnh cho học sinh.");
      return;
    }

    const toastId = toast.loading("Đang xử lý và tải ảnh lên...");
    setAvatarUploading(studentId);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error("File phải là ảnh");
      }

      // Compress and resize image before upload (400x400, quality 0.85)
      const compressedFile = await compressAndResizeImage(file, 400, 400, 0.85);
      
      // console.log(`Original size: ${(file.size / 1024).toFixed(2)} KB`);
      // console.log(`Compressed size: ${(compressedFile.size / 1024).toFixed(2)} KB`);
      // console.log(`Reduction: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);

      const storage = getStorageBucket();
      if (!storage) {
        throw new Error("Không thể kết nối với Firebase Storage. Vui lòng kiểm tra cấu hình.");
      }

      // Delete all old avatar files in the folder before uploading new one
      const avatarFolderRef = ref(storage, `users/${studentId}/avatar`);
      try {
        const oldFiles = await listAll(avatarFolderRef);
        // console.log(`Found ${oldFiles.items.length} old avatar file(s) to delete`);
        // Delete all files in the avatar folder
        if (oldFiles.items.length > 0) {
          const deletePromises = oldFiles.items.map((item) => {
            // console.log(`Deleting old avatar: ${item.fullPath}`);
            return deleteObject(item);
          });
          await Promise.all(deletePromises);
          // console.log("All old avatar files deleted successfully");
        }
      } catch (deleteError: unknown) {
        // Ignore errors - folder might not exist or already empty
        // This is expected for first-time uploads
        // console.log("No old avatar files to delete or error:", deleteError);
      }

      // Use fixed filename to ensure only one avatar exists (always jpg after compression)
      const path = `users/${studentId}/avatar/avatar.jpg`;
      const storageRef = ref(storage, path);
      
      // console.log("Uploading to path:", path);
      // console.log("Storage bucket:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
      // console.log("User ID:", session.user.id);
      // console.log("User role:", profile.role);
      
      await uploadBytes(storageRef, compressedFile);
      const url = await getDownloadURL(storageRef);
      
      // console.log("Upload successful, URL:", url);
      
      // Update active student state immediately (optimistic update)
      if (activeStudent?.id === studentId) {
        setActiveStudent({ ...activeStudent, avatarUrl: url });
      }
      
      // Use updateStudent from hook to ensure data refresh
      await updateStudent(studentId, {
        avatarUrl: url,
      });
      
      toast.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
    } catch (error) {
      console.error("Avatar upload error:", error);
      
      // More detailed error messages
      let errorMessage = "Đã có lỗi xảy ra khi tải ảnh.";
      if (error instanceof Error) {
        if (error.message.includes("storage/unauthorized") || error.message.includes("403")) {
          errorMessage = "Không có quyền upload. Vui lòng kiểm tra Firebase Storage rules. Đảm bảo admin có quyền upload vào path users/{userId}/avatar/";
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
      setAvatarUploading(null);
    }
  };

  // Table columns configuration
  const columns: AdminTableColumn<StudentWithExtras>[] = [
    {
      key: "student",
      title: "Học sinh",
      render: (_, student) => (
        <div className="flex items-center min-w-0">
          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 relative">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center">
              <FiUsers className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveStudent(student);
                setIsDetailEditOpen(true);
              }}
              title="Sửa học sinh"
              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-10"
            >
              <FiEdit className="w-2 h-2 sm:w-3 sm:h-3 text-gray-600" />
            </button>
          </div>
          <div className="ml-2 sm:ml-4 min-w-0 flex-1">
            <div className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">
              {student.displayName || "Chưa có tên"}
            </div>
            <div className="text-xs sm:text-sm md:text-base text-gray-500 truncate">
              {student.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      title: "SĐT",
      className: "hidden md:table-cell",
      render: (_, student) => (
        <span className="text-sm text-gray-900">
          {student.phone || "-"}
        </span>
      ),
    },
    {
      key: "address",
      title: "Địa chỉ",
      className: "hidden lg:table-cell",
      render: (_, student) => (
        <span className="text-sm text-gray-900 truncate inline-block max-w-[200px]">
          {student.address || "(chưa có)"}
        </span>
      ),
    },
    {
      key: "totalBanhRan",
      title: "Bánh mì",
      render: (_, student) => (
        <div className="flex items-center gap-1">
          <span className="text-xs sm:text-sm font-medium text-orange-600 whitespace-nowrap">
            {student.totalBanhRan || 0}
          </span>
          <Image
  src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
  alt="bánh mì"
  width={20}  // tương đương w-5
  height={20} // tương đương h-5
  className="inline-block sm:w-5 sm:h-5 w-4 h-4"
/>
        </div>
      ),
    },
    {
      key: "streakCount",
      title: "Streak",
      className: "hidden sm:table-cell",
      render: (_, student) => (
        <span className="text-sm text-gray-900">
          {student.streakCount || 0}
        </span>
      ),
    },
    {
      key: "note",
      title: "Ghi chú",
      className: "hidden lg:table-cell",
      render: (_, student) => (
        <span className="text-xs sm:text-sm text-gray-700 truncate inline-block max-w-[250px]" title={student.note || ""}>
          {student.note || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: () => (
        <span className="text-sm text-gray-400">-</span>
      ),
    },
  ];

  // Edit form fields (full student information)
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
      name: "totalBanhRan",
      label: "Số lượng bánh mì",
      type: "number",
      validation: {
        min: {
          value: 0,
          message: "Số lượng bánh mì không thể âm",
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

  // Transaction form fields
  const txFormFields: AdminFormField[] = [
    {
      name: "type",
      label: "Loại",
      type: "select",
      required: true,
      validation: {
        required: "Vui lòng chọn loại",
      },
      options: [
        { value: "add", label: "Cộng bánh mì" },
        { value: "subtract", label: "Trừ bánh mì" },
      ],
    },
    {
      name: "amount",
      label: "Số lượng",
      type: "number",
      required: true,
      validation: {
        required: "Số lượng là bắt buộc",
        min: {
          value: 1,
          message: "Số lượng phải lớn hơn 0",
        },
        max: {
          value: 1000,
          message: "Số lượng không thể quá 1000",
        },
      },
      after: ({ setValue, watch }) => {
        const amount = watch("amount");
        const presets = [1, 2, 3, 5, 10, 15, 20, 25, 30, 40, 50];
        return (
          <div className="mt-2">
            <div className="text-xs text-gray-600 mb-1.5">
              Chọn nhanh:
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {presets.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`px-2 sm:px-2.5 py-1 rounded-md border text-xs sm:text-sm transition-colors ${
                    Number(amount) === n
                      ? " bg-primary text-white border-primary"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setValue("amount", n)}
                  aria-label={`Chọn ${n}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      name: "reason",
      label: "Lý do",
      type: "text",
      required: true,
      validation: {
        required: "Lý do là bắt buộc",
        minLength: {
          value: 2,
          message: "Lý do phải có ít nhất 2 ký tự",
        },
      },
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4 px-2 md:px-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Quản lý học sinh
        </h1>
      </motion.div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
        >
          <option value="">Tất cả lớp</option>
          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>
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
          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary text-sm"
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <h3 className="text-sm font-medium text-red-800">
            Có lỗi xảy ra khi tải dữ liệu
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-red-700">
            {error.message || "Vui lòng thử lại sau"}
          </p>
        </div>
      )}

      {/* Students Table */}
      <AdminTable
        columns={columns}
        data={students as unknown as StudentWithExtras[]}
        loading={isLoading}
        emptyMessage={
          activeSearchQuery
            ? "Không tìm thấy học sinh phù hợp"
            : selectedClassId
            ? "Lớp này chưa có học sinh nào"
            : "Vui lòng chọn lớp hoặc tìm kiếm học sinh"
        }
        showCheckbox={false}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Hiển thị{" "}
            <span className="font-medium">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}
            </span>{" "}
            trong tổng số <span className="font-medium">{pagination.total}</span>{" "}
            học sinh
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Edit Modal */}
      {activeStudent && (
        <AdminModal
          isOpen={isDetailEditOpen}
          onClose={() => {
            setIsDetailEditOpen(false);
            setActiveStudent(null);
          }}
          title="Sửa học sinh"
          size="lg"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-4 sm:mb-6">
            <div className="relative">
              {activeStudent.avatarUrl ? (
                <Image
                  src={activeStudent.avatarUrl}
                  alt={activeStudent.displayName || "Avatar"}
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
                disabled={avatarUploading === activeStudent.id}
                title="Đổi ảnh đại diện"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                {avatarUploading === activeStudent.id ? (
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
                            e.target.checked = false; // Prevent checkbox from being checked
                            return;
                          }
                          newBadges = [...currentBadges, badge];
                        } else {
                          newBadges = currentBadges.filter((b) => b !== badge);
                        }
                        
                        // Update activeStudent with new badges
                        setActiveStudent({
                          ...activeStudent,
                          badges: newBadges,
                        } as StudentWithExtras);
                      }}
                      onClick={(e) => {
                        // Prevent event bubbling
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
              displayName: activeStudent?.displayName || "",
              email: activeStudent?.email || "",
              phone: activeStudent?.phone || "",
              address: activeStudent?.address || "",
              parentPhone: activeStudent?.parentPhone || "",
              dateOfBirth: activeStudent?.dateOfBirth
                ? (() => {
                    try {
                      // dateOfBirth should already be a Date object from the service
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
              totalBanhRan: activeStudent?.totalBanhRan || 0,
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
                totalBanhRan?: number | string;
                streakCount?: number | string;
                note?: string;
                rank?: string;
                badges?: string[];
                mvpWins?: number | string;
                mvpLosses?: number | string;
              });
            }}
            isLoading={isUpdating}
            onCancel={() => {
              setIsDetailEditOpen(false);
              setActiveStudent(null);
            }}
          />
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      {selectedStudent && (
        <AdminModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Xác nhận xóa học sinh"
          subtitle={`Bạn có chắc chắn muốn xóa học sinh "${selectedStudent.displayName}" không? Hành động này không thể hoàn tác.`}
          size="sm"
        >
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={closeDeleteModal}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              variant="warning"
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </div>
        </AdminModal>
      )}

      {/* Create Transaction Modal */}
      {selectedStudent && (
        <AdminModal
        isOpen={isCreateTxModalOpen}
        onClose={() => {
          setIsCreateTxModalOpen(false);
          setSelectedStudent(null);
        }}
        title="Tạo giao dịch bánh mì"
        subtitle={
          <span>
            {selectedStudent.displayName || selectedStudent.email} — Số dư:{" "}
            {selectedStudent.totalBanhRan || 0}{" "}
            <Image
              src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
              alt="bánh mì"
              width={20}
              height={20}
              className="inline-block w-4 h-4 sm:w-5 sm:h-5"
            />
          </span>
        }
        size="md"
      >
        <div className="space-y-4">
          <AdminForm
            fields={txFormFields}
            defaultValues={{ type: "add", amount: 1, reason: "" }}
            onSubmit={async (data: CurrencyTxFormData) => {
              await handleCreateTransaction(data);
            }}
            isLoading={isCreating}
            onCancel={() => {
              setIsCreateTxModalOpen(false);
              setSelectedStudent(null);
            }}
            submitText="Tạo giao dịch"
          />
        </div>
      </AdminModal>
      
      )}
    </div>
  );
}
