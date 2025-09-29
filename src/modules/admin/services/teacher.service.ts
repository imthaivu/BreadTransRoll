import { db } from "@/lib/firebase/client";
import { IProfile } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

// Collection name
const USERS_COLLECTION = "users";

// Types for service functions
export interface CreateTeacherData {
  displayName: string;
  email: string;
  avatarUrl?: string;
  classIds?: string[];
  phone?: string;
  address?: string;
  specialization?: string;
  experience?: number;
}

export interface UpdateTeacherData {
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  classIds?: string[];
  phone?: string;
  address?: string;
  specialization?: string;
  experience?: number;
}

// Get all teachers
export const getTeachers = async (): Promise<IProfile[]> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(
      usersRef,
      where("role", "==", "teacher"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as IProfile[];
  } catch (error) {
    console.error("Error getting teachers:", error);
    throw error;
  }
};

// Get teacher by ID
export const getTeacherById = async (
  teacherId: string
): Promise<IProfile | null> => {
  try {
    const teacherRef = doc(db, USERS_COLLECTION, teacherId);
    const teacherSnap = await getDoc(teacherRef);

    if (teacherSnap.exists()) {
      return {
        id: teacherSnap.id,
        ...teacherSnap.data(),
        createdAt: teacherSnap.data().createdAt?.toDate(),
        updatedAt: teacherSnap.data().updatedAt?.toDate(),
      } as IProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting teacher:", error);
    throw error;
  }
};

// Create new teacher
export const createTeacher = async (
  teacherData: CreateTeacherData
): Promise<IProfile> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const now = new Date();

    const newTeacher = {
      ...teacherData,
      role: "teacher",
      classIds: teacherData.classIds || [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(usersRef, newTeacher);

    return {
      id: docRef.id,
      ...newTeacher,
    } as IProfile;
  } catch (error) {
    console.error("Error creating teacher:", error);
    throw error;
  }
};

// Update teacher
export const updateTeacher = async (
  teacherId: string,
  teacherData: UpdateTeacherData
): Promise<boolean> => {
  try {
    const teacherRef = doc(db, USERS_COLLECTION, teacherId);
    const cleanedEntries = Object.entries(teacherData).filter(
      ([, value]) => value !== undefined && value !== ""
    );
    const cleaned = Object.fromEntries(cleanedEntries);
    if (Object.keys(cleaned).length === 0) return true; // Nothing to update
    await updateDoc(teacherRef, {
      ...cleaned,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error updating teacher:", error);
    throw error;
  }
};

// Delete teacher
export const deleteTeacher = async (teacherId: string): Promise<boolean> => {
  try {
    const teacherRef = doc(db, USERS_COLLECTION, teacherId);
    await deleteDoc(teacherRef);
    return true;
  } catch (error) {
    console.error("Error deleting teacher:", error);
    throw error;
  }
};
