export type ActivityType = "listening" | "quiz" | "speaking";

export interface IStudentActivity {
  id: string;
  student: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  type: ActivityType;
  details: {
    book?: string;
    lesson?: string;
    module?: string;
  };
  score?: number; // A normalized percentage score (0-100)
  isCompleted?: boolean;
  timestamp: Date;
  sourceUrl?: string; // For listening to speaking submissions
  listenCount?: number; // For listening activities
  fileDeleted?: boolean; // Track if audio file was deleted from storage
}

export interface ILessonStudentProgress {
  studentId: string;
  studentName: string;
  studentAvatarUrl?: string;
  listenCount: number; // Sourced from listeningProgress.segmentsPlayed.length or similar
  accuracy: number; // Sourced from listeningProgress.maxProgressPercent
  speakingSubmissionStatus: "submitted" | "graded" | "not-submitted";
  speakingSubmissionUrl?: string;
  speakingScore?: number;
}
