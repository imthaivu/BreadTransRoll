import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { getClassMembers } from "./services";

// --- Quiz Result Management Services ---

export interface ClassQuizResult {
  id: string; // Document ID: userId_bookId_lessonId
  userId: string;
  studentName: string;
  bookId: string;
  lessonId: number;
  score: number;
  totalWords: number;
  accuracy: number;
  isCompleted: boolean;
  lastAttempt: Date;
}

/**
 * Get all quiz results for a class in a specific book (optimized - only queries by bookId and studentIds)
 */
export const getClassQuizResults = async (
  classId: string,
  bookId: string
): Promise<ClassQuizResult[]> => {
  if (!classId || !bookId) return [];

  // 1. Get all student members of the class
  const members = await getClassMembers(classId);
  const students = members.filter((m) => m.role === "student");
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // 2. Query quiz results for this book and these students (optimized query)
  // Note: Firestore "in" query limit is 10, so we need to batch if more than 10 students
  const batchSize = 10;
  const allResults: ClassQuizResult[] = [];

  for (let i = 0; i < studentIds.length; i += batchSize) {
    const batch = studentIds.slice(i, i + batchSize);
    const quizQuery = query(
      collection(db, "quizResults"),
      where("userId", "in", batch),
      where("bookId", "==", bookId.toString())
    );

    const snapshot = await getDocs(quizQuery);
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const student = studentMap.get(data.userId);
      if (student) {
        allResults.push({
          id: doc.id,
          userId: data.userId,
          studentName: student.name,
          bookId: data.bookId,
          lessonId: data.lessonId,
          score: data.score || 0,
          totalWords: data.totalWords || 0,
          accuracy: data.accuracy || 0,
          isCompleted: data.isCompleted || false,
          lastAttempt: data.lastAttempt?.toDate() || new Date(),
        });
      }
    });
  }

  return allResults;
};

/**
 * Delete quiz results by document IDs (batch delete for efficiency)
 */
export const deleteQuizResults = async (
  quizResultIds: string[]
): Promise<void> => {
  if (quizResultIds.length === 0) return;

  const quizResultsCol = collection(db, "quizResults");

  // Firestore batch limit is 500 operations
  const batchLimit = 500;
  const batches: string[][] = [];

  for (let i = 0; i < quizResultIds.length; i += batchLimit) {
    batches.push(quizResultIds.slice(i, i + batchLimit));
  }

  // Execute all batches
  for (const batchIds of batches) {
    const currentBatch = writeBatch(db);
    batchIds.forEach((id) => {
      const docRef = doc(quizResultsCol, id);
      currentBatch.delete(docRef);
    });
    await currentBatch.commit();
  }
};

/**
 * Delete all quiz results for a class in a specific book
 */
export const deleteClassQuizResultsByBook = async (
  classId: string,
  bookId: string
): Promise<void> => {
  if (!classId || !bookId) return;

  // Get all quiz results for this class and book
  const results = await getClassQuizResults(classId, bookId);
  const resultIds = results.map((r) => r.id);

  if (resultIds.length === 0) return;

  // Delete all results
  await deleteQuizResults(resultIds);
};

