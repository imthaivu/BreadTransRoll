"use client";

import { useAuth } from "@/lib/auth/context";
import { ICurrencyRequest, CurrencyRequestStatus } from "@/types";
import { useEffect, useMemo, useState } from "react";
import {
  useCurrencyRequests,
  useUpdateCurrencyRequestStatus,
} from "../hooks/useCurrencyManagement";
import { Button } from "@/components/ui/Button";
import { FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import { cn } from "@/utils";
import { AdminTable, AdminTableColumn } from "./common";

const StatusBadge = ({ status }: { status: CurrencyRequestStatus }) => {
  return (
    <span
      className={cn("px-2 py-1 text-xs font-medium rounded-full", {
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

export function AdminCurrencyRequests() {
  const [activeTab, setActiveTab] = useState<CurrencyRequestStatus>("pending");
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    // default to today
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

  const { session } = useAuth();
  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useCurrencyRequests(activeTab, forDate);
  const { mutate: updateStatus, isPending: isUpdating } =
    useUpdateCurrencyRequestStatus();

  const handleUpdate = (requestId: string, status: "approved" | "rejected") => {
    if (!session?.user) return;
    updateStatus({
      requestId,
      status,
      adminId: session.user.id,
      adminName: session.user.name || session.user.email!,
    });
  };

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
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {req.studentName}
          </div>
          <div className="text-xs text-gray-500 truncate">
            ID: {req.studentId}
          </div>
        </div>
      ),
    },
    {
      key: "class",
      title: "Lớp / GV",
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
        <span
          className={`text-sm font-semibold ${
            req.amount > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {req.amount > 0 ? "+" : "-"}
          {Math.abs(req.amount)}
        </span>
      ),
    },
    {
      key: "reason",
      title: "Lý do",
      render: (_, req) => (
        <span className="text-sm text-gray-900 truncate inline-block max-w-[260px]">
          {req.reason}
        </span>
      ),
    },
    {
      key: "date",
      title: "Ngày",
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
        <div className="flex items-center gap-2">
          {activeTab === "pending" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdate(req.id, "rejected")}
                disabled={isUpdating}
                aria-label="Từ chối"
              >
                <FiX className="mr-1" /> Từ chối
              </Button>
              <Button
                size="sm"
                onClick={() => handleUpdate(req.id, "approved")}
                disabled={isUpdating}
                aria-label="Duyệt"
              >
                <FiCheck className="mr-1" /> Duyệt
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
            aria-label="Ngày"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            aria-label="Làm mới"
          >
            <FiRefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-red-500">Đã có lỗi xảy ra: {error.message}</p>
      )}

      <AdminTable
        columns={columns}
        data={requests}
        loading={isLoading}
        emptyMessage="Không có yêu cầu nào trong mục này"
        showCheckbox={false}
      />
    </div>
  );
}
