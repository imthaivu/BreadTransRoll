import { db } from "@/lib/firebase/client";
import {
  ClassStatus,
  IClass,
  IClassMember,
  IClassTeacher,
} from "@/modules/admin";

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { getUserById } from "./user.service";
import { IProfile, IStudent } from "@/types";

// Collection names
const CLASSES_COLLECTION = "classes";
const USERS_COLLECTION = "users";

// Types for service functions
export interface CreateClassData {
  name: string;
  teacherId: string;
  zaloLink?: string;
  meetLink?: string;
  status?: ClassStatus;
}

export interface UpdateClassData {
  name?: string;
  zaloLink?: string;
  meetLink?: string;
  status?: ClassStatus;
  teacher?: IClassTeacher;
}

// Get all classes
export const getClasses = async (): Promise<IClass[]> => {
  try {
    const classesRef = collection(db, CLASSES_COLLECTION);
    const q = query(classesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as IClass;
    });
  } catch (error) {
    console.error("Error getting classes:", error);
    throw error;
  }
};

// Get class by ID
export const getClassById = async (classId: string): Promise<IClass | null> => {
  try {
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const classSnap = await getDoc(classRef);

    if (classSnap.exists()) {
      const data = classSnap.data();
      return {
        id: classSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as IClass;
    }
    return null;
  } catch (error) {
    console.error("Error getting class:", error);
    throw error;
  }
};

// Create new class
export const createClass = async (
  classData: CreateClassData
): Promise<IClass> => {
  const teacherProfile = (await getUserById(
    classData.teacherId
  )) as IProfile | null;
  if (!teacherProfile) {
    throw new Error("Teacher not found");
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();

  // 1. Create class document
  const classRef = doc(collection(db, CLASSES_COLLECTION));
  const newClassData = {
    name: classData.name,
    status: classData.status || ClassStatus.ACTIVE,
    links: {
      zalo: classData.zaloLink || "",
      meet: classData.meetLink || "",
    },
    teacher: {
      id: teacherProfile.id,
      name: teacherProfile.displayName || "N/A",
      avatarUrl: teacherProfile.avatarUrl || "",
      phone: (teacherProfile as unknown as { phone?: string }).phone || "",
    },
    createdAt: now,
    updatedAt: now,
  };
  batch.set(classRef, newClassData);

  // 2. Add teacher to members subcollection (only allowed fields)
  const teacherMemberRef = doc(
    collection(db, CLASSES_COLLECTION, classRef.id, "members"),
    teacherProfile.id
  );
  batch.set(teacherMemberRef, {
    name: teacherProfile.displayName || "N/A",
    email: teacherProfile.email,
    avatarUrl: teacherProfile.avatarUrl || "",
    phone: (teacherProfile as unknown as IStudent)?.phone || "",
    role: "teacher",
    status: "active",
    joinedAt: now,
  });

  // 3. Update teacher's user document with the new classId
  const teacherUserRef = doc(db, USERS_COLLECTION, teacherProfile.id);
  batch.update(teacherUserRef, {
    classIds: arrayUnion(classRef.id),
  });

  await batch.commit();

  return {
    id: classRef.id,
    ...newClassData,
    createdAt: new Date(), // Approximate for return value
    updatedAt: new Date(),
  } as IClass;
};

// Update class
export const updateClass = async (
  classId: string,
  classData: UpdateClassData
): Promise<void> => {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const classRef = doc(db, CLASSES_COLLECTION, classId);
  
  // Get current class data to check if teacher is changing
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) {
    throw new Error("Class not found");
  }
  const currentClassData = classSnap.data() as IClass;
  const oldTeacherId = currentClassData.teacher?.id;
  const newTeacherId = classData.teacher?.id;

  // Build update object with only defined fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataToUpdate: any = { updatedAt: now };

  if (classData.name !== undefined) dataToUpdate.name = classData.name;
  if (classData.status !== undefined) dataToUpdate.status = classData.status;
  if (classData.teacher !== undefined) {
    dataToUpdate.teacher = classData.teacher;
    
    // If teacher is changing, handle the transition
    if (newTeacherId && oldTeacherId && newTeacherId !== oldTeacherId) {
      // 1. Remove old teacher from members subcollection
      const oldTeacherMemberRef = doc(
        collection(db, CLASSES_COLLECTION, classId, "members"),
        oldTeacherId
      );
      batch.delete(oldTeacherMemberRef);

      // 2. Remove classId from old teacher's user document
      const oldTeacherUserRef = doc(db, USERS_COLLECTION, oldTeacherId);
      batch.update(oldTeacherUserRef, { classIds: arrayRemove(classId) });

      // 3. Get new teacher profile
      const newTeacherProfile = (await getUserById(newTeacherId)) as IProfile | null;
      if (!newTeacherProfile) {
        throw new Error("New teacher not found");
      }

      // 4. Add new teacher to members subcollection
      const newTeacherMemberRef = doc(
        collection(db, CLASSES_COLLECTION, classId, "members"),
        newTeacherId
      );
      const teacherWithImage = newTeacherProfile as IProfile & { image?: string };
      batch.set(newTeacherMemberRef, {
        name: newTeacherProfile.displayName || "N/A",
        email: newTeacherProfile.email,
        avatarUrl: newTeacherProfile.avatarUrl || teacherWithImage.image || "",
        phone: (newTeacherProfile as unknown as IStudent)?.phone || "",
        role: "teacher",
        status: "active",
        joinedAt: now,
      });

      // 5. Add classId to new teacher's user document
      const newTeacherUserRef = doc(db, USERS_COLLECTION, newTeacherId);
      batch.update(newTeacherUserRef, { classIds: arrayUnion(classId) });
    } else if (newTeacherId && !oldTeacherId) {
      // If there was no teacher before, just add the new one
      const newTeacherProfile = (await getUserById(newTeacherId)) as IProfile | null;
      if (!newTeacherProfile) {
        throw new Error("New teacher not found");
      }

      const newTeacherMemberRef = doc(
        collection(db, CLASSES_COLLECTION, classId, "members"),
        newTeacherId
      );
      const teacherWithImage = newTeacherProfile as IProfile & { image?: string };
      batch.set(newTeacherMemberRef, {
        name: newTeacherProfile.displayName || "N/A",
        email: newTeacherProfile.email,
        avatarUrl: newTeacherProfile.avatarUrl || teacherWithImage.image || "",
        phone: (newTeacherProfile as unknown as IStudent)?.phone || "",
        role: "teacher",
        status: "active",
        joinedAt: now,
      });

      const newTeacherUserRef = doc(db, USERS_COLLECTION, newTeacherId);
      batch.update(newTeacherUserRef, { classIds: arrayUnion(classId) });
    }
  }
  
  // Handle links update (Firestore doesn't support nested field updates with dot notation in batch)
  if (classData.zaloLink !== undefined || classData.meetLink !== undefined) {
    const currentLinks = currentClassData.links || { zalo: "", meet: "" };
    dataToUpdate.links = {
      zalo: classData.zaloLink !== undefined ? classData.zaloLink : currentLinks.zalo,
      meet: classData.meetLink !== undefined ? classData.meetLink : currentLinks.meet,
    };
  }

  // Update class document
  batch.update(classRef, dataToUpdate);

  await batch.commit();
};

// Delete class (complex operation, requires deleting subcollections)
export const deleteClass = async (classId: string): Promise<void> => {
  const batch = writeBatch(db);

  // 1. Get all members to update their user docs
  const membersRef = collection(db, CLASSES_COLLECTION, classId, "members");
  const membersSnap = await getDocs(membersRef);
  membersSnap.forEach((memberDoc) => {
    // 2. Remove classId from each member's user document
    const userRef = doc(db, USERS_COLLECTION, memberDoc.id);
    batch.update(userRef, { classIds: arrayRemove(classId) });
    // 3. Delete the member document itself
    batch.delete(memberDoc.ref);
  });

  // 4. Delete the main class document
  const classRef = doc(db, CLASSES_COLLECTION, classId);
  batch.delete(classRef);

  await batch.commit();
};

// Get members of a class
export const getClassMembers = async (
  classId: string
): Promise<IClassMember[]> => {
  const membersRef = collection(db, CLASSES_COLLECTION, classId, "members");
  const q = query(membersRef, orderBy("joinedAt", "asc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      joinedAt: data.joinedAt.toDate(),
    } as IClassMember;
  });
};

