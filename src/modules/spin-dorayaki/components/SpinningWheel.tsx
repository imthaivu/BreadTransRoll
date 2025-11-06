"use client";

import { useAuth } from "@/lib/auth/context";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  RefreshCw,
  RotateCw,
  Ticket,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const { 
    data: allSpinTickets = [], 
    isLoading: ticketsLoading,
    refetch: refetchTickets,
    isRefetching: isRefetchingTickets
  } = useQuery<
    SpinTicket[]
  >({
    queryKey: ["todaySpinTickets", studentId],
    queryFn: () => getTodaySpinTickets(studentId),
    enabled: !!studentId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Filter to only show valid tickets (not expired, dateKey matches today)
  const spinTickets = useMemo(() => {
    const vietnamTime = getVietnamTime();
    const currentDateKey = vietnamTime;
    return allSpinTickets.filter(
      (ticket) => ticket.dateKey === currentDateKey && ticket.status === "pending"
    );
  }, [allSpinTickets]);

  // Store prize result while spinning
  const pendingPrizeRef = useRef<string | null>(null);

  // Valid prizes list for validation
  const VALID_PRIZES = ["10", "20", "30", "50", "60", "80", "100"];

  // Spin hook
  const { spin, isSpinning: isSpinLoading } = useSpin({
    onSuccess: (prize) => {
      // Validate prize from server (security check)
      if (!VALID_PRIZES.includes(prize)) {
        console.error("Invalid prize from server:", prize);
        toast.error("Có lỗi xảy ra, vui lòng thử lại");
        setIsSpinning(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        return;
      }

      // Lưu kết quả và điều chỉnh animation nếu đang quay
      pendingPrizeRef.current = prize;
      if (isSpinning) {
        // Nếu đang quay, điều chỉnh target để dừng đúng vị trí
        spinWheelToResult(prize);
      }
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
        const finalPrize = prizes[index].text;
        
        // Verify final prize matches server result (if available)
        if (pendingPrizeRef.current && finalPrize !== pendingPrizeRef.current) {
          // If mismatch, use server result (source of truth)
          console.warn("Prize mismatch, using server result");
          setResult(pendingPrizeRef.current);
        } else {
          setResult(finalPrize);
        }
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

  // Client-side rate limiting (backup layer - server is primary)
  const lastSpinTimeRef = useRef<number>(0);
  const MIN_SPIN_INTERVAL_MS = 1000; // Minimum 1 second between spins

  const startSpin = () => {
    if (isSpinning || isSpinLoading) return;

    // Client-side rate limiting check
    const now = Date.now();
    const timeSinceLastSpin = now - lastSpinTimeRef.current;
    if (timeSinceLastSpin < MIN_SPIN_INTERVAL_MS) {
      toast.error("Vui lòng chờ một chút trước khi quay lại");
      return;
    }

    // Tìm vé quay chưa sử dụng (đã được filter chỉ còn vé hợp lệ)
    const availableTicket = spinTickets.find(
      (ticket) => ticket.status === "pending"
    );

    if (!availableTicket) {
      toast.error("Bạn không có vé quay nào để sử dụng!");
      return;
    }

    // Double-check ticket validity (defense in depth)
    const vietnamTime = getVietnamTime();
    if (availableTicket.dateKey !== vietnamTime) {
      toast.error("Vé đã hết hạn, vui lòng làm mới trang");
      return;
    }

    // Update last spin time
    lastSpinTimeRef.current = now;

    // Reset pending prize
    pendingPrizeRef.current = null;

    // Bắt đầu animation ngay lập tức với một góc quay lớn (tạm thời)
    // Animation sẽ được điều chỉnh khi API trả về
    const tempTargetDeg = currentAngleDegRef.current + 360 * (power + 5); // Quay nhiều vòng hơn
    animStartDegRef.current = currentAngleDegRef.current;
    animTargetDegRef.current = tempTargetDeg;
    animDurationMsRef.current = 10000 + power * 500;
    animStartTimeRef.current = null;

    // Play music ngay
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.volume = 0.6;
      audioRef.current.play().catch(() => {});
    }

    setResult(null);
    setIsSpinning(true);
    requestAnimationFrame(animate);

    // Gọi API để thực hiện quay (song song với animation)
    spin(availableTicket.id);
  };

  // Hàm quay wheel với kết quả đã biết (sau khi API trả về)
  const spinWheelToResult = (decidedPrize: string) => {
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
    
    // Nếu đang quay, điều chỉnh target để dừng đúng vị trí
    if (isSpinning && animStartTimeRef.current !== null) {
      // Tính thời gian đã trôi qua
      const elapsed = performance.now() - animStartTimeRef.current;
      const progress = Math.min(1, elapsed / animDurationMsRef.current);
      
      // Tính góc hiện tại dựa trên progress
      const eased = easeOutCubic(progress);
      const currentDelta = animTargetDegRef.current - animStartDegRef.current;
      const currentAngle = animStartDegRef.current + currentDelta * eased;
      
      // Tính target mới để đảm bảo quay đủ vòng và dừng đúng vị trí
      // Đảm bảo quay thêm ít nhất 2-3 vòng nữa từ vị trí hiện tại
      const remainingTurns = Math.max(extraTurns, 3);
      const finalTarget = currentAngle + neededWithin360 + 360 * remainingTurns;
      
      // Cập nhật animation để dừng đúng vị trí
      animStartDegRef.current = currentAngle;
      animTargetDegRef.current = finalTarget;
      animStartTimeRef.current = performance.now();
      // Giữ nguyên duration còn lại
      const remainingTime = animDurationMsRef.current * (1 - progress);
      animDurationMsRef.current = Math.max(remainingTime, 5000); // Tối thiểu 5 giây
    } else {
      // Nếu chưa bắt đầu quay, setup như bình thường
      const targetDeg = currentDeg + neededWithin360 + 360 * extraTurns;
      animStartDegRef.current = currentAngleDegRef.current;
      animTargetDegRef.current = targetDeg;
      animDurationMsRef.current = 10000 + power * 500;
      animStartTimeRef.current = null;
      
      // Play music
      if (isSoundEnabled && audioRef.current) {
        audioRef.current.volume = 0.6;
        audioRef.current.play().catch(() => {});
      }
      
      setResult(null);
      setIsSpinning(true);
      requestAnimationFrame(animate);
    }
  };

  // Kiểm tra khung giờ hiện tại

  return (
    <>
      <div className="flex w-full flex-col items-center justify-center md:flex-row gap-2">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-2xl border border-blue-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Ticket className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-blue-800">
                  Vé quay hôm nay
                </h2>
              </div>
              <button
                onClick={() => refetchTickets()}
                disabled={isRefetchingTickets || ticketsLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Làm mới danh sách vé"
              >
                <RefreshCw 
                  className={`w-4 h-4 ${isRefetchingTickets || ticketsLoading ? 'animate-spin' : ''}`} 
                />
                <span className="hidden sm:inline">Lấy vé</span>
              </button>
            </div>

            {ticketsLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600">Đang tải vé quay...</span>
              </div>
            ) : spinTickets.length === 0 ? (
              <div className="text-center ">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Chưa có vé quay nào
                </h3>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {spinTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-white rounded-lg border-2 border-dashed border-blue-300 p-3 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                  >
                    {/* Ticket icon decoration */}
                    <div className="absolute top-1.5 right-1.5">
                      <Ticket className="w-3.5 h-3.5 text-blue-400 opacity-20" />
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">
                        Sẵn sàng
                      </span>
                    </div>

                    {/* Date info */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 flex-shrink-0">
                        <Calendar className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 mb-0.5">Hạn sử dụng</p>
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {new Date(ticket.dateKey).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            
          </div>
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-blue-300 bg-gradient-to-br from-sky-100 to-blue-200 p-2 shadow-lg lg:w-112.5 lg:p-8">
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
                  className={`flex cursor-pointer flex-col items-center justify-end gap-1 rounded-2xl border-2 bg-white/50 p-1 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    power === level
                      ? "scale-105 border-yellow-400 shadow-xl"
                      : "border-transparent"
                  }`}
                  onClick={() => handlePowerSelection(level)}
                >
                  <Image
                    src={`/assets/spin-dorayaki/${img}`}
                    alt={name}
                    width={120}
                    height={120}
                  />
                  <span className="text-sm font-semibold text-slate-700 sm:text-base">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
        </div>
        </div>

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
        <div
          ref={canvasContainerRef}
          className="w-full max-w-xs flex-shrink-0 sm:max-w-sm lg:w-120 lg:max-w-none"
        >
          <canvas
            ref={canvasRef}
            id="wheel"
            className="rounded-full bg-[radial-gradient(circle_at_center,_#ffffff,_theme(colors.spin-wheel-blue))] shadow-spin-wheel"
          ></canvas>
          <div className="flex text-center justify-center mt-3">
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
          </div>
        </div>
      </div>

      {/* Spin Tickets Section */}

      {/* Time Slot Notification */}

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
