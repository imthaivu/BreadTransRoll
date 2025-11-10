// ===== USER & AUTHENTICATION =====

import { AppUserProfile } from "@/lib/auth/types";

export interface IProfile extends AppUserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  classIds?: string[];
  totalBanhRan?: number;
  streakCount?: number;
  lastStreakUpdate?: Date;
}

export interface IStudent extends IProfile {
  parentEmail?: string;
  parentPhone?: string;
  grade?: string;
  school?: string;
  dateOfBirth?: Date;
  address?: string;
  totalBanhRan?: number;
}

export interface ITeacher extends IProfile {
  phone?: string;
  address?: string;
  specialization?: string;
  experience?: number;
}

// // ===== CLASS MANAGEMENT =====
// export enum ClassStatus {
//   ACTIVE = "active",
//   INACTIVE = "inactive",
// }

export interface IClassTeacher {
  id: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
}

export interface IClassMember {
  id: string; // This will be the user ID
  name: string;
  email: string;
  avatarUrl?: string;
  role: "student" | "teacher";
  status: "active" | "inactive";
  joinedAt: Date;
  // Extra optional student fields for convenience
  phone?: string; // parent phone or user phone
  parentEmail?: string;
  parentPhone?: string;
  grade?: string;
  school?: string;
  dateOfBirth?: Date | null;
  address?: string;
  totalBanhRan?: number;
}

export interface IClass {
  id: "string";
  name: string;
  status: ClassStatus;
  links: {
    zalo?: string;
    meet?: string;
  };
  teacher: IClassTeacher;
  noteProcess?: string; // Ghi chú quá trình học tập - giáo viên có thể chỉnh sửa
  createdAt: Date;
  updatedAt: Date;
}

export interface IGrammarClass {
  id: string;
  grade: number;
  name: string;
  zaloLink: string;
  meetLink: string;
  status: ClassStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ===== LESSON & CONTENT =====
export interface ILesson {
  id: string;
  classId: string;
  title: string;
  description: string;
  content: string;
  audioUrl?: string;
  videoUrl?: string;
  order: number;
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface IStreamlineBook {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  audioFiles: IAudioFile[];
  level: string;
  missingLessons: number;
}

export interface ILessons1000Book {
  id: string;
  title: string;
  coverImage: string;
  audioFiles: IAudioFile[];
}

export interface IAudioFile {
  id: string;
  title: string;
  url: string;
  duration?: number;
  order: number;
}

// ===== GRAMMAR SYSTEM =====
export interface IGrammarBook {
  id: string;
  grade: number;
  title: string;
  description: string;
  topics: IGrammarTopic[];
}

export interface IGrammarTopic {
  id: string;
  title: string;
  description: string;
  exercises: IGrammarExercise[];
}

export interface IGrammarExercise {
  exerciseNo: number;
  subNo: number;
  title: string;
  video: string;
}

// ===== FLASHCARD SYSTEM =====
export interface IFlashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: Date;
  updatedAt: Date;
}

export interface IFlashcardSet {
  id: string;
  title: string;
  description: string;
  cards: IFlashcard[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== LEADERBOARD & GAMIFICATION =====
export interface ILeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  score: number;
  rank: number;
  classId: string;
  className: string;
  lastUpdated: Date;
}

export interface ICurrencyTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "earn" | "spend" | "admin_add" | "admin_subtract";
  description: string;
  createdAt: Date;
  createdBy: string;
}

// ===== SHOPPING SYSTEM =====
export interface IShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "avatar" | "badge" | "theme" | "premium";
  image: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchase {
  id: string;
  userId: string;
  itemId: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: Date;
}

// ===== NOTIFICATIONS =====
export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: Date;
}

// ===== SYSTEM SETTINGS =====
export interface ISystemSettings {
  id: string;
  key: string;
  value: unknown;
  description: string;
  updatedAt: Date;
  updatedBy: string;
}

// ===== API RESPONSES =====
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
  sourceUrl?: string; // For listening to speaking submissions
  listenCount?: number; // For listening activities
}

export interface IPaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type CurrencyRequestStatus = "pending" | "approved" | "rejected";

export interface ICurrencyRequest {
  id: string;
  studentId: string;
  studentName: string; // denormalized for easy display
  teacherId: string;
  teacherName: string; // denormalized
  classId: string;
  className: string; // denormalized
  amount: number; // positive for addition, negative for subtraction
  reason: string;
  status: CurrencyRequestStatus;
  createdAt: Date;
  reviewedBy?: string; // admin's uid
  reviewedAt?: Date;
}

// ===== FORM TYPES =====
export interface ILoginForm {
  email: string;
  password: string;
}

export interface IRegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "student" | "teacher";
}

export interface IClassForm {
  name: string;
  teacherId: string;
  zaloLink: string;
  meetLink: string;
}

export interface IUserForm {
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  status: "active" | "inactive";
}

// ===== NAVIGATION =====
export interface INavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

export interface ISidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  children?: ISidebarItem[];
}

// ===== STATISTICS =====
export interface IStats {
  totalUsers: number;
  totalClasses: number;
  totalTeachers: number;
  totalStudents: number;
  totalBalance: number;
  todayAdded: number;
  todaySubtracted: number;
}

export interface IActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: "class" | "teacher" | "student" | "currency";
}

// ===== SEARCH & FILTER =====
export interface ISearchFilters {
  query?: string;
  role?: "admin" | "teacher" | "student";
  status?: "active" | "inactive" | "pending";
  classId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ISortOptions {
  field: string;
  direction: "asc" | "desc";
}

export interface IFlashcard {
  book: string;
  lesson: number;
  word: string;
  ipa: string;
  mean: string;
}
