"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/context";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  FiDollarSign,
  FiMinus,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiBarChart2,
} from "react-icons/fi";
import {
  useCurrencyManagement,
  useCurrencyStats,
  useCurrencyTransactions,
} from "../hooks/useCurrencyManagement";
import { useStudents } from "../hooks/useStudentManagement";
import { useClasses } from "../hooks/useClassManagement";
import { ICurrency } from "../services/currency.service";
import {
  AdminForm,
  AdminFormField,
  AdminModal,
  AdminTable,
  AdminTableColumn,
} from "./common";
import { AdminCurrencyRequests } from "./AdminCurrencyRequests";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AdminCurrency() {
  const { session, profile } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<ICurrency | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("transactions");

  const [showConfirmCreate, setShowConfirmCreate] = useState<boolean>(false);

  // Single day filter for transactions (default today)
  const [dateStr, setDateStr] = useState<string>("");
  // Frontend filters
  const [studentQuery, setStudentQuery] = useState<string>("");
  const [dorayakiFilter, setDorayakiFilter] = useState<
    "all" | "dorayaki" | "non-dorayaki"
  >("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const { data: stats, isLoading: isLoadingStats } = useCurrencyStats();

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDateStr(`${yyyy}-${mm}-${dd}`);
  }, []);
  const forDate = useMemo(
    () => (dateStr ? new Date(`${dateStr}T00:00:00`) : undefined),
    [dateStr]
  );

  // Use the currency management mutations
  const { createTransaction, deleteTransaction, isCreating, isDeleting } =
    useCurrencyManagement();

  // Use students and classes hooks for dropdown
  const { data: studentsData } = useStudents();
  const students = useMemo(() => studentsData?.data || [], [studentsData]);
  const { data: classes = [] } = useClasses();

  // Server-side filtered transactions for a given day
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = useCurrencyTransactions(forDate);

  // Apply client-side filters
  const filteredTransactions = useMemo(() => {
    const normalize = (v?: string) => (v || "").toLowerCase();
    const sq = normalize(studentQuery);

    return (transactions || []).filter((t) => {
      // Dorayaki filter
      if (dorayakiFilter === "dorayaki") {
        if (!t.reason.includes("quay_dorayaki")) return false;
      } else if (dorayakiFilter === "non-dorayaki") {
        if (t.reason.includes("quay_dorayaki")) return false;
      }

      // Class filter
      if (selectedClassId) {
        const student = students.find((s) => s.id === t.studentId);
        if (!student || !student.classIds?.includes(selectedClassId))
          return false;
      }

      if (sq) {
        const hay = `${normalize(t.studentName)} ${t.studentId}`;
        if (!hay.includes(sq)) return false;
      }
      return true;
    });
  }, [transactions, studentQuery, dorayakiFilter, selectedClassId, students]);

  // Get selected student info
  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const handleCreateTransaction = async (transactionData: {
    studentId: string;
    amount: number;
    reason: string;
    type: "add" | "subtract";
    userId: string;
  }) => {
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
      // Find student name from selected studentId
      const selectedStudent = students.find(
        (student) => student.id === transactionData.studentId
      );
      const studentName =
        selectedStudent?.displayName || selectedStudent?.email || "Chưa có tên";

      // Check if trying to subtract more than available balance
      if (transactionData.type === "subtract") {
        const currentBalance = selectedStudent?.totalBanhRan || 0;
        if (currentBalance < transactionData.amount) {
          toast.error(
            `Không thể trừ ${transactionData.amount} bánh mì. Số dư hiện tại chỉ có ${currentBalance} bánh mì.`
          );
          return;
        }
      }

      await createTransaction({
        ...transactionData,
        studentName,
        userName: session?.user?.name || session?.user?.email || "Unknown",
        userId: session?.user?.id,
        userRole: profile?.role,
      });
      setIsCreateModalOpen(false);
      setSelectedStudentId("");
      // Refresh the list for the current day
      refetch();
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await deleteTransaction(selectedTransaction.id);
      setIsDeleteModalOpen(false);
      setSelectedTransaction(null);
      refetch();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const openDeleteModal = (transaction: ICurrency) => {
    setSelectedTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedStudentId("");
  };

  const closeDeleteModal = () => {
    setSelectedTransaction(null);
    setIsDeleteModalOpen(false);
  };

  // Table columns configuration
  const columns: AdminTableColumn<ICurrency>[] = [
    {
      key: "student",
      title: "Học sinh",
      render: (_, transaction) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <FiDollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm md:text-base font-medium text-gray-900">
              {transaction.studentName}
            </div>
            <div className="text-sm md:text-base text-gray-500">
              ID: {transaction.studentId}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "admin",
      title: "Người thực hiện",
      render: (_, transaction) => (
        <div>
          <div className="text-sm md:text-base font-medium text-gray-900">
            {transaction.userName || "Không rõ"}
          </div>
          <div className="text-sm md:text-base text-gray-500">
            Vai trò: {transaction.userRole || "Không rõ"}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      title: "Loại",
      render: (_, transaction) => (
        <div className="flex items-center">
          {transaction.type === "add" ? (
            <FiPlus className="w-4 h-4 text-green-600 mr-2" />
          ) : (
            <FiMinus className="w-4 h-4 text-red-600 mr-2" />
          )}
          <span
            className={`text-sm md:text-base font-medium ${
              transaction.type === "add" ? "text-green-600" : "text-red-600"
            }`}
          >
            {transaction.type === "add" ? "Cộng" : "Trừ"}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Số lượng",
      render: (_, transaction) => (
        <span className="text-sm md:text-base font-medium text-gray-900">
          {transaction.amount} bánh mì
        </span>
      ),
    },
    {
      key: "reason",
      title: "Lý do",
      render: (_, transaction) => (
        <span className="text-sm md:text-base text-gray-900">
          {transaction.reason}
        </span>
      ),
    },
    {
      key: "date",
      title: "Ngày",
      render: (_, transaction) => (
        <span className="text-sm md:text-base text-gray-500">
          {transaction.createdAt.toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, transaction) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(transaction);
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
      name: "studentId",
      label: "Học sinh",
      type: "select",
      required: true,
      validation: {
        required: "Vui lòng chọn học sinh",
      },
      options: students.map((student) => ({
        value: student.id,
        label: `${student.displayName || "Chưa có tên"} (${student.email})`,
      })),
    },
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
      <h1 className="text-2xl font-bold mb-6">Quản lý Bánh mì</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoadingStats ? (
          <div className="md:col-span-3 flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <StatCard title="Giao dịch hôm nay" value={stats?.today ?? 0} />
            <StatCard title="Giao dịch tuần này" value={stats?.thisWeek ?? 0} />
            <StatCard
              title="Giao dịch tháng này"
              value={stats?.thisMonth ?? 0}
            />
          </>
        )}
      </div>

      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "transactions"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Giao dịch bánh mì
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "requests"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Yêu cầu cần duyệt
        </button>
      </div>

      {activeTab === "transactions" && (
        <div className="gap-8">
          {/* Filter by day */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">Lọc theo ngày giao dịch</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="px-3 py-2 border border-blue-300 rounded-md text-sm bg-blue-50 text-blue-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Ngày"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                aria-label="Làm mới"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Frontend Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Học sinh
              </label>
              <input
                type="text"
                placeholder="Tìm theo tên/ID"
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm bg-blue-50 text-blue-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Quay Dorayaki
              </label>
              <select
                className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dorayakiFilter}
                onChange={(e) =>
                  setDorayakiFilter(e.target.value as typeof dorayakiFilter)
                }
              >
                <option value="all">Tất cả</option>
                <option value="dorayaki">Chỉ quay dorayaki</option>
                <option value="non-dorayaki">Không phải quay dorayaki</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Lớp học
              </label>
              <select
                className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Tất cả lớp</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mb-2">
            <Button
              variant="outline"
              onClick={() => {
                setStudentQuery("");
                setDorayakiFilter("all");
                setSelectedClassId("");
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>

          {/* Student Balance Display */}
          {selectedStudentId && selectedStudent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">
                    {selectedStudent.displayName || selectedStudent.email}
                  </h3>
                  <p className="text-orange-600 text-sm md:text-base">
                    Tổng bánh mì hiện tại
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-600">
                    {selectedStudent.totalBanhRan || 0}{" "}
                    <Image
  src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
  alt="bánh mì"
  width={20}  // tương đương w-5
  height={20} // tương đương h-5
  className="inline-block sm:w-5 sm:h-5 w-4 h-4"
/>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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

          {/* Currency Transactions Table */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Tổng số giao dịch:{" "}
              <span className="font-bold text-blue-600">
                {filteredTransactions.length}
              </span>
            </p>
          </div>
          <AdminTable
            columns={columns}
            data={filteredTransactions}
            loading={isLoading}
            emptyMessage="Không có giao dịch bánh mì nào"
            showCheckbox={false}
          />

          {/* Create Transaction Modal */}
          <AdminModal
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
            title="Thêm bánh mì"
            subtitle="Nhập thông tin để thêm/trừ bánh mì cho học sinh"
            size="lg"
          >
            <div className="space-y-4">
              {/* Student Selection with Balance Display */}
              <div>
                <label className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                  Chọn học sinh
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.displayName || "Chưa có tên"} ({student.email}) -{" "}
                      {student.totalBanhRan || 0}{" "}
                      <Image
  src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
  alt="bánh mì"
  width={20}  // tương đương w-5
  height={20} // tương đương h-5
  className="inline-block sm:w-5 sm:h-5 w-4 h-4"
/>
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Balance Display */}
              {selectedStudentId && selectedStudent && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm md:text-base font-medium text-orange-800">
                      Tổng bánh mì hiện tại:
                    </span>
                    <span className="text-lg font-bold text-orange-600">
                      {selectedStudent.totalBanhRan || 0}{" "}
                      <Image
  src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
  alt="bánh mì"
  width={20}  // tương đương w-5
  height={20} // tương đương h-5
  className="inline-block sm:w-5 sm:h-5 w-4 h-4"
/>
                    </span>
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <AdminForm
                  fields={editFormFields.filter(
                    (field) => field.name !== "studentId"
                  )}
                  defaultValues={{
                    type: "add",
                    amount: 1,
                    reason: "",
                  }}
                  onSubmit={async (data) => {
                    await handleCreateTransaction({
                      ...data,
                      studentId: selectedStudentId,
                      userId: session?.user?.id,
                      userName:
                        session?.user?.name ||
                        session?.user?.email ||
                        "Unknown",
                      userRole: profile?.role,
                    });
                  }}
                  isLoading={isCreating}
                  onCancel={closeCreateModal}
                  submitText="Thêm giao dịch"
                />
              </div>
            </div>
          </AdminModal>

          {/* Delete Confirmation Modal */}
          {selectedTransaction && (
            <AdminModal
              isOpen={isDeleteModalOpen}
              onClose={closeDeleteModal}
              title="Xác nhận xóa giao dịch"
              subtitle={`Bạn có chắc chắn muốn xóa giao dịch "${selectedTransaction.reason}" không? Hành động này không thể hoàn tác.`}
              size="sm"
            >
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={closeDeleteModal}>
                  Hủy
                </Button>
                <Button
                  onClick={handleDeleteTransaction}
                  disabled={isDeleting}
                  variant="warning"
                >
                  {isDeleting ? "Đang xóa..." : "Xóa"}
                </Button>
              </div>
            </AdminModal>
          )}
        </div>
      )}

      {activeTab === "requests" && <AdminCurrencyRequests />}
    </div>
  );
}

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div className="flex items-center">
      <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
        <FiBarChart2 className="w-5 h-5" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xl font-bold text-gray-900">
          {value.toLocaleString("vi-VN")} giao dịch
        </p>
      </div>
    </div>
  </div>
);
