"use client";

import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useBooks } from "@/modules/flashcard/hooks";
import { useMemo, useState } from "react";
import { FiTrash2, FiCheckSquare, FiSquare, FiUsers } from "react-icons/fi";
import {
  useClassMembers,
  useClassQuizResults,
  useDeleteClassQuizResultsByBook,
  useDeleteQuizResults,
} from "../hooks";
import { ClassQuizResult } from "../services-quiz";

interface QuizResultManagerProps {
  classId: string;
}

export function QuizResultManager({ classId }: QuizResultManagerProps) {
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [dateFilterMode, setDateFilterMode] = useState<"all" | "today" | "custom">("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"all" | "selected" | "byStudents">("all");

  const { data: books } = useBooks();
  const { data: members } = useClassMembers(classId);
  const students = useMemo(
    () => members?.filter((m) => m.role === "student") || [],
    [members]
  );

  // Calculate date filter
  const dateFilter = useMemo(() => {
    if (dateFilterMode === "all") {
      return null;
    } else if (dateFilterMode === "today") {
      const today = new Date();
      // Reset to local midnight to ensure consistent filtering
      today.setHours(0, 0, 0, 0);
      return today;
    } else if (dateFilterMode === "custom" && customDate) {
      // Parse date string and create date in local timezone
      const [year, month, day] = customDate.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    // Default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [dateFilterMode, customDate]);

  const {
    data: quizResults = [],
    isLoading,
    error,
  } = useClassQuizResults(classId, selectedBook, dateFilter);
  const { mutate: deleteSelected, isPending: isDeletingSelected } =
    useDeleteQuizResults();
  const { mutate: deleteAllByBook, isPending: isDeletingAll } =
    useDeleteClassQuizResultsByBook();

  // Group results by student
  const resultsByStudent = useMemo(() => {
    const grouped = new Map<string, ClassQuizResult[]>();
    quizResults.forEach((result) => {
      if (!grouped.has(result.userId)) {
        grouped.set(result.userId, []);
      }
      grouped.get(result.userId)!.push(result);
    });
    return grouped;
  }, [quizResults]);

  // Get students with results
  const studentsWithResults = useMemo(() => {
    const studentIds = new Set(quizResults.map((r) => r.userId));
    return students.filter((s) => studentIds.has(s.id));
  }, [students, quizResults]);

  const handleSelectAll = () => {
    if (selectedResults.size === quizResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(quizResults.map((r) => r.id)));
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.size === studentsWithResults.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(studentsWithResults.map((s) => s.id)));
    }
  };

  const handleToggleResult = (resultId: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleDeleteAll = () => {
    setDeleteMode("all");
    setShowDeleteConfirm(true);
  };

  const handleDeleteSelected = () => {
    if (selectedResults.size === 0) {
      return;
    }
    setDeleteMode("selected");
    setShowDeleteConfirm(true);
  };

  const handleDeleteByStudents = () => {
    if (selectedStudents.size === 0) {
      return;
    }
    setDeleteMode("byStudents");
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteMode === "all") {
      deleteAllByBook({ classId, bookId: selectedBook });
    } else if (deleteMode === "byStudents") {
      // Get all result IDs for selected students
      const resultIdsToDelete: string[] = [];
      selectedStudents.forEach((studentId) => {
        const studentResults = resultsByStudent.get(studentId) || [];
        resultIdsToDelete.push(...studentResults.map((r) => r.id));
      });
      if (resultIdsToDelete.length > 0) {
        deleteSelected(resultIdsToDelete);
        setSelectedStudents(new Set());
      }
    } else {
      deleteSelected(Array.from(selectedResults));
      setSelectedResults(new Set());
    }
    setShowDeleteConfirm(false);
  };

  // Get count of results for selected students
  const selectedStudentsResultCount = useMemo(() => {
    let count = 0;
    selectedStudents.forEach((studentId) => {
      count += resultsByStudent.get(studentId)?.length || 0;
    });
    return count;
  }, [selectedStudents, resultsByStudent]);

  const selectedBookName = books?.find((b) => b.id.toString() === selectedBook)
    ?.name;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Book Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <label className="text-sm font-medium whitespace-nowrap">Chọn sách:</label>
          <select
            value={selectedBook}
            onChange={(e) => {
              setSelectedBook(e.target.value);
              setSelectedResults(new Set());
              setSelectedStudents(new Set());
            }}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">-- Chọn sách --</option>
            {books?.map((book) => (
              <option key={book.id} value={book.id.toString()}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBook && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium whitespace-nowrap">Lọc theo ngày:</label>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                value={dateFilterMode}
                onChange={(e) => {
                  const mode = e.target.value as "all" | "today" | "custom";
                  setDateFilterMode(mode);
                  if (mode === "custom") {
                    // Set default to today's date in YYYY-MM-DD format
                    const today = new Date().toISOString().split("T")[0];
                    setCustomDate(today);
                  }
                  setSelectedResults(new Set());
                  setSelectedStudents(new Set());
                }}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay</option>
                <option value="custom">Chọn ngày cụ thể</option>
              </select>
              {dateFilterMode === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setSelectedResults(new Set());
                    setSelectedStudents(new Set());
                  }}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {!selectedBook ? (
        <p className="text-muted text-center py-8">
          Vui lòng chọn sách để xem danh sách bài quiz
        </p>
      ) : isLoading ? (
        <p className="text-center py-8">Đang tải dữ liệu...</p>
      ) : error ? (
        <p className="text-red-500 text-center py-8">
          Có lỗi xảy ra khi tải dữ liệu
        </p>
      ) : quizResults.length === 0 ? (
        <p className="text-muted text-center py-8">
          Không có bài quiz nào đã nộp trong sách này
        </p>
      ) : (
        <>
          {/* Student Selection Section */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 flex-shrink-0" />
                <h3 className="text-sm font-semibold">Chọn theo học sinh:</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllStudents}
                  disabled={studentsWithResults.length === 0}
                  className="w-full sm:w-auto justify-center"
                >
                  {selectedStudents.size === studentsWithResults.length ? (
                    <FiCheckSquare className="w-4 h-4 mr-2" />
                  ) : (
                    <FiSquare className="w-4 h-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Chọn tất cả </span>
                  ({selectedStudents.size}/{studentsWithResults.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteByStudents}
                  disabled={selectedStudents.size === 0}
                  className="text-red-600 hover:text-red-700 w-full sm:w-auto justify-center"
                >
                  <FiTrash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Xóa bài của học sinh đã chọn </span>
                  <span className="sm:hidden">Xóa ({selectedStudentsResultCount})</span>
                  <span className="hidden sm:inline">({selectedStudentsResultCount})</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {studentsWithResults.map((student) => {
                const studentResults = resultsByStudent.get(student.id) || [];
                return (
                  <button
                    key={student.id}
                    onClick={() => handleToggleStudent(student.id)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm border transition-all ${
                      selectedStudents.has(student.id)
                        ? "bg-primary text-white border-blue-400"
                        : "bg-white dark:bg-gray-800 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {student.name} <span className="text-xs">({studentResults.length})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-2 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={quizResults.length === 0}
                className="w-full sm:w-auto justify-center"
              >
                {selectedResults.size === quizResults.length ? (
                  <FiCheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <FiSquare className="w-4 h-4 mr-2" />
                )}
                <span className="hidden sm:inline">Chọn tất cả bài </span>
                <span className="sm:hidden">Chọn tất cả </span>
                ({selectedResults.size}/{quizResults.length})
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedResults.size === 0}
                className="text-red-600 hover:text-red-700 w-full sm:w-auto justify-center"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Xóa bài đã chọn </span>
                <span className="sm:hidden">Xóa đã chọn </span>
                ({selectedResults.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteAll}
                className="text-red-600 hover:text-red-700 w-full sm:w-auto justify-center"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Xóa tất cả trong sách</span>
                <span className="sm:hidden">Xóa tất cả</span>
              </Button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase w-10 sm:w-12">
                        <input
                          type="checkbox"
                          checked={
                            selectedResults.size === quizResults.length &&
                            quizResults.length > 0
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                        Học sinh
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[80px]">
                        Bài học
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[70px]">
                        Điểm
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[90px] hidden md:table-cell">
                        Độ chính xác
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[110px] hidden sm:table-cell">
                        Trạng thái
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[140px]">
                        Ngày nộp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {quizResults.map((result) => (
                      <tr
                        key={result.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          selectedResults.has(result.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedResults.has(result.id)}
                            onChange={() => handleToggleResult(result.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                          {result.studentName}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                          Bài {result.lessonId}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm whitespace-nowrap">
                          {result.score}/{result.totalWords || "N/A"}
                          <span className="md:hidden ml-1 text-gray-500">
                            ({result.accuracy}%)
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">
                          {result.accuracy}%
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap hidden sm:table-cell">
                          {result.isCompleted ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Hoàn thành
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Chưa hoàn thành
                            </span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                          <span className="hidden lg:inline">
                            {result.lastAttempt.toLocaleString("vi-VN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="lg:hidden">
                            {result.lastAttempt.toLocaleString("vi-VN", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa bài quiz"
        message={
          deleteMode === "all"
            ? `Bạn có chắc chắn muốn xóa TẤT CẢ ${quizResults.length} bài quiz trong sách "${selectedBookName}" không? Hành động này không thể hoàn tác.`
            : deleteMode === "byStudents"
            ? `Bạn có chắc chắn muốn xóa ${selectedStudentsResultCount} bài quiz của ${selectedStudents.size} học sinh đã chọn không? Hành động này không thể hoàn tác.`
            : `Bạn có chắc chắn muốn xóa ${selectedResults.size} bài quiz đã chọn không? Hành động này không thể hoàn tác.`
        }
        confirmText="Xóa"
        cancelText="Hủy"
        confirmVariant="destructive"
      />
    </div>
  );
}

