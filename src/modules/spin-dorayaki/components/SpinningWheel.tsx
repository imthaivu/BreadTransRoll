"use client";

import { useAuth } from "@/lib/auth/context";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  RotateCw,
  Ticket,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSpin } from "../hooks";
import { getTodaySpinTickets } from "../services";
import { SpinTicket } from "../types";
import { PrizeModal } from "./PrizeModal";
import { getVietnamTime } from "@/utils/time";

// Function để kiểm tra khung giờ (copy từ services.ts)
function checkTimeSlotCreateSpinTicket(): {
  allowed: boolean;
  message?: string;
} {
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
    message: `Bạn có thể nhận vé quay vòng quay bánh mì khi nộp bài trong khung giờ 8-10h sáng và 20-22h tối.`,
  };
}

// Configuration for prizes based on DISPLAY probabilities (visual representation)
const prizeDisplayConfig = [
  { text: "10", count: 4, color: "#2196F3", textColor: "#FFFFFF" }, // 20%
  { text: "20", count: 4, color: "#B3E5FC", textColor: "#333333" }, // 10%
  { text: "50", count: 3, color: "#FF9800", textColor: "#FFFFFF" }, // 20%
  { text: "80", count: 2, color: "#F8BBD0", textColor: "#333333" }, // 15%
  { text: "60", count: 2, color: "#4CAF50", textColor: "#FFFFFF" }, // 15%
  { text: "30", count: 3, color: "#FFEB3B", textColor: "#333333" }, // 10%
  { text: "100", count: 2, color: "#F44336", textColor: "#FFFFFF" }, // 10%
];

