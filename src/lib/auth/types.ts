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
  dateOfBirth?: Date;
  parentPhone?: string;
  preferences?: string;
  giftPhone?: string;
  rank?: "dong" | "bac" | "vang" | "kim cuong" | "cao thu";
  badges?: string[];
  mvpWins?: number;
  mvpLosses?: number;
}

export enum UserRole {
  GUEST = "guest",
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}
