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
        
    </div>
  );
}