// Generate the 20-segment array for visual display
const prizes = prizeDisplayConfig.flatMap((p) =>
  Array.from({ length: p.count }, () => ({
    text: p.text,
    color: p.color,
    textColor: p.textColor,
  }))
);

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function SpinningWheel() {
  const { session, refetchProfile } = useAuth();
  const studentId = session?.user?.id || "";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pageLoadAudioRef = useRef<HTMLAudioElement>(null);
  const powerSelectAudioRef = useRef<HTMLAudioElement>(null);
  const [power, setPower] = useState(3);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Query to get today's spin tickets
  const { data: spinTickets = [], isLoading: ticketsLoading } = useQuery<
    SpinTicket[]
  >({
    queryKey: ["todaySpinTickets", studentId],
    queryFn: () => getTodaySpinTickets(studentId),
    enabled: !!studentId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Spin hook
  const { spin, isSpinning: isSpinLoading } = useSpin({
    onSuccess: (prize) => {
      // Sau khi API trả về kết quả, quay wheel đến đúng vị trí
      setTimeout(() => {
        spinWheelToResult(prize);
      }, 100); // Delay nhỏ để đảm bảo state đã update
    },
  });

  // Animation refs
  const currentAngleDegRef = useRef(0); // store in degrees for simpler math
  const animStartDegRef = useRef(0);
  const animTargetDegRef = useRef(0);
  const animStartTimeRef = useRef<number | null>(null);
  const animDurationMsRef = useRef(10000);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const numSegments = prizes.length;
    const angleStep = (2 * Math.PI) / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Step 1: Draw merged colored sections (seamless)
    let i = 0;
    while (i < prizes.length) {
      const currentPrize = prizes[i];
      let j = i;
      while (
        j + 1 < prizes.length &&
        prizes[j + 1].text === currentPrize.text
      ) {
        j++;
      }

      const startAngle =
        i * angleStep + (currentAngleDegRef.current * Math.PI) / 180;
      const endAngle =
        (j + 1) * angleStep + (currentAngleDegRef.current * Math.PI) / 180;

      ctx.fillStyle = currentPrize.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      i = j + 1;
    }

    // Step 2: Divider lines between different sections
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    prizes.forEach((prize, idx) => {
      const prevIndex = (idx - 1 + prizes.length) % prizes.length;
      if (prize.text !== prizes[prevIndex].text) {
        const angle =
          idx * angleStep + (currentAngleDegRef.current * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius
        );
        ctx.stroke();
      }
    });

    // Step 3: Draw text at merged section centers
    i = 0;
    while (i < prizes.length) {
      const currentPrize = prizes[i];
      let j = i;
      while (
        j + 1 < prizes.length &&
        prizes[j + 1].text === currentPrize.text
      ) {
        j++;
      }
      const span = j - i + 1;
      const startAngle =
        i * angleStep + (currentAngleDegRef.current * Math.PI) / 180;
      const midAngle = startAngle + (span * angleStep) / 2;

      ctx.save();
      ctx.fillStyle = currentPrize.textColor;
      ctx.translate(
        centerX + Math.cos(midAngle) * (radius - 50),
        centerY + Math.sin(midAngle) * (radius - 50)
      );
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillText(currentPrize.text, 0, 0);
      ctx.restore();

      i = j + 1;
    }

    // Step 4: Pointer (arrow)
    ctx.fillStyle = "#FFC107";
    ctx.strokeStyle = "#C08405";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 20, 5);
    ctx.lineTo(centerX + 20, 5);
    ctx.lineTo(centerX, 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }, []);

  // Animate to target angle
  const animate = useCallback(
    (time: number) => {
      if (animStartTimeRef.current == null) animStartTimeRef.current = time;
      const t = Math.min(
        1,
        (time - animStartTimeRef.current) / animDurationMsRef.current
      );
      const eased = easeOutCubic(t);
      const delta = animTargetDegRef.current - animStartDegRef.current;
      currentAngleDegRef.current = animStartDegRef.current + delta * eased;
      drawWheel();
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        if (isSoundEnabled && audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        // Compute final index to confirm and show result
        const arcd = 360 / prizes.length;
        const deg = currentAngleDegRef.current;
        const index = Math.floor(((360 - (deg % 360) + 270) % 360) / arcd);
        setResult(prizes[index].text);
      }
    },
    [drawWheel, isSoundEnabled]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const size = container.getBoundingClientRect().width;
      const newSize = Math.max(size, 280);
      canvas.width = newSize;
      canvas.height = newSize;
      drawWheel();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [drawWheel]);

  // Play sound when page loads
  useEffect(() => {
    const playPageLoadSound = () => {
      if (isSoundEnabled && pageLoadAudioRef.current) {
        pageLoadAudioRef.current.volume = 0.12; // 60% of 0.2 = 0.12
        pageLoadAudioRef.current.currentTime = 0; // Start from beginning
        pageLoadAudioRef.current.play().catch(() => {
          // Ignore autoplay errors - browsers may block autoplay
        });
      }
    };

    // Small delay to ensure page is fully loaded
    const timer = setTimeout(playPageLoadSound, 200);
    return () => clearTimeout(timer);
  }, [isSoundEnabled]);

  // Handle power selection with sound
  const handlePowerSelection = (level: number) => {
    setPower(level);

    // Play power selection sound (shorter, more subtle)
    if (isSoundEnabled && powerSelectAudioRef.current) {
      powerSelectAudioRef.current.volume = 0.24; // 60% of 0.4 = 0.24
      powerSelectAudioRef.current.currentTime = 0; // Reset to beginning
      powerSelectAudioRef.current.play().catch(() => {
        // Ignore autoplay errors
      });

      // Stop the sound after 0.5 second for power selection
      setTimeout(() => {
        if (powerSelectAudioRef.current) {
          powerSelectAudioRef.current.pause();
          powerSelectAudioRef.current.currentTime = 0;
        }
      }, 500);
    }
  };

  // Toggle sound on/off
  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);

    // Stop all sounds when disabling
    if (!isSoundEnabled) {
      if (pageLoadAudioRef.current) {
        pageLoadAudioRef.current.pause();
        pageLoadAudioRef.current.currentTime = 0;
      }
      if (powerSelectAudioRef.current) {
        powerSelectAudioRef.current.pause();
        powerSelectAudioRef.current.currentTime = 0;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const startSpin = () => {
    if (isSpinning || isSpinLoading) return;

    // Tìm vé quay chưa sử dụng và còn hiệu lực
    const vietnamTime = getVietnamTime();
    const currentDateKey = vietnamTime;

    const availableTicket = spinTickets.find(
      (ticket) => ticket.dateKey === currentDateKey
    );

    if (!availableTicket) {
      // Kiểm tra xem có vé hết hạn không
      const expiredTickets = spinTickets.filter(
        (ticket) => ticket.dateKey !== currentDateKey
      );

      if (expiredTickets.length > 0) {
        toast.error(
          "Tất cả vé quay đã hết hạn. Vé chỉ có thể sử dụng trong ngày tạo!"
        );
      } else {
        toast.error("Bạn không có vé quay nào để sử dụng!");
      }
      return;
    }

    // Gọi API để thực hiện quay
    spin(availableTicket.id);
  };

  // Hàm quay wheel với kết quả đã biết (sau khi API trả về)
  const spinWheelToResult = (decidedPrize: string) => {
    if (isSpinning) return;

    // 1) Pick a visual segment index that has that prize text (random among them)
    const candidateIndexes: number[] = [];
    for (let i = 0; i < prizes.length; i++) {
      if (prizes[i].text === decidedPrize) candidateIndexes.push(i);
    }
    const targetIndex =
      candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];

    // 2) Compute target angle so that pointer (top) lands at the middle of that segment
    const arcd = 360 / prizes.length;
    const mid = targetIndex * arcd + arcd / 2; // segment middle in display frame
    // Inversion of index formula: desired (360 - (deg % 360) + 270) % 360 = mid
    const currentDeg = currentAngleDegRef.current;
    const base = 630 - mid; // 360 + 270 - mid
    const currentMod = ((currentDeg % 360) + 360) % 360;
    const neededWithin360 = (base - currentMod + 360) % 360;

    // Add extra full turns based on power to be dramatic
    const extraTurns = power; // 3, 6, 10 turns
    const targetDeg = currentDeg + neededWithin360 + 360 * extraTurns;

    // 3) Configure animation
    animStartDegRef.current = currentAngleDegRef.current;
    animTargetDegRef.current = targetDeg;
    animDurationMsRef.current = 10000 + power * 500; // base 10s + a bit more with power
    animStartTimeRef.current = null;

    // Play music
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.volume = 0.6; // 60% volume for spinning sound
      audioRef.current.play().catch(() => {});
    }

    setResult(null);
    setIsSpinning(true);
    requestAnimationFrame(animate);
  };

  // Kiểm tra khung giờ hiện tại
  const timeCheck = checkTimeSlotCreateSpinTicket();

  return (
    <>
    <div className="text-center pt-4 mb-4 sm:pt-8 sm:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Vòng Quay Bánh mì
              </h1>
            </div>
      {/* Time Slot Notification */}
      {!timeCheck.allowed && (
        <div className="w-full max-w-4xl mx-auto px-4 py-4">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 text-lg">⏰</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-800 mb-1">
                  Khung giờ nhận vé quay
                </h3>
                <p className="text-sm text-orange-700">{timeCheck.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex w-full flex-col items-center justify-center gap-8 p-4 lg:flex-row lg:items-start lg:gap-12 lg:p-10">
        <div
          ref={canvasContainerRef}
          className="w-full max-w-xs flex-shrink-0 sm:max-w-sm lg:w-120 lg:max-w-none"
        >
          <canvas
            ref={canvasRef}
            id="wheel"
            className="rounded-full bg-[radial-gradient(circle_at_center,_#ffffff,_theme(colors.spin-wheel-blue))] shadow-spin-wheel"
          ></canvas>
        </div>

        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-blue-300 bg-gradient-to-br from-sky-100 to-blue-200 p-6 shadow-lg lg:w-112.5 lg:p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <Image
                className="h-20 w-20 sm:h-24 sm:w-24 transition-transform duration-500 hover:rotate-[360deg] hover:scale-110"
                src="/assets/spin-dorayaki/doraemon.png"
                alt="Doraemon"
                width={96}
                height={96}
              />
              {/* Sound toggle button */}
              <button
                onClick={toggleSound}
                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                title={isSoundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-4 h-4 text-blue-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <h1 className="text-2xl font-bold text-blue-800 [text-shadow:1px_1px_2px_#fff] sm:text-3xl">
              Vòng Quay Bánh mì
            </h1>
          </div>

          <div className="w-full space-y-3">
            <h2 className="text-center text-base font-semibold text-blue-700 sm:text-lg">
              Chọn Sức Mạnh
            </h2>
            <div className="flex w-full justify-between gap-3">
              {[
                { level: 3, name: "Yếu", img: "sizuka.png" },
                { level: 6, name: "Vừa", img: "suneo.png" },
                { level: 10, name: "Mạnh", img: "chai-en.png" },
              ].map(({ level, name, img }) => (
                <div
                  key={level}
                  className={`flex flex-1 cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 bg-white/50 p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    power === level
                      ? "scale-105 border-yellow-400 shadow-xl"
                      : "border-transparent"
                  }`}
                  onClick={() => handlePowerSelection(level)}
                >
                  <Image
                    className="h-12 w-12 rounded-full border-2 border-white shadow-sm sm:h-14 sm:w-14"
                    src={`/assets/spin-dorayaki/${img}`}
                    alt={name}
                    width={80}
                    height={80}
                  />
                  <span className="text-sm font-semibold text-slate-700 sm:text-base">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            id="btnSpin"
            onClick={startSpin}
            disabled={isSpinning || isSpinLoading}
            className={`flex items-center justify-center gap-3 rounded-full border-b-4 border-yellow-700 bg-yellow-500 px-10 py-4 text-2xl font-bold text-white transition-all hover:scale-105 active:translate-y-1 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              !isSpinning && !isSpinLoading && "animate-pulse"
            }`}
          >
            <RotateCw
              size={24}
              className={isSpinning || isSpinLoading ? "animate-spin" : ""}
            />
            <span className="text-lg sm:text-xl">
              {isSpinning || isSpinLoading ? "Đang quay..." : "QUAY NGAY!"}
            </span>
          </button>

          <audio
            ref={audioRef}
            src="/sounds/spin-dorayaki-music.mp3"
            className="hidden"
          ></audio>

          {/* Page load sound */}
          <audio
            ref={pageLoadAudioRef}
            src="/sounds/spin-dorayaki-music.mp3"
            className="hidden"
            preload="auto"
          ></audio>

          {/* Power selection sound */}
          <audio
            ref={powerSelectAudioRef}
            src="/sounds/spin-dorayaki-music.mp3"
            className="hidden"
            preload="auto"
          ></audio>
        </div>
      </div>

      {/* Spin Tickets Section */}
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Ticket className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-blue-800">
              Vé quay hôm nay
            </h2>
          </div>

          {ticketsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Đang tải vé quay...</span>
            </div>
          ) : spinTickets.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Chưa có vé quay nào
              </h3>
              <p className="text-gray-500">
                Hoàn thành quiz với độ chính xác cao để nhận vé quay bánh mì!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {spinTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium text-yellow-700">
                        Chưa sử dụng
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {/* Hiển thị trạng thái hết hạn */}
                      {(() => {
                        const vietnamTime = getVietnamTime();
                        const currentDateKey = vietnamTime;
                        const isExpired = ticket.dateKey !== currentDateKey;

                        if (isExpired) {
                          return (
                            <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded-full">
                              ⏰ Hết hạn
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        Sách {ticket.bookId} - Lesson {ticket.lessonId}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">
                        {new Date(ticket.dateKey).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const now = new Date();
                    const vietnamTime = getVietnamTime();
                    const isExpired = ticket.dateKey !== vietnamTime;

                    return (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        {isExpired ? (
                          <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full text-center">
                            ⏰ Vé đã hết hạn
                          </div>
                        ) : (
                          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full text-center">
                            Sẵn sàng quay!
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              ))}
            </div>
          )}

          {spinTickets.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  Tổng cộng: {spinTickets.length} vé quay hôm nay
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Mỗi vé chỉ có thể sử dụng một lần. Hoàn thành thêm quiz để nhận
                thêm vé!
              </p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <PrizeModal
            prize={result}
            onClose={() => {
              setResult(null);
              refetchProfile();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
