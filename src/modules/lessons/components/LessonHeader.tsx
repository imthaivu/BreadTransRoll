import { FiBook, FiUsers, FiEye, FiClock } from "react-icons/fi";
import type { LessonDoc } from "../types";
import {
  calculateLessonStats,
  getMediaTypeIcon,
  formatDateFromTimestamp,
} from "../utils";

interface LessonHeaderProps {
  lesson: LessonDoc;
  className: string;
  loading?: boolean;
}

export function LessonHeader({
  lesson,
  className,
  loading = false,
}: LessonHeaderProps) {
  const stats = calculateLessonStats(lesson);
  const mediaIcon = getMediaTypeIcon(lesson.mediaType);
  const createdAt = formatDateFromTimestamp(lesson.createdAt);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 rounded-2xl p-8 mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded mb-6 w-2/3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/80 rounded-xl p-4">
                <div className="h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 rounded-2xl p-8 mb-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-200 to-emerald-200 flex items-center justify-center text-3xl border-2 border-green-300/50 shadow-lg">
          {mediaIcon}
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-2">
            {lesson.title || "Bài học không tên"}
          </h1>
          <p className="text-lg text-green-700 mb-1">{className}</p>
          {lesson.description && (
            <p className="text-sm md:text-base text-green-600">
              {lesson.description}
            </p>
          )}
          {createdAt && (
            <p className="text-xs text-green-500 mt-1">Tạo lúc: {createdAt}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-green-200/50 shadow-sm">
          <FiBook className="text-2xl mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-green-800">
            {stats.totalSections}
          </div>
          <div className="text-sm md:text-base text-green-700">Sections</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-emerald-200/50 shadow-sm">
          <FiEye className="text-2xl mx-auto mb-2 text-emerald-600" />
          <div className="text-2xl font-bold text-emerald-800">
            {stats.totalViews}
          </div>
          <div className="text-sm md:text-base text-emerald-700">Lượt xem</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-teal-200/50 shadow-sm">
          <FiUsers className="text-2xl mx-auto mb-2 text-teal-600" />
          <div className="text-2xl font-bold text-teal-800">
            {stats.completionRate.toFixed(0)}%
          </div>
          <div className="text-sm md:text-base text-teal-700">Hoàn thành</div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-center border border-cyan-200/50 shadow-sm">
          <FiClock className="text-2xl mx-auto mb-2 text-cyan-600" />
          <div className="text-2xl font-bold text-cyan-800">
            {stats.averageTimeSpent}m
          </div>
          <div className="text-sm md:text-base text-cyan-700">Thời gian TB</div>
        </div>
      </div>
    </div>
  );
}
