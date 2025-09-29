import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { startOfWeek, startOfMonth } from "date-fns";

const USERS_COLLECTION = "users";
const CLASSES_COLLECTION = "classes";
const SPEAKING_SUBMISSIONS_COLLECTION = "speakingSubmissions";
const LISTENING_PROGRESS_COLLECTION = "listeningProgress";
const CURRENCY_COLLECTION = "currency";
const QUIZ_RESULTS_COLLECTION = "quizResults";
const STATISTICS_COLLECTION = "statistics";

interface DailyDataPoint {
  date: string;
  count: number;
}

export interface DashboardStats {
  newUsersThisMonth: number;
  totalClasses: number;
  totalTeachers: number;
  totalStudents: number;
  speakingSubmissionsToday: number;
  listeningProgressToday: number;
  currencyTransactionsToday: number;
  quizResultsToday: number;
  speakingSubmissionsLast7Days: DailyDataPoint[];
  newUsersLast7Days: DailyDataPoint[];
  listeningProgressLast7Days: DailyDataPoint[];
  quizResultsLast7Days: DailyDataPoint[];
  visitorStats: {
    totalAnonymous: number;
    totalGuest: number;
    dailyData: { date: string; anonymous: number; guest: number }[];
  };
}

// Helper to process data for the line chart
const processLast7DaysData = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  docs: any[],
  dateField: string
): DailyDataPoint[] => {
  const today = new Date();
  const last7Days: { [key: string]: number } = {};

  // Initialize last 7 days with 0 count
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split("T")[0]; // YYYY-MM-DD
    last7Days[dateString] = 0;
  }

  // Count docs per day
  docs.forEach((doc) => {
    const data = doc.data();
    if (data[dateField]?.toDate) {
      const dateString = data[dateField].toDate().toISOString().split("T")[0];
      if (last7Days[dateString] !== undefined) {
        last7Days[dateString]++;
      }
    }
  });

  return Object.entries(last7Days).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }),
    count,
  }));
};

