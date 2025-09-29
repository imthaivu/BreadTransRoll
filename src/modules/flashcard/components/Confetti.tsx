"use client";

import { useEffect } from "react";

interface ConfettiProps {
  show: boolean;
  duration?: number; // milliseconds
}

export default function Confetti({ show, duration = 2000 }: ConfettiProps) {
  useEffect(() => {
    if (!show) return;

    const endTime = Date.now() + duration;

    const createConfetti = () => {
      const colors = [
        "#ff6b6b",
        "#4ecdc4",
        "#45b7d1",
        "#96ceb4",
        "#feca57",
        "#ff9ff3",
      ];
      const confetti = document.createElement("div");

      confetti.style.position = "fixed";
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.top = "-10px";
      confetti.style.width = "10px";
      confetti.style.height = "10px";
      confetti.style.backgroundColor =
        colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = "50%";
      confetti.style.pointerEvents = "none";
      confetti.style.zIndex = "9999";
      confetti.style.animation = "confetti-fall 2s linear forwards";

      document.body.appendChild(confetti);

      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }
      }, 2000);
    };

    const interval = setInterval(() => {
      if (Date.now() < endTime) {
        createConfetti();
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [show, duration]);

  return null;
}
