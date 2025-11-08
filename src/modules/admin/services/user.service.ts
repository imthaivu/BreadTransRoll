import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { IProfile } from "@/types";
import { UserRole } from "@/lib/auth/types";

// Collection name
const USERS_COLLECTION = "users";

// Types for service functions
export interface CreateUserData {
  displayName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  classIds?: string[];
  canCreateClass?: boolean;
  permissions?: string[];
  phone?: string;
}

export interface UpdateUserData {
  displayName?: string;
  email?: string;
  role?: UserRole;
  avatarUrl?: string;
  classIds?: string[];
  canCreateClass?: boolean;
  permissions?: string[];
  phone?: string;
}

// Get all users
export const getUsers = async (): Promise<IProfile[]> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as IProfile[];
  } catch (error) {
    console.error("Error getting users:", error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<IProfile | null> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data(),
        createdAt: userSnap.data().createdAt?.toDate(),
        updatedAt: userSnap.data().updatedAt?.toDate(),
      } as IProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

// Create new user
export const createUser = async (
  userData: CreateUserData
): Promise<IProfile> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const now = new Date();

    const newUser = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(usersRef, newUser);

    return {
      id: docRef.id,
      ...newUser,
    } as IProfile;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Update user
export const updateUser = async (
  userId: string,
  userData: UpdateUserData
): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const cleanedEntries = Object.entries(userData).filter(
      ([, value]) => value !== undefined && value !== ""
    );
    const cleaned = Object.fromEntries(cleanedEntries);
    if (Object.keys(cleaned).length === 0) return true;
    await updateDoc(userRef, {
      ...cleaned,
      updatedAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

// Get users with birthdays in the next N days
export interface UserWithBirthday extends IProfile {
  dateOfBirth?: Date;
  birthdayDate: Date; // The actual birthday date this year
  daysUntilBirthday: number;
}

export const getUsersWithUpcomingBirthdays = async (
  daysAhead: number = 10
): Promise<UserWithBirthday[]> => {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const querySnapshot = await getDocs(usersRef);
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysAhead);

    const usersWithBirthdays: UserWithBirthday[] = [];

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to Date for dateOfBirth
      let dateOfBirth: Date | undefined;
      if (data.dateOfBirth) {
        if (data.dateOfBirth.toDate && typeof data.dateOfBirth.toDate === 'function') {
          dateOfBirth = data.dateOfBirth.toDate();
        } else if (data.dateOfBirth instanceof Date) {
          dateOfBirth = data.dateOfBirth;
        }
      }

      if (!dateOfBirth) return;

      // Calculate birthday this year
      const birthdayThisYear = new Date(
        today.getFullYear(),
        dateOfBirth.getMonth(),
        dateOfBirth.getDate()
      );

      // If birthday has passed this year, calculate for next year
      const birthdayDate = birthdayThisYear < today
        ? new Date(
            today.getFullYear() + 1,
            dateOfBirth.getMonth(),
            dateOfBirth.getDate()
          )
        : birthdayThisYear;

      // Calculate days until birthday
      const daysUntilBirthday = Math.ceil(
        (birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Only include if birthday is within the next N days
      if (daysUntilBirthday >= 0 && daysUntilBirthday <= daysAhead) {
        usersWithBirthdays.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          dateOfBirth,
          birthdayDate,
          daysUntilBirthday,
        } as UserWithBirthday);
      }
    });

    // Sort by days until birthday (ascending)
    usersWithBirthdays.sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

    return usersWithBirthdays;
  } catch (error) {
    console.error("Error getting users with upcoming birthdays:", error);
    throw error;
  }
};