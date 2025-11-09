"use client";

import { motion } from "framer-motion";
import {
  FiLayers,
  FiUserPlus,
  FiUsers,
  FiShield,
  FiEye,
  FiUserCheck,
  FiMic,
  FiTrash2,
} from "react-icons/fi";
import { useDashboardStats } from "../hooks/useDashboardStats";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import VisitorLineChart from "./charts/VisitorLineChart";
import { useState } from "react";
import ActivityLineChart from "./charts/ActivityLineChart";
import {
  useTotalSpeakingSubmissions,
  useDeleteAllSpeakingAudio,
} from "../hooks/useSpeakingManagement";
import { useUpcomingBirthdays } from "../hooks/useBirthdays";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { FiGift } from "react-icons/fi";
import Image from "next/image";

export default function AdminDashboard() {
  const [visitorRange, setVisitorRange] = useState<"week" | "month">("week");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const {
    data: statsData,
    isLoading,
    isError,
  } = useDashboardStats(visitorRange);
  const { data: totalSpeakingSubmissions = 0, isLoading: isLoadingSpeaking } =
    useTotalSpeakingSubmissions();
  const { mutate: deleteAllAudio, isPending: isDeleting } = useDeleteAllSpeakingAudio();
  const { data: upcomingBirthdays = [], isLoading: isLoadingBirthdays } =
    useUpcomingBirthdays(10);

  const handleDeleteAllAudio = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAll = () => {
    setShowDeleteConfirm(false);
    deleteAllAudio();
  };

  const stats = [
    {
      title: "Người dùng đăng ký mới trong tháng này",
      value: statsData?.newUsersThisMonth ?? 0,
      icon: <FiUsers className="w-6 h-6" />,
      color: "blue",
    },
    {
      title: "Tổng số lớp học",
      value: statsData?.totalClasses ?? 0,
      icon: <FiLayers className="w-6 h-6" />,
      color: "green",
    },
    {
      title: "Tổng số giáo viên",
      value: statsData?.totalTeachers ?? 0,
      icon: <FiUserPlus className="w-6 h-6" />,
      color: "purple",
    },
    {
      title: "Tổng số học sinh",
      value: statsData?.totalStudents ?? 0,
      icon: <FiShield className="w-6 h-6" />,
      color: "orange",
    },
  ];

  const visitorStats = [
    {
      title: `Khách vãng lai (${
        visitorRange === "week" ? "tuần này" : "tháng này"
      })`,
      value: statsData?.visitorStats?.totalAnonymous ?? 0,
      icon: <FiEye className="w-6 h-6" />,
      color: "indigo",
    },
    {
      title: `Người dùng Guest (${
        visitorRange === "week" ? "tuần này" : "tháng này"
      })`,
      value: statsData?.visitorStats?.totalGuest ?? 0,
      icon: <FiUserCheck className="w-6 h-6" />,
      color: "teal",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Đã có lỗi xảy ra khi tải dữ liệu.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
      </div>

      {/* Upcoming Birthdays Card */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-pink-100 text-pink-600">
              <FiGift className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Sinh nhật sắp tới (10 ngày)
            </h2>
          </div>
          {isLoadingBirthdays ? (
            <div className="text-center py-4 text-gray-500">Đang tải...</div>
          ) : (
            <div className="space-y-2">
              {upcomingBirthdays.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.displayName || ""}
                      width={40}
                      height={40}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 font-medium">
                        {(user.displayName || user.email || "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.role === "student" ? "Học sinh" : "Giáo viên"} •{" "}
                      {user.birthdayDate.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                      {user.daysUntilBirthday === 0 && (
                        <span className="ml-2 text-pink-600 font-semibold">🎉 Hôm nay!</span>
                      )}
                      {user.daysUntilBirthday === 1 && (
                        <span className="ml-2 text-orange-600 font-semibold">Ngày mai</span>
                      )}
                      {user.daysUntilBirthday > 1 && (
                        <span className="ml-2 text-gray-600">
                          Còn {user.daysUntilBirthday} ngày
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Speaking Submissions Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg bg-red-100 text-red-600 flex-shrink-0">
              <FiMic className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm md:text-base font-medium text-gray-600">
                Tổng số bài audio nói đã nộp
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                {isLoadingSpeaking ? "..." : totalSpeakingSubmissions.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleDeleteAllAudio}
            disabled={totalSpeakingSubmissions === 0 || isDeleting || isLoadingSpeaking}
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 flex-shrink-0"
            size="sm"
          >
            <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">
              {isDeleting ? "Đang xóa..." : `Xóa tất cả (${totalSpeakingSubmissions.toLocaleString("vi-VN")})`}
            </span>
            <span className="sm:hidden">
              {isDeleting ? "Đang xóa..." : `Xóa tất cả`}
            </span>
          </Button>
        </div>
      </div>

      <ActivityLineChart
        speakingData={statsData?.speakingSubmissionsLast7Days ?? []}
        userData={statsData?.newUsersLast7Days ?? []}
        listeningData={statsData?.listeningProgressLast7Days ?? []}
        quizData={statsData?.quizResultsLast7Days ?? []}
      />

      {/* Stats - Mobile: merge 4 cards into one, Desktop: original grid */}
      {/* Mobile merged card */}
      <div className="block md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <h4 className="text-base font-semibold text-gray-800 mb-3">
            Tổng quan
          </h4>
          <div className="divide-y divide-gray-100">
            {stats.map((stat) => (
              <div key={stat.title} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                    {stat.icon}
                  </div>
                  <p className="text-sm font-medium text-gray-600 max-w-[180px]">
                    {stat.title}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Desktop / Tablet grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}
              >
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
        {visitorStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.3 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base font-medium text-gray-600">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}
              >
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
        {Array.isArray(statsData?.visitorStats?.dailyData) &&
          statsData!.visitorStats!.dailyData.length >= 2 && (
            <VisitorLineChart
              data={statsData!.visitorStats!.dailyData}
              range={visitorRange}
              onRangeChange={setVisitorRange}
            />
          )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteAll}
        title="Xác nhận xóa tất cả file audio"
        message={`Bạn có chắc chắn muốn xóa tất cả ${totalSpeakingSubmissions} file audio đã nộp không? Lưu ý: Trạng thái nộp bài sẽ được giữ lại, chỉ file audio trong storage sẽ bị xóa. Hành động này không thể hoàn tác.`}
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        confirmVariant="destructive"
      />
    </div>
  );
}
