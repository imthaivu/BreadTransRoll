"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import LoadingSpinner, { SkeletonCard } from "./LoadingSpinner";
import { cn } from "@/utils";

interface PageMotionProps {
  children: ReactNode;
  delay?: number;
  showLoading?: boolean;
  loadingText?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.3,
};

export default function PageMotion({
  children,
  delay = 0,
  showLoading = false,
}: PageMotionProps) {
  const [isLoading, setIsLoading] = useState(showLoading);

  useEffect(() => {
    if (showLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000 + delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [showLoading, delay]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ ...pageTransition, delay }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Component cho fade in đơn giản
export function FadeIn({
  children,
  delay = 0,
  showLoading = false,
  loadingText = "Đang tải...",
}: PageMotionProps) {
  const [isLoading, setIsLoading] = useState(showLoading);

  useEffect(() => {
    if (showLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800 + delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [showLoading, delay]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text={loadingText} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Component cho slide up
export function SlideUp({
  children,
  delay = 0,
  showLoading = false,
  loadingText = "Đang tải...",
}: PageMotionProps) {
  const [isLoading, setIsLoading] = useState(showLoading);

  useEffect(() => {
    if (showLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 900 + delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [showLoading, delay]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text={loadingText} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Component cho stagger animation
export function StaggerContainer({ children, delay = 0 }: PageMotionProps) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      variants={{
        initial: { opacity: 0 },
        in: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay,
          },
        },
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Component cho stagger items
export function StaggerItem({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={cn("w-full", className)}
      variants={{
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
      }}
      initial="initial"
      animate="in"
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
