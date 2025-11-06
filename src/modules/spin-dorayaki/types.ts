import { Timestamp } from "firebase/firestore";

export enum SpinTicketStatus {
  PENDING = "pending",
  USED = "used",
}

export enum SpinTicketSource {
  SPEAKING = "speaking",
  FLASHCARD = "flashcard",
  ADMIN = "admin",
} 

export interface SpinTicket {
  id: string;
  studentId: string;
  bookId: string;
  lessonId: number;
  dateKey: string;
  createdAt: Timestamp;
  status: SpinTicketStatus;
  prize?: string;
  usedAt?: Timestamp;
  source: SpinTicketSource;
}

export interface CreateSpinTicketData {
  studentId: string;
  bookId: string;
  lessonId: number;
  source: SpinTicketSource;
}
