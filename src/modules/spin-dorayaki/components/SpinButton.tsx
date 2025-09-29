"use client";

import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Gift } from "lucide-react";
import Image from "next/image";

interface SpinButtonProps {
  onSpin: () => void;
  isSpinning: boolean;
  disabled?: boolean;
  className?: string;
}

export function SpinButton({
  onSpin,
  isSpinning,
  disabled,
  className,
}: SpinButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      <Button
        onClick={onSpin}
        disabled={disabled || isSpinning}
        className="relative overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-full shadow-lg border-2 border-yellow-300 min-w-[200px]"
      >
        {isSpinning ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Đang quay...</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6" />
            <span>QUAY NGAY!</span>
            <Image
              src="/assets/images/banh-ran-1.png"
              alt="Bánh rán"
              width={24}
              height={24}
              className="animate-bounce"
            />
          </div>
        )}

        {/* Sparkle effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300" />
      </Button>
    </motion.div>
  );
}
