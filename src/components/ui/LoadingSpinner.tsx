"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  children?: ReactNode;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export default function LoadingSpinner({
  size = "md",
  text,
  children,
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`${sizeClasses[size]} border-2 border-border border-t-primary rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm md:text-base text-muted"
        >
          {text}
        </motion.p>
      )}
      {children}
    </div>
  );
}

// Loading dots animation
export function LoadingDots({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm md:text-base text-muted"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

// Skeleton loading
export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full"
    >
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 bg-border/30 rounded-lg mb-4 mx-auto w-3/4"></div>
          <div className="h-4 bg-border/20 rounded-lg mx-auto w-1/2"></div>
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-border/10 rounded-xl p-6">
              <div className="h-12 bg-border/20 rounded-lg mb-4"></div>
              <div className="h-6 bg-border/20 rounded-lg mb-2"></div>
              <div className="h-4 bg-border/20 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Button skeleton */}
        <div className="text-center mt-8">
          <div className="h-12 bg-border/20 rounded-xl mx-auto w-48"></div>
        </div>
      </div>
    </motion.div>
  );
}

// Page loading wrapper
export function PageLoading({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-[400px] flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
}

// Milu themed loading
export function MiluLoading({ text = "Đang tải..." }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center h-full"
    >
      {/* Milu Animation */}
      <motion.div
        className="text-6xl mb-4"
        animate={{
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut", // Smooth easing
        }}
      >
        <Image
          src="/assets/images/doraemon-1.png"
          alt="Milu"
          width={120}
          height={120}
        />
      </motion.div>

      {/* Loading Text */}
      <motion.h3
        className="text-xl font-semibold text-primary mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {text}
      </motion.h3>

      {/* Loading Dots */}
      <div className="flex justify-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      {/* Fun Message */}
      <motion.p
        className="text-sm md:text-base text-muted mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Milu đang chuẩn bị bảo bối... ✨
      </motion.p>
    </motion.div>
  );
}
