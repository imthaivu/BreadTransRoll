import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  Timestamp,
  writeBatch,
  limit,
  startAfter,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { IClassMember } from "@/types";
import { IClass } from "../admin";
import { ILessonStudentProgress, IStudentActivity } from "./types";

const CLASSES_COLLECTION = "classes";

// Get all classes for a specific teacher
export const getTeacherClasses = async (
  teacherId: string
): Promise<IClass[]> => {
  if (!teacherId) return [];

  const classesRef = collection(db, CLASSES_COLLECTION);
  const q = query(
    classesRef,
    where("teacher.id", "==", teacherId),
    orderBy("createdAt", "desc")
  );

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
};

// Get details for a single class, ensuring the teacher has access
export const getClassDetails = async (
  classId: string,
  teacherId: string
): Promise<IClass | null> => {
  if (!classId || !teacherId) return null;

  const classRef = doc(db, CLASSES_COLLECTION, classId);
  const classSnap = await getDoc(classRef);

  if (classSnap.exists()) {
    const data = classSnap.data();
    // Security check: Make sure the requesting teacher is the class teacher
    if (data.teacher.id !== teacherId) {
      console.warn("Unauthorized access attempt for class details.");
      return null;
    }

    return {
      id: classSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as IClass;
  }
  return null;
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

// --- Progress Tracking Services ---

export const getClassProgressActivities = async (
  classId: string,
  bookId: string,
  lessonId: string
): Promise<IStudentActivity[]> => {
  if (!classId || !bookId || !lessonId) return [];

  // 1. Get all student members of the class
  const members = await getClassMembers(classId);
  const students = members.filter((m) => m.role === "student");
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  // 2. Fetch all three data sources in parallel
  const [listeningData, quizData, speakingData] = await Promise.all([
    // Listening Progress
    getDocs(
      query(
        collection(db, "listeningProgress"),
        where("studentId", "in", studentIds),
        where("itemKey", "==", bookId.toString()),
        where("audioId", "==", lessonId.toString())
      )
    ),
    // Quiz Results
    getDocs(
      query(
        collection(db, "quizResults"),
        where("userId", "in", studentIds),
        where("bookId", "==", bookId.toString()),
        where("lessonId", "==", parseInt(lessonId))
      )
    ),
    // Speaking Submissions
    getDocs(
      query(
        collection(db, "speakingSubmissions"),
        where("studentId", "in", studentIds),
        where("bookId", "==", bookId.toString()),
        where("lessonId", "==", parseInt(lessonId))
      )
    ),
  ]);

  // 3. Map each data source to the unified IStudentActivity type
  const listeningActivities: IStudentActivity[] = listeningData.docs.map(
    (doc) => {
      const data = doc.data();
      const student = studentMap.get(data.studentId);
      const score = data.maxProgressPercent || 0;
      return {
        id: doc.id,
        student: {
          id: student?.id || "",
          name: student?.name || "N/A",
          avatarUrl: student?.avatarUrl,
        },
        type: "listening",
        details: {
          module: data.module,
          book: data.itemKey,
          lesson: data.audioId,
        },
        timestamp: data.lastListenedAt.toDate(),
        listenCount: data.listenCount || 0,
      };
    }
  );

  const quizActivities: IStudentActivity[] = quizData.docs.map((doc) => {
    const data = doc.data();
    const student = studentMap.get(data.userId);

    return {
      id: doc.id,
      student: {
        id: student?.id || "",
        name: student?.name || "N/A",
        avatarUrl: student?.avatarUrl,
      },
      type: "quiz",
      details: { book: data.bookId, lesson: data.lessonId.toString() },
      score: data?.accuracy || 0,
      isCompleted: data?.accuracy >= 90,
      timestamp: data.lastAttempt.toDate(),
    };
  });

  const speakingActivities: IStudentActivity[] = speakingData.docs.map(
    (doc) => {
      const data = doc.data();
      const student = studentMap.get(data.studentId);

      return {
        id: doc.id,
        student: {
          id: student?.id || "",
          name: student?.name || "N/A",
          avatarUrl: student?.avatarUrl,
        },
        type: "speaking",
        details: {
          book: data.bookId || "N/A",
          lesson: data.lessonId || "N/A",
        },
        timestamp: data.submittedAt.toDate(),
        sourceUrl: data.fileURL,
      };
    }
  );

  // 4. Combine and sort all activities
  const allActivities = [
    ...listeningActivities,
    ...quizActivities,
    ...speakingActivities,
  ];

  allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return allActivities;
};

export const getStudentClasses = async (
  studentId: string
): Promise<IClass[]> => {
  const userRef = doc(db, "users", studentId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.error("No such user!");
    return [];
  }

  const userData = userSnap.data();
  const classIds = userData.classIds || [];

  if (classIds.length === 0) {
    return [];
  }

  const classesQuery = query(
    collection(db, "classes"),
    where("__name__", "in", classIds)
  );

  const querySnapshot = await getDocs(classesQuery);
  const classes = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate(),
    } as IClass;
  });

  return classes;
};

