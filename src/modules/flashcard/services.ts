import { db } from "@/lib/firebase/client";
import {
  Book,
  FlashcardBook,
  FlashcardIndex,
  FlashcardLesson,
  FlashcardWord,
  Word,
  QuizResult,
  LessonStatus,
} from "./types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  increment,
  setDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export async function getBooks(): Promise<Book[]> {
  const res = await fetch("/data/books/books.json");
  if (!res.ok) throw new Error("Failed to fetch books");
  return res.json();
}

export async function getBook(bookId: string): Promise<Book> {
  const res = await fetch(`/data/books/book_${bookId}.json`);
  if (!res.ok) throw new Error("Failed to fetch book");
  return res.json();
}

export async function getLessonWords(
  bookId: string,
  lessonId: number[]
): Promise<Word[]> {
  const res = await fetch(`/data/books/book_${bookId}.json`);
  if (!res.ok) throw new Error("Failed to fetch lesson words");

  const data: Book = await res.json();
  if (!data.lessons) throw new Error("Failed to fetch lesson words");

  const lessons = data.lessons.filter((lesson) => lessonId.includes(lesson.id));
  if (lessons.length === 0) throw new Error("No lessons found");

  const lessonWords = lessons.map((lesson) => lesson.words).flat();
  if (!lessonWords) throw new Error("Failed to fetch lesson words");

  return lessonWords;
}

// API Helper cho Flashcard
export const flashcardAPI = {
  // Lấy danh sách tất cả sách
  async getBooks(): Promise<FlashcardBook[]> {
    // // console.log("Fetching books from:", "/data/flashcard/index.json");
    const response = await fetch("/data/flashcard/index.json");
    // // console.log("Response status:", response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: FlashcardIndex = await response.json();
    // // console.log("Index data:", data);
    return data.books;
  },

  // Lấy thông tin chi tiết của một sách
  async getBook(bookId: number): Promise<FlashcardBook | undefined> {
    const books = await this.getBooks();
    return books.find((book) => book.id === bookId);
  },

  // Lấy danh sách lessons của một sách
  async getBookLessons(bookId: number): Promise<number[]> {
    const book = await this.getBook(bookId);
    return book ? book.lessons : [];
  },

  // Lấy từ vựng của một lesson cụ thể
  async getLessonWords(
    bookId: number,
    lessonId: number
  ): Promise<FlashcardWord[]> {
    const response = await fetch(
      `/data/flashcard/book_${bookId}_lesson_${lessonId}.json`
    );
    const data: FlashcardLesson = await response.json();

    // // console.log("Get lesson words:", data);
    return data.words;
  },

  // Lấy từ vựng của nhiều lessons
  async getMultipleLessonsWords(
    bookId: number,
    lessonIds: number[]
  ): Promise<FlashcardWord[]> {
    const promises = lessonIds.map((lessonId) =>
      this.getLessonWords(bookId, lessonId)
    );
    const results = await Promise.all(promises);
    return results.flat();
  },

  // Tìm kiếm từ vựng
  async searchWords(query: string): Promise<
    Array<{
      book: number;
      lesson: number;
      words: FlashcardWord[];
    }>
  > {
    const books = await this.getBooks();
    const results: Array<{
      book: number;
      lesson: number;
      words: FlashcardWord[];
    }> = [];

    for (const book of books) {
      for (const lessonId of book.lessons) {
        const words = await this.getLessonWords(book.id, lessonId);
        const filteredWords = words.filter(
          (word) =>
            word.word.toLowerCase().includes(query.toLowerCase()) ||
            word.mean.toLowerCase().includes(query.toLowerCase())
        );

        if (filteredWords.length > 0) {
          results.push({
            book: book.id,
            lesson: lessonId,
            words: filteredWords,
          });
        }
      }
    }

    return results;
  },

  // Lấy thống kê tổng quan
  async getStats(): Promise<FlashcardIndex> {
    const response = await fetch("/data/flashcard/index.json");
    return await response.json();
  },
};

// =================================================================
// Review Words Services
// =================================================================

const reviewWordsCol = (userId: string) =>
  collection(db, "users", userId, "reviewWords");

