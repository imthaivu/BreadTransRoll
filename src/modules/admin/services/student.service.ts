import { db } from "@/lib/firebase/client";
import { IProfile, IStudent, IPaginatedResponse } from "@/types";
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

// Get all students with pagination and search
export const getStudents = async (
  options?: {
    page?: number;
    limit?: number;
    classId?: string;
    searchKeyword?: string;
  }
): Promise<IPaginatedResponse<IStudent>> => {
  try {
    const {
      page = 1,
      limit: pageLimit = 10,
      classId,
      searchKeyword,
    } = options || {};

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

    // Fetch all matching students (for search and total count)
    const q = query(studentsRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    let allStudents = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to Date for dateOfBirth
      let dateOfBirth: Date | undefined;
      if (data.dateOfBirth) {
        if (data.dateOfBirth.toDate && typeof data.dateOfBirth.toDate === 'function') {
          // Firestore Timestamp
          dateOfBirth = data.dateOfBirth.toDate();
        } else if (data.dateOfBirth instanceof Date) {
          // Already a Date object
          dateOfBirth = data.dateOfBirth;
        }
      }
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dateOfBirth,
      };
    }) as IStudent[];

    // Sort by createdAt desc on client side when filtering by classId
    if (classId) {
      allStudents = allStudents.sort((a, b) => {
        const aDate = a.createdAt?.getTime() || 0;
        const bDate = b.createdAt?.getTime() || 0;
        return bDate - aDate; // desc order
      });
    }

    // Apply search filter on server side
    let filteredStudents = allStudents;
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filteredStudents = allStudents.filter((student) => {
        const nameMatch = student.displayName
          ?.toLowerCase()
          .includes(keyword) || false;
        
        const emailMatch = student.email?.toLowerCase().includes(keyword) || false;
        
        const phoneMatch = student.phone?.toLowerCase().includes(keyword) || false;

        return nameMatch || emailMatch || phoneMatch;
      });
    }

    // Calculate pagination
    const total = filteredStudents.length;
    const totalPages = Math.ceil(total / pageLimit);
    const startIndex = (page - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    return {
      data: paginatedStudents,
      pagination: {
        page,
        limit: pageLimit,
        total,
        totalPages,
      },
    };
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
      const data = studentSnap.data();
      // Convert Firestore Timestamp to Date for dateOfBirth
      let dateOfBirth: Date | undefined;
      if (data.dateOfBirth) {
        if (data.dateOfBirth.toDate && typeof data.dateOfBirth.toDate === 'function') {
          // Firestore Timestamp
          dateOfBirth = data.dateOfBirth.toDate();
        } else if (data.dateOfBirth instanceof Date) {
          // Already a Date object
          dateOfBirth = data.dateOfBirth;
        }
      }
      return {
        id: studentSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dateOfBirth,
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
