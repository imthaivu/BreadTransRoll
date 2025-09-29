import type {
  LessonDoc,
  LessonLite,
  LessonStats,
  LessonFilter,
  ClassLite,
} from "./types";
import { LESSON_MEDIA_TYPE_LABELS, LESSON_MEDIA_TYPE_ICONS } from "./constants";

// Utility functions for lessons module
export function getTimestampSeconds(value: unknown): number {
  if (
    value !== null &&
    typeof value === "object" &&
    "seconds" in (value as Record<string, unknown>)
  ) {
    const seconds = (value as { seconds: unknown }).seconds;
    return typeof seconds === "number" ? seconds : 0;
  }
  return 0;
}

export function formatDateFromTimestamp(value: unknown): string {
  const seconds = getTimestampSeconds(value);
  if (seconds === 0) return "Không xác định";

  const date = new Date(seconds * 1000);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTimeFromTimestamp(value: unknown): string {
  const seconds = getTimestampSeconds(value);
  if (seconds === 0) return "Không xác định";

  const date = new Date(seconds * 1000);
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateLessonStats(lesson: LessonDoc): LessonStats {
  const totalViews = lesson.viewedBy?.length ?? 0;
  const totalSections = lesson.sections?.length ?? 0;

  // Calculate completion rate based on section views
  let completedSections = 0;
  if (lesson.sectionViews && lesson.sections) {
    completedSections = lesson.sections.filter(
      (section) =>
        lesson.sectionViews?.[section.id] &&
        lesson.sectionViews[section.id].length > 0
    ).length;
  }

  const completionRate =
    totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  // Average time spent (placeholder calculation)
  const averageTimeSpent =
    totalViews > 0 ? Math.round(Math.random() * 30 + 10) : 0;

  return {
    totalViews,
    totalSections,
    completionRate,
    averageTimeSpent,
  };
}

export function getMediaTypeLabel(mediaType?: string): string {
  if (!mediaType) return "Không xác định";
  return (
    LESSON_MEDIA_TYPE_LABELS[
      mediaType as keyof typeof LESSON_MEDIA_TYPE_LABELS
    ] || mediaType
  );
}

export function getMediaTypeIcon(mediaType?: string): string {
  if (!mediaType) return "📄";
  return (
    LESSON_MEDIA_TYPE_ICONS[
      mediaType as keyof typeof LESSON_MEDIA_TYPE_ICONS
    ] || "📄"
  );
}

export function filterLessons(
  lessons: LessonLite[],
  filter: LessonFilter
): LessonLite[] {
  let filtered = [...lessons];

  // Search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (lesson) =>
        lesson.title?.toLowerCase().includes(searchLower) ||
        lesson.description?.toLowerCase().includes(searchLower)
    );
  }

  // Media type filter
  if (filter.mediaType && filter.mediaType !== "all") {
    filtered = filtered.filter(
      (lesson) => lesson.mediaType === filter.mediaType
    );
  }

  // Sort
  filtered.sort((a, b) => {
    let aValue: unknown;
    let bValue: unknown;

    switch (filter.sortBy) {
      case "createdAt":
        aValue = getTimestampSeconds(a.createdAt);
        bValue = getTimestampSeconds(b.createdAt);
        break;
      case "title":
        aValue = a.title || "";
        bValue = b.title || "";
        break;
      case "views":
        // Placeholder for views count
        aValue = 0;
        bValue = 0;
        break;
      default:
        aValue = getTimestampSeconds(a.createdAt);
        bValue = getTimestampSeconds(b.createdAt);
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return filter.sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return filter.sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  return filtered;
}

export function getUserRoleInClass(
  classData: ClassLite,
  userId: string,
  userRole?: string
): "admin" | "teacher" | "student" | "none" {
  if (userRole === "admin") return "admin";
  if (classData.teacherUids?.includes(userId)) return "teacher";
  if (classData.studentUids?.includes(userId)) return "student";
  return "none";
}

export function canUserAccessLesson(
  lesson: LessonDoc,
  classData: ClassLite,
  userId: string,
  userRole?: string
): boolean {
  const roleInClass = getUserRoleInClass(classData, userId, userRole);
  return roleInClass !== "none" || userRole === "admin";
}

export function canUserEditLesson(
  lesson: LessonDoc,
  classData: ClassLite,
  userId: string,
  userRole?: string
): boolean {
  const roleInClass = getUserRoleInClass(classData, userId, userRole);
  return roleInClass === "admin" || roleInClass === "teacher";
}

export function canUserDeleteLesson(
  lesson: LessonDoc,
  classData: ClassLite,
  userId: string,
  userRole?: string
): boolean {
  const roleInClass = getUserRoleInClass(classData, userId, userRole);
  return roleInClass === "admin" || roleInClass === "teacher";
}

export function getLessonNavigation(
  lessons: LessonLite[],
  currentLessonId: string
): {
  currentIndex: number;
  totalLessons: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextLesson?: LessonLite;
  previousLesson?: LessonLite;
} {
  const currentIndex = lessons.findIndex(
    (lesson) => lesson.id === currentLessonId
  );
  const totalLessons = lessons.length;
  const hasNext = currentIndex < totalLessons - 1;
  const hasPrevious = currentIndex > 0;
  const nextLesson = hasNext ? lessons[currentIndex + 1] : undefined;
  const previousLesson = hasPrevious ? lessons[currentIndex - 1] : undefined;

  return {
    currentIndex,
    totalLessons,
    hasNext,
    hasPrevious,
    nextLesson,
    previousLesson,
  };
}

export function validateLessonForm(formData: {
  title: string;
  description: string;
  mediaUrl: string;
  sections: Array<{ title: string; content: string }>;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!formData.title.trim()) {
    errors.push("Tiêu đề bài học không được để trống");
  }

  if (formData.title.length > 200) {
    errors.push("Tiêu đề bài học không được vượt quá 200 ký tự");
  }

  if (formData.description.length > 1000) {
    errors.push("Mô tả không được vượt quá 1000 ký tự");
  }

  if (!formData.mediaUrl.trim()) {
    errors.push("URL media không được để trống");
  }

  if (formData.sections.length === 0) {
    errors.push("Bài học phải có ít nhất 1 section");
  }

  if (formData.sections.length > 50) {
    errors.push("Bài học không được có quá 50 sections");
  }

  formData.sections.forEach((section, index) => {
    if (!section.title.trim()) {
      errors.push(`Section ${index + 1}: Tiêu đề không được để trống`);
    }
    if (!section.content.trim()) {
      errors.push(`Section ${index + 1}: Nội dung không được để trống`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ["mp4", "webm", "ogg", "avi", "mov"];
  const extension = getFileExtension(filename).toLowerCase();
  return videoExtensions.includes(extension);
}

export function isAudioFile(filename: string): boolean {
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "aac"];
  const extension = getFileExtension(filename).toLowerCase();
  return audioExtensions.includes(extension);
}
