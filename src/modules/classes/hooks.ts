"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCurrencyRequest,
  getClassDetails,
  getClassMembers,
  getClassProgressActivities,
  getLessonStudentProgress,
  getStudentClasses,
  getTeacherClasses,
  updateClassLinks,
  getClassQuizResults,
  deleteQuizResults,
  deleteClassQuizResultsByBook,
} from "./services";
import { getStudentQuizCountsByDate } from "./services-quiz";
import toast from "react-hot-toast";

export const teacherClassKeys = {
  all: ["teacherClasses"] as const,
  lists: () => [...teacherClassKeys.all, "list"] as const,
  list: (teacherId: string) =>
    [...teacherClassKeys.lists(), { teacherId }] as const,
  details: () => [...teacherClassKeys.all, "detail"] as const,
  detail: (id: string) => [...teacherClassKeys.details(), id] as const,
  members: (classId: string) =>
    [...teacherClassKeys.detail(classId), "members"] as const,
  progress: (classId: string, bookId?: string, lessonId?: string) =>
    [
      ...teacherClassKeys.detail(classId),
      "progress",
      { bookId, lessonId },
    ] as const,
  studentClasses: (studentId?: string) =>
    [...teacherClassKeys.all, "student", { studentId }] as const,
};

export const useCreateCurrencyRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCurrencyRequest,
    onSuccess: () => {
      toast.success("Yêu cầu đã được gửi thành công! Admin sẽ xem xét và duyệt yêu cầu.");
      // Invalidate all currency requests queries so admin can see new requests immediately
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            key.length >= 2 &&
            key[0] === "currency" &&
            key[1] === "requests"
          );
        },
      });
    },
    onError: (error: Error | unknown) => {
      console.error("Error creating currency request:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gửi yêu cầu thất bại. Vui lòng thử lại.";
      toast.error(errorMessage);
    },
  });
};

export const useUpdateClassLinks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClassLinks,
    onSuccess: (_, { classId }) => {
      toast.success("Cập nhật liên kết thành công!");
      queryClient.invalidateQueries({
        queryKey: teacherClassKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: teacherClassKeys.detail(classId),
      });
    },
    onError: (error) => {
      console.error("Error updating class links:", error);
      toast.error("Cập nhật liên kết thất bại.");
    },
  });
};

export const useTeacherClasses = (teacherId: string | undefined) => {
  return useQuery({
    queryKey: teacherClassKeys.list(teacherId!),
    queryFn: () => getTeacherClasses(teacherId!),
    enabled: !!teacherId,
  });
};

export const useStudentClasses = (studentId: string | undefined) => {
  return useQuery({
    queryKey: teacherClassKeys.studentClasses(studentId),
    queryFn: () => getStudentClasses(studentId!),
    enabled: !!studentId,
  });
};

export const useClassDetails = (classId: string, teacherId: string) => {
  return useQuery({
    queryKey: teacherClassKeys.detail(classId),
    queryFn: () => getClassDetails(classId, teacherId),
    enabled: !!classId && !!teacherId,
  });
};

export const useClassMembers = (classId: string) => {
  return useQuery({
    queryKey: teacherClassKeys.members(classId),
    queryFn: () => getClassMembers(classId),
    enabled: !!classId,
  });
};

/**
 * Hook to fetch all progress activities for a specific class.
 */
export const useClassProgress = (
  classId: string,
  bookId: string,
  lessonId: string
) => {
  return useQuery({
    queryKey: ["classProgress", classId, bookId, lessonId],
    queryFn: () => getClassProgressActivities(classId, bookId, lessonId),
    enabled: !!classId && !!bookId && !!lessonId,
  });
};

/**
 * Hook to fetch aggregated progress for all students in a class for a specific lesson.
 */
export const useLessonStudentProgress = (
  classId: string,
  bookId: string,
  lessonId: string
) => {
  return useQuery({
    queryKey: teacherClassKeys.progress(classId, bookId, lessonId),
    queryFn: () => getLessonStudentProgress(classId, bookId, lessonId),
    enabled: !!classId && !!bookId && !!lessonId,
  });
};

/**
 * Hook to fetch quiz results for a class in a specific book
 * @param dateFilter - Optional date to filter results. If null/undefined, returns all results.
 */
export const useClassQuizResults = (
  classId: string,
  bookId: string,
  dateFilter?: Date | null
) => {
  const dateKey = dateFilter
    ? dateFilter.toISOString().split("T")[0]
    : "all-time";
  return useQuery({
    queryKey: ["classQuizResults", classId, bookId, dateKey],
    queryFn: () => getClassQuizResults(classId, bookId, dateFilter),
    enabled: !!classId && !!bookId,
  });
};

/**
 * Hook to delete quiz results
 */
export const useDeleteQuizResults = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuizResults,
    onSuccess: (_, quizResultIds) => {
      toast.success(`Đã xóa ${quizResultIds.length} bài quiz thành công!`);
      // Invalidate all related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            (key[0] === "classQuizResults" ||
              key[0] === "classProgress" ||
              key.includes("progress"))
          );
        },
      });
    },
    onError: (error) => {
      console.error("Error deleting quiz results:", error);
      toast.error("Xóa bài quiz thất bại. Vui lòng thử lại.");
    },
  });
};

/**
 * Hook to delete all quiz results for a class in a specific book
 */
export const useDeleteClassQuizResultsByBook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, bookId }: { classId: string; bookId: string }) =>
      deleteClassQuizResultsByBook(classId, bookId),
    onSuccess: (_, { classId, bookId }) => {
      toast.success("Đã xóa tất cả bài quiz trong sách này thành công!");
      // Invalidate all related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) &&
            (key[0] === "classQuizResults" ||
              (key[0] === "classProgress" && key[2] === bookId) ||
              key.includes("progress"))
          );
        },
      });
      // Invalidate specific query
      queryClient.invalidateQueries({
        queryKey: ["classQuizResults", classId, bookId],
      });
    },
    onError: (error) => {
      console.error("Error deleting quiz results by book:", error);
      toast.error("Xóa bài quiz thất bại. Vui lòng thử lại.");
    },
  });
};

/**
 * Hook to get quiz result counts by date for students in a class
 * Returns a Map of studentId -> count of quiz results submitted on the specified date
 */
export const useStudentQuizCountsByDate = (
  classId: string,
  targetDate: Date
) => {
  return useQuery({
    queryKey: ["studentQuizCountsByDate", classId, targetDate.toISOString().split("T")[0]],
    queryFn: () => getStudentQuizCountsByDate(classId, targetDate),
    enabled: !!classId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
