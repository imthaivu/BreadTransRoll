"use client";

import { motion } from "framer-motion";
import { ReactNode, useState } from "react";

interface LoadingButtonProps {
  children: ReactNode;
  onClick?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  loadingText?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: " bg-primary text-white hover: bg-primary/90",
  secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  outline:
    "border border-primary text-primary hover: bg-primary hover:text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm md:text-base",
  md: "px-6 py-2 text-base",
  lg: "px-8 py-3 text-lg",
};

export default function LoadingButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  className = "",
  loadingText = "Đang xử lý...",
  variant = "primary",
  size = "md",
}: LoadingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (loading || isLoading || disabled) return;

    setIsLoading(true);
    try {
      if (onClick) {
        await onClick();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = disabled || loading || isLoading;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-xl font-semibold transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 transform
        ${className}
      `}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
    >
      <div className="flex items-center justify-center gap-2">
        {(loading || isLoading) && (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
        <span>{loading || isLoading ? loadingText : children}</span>
      </div>
    </motion.button>
  );
}
