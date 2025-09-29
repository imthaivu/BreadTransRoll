"use client";

import { usePageTransition } from "@/hooks/usePageTransition";
import { ReactNode } from "react";

interface BackButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: unknown;
}

export default function BackButton({
  children,
  className,
  onClick,
  ...props
}: BackButtonProps) {
  const { navigateBack } = usePageTransition();

  const handleClick = () => {
    // Call custom onClick if provided
    if (onClick) {
      onClick();
    }

    // Navigate back với slidePrev effect
    navigateBack();
  };

  return (
    <button className={className} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
