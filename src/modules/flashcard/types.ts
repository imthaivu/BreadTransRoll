import { Timestamp } from "firebase/firestore";

// Types cho Flashcard Module
export interface FlashcardBook {
  id: number;
  name: string;
  totalLessons: number;
  totalWords: number;
  lessons: number[];
}

export interface FlashcardWord {
  book: number;
  lesson: number;
  word: string;
  ipa: string;
  mean: string;
}

export interface FlashcardLesson {
  book: number;
  lesson: number;
  words: FlashcardWord[];
}

export interface FlashcardIndex {
  books: FlashcardBook[];
  totalBooks: number;
  totalLessons: number;
  totalWords: number;
  lastUpdated: string;
}

export interface ReviewWord extends Word {
  needReview: number;
}

export interface SessionAnswer {
  word: Word;
  isCorrect: boolean;
}

export interface QuizResult {
  userId: string;
  bookId: string;
  lessonId: number;
  accuracy: number;
  score: number;
  totalWords: number;
  isCompleted: boolean;
  lastAttempt: Timestamp; // Firestore Server Timestamp
}

export interface LessonStatus {
  userId: string;
  bookId: string;
  lessonId: number;
  isCompleted: boolean;
  lastAccuracy: number;
  lastAttempt: Timestamp;
}

export interface FlashcardState {
  books: FlashcardBook[];
  selectedBook: number | null;
  selectedLessons: number[];
  selectedMode: "flashcard" | "quiz";
  deck: FlashcardWord[];
  currentIndex: number;
  score: number;
  wrongWords: FlashcardWord[];
  progress: number;
  accuracy: number;
  isPlaying: boolean;
  isLoading: boolean;
}

/** Quiz history cho mỗi user */
export interface QuizHistory {
  id: string; // Firestore document id
  userId: string;
  bookId: string;
  lessonId: string;
  score: number;
  date: string; // ISO string
}

/** User (nếu bạn quản lý user trong Firestore) */
export interface User {
  id: string; // Firestore document id
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Word {
  word: string;
  ipa: string;
  mean: string;
  book: string;
  lesson: number;
}

export interface Lesson {
  id: number;
  words: Word[];
}

export interface Book {
  id: number;
  name: string;
  totalLessons: number;
  totalWords: number;
  lessons?: Lesson[]; // optional vì books.json chỉ lưu metadata
}
