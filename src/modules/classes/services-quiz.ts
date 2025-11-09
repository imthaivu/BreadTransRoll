import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
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
 * @param dateFilter - Optional date to filter results. If provided, only returns results from that date. If null/undefined, returns all results.
 */
export const getClassQuizResults = async (
  classId: string,
  bookId: string,
  dateFilter?: Date | null
): Promise<ClassQuizResult[]> => {
  if (!classId || !bookId) return [];

  // 1. Get all student members of the class
  const members = await getClassMembers(classId);
  const students = members.filter((m) => m.role === "student");
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // 2. Set up date range if dateFilter is provided (for client-side filtering)
  let filterDate: Date | undefined;
  
  if (dateFilter) {
    filterDate = new Date(dateFilter);
    filterDate.setHours(0, 0, 0, 0);
  }

  // 3. Query quiz results for this book and these students (optimized query)
  // Note: Firestore "in" query limit is 10, so we need to batch if more than 10 students
  // We query all results and filter by date client-side to avoid Firestore query limitations
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
        const lastAttempt = data.lastAttempt?.toDate() || new Date();
        
        // Filter by date if dateFilter is provided (client-side filtering)
        if (filterDate) {
          // Compare dates by year, month, and day (ignore time and timezone)
          const resultDate = new Date(lastAttempt);
          const resultYear = resultDate.getFullYear();
          const resultMonth = resultDate.getMonth();
          const resultDay = resultDate.getDate();
          
          const filterYear = filterDate.getFullYear();
          const filterMonth = filterDate.getMonth();
          const filterDay = filterDate.getDate();
          
          // Check if the result date matches the filter date
          if (
            resultYear !== filterYear ||
            resultMonth !== filterMonth ||
            resultDay !== filterDay
          ) {
            return; // Skip this result if date doesn't match
          }
        }
        
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
          lastAttempt: lastAttempt,
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

/**
 * Get quiz result counts by date for students in a class
 * Returns a map of studentId -> count of quiz results submitted on the specified date
 */
export const getStudentQuizCountsByDate = async (
  classId: string,
  targetDate: Date
): Promise<Map<string, number>> => {
  if (!classId) return new Map();

  // Get all student members of the class
  const members = await getClassMembers(classId);
  const students = members.filter((m) => m.role === "student");
  if (students.length === 0) return new Map();

  const studentIds = students.map((s) => s.id);
  const countsMap = new Map<string, number>();

  // Set up date range (start and end of the target date)
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const startTimestamp = Timestamp.fromDate(startOfDay);
  const endTimestamp = Timestamp.fromDate(endOfDay);

  // Query quiz results for these students within the date range
  // Note: Firestore "in" query limit is 10, so we need to batch if more than 10 students
  const batchSize = 10;

  for (let i = 0; i < studentIds.length; i += batchSize) {
    const batch = studentIds.slice(i, i + batchSize);
    const quizQuery = query(
      collection(db, "quizResults"),
      where("userId", "in", batch),
      where("lastAttempt", ">=", startTimestamp),
      where("lastAttempt", "<=", endTimestamp)
    );

    const snapshot = await getDocs(quizQuery);
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const userId = data.userId;
      if (userId) {
        const currentCount = countsMap.get(userId) || 0;
        countsMap.set(userId, currentCount + 1);
      }
    });
  }

  // Initialize all students with 0 if they don't have any results
  studentIds.forEach((studentId) => {
    if (!countsMap.has(studentId)) {
      countsMap.set(studentId, 0);
    }
  });

  return countsMap;
};