export const getDashboardStats = async (
  range: "week" | "month" = "week"
): Promise<DashboardStats> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthTimestamp = Timestamp.fromDate(startOfMonth);

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfDayTimestamp = Timestamp.fromDate(startOfDay);

    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

    const sevenDaysAgo = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 6
    );
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    // --- Visitor Stats ---
    const visitorStats = await getVisitorStats(range);

    // New users this month
    const usersRef = collection(db, USERS_COLLECTION);
    const newUsersQuery = query(
      usersRef,
      where("createdAt", ">=", startOfMonthTimestamp)
    );
    const newUsersSnapshot = await getCountFromServer(newUsersQuery);
    const newUsersThisMonth = newUsersSnapshot.data().count;

    // Total classes
    const classesRef = collection(db, CLASSES_COLLECTION);
    const classesSnapshot = await getCountFromServer(classesRef);
    const totalClasses = classesSnapshot.data().count;

    // Total teachers
    const teachersQuery = query(usersRef, where("role", "==", "teacher"));
    const teachersSnapshot = await getCountFromServer(teachersQuery);
    const totalTeachers = teachersSnapshot.data().count;

    // Total students
    const studentsQuery = query(usersRef, where("role", "==", "student"));
    const studentsSnapshot = await getCountFromServer(studentsQuery);
    const totalStudents = studentsSnapshot.data().count;

    // Speaking submissions today
    const speakingSubmissionsRef = collection(
      db,
      SPEAKING_SUBMISSIONS_COLLECTION
    );
    const speakingQuery = query(
      speakingSubmissionsRef,
      where("submittedAt", ">=", startOfDayTimestamp),
      where("submittedAt", "<=", endOfDayTimestamp)
    );
    const speakingSubmissionsSnapshot = await getCountFromServer(speakingQuery);
    const speakingSubmissionsToday = speakingSubmissionsSnapshot.data().count;

    // Listening progress records today
    const listeningProgressRef = collection(db, LISTENING_PROGRESS_COLLECTION);
    const listeningQuery = query(
      listeningProgressRef,
      where("lastListenedAt", ">=", startOfDayTimestamp),
      where("lastListenedAt", "<=", endOfDayTimestamp)
    );
    const listeningProgressSnapshot = await getCountFromServer(listeningQuery);
    const listeningProgressToday = listeningProgressSnapshot.data().count;

    // Currency transactions today
    const currencyRef = collection(db, CURRENCY_COLLECTION);
    const currencyQuery = query(
      currencyRef,
      where("createdAt", ">=", startOfDayTimestamp),
      where("createdAt", "<=", endOfDayTimestamp)
    );
    const currencySnapshot = await getCountFromServer(currencyQuery);
    const currencyTransactionsToday = currencySnapshot.data().count;

    // Quiz results today
    const quizResultsRef = collection(db, QUIZ_RESULTS_COLLECTION);
    const quizQuery = query(
      quizResultsRef,
      where("lastAttempt", ">=", startOfDayTimestamp),
      where("lastAttempt", "<=", endOfDayTimestamp)
    );
    const quizSnapshot = await getCountFromServer(quizQuery);
    const quizResultsToday = quizSnapshot.data().count;

    // Data for charts
    // Speaking submissions in the last 7 days
    const speaking7DaysQuery = query(
      speakingSubmissionsRef,
      where("submittedAt", ">=", sevenDaysAgoTimestamp)
    );
    const speaking7DaysSnapshot = await getDocs(speaking7DaysQuery);
    const speakingSubmissionsLast7Days = processLast7DaysData(
      speaking7DaysSnapshot.docs,
      "submittedAt"
    );

    // New users in the last 7 days
    const users7DaysQuery = query(
      usersRef,
      where("createdAt", ">=", sevenDaysAgoTimestamp)
    );
    const users7DaysSnapshot = await getDocs(users7DaysQuery);
    const newUsersLast7Days = processLast7DaysData(
      users7DaysSnapshot.docs,
      "createdAt"
    );

    // Listening progress in the last 7 days
    const listening7DaysQuery = query(
      listeningProgressRef,
      where("lastListenedAt", ">=", sevenDaysAgoTimestamp)
    );
    const listening7DaysSnapshot = await getDocs(listening7DaysQuery);
    const listeningProgressLast7Days = processLast7DaysData(
      listening7DaysSnapshot.docs,
      "lastListenedAt"
    );

    // Quiz results in the last 7 days
    const quiz7DaysQuery = query(
      quizResultsRef,
      where("lastAttempt", ">=", sevenDaysAgoTimestamp)
    );
    const quiz7DaysSnapshot = await getDocs(quiz7DaysQuery);
    const quizResultsLast7Days = processLast7DaysData(
      quiz7DaysSnapshot.docs,
      "lastAttempt"
    );

    return {
      // Stats
      newUsersThisMonth,
      totalClasses,
      totalTeachers,
      totalStudents,

      // Stats
      speakingSubmissionsToday,
      listeningProgressToday,
      currencyTransactionsToday,
      quizResultsToday,

      // Charts
      newUsersLast7Days,
      speakingSubmissionsLast7Days,
      listeningProgressLast7Days,
      quizResultsLast7Days,
      visitorStats,
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

export const getVisitorStats = async (range: "week" | "month") => {
  const now = new Date();
  let startDate;

  if (range === "week") {
    startDate = startOfWeek(now, { weekStartsOn: 1 });
  } else {
    startDate = startOfMonth(now);
  }

  const statsQuery = query(
    collection(db, STATISTICS_COLLECTION),
    where("startDate", ">=", startDate)
  );

  const querySnapshot = await getDocs(statsQuery);

  let totalAnonymous = 0;
  let totalGuest = 0;
  const dailyDataMap = new Map<string, { anonymous: number; guest: number }>();

  querySnapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalAnonymous += data.anonymousVisits || 0;
    totalGuest += data.guestVisits || 0;

    if (data.dailyCounts) {
      for (const [date, counts] of Object.entries(
        data.dailyCounts as Record<string, { anonymous: number; guest: number }>
      )) {
        const existing = dailyDataMap.get(date) || { anonymous: 0, guest: 0 };
        existing.anonymous += counts.anonymous || 0;
        existing.guest += counts.guest || 0;
        dailyDataMap.set(date, existing);
      }
    }
  });

  const dailyData = Array.from(dailyDataMap.entries())
    .map(([date, counts]) => ({
      date: new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      }),
      ...counts,
    }))
    .sort((a, b) => {
      const dateA = a.date.split("/").reverse().join("-");
      const dateB = b.date.split("/").reverse().join("-");
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

  return {
    totalAnonymous,
    totalGuest,
    dailyData,
  };
};
