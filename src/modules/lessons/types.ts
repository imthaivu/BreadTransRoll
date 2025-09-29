// Lessons module types
export type LessonDoc = {
  title: string;
  description?: string;
  mediaType: "video" | "audio" | string;
  mediaUrl: string;
  sections?: Array<{ id: string; title: string; content: string }>;
  viewedBy?: string[];
  classId?: string;
  sectionViews?: Record<string, string[]>; // sectionId -> array of student UIDs
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type LessonLite = {
  id: string;
  title?: string;
  description?: string;
  mediaType?: string;
  classId?: string;
  createdAt?: unknown;
};

export type ScriptLite = {
  id: string;
  title: string;
  description?: string;
  sections?: Array<{ id: string }>;
  classId?: string;
  createdAt?: unknown;
};

export type ClassLite = {
  id: string;
  name?: string;
  description?: string;
  teacherUids?: string[];
  studentUids?: string[];
  createdAt?: unknown;
};

export type LessonSection = {
  id: string;
  title: string;
  content: string;
};

export type LessonFormData = {
  title: string;
  description: string;
  mediaType: "video" | "audio";
  mediaUrl: string;
  sections: LessonSection[];
};

export type LessonDetailData = {
  lesson: LessonDoc;
  className: string;
  lessons: LessonLite[];
  scripts: ScriptLite[];
  currentIndex: number;
  totalLessons: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type LessonStats = {
  totalViews: number;
  totalSections: number;
  completionRate: number;
  averageTimeSpent: number;
};

export type LessonProgress = {
  lessonId: string;
  userId: string;
  viewedSections: string[];
  completedAt?: unknown;
  timeSpent: number;
};

export type LessonFilter = {
  search: string;
  mediaType: string;
  sortBy: "createdAt" | "title" | "views";
  sortOrder: "asc" | "desc";
};

export type LessonCardProps = {
  lesson: LessonLite;
  classId: string;
  onView?: (lessonId: string) => void;
  onEdit?: (lessonId: string) => void;
  onDelete?: (lessonId: string) => void;
  userRole?: string;
};
