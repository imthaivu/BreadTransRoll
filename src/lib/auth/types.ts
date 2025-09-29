export interface AppUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  phone?: string;
  address?: string;
  bankAccount?: string;
  avatarUrl?: string;
  role: UserRole;
  classIds?: string[];
  isActive: boolean;
  totalBanhRan?: number;
  createdAt: Date;
  updatedAt: Date;
  streakCount?: number;
  lastStreakUpdate?: Date;
}

export enum UserRole {
  GUEST = "guest",
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}
