import { db } from "@/lib/firebase/client";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

/**
 * Gets the current date in Vietnam timezone (normalized to midnight).
 * This ensures consistent date comparison regardless of client/server timezone.
 */
function getVietnamDate(): Date {
  const now = new Date();
  // Convert to Vietnam timezone string (YYYY-MM-DD)
  const vietnamDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // Parse back to Date object (this creates a date at midnight in local timezone,
  // but we'll use it only for date components comparison)
  const [year, month, day] = vietnamDateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Normalizes a date to Vietnam timezone date (at midnight).
 * Used to compare dates correctly regardless of the original timezone.
 */
function normalizeToVietnamDate(date: Date): Date {
  const vietnamDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const [year, month, day] = vietnamDateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Checks and updates a student's daily streak.
 * Uses Vietnam timezone (Asia/Ho_Chi_Minh) for consistent date comparison.
 * 
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
  
  // Get today's date in Vietnam timezone (normalized to midnight UTC for comparison)
  const today = getVietnamDate();

  // Get the last update date, normalized to Vietnam timezone
  const lastUpdateDate = userData.lastStreakUpdate?.toDate();
  let lastUpdateDay: Date | null = null;
  if (lastUpdateDate) {
    lastUpdateDay = normalizeToVietnamDate(lastUpdateDate);
  }

  // Compare dates using UTC timestamps (both normalized to midnight UTC)
  const todayTime = today.getTime();
  const lastUpdateTime = lastUpdateDay?.getTime();

  // If streak was already updated today, do nothing.
  if (lastUpdateTime === todayTime) {
    return { updated: false, newStreakCount: userData.streakCount || 0 };
  }

  // Calculate yesterday in Vietnam timezone
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  let newStreakCount = 1;
  
  // If last update was yesterday (exactly), increment streak.
  if (lastUpdateTime === yesterday.getTime()) {
    newStreakCount = (userData.streakCount || 0) + 1;
  }
  // Otherwise:
  // - If lastUpdateDay is null (first time), newStreakCount = 1 ✓
  // - If lastUpdateDay was more than 1 day ago, streak is broken, reset to 1 ✓
  // - If lastUpdateDay was in the future (shouldn't happen), reset to 1 ✓

  await updateDoc(userRef, {
    streakCount: newStreakCount,
    lastStreakUpdate: serverTimestamp(),
  });

  return { updated: true, newStreakCount };
};
