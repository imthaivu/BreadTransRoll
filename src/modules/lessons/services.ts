import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import type {
  LessonDoc,
  LessonLite,
  ScriptLite,
  ClassLite,
  LessonDetailData,
  LessonFormData,
} from "./types";

// Data fetching services for lessons module
export async function fetchLessonDetail(
  classId: string,
  lessonId: string
): Promise<LessonDetailData> {
  const db = getDb();
  const [cSnap, lSnap] = await Promise.all([
    getDoc(doc(db, "classes", classId)),
    getDoc(doc(db, "lessons", lessonId)),
  ]);

  const classData = (cSnap.data() as ClassLite | undefined) ?? {};
  const className = (classData as ClassLite).name || "Lớp học không tên";
  const lesson = (lSnap.data() as LessonDoc | undefined) ?? ({} as LessonDoc);

  // Lessons in class (for navigation)
  let lessons: LessonLite[] = [];
  try {
    const q1 = query(
      collection(db, "lessons"),
      where("classId", "==", classId),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const snap = await getDocs(q1);
    lessons = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<LessonLite, "id">),
    }));
  } catch {
    const snap = await getDocs(collection(db, "lessons"));
    lessons = snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LessonLite, "id"> & { classId?: string }),
      }))
      .filter((l) => l.classId === classId);
  }

  // Scripts of class
  let scripts: ScriptLite[] = [];
  try {
    const q2 = query(
      collection(db, "scripts"),
      where("classId", "==", classId),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    const snap = await getDocs(q2);
    scripts = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ScriptLite, "id">),
    }));
  } catch {
    const snap = await getDocs(collection(db, "scripts"));
    scripts = snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ScriptLite, "id"> & { classId?: string }),
      }))
      .filter((s) => s.classId === classId);
  }

  // Calculate navigation info
  const currentIndex = lessons.findIndex((l) => l.id === lessonId);
  const totalLessons = lessons.length;
  const hasNext = currentIndex < totalLessons - 1;
  const hasPrevious = currentIndex > 0;

  return {
    lesson,
    className,
    lessons,
    scripts,
    currentIndex,
    totalLessons,
    hasNext,
    hasPrevious,
  };
}

export async function fetchLessonsForClass(
  classId: string
): Promise<LessonLite[]> {
  const db = getDb();
  try {
    const q = query(
      collection(db, "lessons"),
      where("classId", "==", classId),
      orderBy("createdAt", "desc"),
      limit(200)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<LessonLite, "id">),
    }));
  } catch {
    const snap = await getDocs(collection(db, "lessons"));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<LessonLite, "id"> & { classId?: string }),
      }))
      .filter((l) => l.classId === classId);
  }
}

export async function fetchLessonInfo(lessonId: string): Promise<LessonDoc> {
  const db = getDb();
  const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
  return (lessonSnap.data() as LessonDoc | undefined) ?? ({} as LessonDoc);
}

export async function fetchClassInfo(classId: string): Promise<ClassLite> {
  const db = getDb();
  const classSnap = await getDoc(doc(db, "classes", classId));
  return (classSnap.data() as ClassLite | undefined) ?? { id: classId };
}

export async function createLesson(
  classId: string,
  formData: LessonFormData
): Promise<string> {
  const db = getDb();

  const lessonData: Omit<LessonDoc, "id"> = {
    title: formData.title,
    description: formData.description,
    mediaType: formData.mediaType,
    mediaUrl: formData.mediaUrl,
    sections: formData.sections,
    classId,
    viewedBy: [],
    sectionViews: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "lessons"), lessonData);
  return docRef.id;
}

export async function updateLesson(
  lessonId: string,
  formData: Partial<LessonFormData>
): Promise<void> {
  const db = getDb();

  const updateData: Partial<LessonDoc> = {
    ...formData,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, "lessons", lessonId), updateData);
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, "lessons", lessonId));
}

export async function markLessonAsViewed(
  lessonId: string,
  userId: string
): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, "lessons", lessonId), {
    viewedBy: arrayUnion(userId),
  });
}

export async function markSectionAsViewed(
  lessonId: string,
  sectionId: string,
  userId: string
): Promise<void> {
  const db = getDb();
  const lessonRef = doc(db, "lessons", lessonId);

  // Get current lesson data
  const lessonSnap = await getDoc(lessonRef);
  const lessonData = lessonSnap.data() as LessonDoc | undefined;

  if (lessonData) {
    const sectionViews = lessonData.sectionViews || {};
    const currentViewers = sectionViews[sectionId] || [];

    if (!currentViewers.includes(userId)) {
      sectionViews[sectionId] = [...currentViewers, userId];

      await updateDoc(lessonRef, {
        sectionViews,
      });
    }
  }
}

export async function duplicateLesson(
  lessonId: string,
  newClassId: string,
  newTitle: string
): Promise<string> {
  const db = getDb();

  // Get original lesson
  const originalLesson = await fetchLessonInfo(lessonId);

  // Create new lesson with modified data
  const newLessonData: Omit<LessonDoc, "id"> = {
    ...originalLesson,
    title: newTitle,
    classId: newClassId,
    viewedBy: [],
    sectionViews: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, "lessons"), newLessonData);
  return docRef.id;
}