// Add a student to a class
export const addStudentToClass = async (
  classId: string,
  studentId: string
): Promise<void> => {
  const studentProfile = (await getUserById(studentId)) as IStudent | null;
  if (!studentProfile || studentProfile.role !== "student") {
    throw new Error("Student profile not found or user is not a student.");
  }

  const batch = writeBatch(db);
  const now = serverTimestamp();

  // 1. Add student to members subcollection (only allowed fields)
  const studentMemberRef = doc(
    collection(db, CLASSES_COLLECTION, classId, "members"),
    studentId
  );
  batch.set(studentMemberRef, {
    name: studentProfile.displayName || "N/A",
    email: studentProfile.email,
    avatarUrl: studentProfile.avatarUrl || "",
    phone: studentProfile.phone || "",
    role: "student",
    status: "active",
    joinedAt: now,
  });

  // 2. Update student's user document with the new classId
  const studentUserRef = doc(db, USERS_COLLECTION, studentId);
  batch.update(studentUserRef, { classIds: arrayUnion(classId) });

  await batch.commit();
};

// Remove a member (student or teacher) from a class
export const removeMemberFromClass = async (
  classId: string,
  memberId: string
): Promise<void> => {
  const batch = writeBatch(db);

  // 1. Remove member from members subcollection
  const memberRef = doc(
    collection(db, CLASSES_COLLECTION, classId, "members"),
    memberId
  );
  batch.delete(memberRef);

  // 2. Remove classId from member's user document
  const userRef = doc(db, USERS_COLLECTION, memberId);
  batch.update(userRef, { classIds: arrayRemove(classId) });

  await batch.commit();
};

