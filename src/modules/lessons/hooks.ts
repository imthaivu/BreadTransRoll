import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLessonDetail,
  fetchLessonsForClass,
  fetchLessonInfo,
  fetchClassInfo,
  createLesson,
  updateLesson,
  deleteLesson,
  markLessonAsViewed,
  markSectionAsViewed,
  duplicateLesson,
} from "./services";

// Custom hooks for lessons module
export function useLessonDetail(classId: string, lessonId: string) {
  return useQuery({
    queryKey: ["lesson-detail", classId, lessonId],
    queryFn: () => fetchLessonDetail(classId, lessonId),
    enabled: Boolean(classId) && Boolean(lessonId),
    staleTime: 60_000,
  });
}

export function useLessonsForClass(classId: string) {
  return useQuery({
    queryKey: ["lessons-for-class", classId],
    queryFn: () => fetchLessonsForClass(classId),
    enabled: Boolean(classId),
    staleTime: 120_000,
  });
}

export function useLessonInfo(lessonId: string) {
  return useQuery({
    queryKey: ["lesson-info", lessonId],
    queryFn: () => fetchLessonInfo(lessonId),
    enabled: Boolean(lessonId),
    staleTime: 120_000,
  });
}

export function useClassInfo(classId: string) {
  return useQuery({
    queryKey: ["class-info", classId],
    queryFn: () => fetchClassInfo(classId),
    enabled: Boolean(classId),
    staleTime: 120_000,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      formData,
    }: {
      classId: string;
      formData: import("./types").LessonFormData;
    }) => createLesson(classId, formData),
    onSuccess: (_, { classId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["lessons-for-class", classId],
      });
      queryClient.invalidateQueries({ queryKey: ["lesson-detail", classId] });
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      formData,
    }: {
      lessonId: string;
      formData: Partial<import("./types").LessonFormData>;
    }) => updateLesson(lessonId, formData),
    onSuccess: (_, { lessonId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["lesson-info", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lesson-detail"] });
      queryClient.invalidateQueries({ queryKey: ["lessons-for-class"] });
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => deleteLesson(lessonId),
    onSuccess: () => {
      // Invalidate all lesson-related queries
      queryClient.invalidateQueries({ queryKey: ["lesson-detail"] });
      queryClient.invalidateQueries({ queryKey: ["lessons-for-class"] });
      queryClient.invalidateQueries({ queryKey: ["lesson-info"] });
    },
  });
}

export function useMarkLessonAsViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, userId }: { lessonId: string; userId: string }) =>
      markLessonAsViewed(lessonId, userId),
    onSuccess: (_, { lessonId }) => {
      // Invalidate lesson info to update view count
      queryClient.invalidateQueries({ queryKey: ["lesson-info", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lesson-detail"] });
    },
  });
}

export function useMarkSectionAsViewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      sectionId,
      userId,
    }: {
      lessonId: string;
      sectionId: string;
      userId: string;
    }) => markSectionAsViewed(lessonId, sectionId, userId),
    onSuccess: (_, { lessonId }) => {
      // Invalidate lesson info to update section views
      queryClient.invalidateQueries({ queryKey: ["lesson-info", lessonId] });
      queryClient.invalidateQueries({ queryKey: ["lesson-detail"] });
    },
  });
}

export function useDuplicateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      lessonId,
      newClassId,
      newTitle,
    }: {
      lessonId: string;
      newClassId: string;
      newTitle: string;
    }) => duplicateLesson(lessonId, newClassId, newTitle),
    onSuccess: (_, { newClassId }) => {
      // Invalidate lessons for the new class
      queryClient.invalidateQueries({
        queryKey: ["lessons-for-class", newClassId],
      });
    },
  });
}
