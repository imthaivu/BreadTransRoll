"use client";

import { motion } from "framer-motion";
import {
  FiLayers,
  FiUserPlus,
  FiUsers,
  FiShield,
  FiEye,
  FiUserCheck,
} from "react-icons/fi";
import { useDashboardStats } from "../hooks/useDashboardStats";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import VisitorLineChart from "./charts/VisitorLineChart";
import { useState } from "react";
import ActivityLineChart from "./charts/ActivityLineChart";

export default function AdminDashboard() {
  const [visitorRange, setVisitorRange] = useState<"week" | "month">("week");
  const {
    data: statsData,
    isLoading,
    isError,
  } = useDashboardStats(visitorRange);

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
        <p className="text-gray-600 mt-2">
          Quản lý toàn bộ hệ thống, người dùng và nội dung
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <VisitorLineChart
          data={statsData?.visitorStats?.dailyData ?? []}
          range={visitorRange}
          onRangeChange={setVisitorRange}
        />
        <ActivityLineChart
          speakingData={statsData?.speakingSubmissionsLast7Days ?? []}
          userData={statsData?.newUsersLast7Days ?? []}
          listeningData={statsData?.listeningProgressLast7Days ?? []}
          quizData={statsData?.quizResultsLast7Days ?? []}
        />
      </div>
    </div>
  );
}
