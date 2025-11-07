import { db } from "@/lib/firebase/client";
import { IProfile, IStudent } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  QueryConstraint,
} from "firebase/firestore";

// Collection name
const STUDENTS_COLLECTION = "users";

// Types for service functions
export interface CreateStudentData {
  displayName: string;
  email: string;
  avatarUrl?: string;
  classIds?: string[];
  parentEmail?: string;
  parentPhone?: string;
  grade?: string;
  school?: string;
  dateOfBirth?: Date;
  address?: string;
  phone?: string;
}

export interface UpdateStudentData {
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  classIds?: string[];
  parentPhone?: string;
  dateOfBirth?: Date;
  address?: string;
  phone?: string;
  totalBanhRan?: number;
  streakCount?: number;
  note?: string;
  rank?: "dong" | "bac" | "vang" | "kim cuong" | "cao thu";
  badges?: string[];
  mvpWins?: number;
  mvpLosses?: number;
}

// Get all students
export const getStudents = async (count?: number, classId?: string): Promise<IStudent[]> => {
  try {
    const studentsRef = collection(db, STUDENTS_COLLECTION);
    const queryConstraints: QueryConstraint[] = [
      where("role", "==", "student"),
    ];

    // If classId is provided, filter by classIds array-contains
    // Note: When using array-contains, we can't use orderBy in the same query without a composite index
    // So we'll sort on the client side instead
    if (classId) {
      queryConstraints.push(where("classIds", "array-contains", classId));
    } else {
      // Only use orderBy when not filtering by classId to avoid needing a composite index
      queryConstraints.push(orderBy("createdAt", "desc"));
    }

    if (count) {
      queryConstraints.push(limit(count));
    }

    const q = query(studentsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    let students = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as IStudent[];

    // Sort by createdAt desc on client side when filtering by classId
    if (classId) {
      students = students.sort((a, b) => {
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate; // desc order
      });
      
      // Apply limit after sorting if needed
      if (count && students.length > count) {
        students = students.slice(0, count);
      }
    }

    return students;
  } catch (error) {
    console.error("Error getting students:", error);
    throw error;
  }
};

// Get student by ID
export const getStudentById = async (
  studentId: string
): Promise<IProfile | null> => {
  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    const studentSnap = await getDoc(studentRef);

    if (studentSnap.exists()) {
      return {
        id: studentSnap.id,
        ...studentSnap.data(),
        createdAt: studentSnap.data().createdAt?.toDate(),
        updatedAt: studentSnap.data().updatedAt?.toDate(),
      } as IProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting student:", error);
    throw error;
  }
};

// Create new student
export const createStudent = async (
  studentData: CreateStudentData
): Promise<IProfile> => {
  try {
    const studentsRef = collection(db, STUDENTS_COLLECTION);
    const now = new Date();

    const newStudent = {
      ...studentData,
      role: "student",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(studentsRef, newStudent);

    return {
      id: docRef.id,
      ...newStudent,
    } as IProfile;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
};

// Update student
export const updateStudent = async (
  studentId: string,
  studentData: UpdateStudentData
): Promise<boolean> => {
  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    // Fields that should allow empty strings (to clear/delete content)
    const textFields = ['note', 'address'];
    const cleanedEntries = Object.entries(studentData).filter(
      ([key, value]) => {
        // Always include text fields even if empty string (to allow clearing)
        if (textFields.includes(key)) {
          return value !== undefined;
        }
        // For other fields, filter out undefined and empty strings
        return value !== undefined && value !== "";
      }
    );
    const cleaned = Object.fromEntries(cleanedEntries);
    if (Object.keys(cleaned).length === 0) return true; // Nothing to update
    await updateDoc(studentRef, {
      ...cleaned,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
};

// Delete student
export const deleteStudent = async (studentId: string): Promise<boolean> => {
  try {
    const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
    await deleteDoc(studentRef);
    return true;
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
};
