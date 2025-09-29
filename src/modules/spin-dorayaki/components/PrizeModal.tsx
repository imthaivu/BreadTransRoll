"use client";

import { useAuth } from "@/lib/auth/context";
import { motion } from "framer-motion";
import { Star, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

interface PrizeModalProps {
  prize: string;
  onClose: () => void;
}

export function PrizeModal({ prize, onClose }: PrizeModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Play sound based on prize value
  useEffect(() => {
    const audio = audioRef.current;

    const playPrizeSound = () => {
      if (audio) {
        const prizeValue = parseInt(prize);
        const soundFile =
          prizeValue <= 30
            ? "doraemon-low-point.mp3"
            : "doraemon-high-point.mp3";

        audio.src = `/sounds/${soundFile}`;
        audio.volume = 0.6; // 60% volume
        audio.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };

    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(playPrizeSound, 300);

    // Cleanup function to stop audio when component unmounts
    return () => {
      clearTimeout(timer);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [prize]);

  // Handle close with audio cleanup
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: -50, opacity: 0, scale: 0.7 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.7 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative w-full max-w-md rounded-3xl border-8 border-yellow-400 bg-gradient-to-b from-sky-300 to-blue-400 p-6 pt-16 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white transition-transform hover:scale-110"
        >
          <X size={24} />
        </button>

        {/* Doraemon Image */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="absolute -top-20 left-1/2 -translate-x-1/2"
        >
          <Image
            src="/assets/spin-dorayaki/doraemon.png"
            alt="Doraemon"
            width={120}
            height={120}
            className="drop-shadow-lg"
          />
        </motion.div>

        {/* Stars */}
        <Star
          className="absolute left-6 top-6 h-6 w-6 text-yellow-300"
          fill="currentColor"
        />
        <Star
          className="absolute right-6 top-12 h-8 w-8 text-yellow-300"
          fill="currentColor"
        />
        <Star
          className="absolute bottom-8 left-10 h-5 w-5 text-yellow-300"
          fill="currentColor"
        />

        <h2 className="text-3xl font-bold text-white [text-shadow:2px_2px_4px_rgba(0,0,0,0.5)]">
          CHÚC MỪNG!
        </h2>

        <p className="mt-2 text-xl font-semibold text-sky-100">
          Bạn đã nhận được
        </p>

        <div className="my-5 flex items-center justify-center gap-2">
          <motion.span
            className="text-8xl font-black text-white [text-shadow:3px_3px_0px_#f59e0b]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {prize}
          </motion.span>
          <Image
            src="/assets/images/banh-ran-1.png"
            alt="Bánh rán"
            width={120}
            height={120}
            className="drop-shadow-xl"
          />
        </div>

        <button
          onClick={handleClose}
          className="rounded-full border-b-4 border-amber-700 bg-amber-500 px-10 py-3 font-bold text-white transition-all hover:scale-105 active:translate-y-1 active:border-b-2"
        >
          Tuyệt vời!
        </button>

        {/* Hidden audio element */}
        <audio ref={audioRef} className="hidden" preload="auto" />
      </motion.div>
    </motion.div>
  );
}
