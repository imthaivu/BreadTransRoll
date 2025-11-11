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
  useCurrencyRequests,
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
  const [requestsRefetchFn, setRequestsRefetchFn] = useState<(() => Promise<any>) | null>(null);

  const [showConfirmCreate, setShowConfirmCreate] = useState<boolean>(false);

  // Single day filter for transactions (default today)
  const [dateStr, setDateStr] = useState<string>("");
  // Frontend filters
  const [studentQuery, setStudentQuery] = useState<string>("");
  const [dorayakiFilter, setDorayakiFilter] = useState<
    "all" | "dorayaki" | "non-dorayaki"
  >("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const statsQuery = useCurrencyStats();
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = statsQuery || {
    data: undefined,
    isLoading: false,
    refetch: () => Promise.resolve(),
  };

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
  const currencyManagement = useCurrencyManagement();
  const { createTransaction, deleteTransaction, isCreating, isDeleting } =
    currencyManagement || {
      createTransaction: async () => {},
      deleteTransaction: async () => {},
      isCreating: false,
      isDeleting: false,
    };

  // Use students and classes hooks for dropdown
  const { data: studentsData } = useStudents();
  const students = useMemo(() => studentsData?.data || [], [studentsData]);
  const { data: classes = [] } = useClasses();

  // Server-side filtered transactions for a given day
  const transactionsQuery = useCurrencyTransactions(forDate);
  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
  } = transactionsQuery || {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
  };

  // Get pending requests count for badge
  const pendingRequestsQuery = useCurrencyRequests("pending", undefined);
  const {
    data: pendingRequests = [],
    refetch: refetchPendingRequests,
  } = pendingRequestsQuery || {
    data: [],
    refetch: () => Promise.resolve(),
  };

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

  // Log dates with transactions
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const datesWithTransactions = new Set<string>();
      transactions.forEach((t) => {
        const dateStr = t.createdAt.toLocaleDateString("vi-VN");
        datesWithTransactions.add(dateStr);
      });
      console.log("📅 Các ngày có giao dịch bánh mì:", Array.from(datesWithTransactions).sort().reverse());
      console.log("📊 Tổng số giao dịch:", transactions.length);
      console.log("📆 Ngày đang lọc:", dateStr ? new Date(`${dateStr}T00:00:00`).toLocaleDateString("vi-VN") : "Tất cả");
    } else if (transactions && transactions.length === 0) {
      console.log("📅 Không có giao dịch nào cho ngày:", dateStr ? new Date(`${dateStr}T00:00:00`).toLocaleDateString("vi-VN") : "Tất cả");
    }
  }, [transactions, dateStr]);

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
        <div className="flex items-center min-w-0">
          <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
          </div>
          <div className="ml-2 sm:ml-4 min-w-0 flex-1">
            <div className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">
              {transaction.studentName}
            </div>
            <div className="text-xs sm:text-sm md:text-base text-gray-500 truncate">
              ID: {transaction.studentId}
            </div>
            {/* Show admin info on mobile in student column */}
            <div className="md:hidden mt-1 text-xs text-gray-400">
              {transaction.userName || "Không rõ"}
            </div>
            {/* Show date on mobile */}
            <div className="md:hidden mt-0.5 text-xs text-gray-400">
              {transaction.createdAt.toLocaleDateString("vi-VN")}
            </div>
            {/* Show reason on mobile */}
            <div className="sm:hidden mt-1 text-xs text-gray-600 truncate">
              {transaction.reason}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "admin",
      title: "Người thực hiện",
      className: "hidden md:table-cell",
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
            <FiPlus className="w-4 h-4 text-green-600 mr-1 sm:mr-2" />
          ) : (
            <FiMinus className="w-4 h-4 text-red-600 mr-1 sm:mr-2" />
          )}
          <span
            className={`text-xs sm:text-sm md:text-base font-medium ${
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
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm md:text-base font-medium text-gray-900">
            {transaction.amount}
          </span>
          <span className="text-xs text-gray-500 md:hidden">bánh mì</span>
          <span className="hidden md:inline text-sm text-gray-500">bánh mì</span>
        </div>
      ),
    },
    {
      key: "reason",
      title: "Lý do",
      className: "hidden sm:table-cell",
      render: (_, transaction) => (
        <span className="text-sm md:text-base text-gray-900 truncate max-w-xs">
          {transaction.reason}
        </span>
      ),
    },
    {
      key: "date",
      title: "Ngày",
      className: "hidden md:table-cell",
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
        <div className="flex space-x-1 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 text-red-600 hover:text-red-700 px-2 sm:px-3"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteModal(transaction);
            }}
          >
            <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Xóa</span>
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Quản lý Bánh mì</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {isLoadingStats ? (
          <div className="sm:col-span-2 md:col-span-3 flex justify-center p-6 sm:p-8">
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

      {/* Shared Filters - Above tabs */}
      <div className="space-y-3 sm:space-y-4">
        {/* Filter by day */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-600">Lọc theo ngày</div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-primary/30 rounded-md text-xs sm:text-sm bg-primary/10 text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary min-w-0"
              aria-label="Ngày"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                console.log("🔄 Đang làm mới dữ liệu...");
                // Refetch all data
                try {
                  const promises: (Promise<any> | void)[] = [];
                  if (refetch) {
                    const result = refetch();
                    if (result) promises.push(result);
                  }
                  if (refetchStats) {
                    const result = refetchStats();
                    if (result) promises.push(result);
                  }
                  if (refetchPendingRequests) {
                    const result = refetchPendingRequests();
                    if (result) promises.push(result);
                  }
                  if (requestsRefetchFn) {
                    const result = requestsRefetchFn();
                    if (result) promises.push(result);
                  }
                  await Promise.all(promises.filter((p): p is Promise<any> => !!p));
                  console.log("✅ Đã làm mới dữ liệu thành công");
                } catch (error) {
                  console.error("❌ Lỗi khi làm mới dữ liệu:", error);
                }
              }}
              aria-label="Làm mới"
              className="flex-shrink-0"
            >
              <FiRefreshCw
                className={`h-4 w-4 sm:h-5 sm:w-5 ${isLoading || isLoadingStats ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400 flex-shrink-0"
              onClick={() => {
                setStudentQuery("");
                setDorayakiFilter("all");
                setSelectedClassId("");
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>

        {/* Frontend Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Học sinh
            </label>
            <input
              type="text"
              placeholder="Tìm theo tên/ID"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              className="w-full px-3 py-2 border border-primary/30 rounded-md text-xs sm:text-sm bg-primary/10 text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Lớp học
            </label>
            <select
              className="w-full px-3 py-2 border border-blue-300 rounded-md text-xs sm:text-sm bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>

      <div className="flex border-b border-border mb-3 sm:mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            activeTab === "transactions"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Giao dịch bánh mì
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 relative ${
            activeTab === "requests"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Yêu cầu cần duyệt
          {pendingRequests.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-600 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "transactions" && (
        <div className="gap-4 sm:gap-8">
          {/* Dorayaki Filter - Only in transactions tab */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs text-gray-600 mb-1">
              Quay Dorayaki
            </label>
            <select
              className="w-full sm:w-auto px-3 py-2 border border-blue-300 rounded-md text-xs sm:text-sm bg-blue-50 text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Student Balance Display */}
          {selectedStudentId && selectedStudent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-3 sm:p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-orange-800 truncate">
                    {selectedStudent.displayName || selectedStudent.email}
                  </h3>
                  <p className="text-orange-600 text-xs sm:text-sm md:text-base">
                    Tổng bánh mì hiện tại
                  </p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600 flex items-center gap-1">
                    <span>{selectedStudent.totalBanhRan || 0}</span>
                    <Image
                      src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
                      alt="bánh mì"
                      width={20}
                      height={20}
                      className="inline-block sm:w-5 sm:h-5 w-4 h-4"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-xs sm:text-sm md:text-base font-medium text-red-800">
                    Có lỗi xảy ra khi tải dữ liệu
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm md:text-base text-red-700">
                    <p>{error.message || "Vui lòng thử lại sau"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Currency Transactions Table */}
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Tổng số giao dịch:{" "}
              <span className="font-bold text-primary">
                {filteredTransactions.length}
              </span>
            </p>
          </div>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="px-2 sm:px-0">
              <AdminTable
                columns={columns}
                data={filteredTransactions}
                loading={isLoading}
                emptyMessage="Không có giao dịch bánh mì nào"
                showCheckbox={false}
              />
            </div>
          </div>

          {/* Create Transaction Modal */}
          <AdminModal
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
            title="Thêm bánh mì"
            subtitle="Nhập thông tin để thêm/trừ bánh mì cho học sinh"
            size="lg"
          >
            <div className="space-y-3 sm:space-y-4">
              {/* Student Selection with Balance Display */}
              <div>
                <label className="block text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2">
                  Chọn học sinh
                </label>
                <select
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">-- Chọn học sinh --</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.displayName || "Chưa có tên"} ({student.email}) -{" "}
                      {student.totalBanhRan || 0} 🍞
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Balance Display */}
              {selectedStudentId && selectedStudent && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs sm:text-sm md:text-base font-medium text-orange-800">
                      Tổng bánh mì hiện tại:
                    </span>
                    <span className="text-base sm:text-lg font-bold text-orange-600 flex items-center gap-1">
                      {selectedStudent.totalBanhRan || 0}{" "}
                      <Image
                        src="https://magical-tulumba-581427.netlify.app/img-ui/dorayaki.png"
                        alt="bánh mì"
                        width={20}
                        height={20}
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

      {activeTab === "requests" && (
        <AdminCurrencyRequests
          dateStr={dateStr}
          studentQuery={studentQuery}
          selectedClassId={selectedClassId}
          students={students}
          onRefetch={() => {
            refetch();
            refetchStats();
            refetchPendingRequests();
          }}
          onRefetchReady={(refetchFn) => setRequestsRefetchFn(() => refetchFn)}
        />
      )}
    </div>
  );
}

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
    <div className="flex items-center">
      <div className="p-2 sm:p-3 rounded-lg bg-primary/10 text-primary flex-shrink-0">
        <FiBarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="ml-3 sm:ml-4 min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900">
          {value.toLocaleString("vi-VN")} <span className="text-xs sm:text-sm font-normal text-gray-500">giao dịch</span>
        </p>
      </div>
    </div>
  </div>
);
