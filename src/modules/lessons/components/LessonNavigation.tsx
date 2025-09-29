import Link from "next/link";
import { FiChevronLeft, FiChevronRight, FiList } from "react-icons/fi";
import type { LessonLite } from "../types";

interface LessonNavigationProps {
  lessons: LessonLite[];
  classId: string;
  hasNext: boolean;
  hasPrevious: boolean;
  currentIndex: number;
  totalLessons: number;
}

export function LessonNavigation({
  lessons,
  classId,
  hasNext,
  hasPrevious,
  currentIndex,
  totalLessons,
}: LessonNavigationProps) {
  const nextLesson = hasNext ? lessons[currentIndex + 1] : undefined;
  const previousLesson = hasPrevious ? lessons[currentIndex - 1] : undefined;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-8 border border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Previous Lesson */}
        <div className="flex-1">
          {hasPrevious && previousLesson ? (
            <Link
              href={`/classes/${classId}/lessons/${previousLesson.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              <div className="text-left">
                <div className="text-xs text-gray-500">Bài trước</div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600 truncate max-w-[200px]">
                  {previousLesson.title || "Bài học không tên"}
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 p-3 text-gray-400">
              <FiChevronLeft className="w-5 h-5" />
              <div className="text-left">
                <div className="text-xs">Bài trước</div>
                <div className="font-medium">Không có</div>
              </div>
            </div>
          )}
        </div>

        {/* Lesson Counter */}
        <div className="flex items-center gap-4 px-6">
          <Link
            href={`/classes/${classId}/lessons`}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <FiList className="w-4 h-4" />
            <span className="text-sm md:text-base font-medium">Danh sách</span>
          </Link>

          <div className="text-center">
            <div className="text-sm md:text-base text-gray-500">
              Bài {currentIndex + 1} / {totalLessons}
            </div>
            <div className="text-xs text-gray-400">
              {Math.round(((currentIndex + 1) / totalLessons) * 100)}% hoàn
              thành
            </div>
          </div>
        </div>

        {/* Next Lesson */}
        <div className="flex-1">
          {hasNext && nextLesson ? (
            <Link
              href={`/classes/${classId}/lessons/${nextLesson.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div className="text-right">
                <div className="text-xs text-gray-500">Bài tiếp</div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600 truncate max-w-[200px]">
                  {nextLesson.title || "Bài học không tên"}
                </div>
              </div>
              <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </Link>
          ) : (
            <div className="flex items-center gap-3 p-3 text-gray-400">
              <div className="text-right">
                <div className="text-xs">Bài tiếp</div>
                <div className="font-medium">Không có</div>
              </div>
              <FiChevronRight className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
