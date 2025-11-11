"use client";

import { useAuth } from "@/lib/auth/context";
import { ICurrencyRequest, CurrencyRequestStatus } from "@/types";
import { useMemo, useState, useEffect } from "react";
import {
  useCurrencyRequests,
  useUpdateCurrencyRequestStatus,
} from "../hooks/useCurrencyManagement";
import { Button } from "@/components/ui/Button";
import { FiCheck, FiX } from "react-icons/fi";
import { cn } from "@/utils";
import { AdminTable, AdminTableColumn } from "./common";

interface AdminCurrencyRequestsProps {
  dateStr: string;
  studentQuery: string;
  selectedClassId: string;
  students: Array<{ id: string; classIds?: string[] }>;
  onRefetch?: () => void;
  onRefetchReady?: (refetchFn: () => Promise<unknown>) => void;
}

const StatusBadge = ({ status }: { status: CurrencyRequestStatus }) => {
  return (
    <span
      className={cn("px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap", {
        "bg-yellow-100 text-yellow-800": status === "pending",
        "bg-green-100 text-green-800": status === "approved",
        "bg-red-100 text-red-800": status === "rejected",
      })}
    >
      {status === "pending"
        ? "Chờ duyệt"
        : status === "approved"
        ? "Đã duyệt"
        : "Đã từ chối"}
    </span>
  );
};

export function AdminCurrencyRequests({
  dateStr,
  studentQuery,
  selectedClassId,
  students,
  onRefetch,
  onRefetchReady,
}: AdminCurrencyRequestsProps) {
  const [activeTab, setActiveTab] = useState<CurrencyRequestStatus>("pending");

  const forDate = useMemo(
    () => (dateStr ? new Date(`${dateStr}T00:00:00`) : undefined),
    [dateStr]
  );

  const { session } = useAuth();
  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useCurrencyRequests(activeTab, forDate);
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateCurrencyRequestStatus();

  // Expose refetch function to parent
  useEffect(() => {
    if (onRefetchReady && refetch && typeof refetch === 'function') {
      onRefetchReady(refetch);
    }
  }, [refetch, onRefetchReady]);

  // Apply client-side filters
  const filteredRequests = useMemo(() => {
    const normalize = (v?: string) => (v || "").toLowerCase();
    const sq = normalize(studentQuery);

    return (requests || []).filter((req) => {
      // Student filter
      if (sq) {
        const hay = `${normalize(req.studentName)} ${req.studentId}`;
        if (!hay.includes(sq)) return false;
      }

      // Class filter
      if (selectedClassId) {
        const student = students.find((s) => s.id === req.studentId);
        if (!student || !student.classIds?.includes(selectedClassId))
          return false;
      }

      return true;
    });
  }, [requests, studentQuery, selectedClassId, students]);

  const tabs: { id: CurrencyRequestStatus; label: string }[] = [
    { id: "pending", label: "Chờ duyệt" },
    { id: "approved", label: "Đã duyệt" },
    { id: "rejected", label: "Đã từ chối" },
  ];

  const columns: AdminTableColumn<ICurrencyRequest>[] = [
    {
      key: "student",
      title: "Học sinh",
      render: (_, req) => (
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
            {req.studentName}
          </div>
          <div className="text-xs text-gray-500 truncate">
            ID: {req.studentId}
          </div>
          {/* Show class/teacher on mobile */}
          <div className="md:hidden mt-1">
            <div className="text-xs text-gray-600 truncate">
              {req.className || "-"}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {req.teacherName || "-"}
            </div>
          </div>
          {/* Show reason on mobile */}
          <div className="sm:hidden mt-1 text-xs text-gray-600 truncate">
            {req.reason}
          </div>
          {/* Show date on mobile */}
          <div className="md:hidden mt-0.5 text-xs text-gray-400">
            {req.createdAt?.toLocaleString?.("vi-VN")}
          </div>
        </div>
      ),
    },
    {
      key: "class",
      title: "Lớp / GV",
      className: "hidden md:table-cell",
      render: (_, req) => (
        <div className="text-sm text-gray-900">
          <div className="font-medium truncate">{req.className || "-"}</div>
          <div className="text-xs text-gray-500 truncate">
            {req.teacherName || "-"}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      title: "Số lượng",
      render: (_, req) => (
        <div className="flex flex-col">
          <span
            className={`text-xs sm:text-sm font-semibold ${
              req.amount > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {req.amount > 0 ? "+" : "-"}
            {Math.abs(req.amount)}
          </span>
          <span className="text-xs text-gray-500 md:hidden">bánh mì</span>
        </div>
      ),
    },
    {
      key: "reason",
      title: "Lý do",
      className: "hidden sm:table-cell",
      render: (_, req) => (
        <span className="text-sm text-gray-900 truncate inline-block max-w-[260px]">
          {req.reason}
        </span>
      ),
    },
    {
      key: "date",
      title: "Ngày",
      className: "hidden md:table-cell",
      render: (_, req) => (
        <span className="text-sm text-gray-600">
          {req.createdAt?.toLocaleString?.("vi-VN")}
        </span>
      ),
    },
    {
      key: "status",
      title: "Trạng thái",
      render: (_, req) => <StatusBadge status={req.status} />,
    },
    {
      key: "actions",
      title: "Thao tác",
      render: (_, req) => (
        <div className="flex items-center gap-1 sm:gap-2">
          {activeTab === "pending" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate(req.id, "rejected")}
                disabled={isUpdating}
                aria-label="Từ chối"
                className="px-2 sm:px-3 text-xs sm:text-sm"
              >
                <FiX className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Từ chối</span>
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdate(req.id, "approved")}
                disabled={isUpdating}
                aria-label="Duyệt"
                className="px-2 sm:px-3 text-xs sm:text-sm"
              >
                <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                <span className="hidden sm:inline">Duyệt</span>
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  // Trigger parent refetch when status is updated
  const handleUpdate = (requestId: string, status: "approved" | "rejected") => {
    if (!session?.user) return;
    updateStatus(
      {
        requestId,
        status,
        adminId: session.user.id,
        adminName: session.user.name || session.user.email!,
      },
      {
        onSuccess: () => {
          refetch();
          onRefetch?.();
        },
      }
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex border-b border-border overflow-x-auto mb-3 sm:mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-red-600">
            Đã có lỗi xảy ra: {error.message}
          </p>
        </div>
      )}

      <div className="mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm text-gray-600">
          Tổng số yêu cầu:{" "}
          <span className="font-bold text-primary">
            {filteredRequests.length}
          </span>
        </p>
      </div>

      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="px-2 sm:px-0">
          <AdminTable
            columns={columns}
            data={filteredRequests}
            loading={isLoading}
            emptyMessage="Không có yêu cầu nào trong mục này"
            showCheckbox={false}
          />
        </div>
      </div>
    </div>
  );
}