export const updateClassLinks = async ({
  classId,
  links,
}: {
  classId: string;
  links: { zalo?: string; meet?: string };
}) => {
  const classRef = doc(db, CLASSES_COLLECTION, classId);
  await updateDoc(classRef, {
    links: links,
    updatedAt: serverTimestamp(),
  });
};

export type CreateCurrencyRequestData = {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  amount: number;
  reason: string;
};

export const createCurrencyRequest = async (
  requestData: CreateCurrencyRequestData
): Promise<void> => {
  try {
    const requestsCol = collection(db, "currencyRequests");
    await addDoc(requestsCol, {
      ...requestData,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    console.error("Error creating currency request:", error);
    throw new Error(
      error?.message || "Không thể tạo yêu cầu. Vui lòng thử lại."
    );
  }
};

export const getLessonStudentProgress = async (
  classId: string,
  bookId: string,
  lessonId: string
): Promise<ILessonStudentProgress[]> => {
  // 1. Get all student members of the class
  const members = await getClassMembers(classId);
  const students = members.filter((m) => m.role === "student");
  if (students.length === 0) return [];
  const studentIds = students.map((s) => s.id);

  // 2. Fetch listening and speaking data in parallel
  const [listeningSnap, speakingSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "listeningProgress"),
        where("studentId", "in", studentIds),
        where("itemKey", "==", bookId),
        where("audioId", "==", lessonId)
      )
    ),
    getDocs(
      query(
        collection(db, "submissions"),
        where("classId", "==", classId),
        where("bookId", "==", bookId),
        where("lessonId", "==", lessonId)
      )
    ),
  ]);

  // 3. Process data into maps for quick lookup
  const listeningDataMap = new Map(
    listeningSnap.docs.map((doc) => [doc.data().studentId, doc.data()])
  );
  const speakingDataMap = new Map(
    speakingSnap.docs.map((doc) => [doc.data().uid, doc.data()])
  );

  // 4. Aggregate data for each student
  const progressData: ILessonStudentProgress[] = students.map((student) => {
    const listeningProgress = listeningDataMap.get(student.id);
    const speakingSubmission = speakingDataMap.get(student.id);

    let speakingStatus: ILessonStudentProgress["speakingSubmissionStatus"] =
      "not-submitted";
    if (speakingSubmission) {
      speakingStatus = speakingSubmission.score ? "graded" : "submitted";
    }

    return {
      studentId: student.id,
      studentName: student.name,
      studentAvatarUrl: student.avatarUrl,
      listenCount: listeningProgress?.segmentsPlayed?.length || 0,
      accuracy: listeningProgress?.maxProgressPercent || 0,
      speakingSubmissionStatus: speakingStatus,
      speakingSubmissionUrl: speakingSubmission?.url,
      speakingScore: speakingSubmission?.score,
    };
  });

  return progressData;
};

export const getClassProgress = async (
  classId: string
): Promise<ILessonStudentProgress[]> => {
  if (!classId) return [];

  // 1. Get all student members of the class
  const members = await getClassMembers(classId);
  const students = members.filter((m) => m.role === "student");
  if (students.length === 0) return [];
  const studentIds = students.map((s) => s.id);

  // 2. Fetch listening and speaking data in parallel
  const [listeningSnap, speakingSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "listeningProgress"),
        where("studentId", "in", studentIds)
      )
    ),
    getDocs(
      query(
        collection(db, "speakingSubmissions"),
        where("studentId", "in", studentIds)
      )
    ),
  ]);

  // 3. Process data into maps for quick lookup
  const listeningDataMap = new Map(
    listeningSnap.docs.map((doc) => [doc.data().studentId, doc.data()])
  );
  const speakingDataMap = new Map(
    speakingSnap.docs.map((doc) => [doc.data().uid, doc.data()])
  );

  // 4. Aggregate data for each student
  const progressData: ILessonStudentProgress[] = students.map((student) => {
    const listeningProgress = listeningDataMap.get(student.id);
    const speakingSubmission = speakingDataMap.get(student.id);

    let speakingStatus: ILessonStudentProgress["speakingSubmissionStatus"] =
      "not-submitted";
    if (speakingSubmission) {
      speakingStatus = speakingSubmission.score ? "graded" : "submitted";
    }

    return {
      studentId: student.id,
      studentName: student.name,
      studentAvatarUrl: student.avatarUrl,
      listenCount: listeningProgress?.segmentsPlayed?.length || 0,
      accuracy: listeningProgress?.maxProgressPercent || 0,
      speakingSubmissionStatus: speakingStatus,
      speakingSubmissionUrl: speakingSubmission?.url,
      speakingScore: speakingSubmission?.score,
    };
  });

  return progressData;
};
