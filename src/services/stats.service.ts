import { db } from "@/lib/firebase/client";
import { doc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { getWeek, getYear, startOfWeek, endOfWeek, format } from "date-fns";

export const trackVisit = async (type: "anonymous" | "guest") => {
  const now = new Date();
  const year = getYear(now);
  const week = getWeek(now, { weekStartsOn: 1 }); // Tuần bắt đầu từ thứ Hai

  // Tạo document ID dạng YYYY-WW, ví dụ: 2024-38
  const docId = `${year}-${week.toString().padStart(2, "0")}`;
  const statsRef = doc(db, "statistics", docId);

  // Tạo key cho ngày hôm nay dạng YYYY-MM-DD
  const dayKey = format(now, "yyyy-MM-dd");

  const fieldToIncrement =
    type === "anonymous" ? "anonymousVisits" : "guestVisits";

  const dailyFieldToIncrement =
    type === "anonymous"
      ? `dailyCounts.${dayKey}.anonymous`
      : `dailyCounts.${dayKey}.guest`;

  try {
    // Sử dụng setDoc với { merge: true } để tạo mới hoặc cập nhật document
    await setDoc(
      statsRef,
      {
        year: year,
        week: week,
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
        updatedAt: serverTimestamp(),
        [fieldToIncrement]: increment(1),
        [dailyFieldToIncrement]: increment(1),
      },
      { merge: true }
    );
  } catch (error) {
    console.error(`Error tracking ${type} visit:`, error);
  }
};
