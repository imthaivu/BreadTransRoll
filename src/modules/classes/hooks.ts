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
} from "./services";
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
  return useMutation({
    mutationFn: createCurrencyRequest,
    onSuccess: () => {
      toast.success("Yêu cầu đã được gửi thành công!");
    },
    onError: (error) => {
      console.error("Error creating currency request:", error);
      toast.error("Gửi yêu cầu thất bại. Vui lòng thử lại.");
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
