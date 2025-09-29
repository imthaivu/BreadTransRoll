import { db } from "@/lib/firebase/client";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

/**
 * Checks and updates a student's daily streak.
 * @param userId - The ID of the student.
 * @returns An object indicating if the streak was updated and the new streak count.
 */
export const updateStudentStreak = async (
  userId: string
): Promise<{ updated: boolean; newStreakCount: number }> => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User not found");
  }

  const userData = userSnap.data();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const lastUpdateDate = userData.lastStreakUpdate?.toDate();
  let lastUpdateDay: Date | null = null;
  if (lastUpdateDate) {
    lastUpdateDay = new Date(
      lastUpdateDate.getFullYear(),
      lastUpdateDate.getMonth(),
      lastUpdateDate.getDate()
    );
  }

  // If streak was already updated today, do nothing.
  if (lastUpdateDay && lastUpdateDay.getTime() === today.getTime()) {
    return { updated: false, newStreakCount: userData.streakCount || 0 };
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  let newStreakCount = 1;
  // If last update was yesterday, increment streak.
  if (lastUpdateDay && lastUpdateDay.getTime() === yesterday.getTime()) {
    newStreakCount = (userData.streakCount || 0) + 1;
  }
  // Otherwise, the streak is broken and reset to 1.

  await updateDoc(userRef, {
    streakCount: newStreakCount,
    lastStreakUpdate: serverTimestamp(),
  });

  return { updated: true, newStreakCount };
};
