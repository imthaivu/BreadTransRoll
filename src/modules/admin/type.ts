// ===== CLASS MANAGEMENT =====
export enum ClassStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface IClassTeacher {
  id: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
}

export interface IClassSummary {
  studentCount: number;
  totalSubmissions?: number;
  averageProgress?: number;
  lastActivityAt?: Date;
}

export interface IClassMember {
  id: string; // This will be the user ID
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  role: "student" | "teacher";
  status: "active" | "inactive";
  joinedAt: Date;
  tuitionRenewalAt?: Date;
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
  summary: IClassSummary;
  createdAt: Date;
  updatedAt: Date;
}