/**
 * Lấy tất cả các từ cần ôn của người dùng
 */
export async function getReviewWords(userId: string): Promise<Word[]> {
  if (!userId) return [];
  const q = query(reviewWordsCol(userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as Word);
}

/**
 * Thêm một từ vào danh sách ôn tập hoặc reset needReview về 3 nếu đã tồn tại
 */
export async function addOrUpdateReviewWord(userId: string, word: Word) {
  if (!userId) return;
  const wordRef = doc(db, "users", userId, "reviewWords", word.word);
  await setDoc(wordRef, { ...word, needReview: 3 }, { merge: true });
}

/**
 * Giảm số lần cần ôn của một từ. Nếu về 0 thì xóa.
 */
export async function decreaseReviewCount(userId: string, word: Word) {
  if (!userId) return;
  const wordRef = doc(db, "users", userId, "reviewWords", word.word);

  try {
    await runTransaction(db, async (transaction) => {
      const wordDoc = await transaction.get(wordRef);
      if (!wordDoc.exists()) {
        return;
      }
      const currentNeedReview = wordDoc.data().needReview || 1;
      if (currentNeedReview > 1) {
        transaction.update(wordRef, { needReview: increment(-1) });
      } else {
        transaction.delete(wordRef);
      }
    });
  } catch (e) {
    console.error("Transaction failed: ", e);
  }
}

// =================================================================
// Lesson Status Services
// =================================================================

const lessonStatusCol = collection(db, "userLessonStatus");

/**
 * Cập nhật trạng thái lesson với điểm mới nhất.
 * Luôn cập nhật với điểm mới nhất, không cần điểm cao hơn mới cập nhật.
 */
export async function updateLessonStatus(
  statusData: Omit<LessonStatus, "lastAttempt">
) {
  const { userId, bookId, lessonId } = statusData;
  if (!userId || !bookId || !lessonId) return;

  const docId = `${userId}_${bookId}_${lessonId}`;
  const docRef = doc(lessonStatusCol, docId);

  // Always update with the latest status, regardless of previous accuracy
  await setDoc(docRef, {
    ...statusData,
    lastAttempt: serverTimestamp(),
  });
}

/**
 * Lấy danh sách ID của các lesson đã hoàn thành trong một sách
 */
export async function getCompletedLessons(
  userId: string,
  bookId: string
): Promise<number[]> {
  if (!userId || !bookId) return [];

  const q = query(
    lessonStatusCol,
    where("userId", "==", userId),
    where("bookId", "==", bookId),
    where("isCompleted", "==", true)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data().lessonId as number);
}

/**
 * Lấy trạng thái của tất cả lessons trong một sách với độ chính xác
 */
export async function getLessonStatuses(
  userId: string,
  bookId: string
): Promise<Map<number, LessonStatus>> {
  if (!userId || !bookId) return new Map();

  const q = query(
    lessonStatusCol,
    where("userId", "==", userId),
    where("bookId", "==", bookId)
  );

  const snapshot = await getDocs(q);
  const statusMap = new Map<number, LessonStatus>();
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as LessonStatus;
    statusMap.set(data.lessonId, data);
  });

  return statusMap;
}

// =================================================================
// Quiz Result Services
// =================================================================

const quizResultsCol = collection(db, "quizResults");

/**
 * Lưu kết quả quiz mới nhất của một lesson.
 * Luôn cập nhật với điểm mới nhất, không cần điểm cao hơn mới cập nhật.
 * Sẽ ghi đè kết quả cũ nếu đã có.
 */
export async function saveQuizResult(
  resultData: Omit<QuizResult, "lastAttempt">
) {
  const { userId, bookId, lessonId } = resultData;
  if (!userId || !bookId || !lessonId) return;

  // Create a unique ID for the document to ensure overwriting
  const docId = `${userId}_${bookId}_${lessonId}`;
  const docRef = doc(quizResultsCol, docId);

  // Always update with the latest result, regardless of score
  await setDoc(docRef, {
    ...resultData,
    lastAttempt: serverTimestamp(),
  });
}
