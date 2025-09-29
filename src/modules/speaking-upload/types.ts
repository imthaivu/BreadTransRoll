import { Timestamp } from "firebase/firestore";

export interface SpeakingSubmission {
  studentId: string;
  studentName: string;
  bookId: string;
  lessonId: number;
  fileURL: string;
  originalFileName: string;
  submittedAt: Timestamp;
}

export const SPEAKING_MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB
