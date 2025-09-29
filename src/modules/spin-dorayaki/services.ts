import { UserRole } from "@/lib/auth/types";
import { db } from "@/lib/firebase/client";
import { getVietnamTime } from "@/utils/time";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { CreateCurrencyData } from "../admin";
import { CreateSpinTicketData, SpinTicket, SpinTicketStatus } from "./types";

const NODE_ENV = process.env.NODE_ENV;
const IS_DEV = NODE_ENV === "development" || NODE_ENV === "test";
const spinTicketsCol = collection(db, "spinTickets");
const locksCol = collection(db, "spinLocks");

// Kiểm tra khung giờ cho phép tạo vé quay (8-10h sáng và 20-22h tối)
export function checkTimeSlotCreateSpinTicket(): {
  allowed: boolean;
  message?: string;
} {
  if (IS_DEV) return { allowed: true };

  const now = new Date();
  const vietnamTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  const currentHour = vietnamTime.getHours();

  // Khung giờ sáng: 8-10h (8:00 - 9:59)
  const isMorningSlot = currentHour >= 8 && currentHour < 10;

  // Khung giờ tối: 20-22h (20:00 - 21:59)
  const isEveningSlot = currentHour >= 20 && currentHour < 22;

  if (isMorningSlot) {
    return { allowed: true };
  }

  if (isEveningSlot) {
    return { allowed: true };
  }

  // Tính thời gian còn lại đến khung giờ tiếp theo
  let nextSlotTime: Date;
  let nextSlotName: string;

  if (currentHour < 8) {
    // Trước 8h sáng, chờ đến 8h sáng
    nextSlotTime = new Date(vietnamTime);
    nextSlotTime.setHours(8, 0, 0, 0);
    nextSlotName = "8:00 sáng";
  } else if (currentHour >= 10 && currentHour < 20) {
    // Từ 10h sáng đến 20h, chờ đến 20h tối
    nextSlotTime = new Date(vietnamTime);
    nextSlotTime.setHours(20, 0, 0, 0);
    nextSlotName = "20:00 tối";
  } else {
    // Sau 22h, chờ đến 8h sáng ngày mai
    nextSlotTime = new Date(vietnamTime);
    nextSlotTime.setDate(nextSlotTime.getDate() + 1);
    nextSlotTime.setHours(8, 0, 0, 0);
    nextSlotName = "8:00 sáng ngày mai";
  }

  const timeDiff = nextSlotTime.getTime() - vietnamTime.getTime();
  const hoursLeft = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  let timeLeftText = "";
  if (hoursLeft > 0) {
    timeLeftText = `${hoursLeft} giờ ${minutesLeft} phút`;
  } else {
    timeLeftText = `${minutesLeft} phút`;
  }

  return {
    allowed: false,
    message: `Chỉ có thể tạo vé quay trong khung giờ 8-10h sáng và 20-22h tối. Khung giờ tiếp theo: ${nextSlotName} (còn ${timeLeftText})`,
  };
}

// Kiểm tra vé còn hiệu lực không (chỉ dùng trong ngày tạo)
function isTicketValid(ticket: SpinTicket): boolean {
  const vietnamTime = getVietnamTime();
  const currentDateKey = vietnamTime; // YYYY-MM-DD

  // Vé chỉ có hiệu lực trong ngày tạo
  return ticket.dateKey === currentDateKey;
}

// Tạo vé quay mới
export async function createSpinTicket(
  data: CreateSpinTicketData
): Promise<SpinTicket | null> {
  const { studentId, bookId, lessonId, source } = data;

  // Kiểm tra khung giờ cho phép tạo vé
  const timeCheck = checkTimeSlotCreateSpinTicket();
  if (!timeCheck.allowed) {
    return null;
  }

  // Tạo dateKey theo format YYYY-MM-DD (Vietnam timezone)
  const vietnamTime = getVietnamTime();
  const dateKey = vietnamTime; // YYYY-MM-DD

  // Tạo unique ID
  const docId = `${studentId}_${bookId}_${lessonId}_${dateKey}`;
  const docRef = doc(spinTicketsCol, docId);

  const ticketData = {
    studentId,
    bookId,
    lessonId,
    dateKey,
    createdAt: serverTimestamp(),
    status: SpinTicketStatus.PENDING,
    source,
  };

  await setDoc(docRef, ticketData);

  return {
    id: docId,
    ...ticketData,
    createdAt: Timestamp.now(), // Fallback for client-side
  };
}

// Kiểm tra vé quay đã tồn tại chưa (dựa trên studentId, bookId, lessonId, dateKey)
export async function checkExistingSpinTicket(
  studentId: string,
  bookId: string,
  lessonId: number
): Promise<SpinTicket | null> {
  // Tạo dateKey theo format YYYY-MM-DD (Vietnam timezone)
  const vietnamTime = getVietnamTime();
  const dateKey = vietnamTime;

  const docId = `${studentId}_${bookId}_${lessonId}_${dateKey}`;
  const docRef = doc(spinTicketsCol, docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as SpinTicket;
  }

  return null;
}

// Lấy tất cả vé quay còn hiệu lực (chưa sử dụng, trong ngày) của user
export async function getTodaySpinTickets(
  studentId: string
): Promise<SpinTicket[]> {
  // Tạo dateKey theo format YYYY-MM-DD (Vietnam timezone)
  const now = new Date();
  const vietnamTime = getVietnamTime();
  const dateKey = vietnamTime; // YYYY-MM-DD

  const q = query(
    spinTicketsCol,
    where("studentId", "==", studentId),
    where("dateKey", "==", dateKey)
  );

  const snapshot = await getDocs(q);
  const tickets = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SpinTicket[];

  // Lọc ra các vé còn hiệu lực (chỉ trong ngày) và chưa sử dụng
  return tickets.filter(
    (ticket) => isTicketValid(ticket) && ticket.status === "pending"
  );
}

// Sử dụng vé quay (đánh dấu đã sử dụng và lưu giải thưởng)
export async function useSpinTicket(
  ticketId: string,
  prize: string
): Promise<void> {
  const docRef = doc(spinTicketsCol, ticketId);
  await setDoc(
    docRef,
    {
      status: "used",
      prize,
      usedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Lấy vé quay theo ID
export async function getSpinTicket(
  ticketId: string
): Promise<SpinTicket | null> {
  const docRef = doc(spinTicketsCol, ticketId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as SpinTicket;
  }

  return null;
}

// Thực hiện quay vé
export async function performSpin(
  studentId: string,
  ticketId: string,
  deviceInfo?: string,
  sessionId?: string
): Promise<{ prize: string; ticket: SpinTicket }> {
  // 1. Kiểm tra session restrictions
  await checkSessionRestrictions(studentId, sessionId);

  // 2. Kiểm tra rate limit cho user
  await checkUserRateLimit(studentId);

  // 3. Tạo user-level lock để chống đa thiết bị
  await createUserSpinLock(studentId, deviceInfo);

  // 4. Tạo ticket-level lock để tránh race condition
  await createSpinLock(ticketId, studentId);

  try {
    // 2. Sử dụng transaction để đảm bảo atomicity
    const result = await runTransaction(db, async (transaction) => {
      // 3. Tất cả READS trước
      const ticketRef = doc(spinTicketsCol, ticketId);
      const userRef = doc(db, "users", studentId);

      const [ticketSnap, userSnap] = await Promise.all([
        transaction.get(ticketRef),
        transaction.get(userRef),
      ]);

      if (!ticketSnap.exists()) {
        throw new Error("Vé quay không tồn tại");
      }

      const ticket = ticketSnap.data() as SpinTicket;
      const userData = userSnap.exists() ? userSnap.data() : {};

      if (ticket.studentId !== studentId) {
        throw new Error("Bạn không có quyền sử dụng vé này");
      }

      if (ticket.status === SpinTicketStatus.USED) {
        throw new Error("Vé quay đã được sử dụng");
      }

      // 4. Kiểm tra vé có còn hiệu lực không (chỉ dùng trong ngày)
      if (!isTicketValid(ticket)) {
        throw new Error(
          "Vé quay đã hết hạn. Vé chỉ có thể sử dụng trong ngày tạo."
        );
      }

      // 5. Tính kết quả dựa trên xác suất thật
      const prize = pickPrizeByRealProbability();

      // 6. Tất cả WRITES sau
      transaction.update(ticketRef, {
        status: SpinTicketStatus.USED,
        prize,
        usedAt: serverTimestamp(),
      });

      // 7. Trả về dữ liệu cần thiết để tạo currency transaction
      return {
        prize,
        ticket: {
          ...ticket,
          status: SpinTicketStatus.USED,
          prize,
          usedAt: Timestamp.now(),
        },
        userData,
      };
    });

    // 8. Tạo currency transaction sau khi transaction chính hoàn thành
    await createCurrencyTransaction({
      studentId: result.ticket.studentId,
      studentName: result.userData.displayName || "Chưa đặt tên",
      userId: studentId,
      userName: result.userData.displayName || "Chưa đặt tên",
      userRole: result.userData.role as UserRole,
      amount: parseInt(result.prize),
      reason: `quay_dorayaki_book_${result.ticket.bookId}_lesson_${result.ticket.lessonId}`,
      type: "add",
    });

    // 9. Trả về kết quả
    return {
      prize: result.prize,
      ticket: result.ticket,
    };
  } finally {
    // 10. Luôn xóa tất cả locks sau khi hoàn thành (dù thành công hay thất bại)
    await Promise.all([
      releaseSpinLock(ticketId),
      releaseUserSpinLock(studentId),
    ]);
  }
}

// Chọn giải thưởng dựa trên xác suất thật
function pickPrizeByRealProbability(): string {
  // Real probabilities (sum = 100)
  const REAL_PROBS: Record<string, number> = {
    "100": 3,
    "80": 5,
    "60": 10,
    "50": 12,
    "30": 15,
    "20": 23,
    "10": 32,
  };

  const keys = Object.keys(REAL_PROBS);
  const r = Math.random() * 100;
  let acc = 0;

  for (const k of keys) {
    acc += REAL_PROBS[k];
    if (r < acc) return k;
  }

  return "10"; // fallback
}

// Tạo giao dịch tiền ảo
async function createCurrencyTransaction(
  data: CreateCurrencyData
): Promise<void> {
  const currencyCol = collection(db, "currency");
  const now = Timestamp.now();

  await addDoc(currencyCol, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  // Cập nhật totalBanhRan của user
  const userRef = doc(db, "users", data.studentId);
  await updateDoc(userRef, {
    totalBanhRan: increment(data.amount),
    updatedAt: now,
  });
}

// Tạo lock cho ticket để tránh race condition
async function createSpinLock(
  ticketId: string,
  studentId: string
): Promise<void> {
  const lockKey = `spin_${ticketId}`;
  const lockRef = doc(locksCol, lockKey);

  const lockData = {
    ticketId,
    studentId,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 30000)), // 30s TTL
  };

  try {
    // Thử tạo lock (sẽ fail nếu đã tồn tại)
    await setDoc(lockRef, lockData);
  } catch (error) {
    // Kiểm tra xem lock có hết hạn không
    const existingLock = await getDoc(lockRef);
    if (existingLock.exists()) {
      const lockData = existingLock.data();
      const now = new Date();
      const expiresAt = lockData.expiresAt?.toDate();

      if (expiresAt && now > expiresAt) {
        // Lock đã hết hạn, xóa và tạo lại
        await deleteDoc(lockRef);
        await setDoc(lockRef, {
          ticketId,
          studentId,
          createdAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 30000)),
        });
        return;
      }
    }

    throw new Error("Đang có người khác quay vé này, vui lòng thử lại sau");
  }
}

// Xóa lock sau khi hoàn thành
async function releaseSpinLock(ticketId: string): Promise<void> {
  const lockKey = `spin_${ticketId}`;
  const lockRef = doc(locksCol, lockKey);
  await deleteDoc(lockRef);
}

// Tạo user-level lock để chống đa thiết bị
async function createUserSpinLock(
  studentId: string,
  deviceInfo?: string
): Promise<void> {
  const userLockKey = `user_spin_${studentId}`;
  const userLockRef = doc(locksCol, userLockKey);

  const userLockData = {
    studentId,
    deviceInfo: deviceInfo || "unknown",
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 60000)), // 60s TTL
  };

  try {
    // Thử tạo user lock
    await setDoc(userLockRef, userLockData);
  } catch (error) {
    // Kiểm tra xem user lock có hết hạn không
    const existingUserLock = await getDoc(userLockRef);
    if (existingUserLock.exists()) {
      const lockData = existingUserLock.data();
      const now = new Date();
      const expiresAt = lockData.expiresAt?.toDate();

      if (expiresAt && now > expiresAt) {
        // Lock đã hết hạn, xóa và tạo lại
        await deleteDoc(userLockRef);
        await setDoc(userLockRef, userLockData);
        return;
      }
    }

    throw new Error("Bạn đang quay ở thiết bị khác, vui lòng chờ 1 phút");
  }
}

// Xóa user lock sau khi hoàn thành
async function releaseUserSpinLock(studentId: string): Promise<void> {
  const userLockKey = `user_spin_${studentId}`;
  const userLockRef = doc(locksCol, userLockKey);
  await deleteDoc(userLockRef);
}

// Kiểm tra rate limit cho user (1 phút/lần)
async function checkUserRateLimit(studentId: string): Promise<void> {
  const rateLimitKey = `rate_limit_${studentId}`;
  const rateLimitRef = doc(locksCol, rateLimitKey);

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 phút trước

  try {
    const rateLimitSnap = await getDoc(rateLimitRef);

    if (rateLimitSnap.exists()) {
      const rateLimitData = rateLimitSnap.data();
      const lastSpinTime = rateLimitData.lastSpinTime?.toDate();

      if (lastSpinTime && lastSpinTime > oneMinuteAgo) {
        const remainingTime = Math.ceil(
          (lastSpinTime.getTime() + 60000 - now.getTime()) / 1000
        );
        throw new Error(
          `Bạn cần chờ ${remainingTime} giây trước khi quay tiếp`
        );
      }
    }

    // Cập nhật rate limit
    await setDoc(
      rateLimitRef,
      {
        studentId,
        lastSpinTime: serverTimestamp(),
        count: increment(1),
      },
      { merge: true }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Bạn cần chờ")) {
      throw error;
    }
    // Nếu lỗi khác, cho phép tiếp tục
    console.warn("Rate limit check failed:", error);
  }
}

// Kiểm tra session restrictions (chống đa thiết bị, timeout 30 phút)
async function checkSessionRestrictions(
  studentId: string,
  sessionId?: string
): Promise<void> {
  if (!sessionId) return; // Skip nếu không có session ID

  const sessionKey = `session_${studentId}_${sessionId}`;
  const sessionRef = doc(locksCol, sessionKey);

  try {
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      const now = new Date();
      const lastActivity = sessionData.lastActivity?.toDate();

      // Nếu session đã hết hạn (30 phút không hoạt động)
      if (
        lastActivity &&
        now.getTime() - lastActivity.getTime() > 30 * 60 * 1000
      ) {
        await deleteDoc(sessionRef);
        return;
      }

      // Kiểm tra xem có session khác đang active không
      const activeSessionsQuery = query(
        locksCol,
        where("studentId", "==", studentId),
        where("type", "==", "session")
      );

      const activeSessions = await getDocs(activeSessionsQuery);

      if (activeSessions.size > 1) {
        throw new Error(
          "Phát hiện nhiều phiên đăng nhập. Vui lòng đăng xuất khỏi thiết bị khác."
        );
      }
    }

    // Cập nhật session activity
    await setDoc(
      sessionRef,
      {
        studentId,
        sessionId,
        type: "session",
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Phát hiện nhiều phiên")
    ) {
      throw error;
    }
    console.warn("Session check failed:", error);
  }
}