// Sync all members' information in a class with their latest user profiles
export const syncClassMembers = async (
  classId: string
): Promise<void> => {
  const batch = writeBatch(db);
  
  // Get all members of the class
  const members = await getClassMembers(classId);
  
  // For each member, get their latest profile and update all fields
  for (const member of members) {
    try {
      const userProfile = await getUserById(member.id);
      if (userProfile) {
        const memberRef = doc(
          collection(db, CLASSES_COLLECTION, classId, "members"),
          member.id
        );
        
        // Prepare update data with all fields from user profile
        const updateData: Partial<IClassMember> = {
          name: userProfile.displayName || userProfile.email || member.name,
          email: userProfile.email || member.email,
          avatarUrl: userProfile.avatarUrl || "",
          phone: userProfile.phone || "",
        };

        // If it's a student, sync additional student fields
        if (userProfile.role === "student") {
          const studentProfile = userProfile as IStudent;
          updateData.parentEmail = studentProfile.parentEmail || "";
          updateData.parentPhone = studentProfile.parentPhone || "";
          updateData.grade = studentProfile.grade || "";
          updateData.school = studentProfile.school || "";
          updateData.dateOfBirth = studentProfile.dateOfBirth || null;
          updateData.address = studentProfile.address || "";
          updateData.totalBanhRan = studentProfile.totalBanhRan || 0;
        }

        // Update role if it changed (shouldn't happen but just in case)
        updateData.role = userProfile.role === "student" ? "student" : "teacher";
        
        batch.update(memberRef, updateData);
      }
    } catch (error) {
      console.error(`Error syncing member ${member.id}:`, error);
      // Continue with other members even if one fails
    }
  }
  
  await batch.commit();
};

// Update a member's details in a class
export const updateClassMember = async (
  classId: string,
  memberId: string,
  data: Partial<IClassMember>
) => {
  const memberRef = doc(
    collection(db, CLASSES_COLLECTION, classId, "members"),
    memberId
  );
  await updateDoc(memberRef, data);
};
