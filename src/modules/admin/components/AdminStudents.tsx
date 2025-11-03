"use client";

import { Button } from "@/components/ui/Button";
import { IProfile } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiEdit, FiEye, FiTrash2, FiUsers, FiDollarSign } from "react-icons/fi";
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
import toast from "react-hot-toast";
import { useMemo } from "react";

type StudentWithExtras = IProfile & {
  phone?: string;
  address?: string;
  totalBanhRan?: number;
  streakCount?: number;
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

  // Server-side limit
  const [limit, setLimit] = useState<number | undefined>(10);

  // Filters
  const [studentFilter, setStudentFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");

  // Auth and roles
  const { session, profile } = useAuth();

  // Use the student management hook
  const {
    students,
    isLoading,
    error,
    updateStudent,
    deleteStudent,
    isUpdating,
    isDeleting,
  } = useStudentManagement(limit);

  // Apply filters
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const studentMatch =
        !studentFilter ||
        student.displayName
          ?.toLowerCase()
          .includes(studentFilter.toLowerCase()) ||
        student.email?.toLowerCase().includes(studentFilter.toLowerCase());

      const phoneMatch =
        !phoneFilter || (student.phone && student.phone.includes(phoneFilter));

      const addressMatch =
        !addressFilter ||
        student.address?.toLowerCase().includes(addressFilter.toLowerCase());

      return studentMatch && phoneMatch && addressMatch;
    });
  }, [students, studentFilter, phoneFilter, addressFilter]);

  // Currency management
  const { createTransaction, isCreating } = useCurrencyManagement();

  const handleUpdateStudent = async (studentData: {
    displayName: string;
    email: string;
    phone?: string;
    address?: string;
  }) => {
    const target = activeStudent || selectedStudent;
    if (!target) return;

    try {
      await updateStudent(target.id, studentData);
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
          `Không thể trừ ${transactionData.amount} bánh rán. Số dư hiện tại chỉ có ${currentBalance} bánh rán.`
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
    setActiveStudent(student);
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

  // Table columns configuration
  const columns: AdminTableColumn<StudentWithExtras>[] = [
    {
      key: "student",
      title: "Học sinh",
      render: (_, student) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm md:text-base font-medium text-gray-900">
              {student.displayName || "Chưa có tên"}
            </div>
            <div className="text-sm md:text-base text-gray-500">
              {student.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      title: "SĐT",
      render: (_, student) => (
        <span className="text-sm md:text-base text-gray-900">
          {student.phone || "-"}
        </span>
      ),
    },
    {
      key: "address",
      title: "Địa chỉ",
      render: (_, student) => (
        <span className="text-sm md:text-base text-gray-900 truncate inline-block max-w-[220px]">
          {student.address || "(chưa có)"}
        </span>
      ),
    },
    {
      key: "totalBanhRan",
      title: "Bánh rán",
      render: (_, student) => (
        <div className="flex items-center">
          <span className="text-sm md:text-base font-medium text-orange-600">
            {student.totalBanhRan || 0} 🥟
          </span>
        </div>
      ),
    },
    {
      key: "streakCount",
      title: "Streak",
      render: (_, student) => (
        <span className="text-sm md:text-base text-gray-900">
          {student.streakCount || 0}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, student) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              openDetailEditModal(student);
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
              openDeleteModal(student);
            }}
          >
            <FiTrash2 className="w-3 h-3" />
            Xóa
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-green-700 hover:text-green-800"
            onClick={(e) => {
              e.stopPropagation();
              openCreateTxModal(student);
            }}
          >
            <FiDollarSign className="w-3 h-3" />
            Giao dịch
          </Button>
        </div>
      ),
    },
  ];

  // Edit form fields (minimal important fields)
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
        { value: "add", label: "Cộng bánh rán" },
        { value: "subtract", label: "Trừ bánh rán" },
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
            <div className="text-xs text-gray-600 mb-1">
              Chọn nhanh số lượng
            </div>
            <div className="flex flex-wrap gap-2">
              {presets.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`px-2.5 py-1 rounded-md border text-sm ${
                    Number(amount) === n
                      ? "bg-blue-600 text-white border-blue-600"
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý học sinh</h1>
          
        </div>
      </motion.div>

      {/* Query Limit */}
      <div className="flex items-center gap-4 mb-4">
        <label
          htmlFor="limit-select"
          className="text-sm font-medium text-gray-700"
        >
          Số lượng học sinh hiển thị:
        </label>
        <select
          id="limit-select"
          value={limit || "all"}
          onChange={(e) =>
            setLimit(
              e.target.value === "all" ? undefined : Number(e.target.value)
            )
          }
          className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value="all">Tất cả</option>
        </select>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Lọc theo tên hoặc email..."
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <input
          type="text"
          placeholder="Lọc theo số điện thoại..."
          value={phoneFilter}
          onChange={(e) => setPhoneFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        />
        <input
          type="text"
          placeholder="Lọc theo địa chỉ..."
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
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

      {/* Students Table */}
      <AdminTable
        columns={columns}
        data={filteredStudents as unknown as StudentWithExtras[]}
        loading={isLoading}
        emptyMessage="Không có học sinh nào"
        showCheckbox={false}
      />

      {/* Unified Detail/Edit Modal */}
      {activeStudent && (
        <AdminModal
          isOpen={isDetailEditOpen}
          onClose={() => {
            setIsDetailEditOpen(false);
            setActiveStudent(null);
          }}
          title="Chi tiết / Sửa học sinh"
          size="xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Details */}
            <div className="space-y-3 p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-1">Thông tin chi tiết</h4>
              <div className="text-sm space-y-2">
                <div className="text-gray-700">
                  <span className="font-medium">Tên:</span>{" "}
                  {activeStudent.displayName || "(Chưa có tên)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Email:</span>{" "}
                  {activeStudent.email}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {activeStudent.phone || "(chưa có)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Địa chỉ:</span>{" "}
                  {activeStudent.address || "(chưa có)"}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Bánh rán:</span>{" "}
                  {activeStudent.totalBanhRan || 0}
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Streak:</span>{" "}
                  {activeStudent.streakCount || 0}
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="p-4 rounded-lg border border-gray-200 bg-white">
              <h4 className="font-semibold mb-2">Sửa thông tin</h4>
              <AdminForm
                fields={editFormFields}
                defaultValues={{
                  displayName: activeStudent?.displayName || "",
                  email: activeStudent?.email || "",
                  phone: activeStudent?.phone || "",
                  address: activeStudent?.address || "",
                }}
                onSubmit={async (data) => {
                  await handleUpdateStudent(
                    data as {
                      displayName: string;
                      email: string;
                      phone?: string;
                      address?: string;
                    }
                  );
                }}
                isLoading={isUpdating}
                onCancel={() => {
                  setIsDetailEditOpen(false);
                  setActiveStudent(null);
                }}
              />
            </div>
          </div>
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
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={closeDeleteModal}>
              Hủy
            </Button>
            <Button
              variant="warning"
              onClick={handleDeleteStudent}
              disabled={isDeleting}
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
          title="Tạo giao dịch bánh rán"
          subtitle={`Học sinh: ${
            selectedStudent.displayName || selectedStudent.email
          } — Số dư: ${selectedStudent.totalBanhRan || 0} 🥟`}
          size="lg"
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
