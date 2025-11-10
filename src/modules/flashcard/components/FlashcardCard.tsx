"use client";

import { Button } from "@/components/ui/Button";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Word } from "../types";

interface FlashcardCardProps {
  data: Word;
  onAnswer: (isCorrect: boolean) => void;
  onSpeak: (text: string) => void;
  onFlip?: (word: Word) => void;
}

function FlashcardCardComp({ data, onAnswer, onSpeak, onFlip }: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const hasFlippedRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const onSpeakRef = useRef(onSpeak);
  useEffect(() => {
    onSpeakRef.current = onSpeak;
  }, [onSpeak]);

  useEffect(() => {
    onSpeakRef.current(data.word);
  }, [data.word]);

  useEffect(() => {
    setIsFlipped(false);
    setDragOffset(0);
    setHasMoved(false);
    hasFlippedRef.current = false;
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
      cardRef.current.style.transform = "translateX(0) rotateY(0deg)";
      void cardRef.current.offsetHeight;
      cardRef.current.style.transition = "transform 0.6s ease";
    }
  }, [data.word]);

  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
    }
    dragStartPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
    setHasMoved(false);
  }, []);

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const offsetX = clientX - dragStartPos.current.x;
      const offsetY = clientY - dragStartPos.current.y;

      if (!hasMoved && (Math.abs(offsetX) > 5 || Math.abs(offsetY) > 5)) {
        setHasMoved(true);
      }
      setDragOffset(offsetX);

      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(${offsetX}px) rotate(${
          offsetX / 10
        }deg) ${isFlipped ? "rotateY(180deg)" : ""}`;
      }
    },
    [isDragging, isFlipped, hasMoved]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);

    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.3s ease";
    }

    if (!hasMoved) {
      setIsFlipped((prev) => {
        const newFlipped = !prev;
        // Khi lật từ false sang true (lần đầu tiên), gọi onFlip
        if (!prev && newFlipped && !hasFlippedRef.current && onFlip) {
          hasFlippedRef.current = true;
          onFlip(data);
        }
        return newFlipped;
      });
      if (cardRef.current) {
        cardRef.current.style.transform = "";
      }
      return;
    }

    if (dragOffset > 100) {
      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(100vw) rotate(90deg)`;
      }
      setTimeout(() => onAnswer(true), 300);
    } else if (dragOffset < -100) {
      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(-100vw) rotate(-90deg)`;
      }
      setTimeout(() => onAnswer(false), 300);
    } else {
      setDragOffset(0);
      if (cardRef.current) {
        cardRef.current.style.transform = isFlipped ? "rotateY(180deg)" : "";
      }
    }
  }, [isDragging, hasMoved, dragOffset, onAnswer, isFlipped, data, onFlip]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) =>
      handleDragMove(e.clientX, e.clientY);
    const onPointerUp = () => handleDragEnd();
    const onPointerCancel = () => handleDragEnd();

    if (isDragging) {
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    }

    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  return (
    <div className="flex justify-center items-center w-full max-w-md">
      <div
        ref={cardRef}
        className="relative w-full h-40 md:w-96 md:h-72 cursor-pointer perspective-1000 no-select touch-none"
        onPointerDown={(e) => {
          try {
            (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          } catch {}
          handleDragStart(e.clientX, e.clientY);
        }}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 w-full h-full rounded-lg"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.6s ease",
          }}
        >
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br bg-white rounded-lg flex flex-col justify-center items-center text-black p-6 shadow-[0px_0px_10px_rgba(1,1,1,0.4)]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{data.word}</h2>
              <p className="text-lg opacity-90">{data.ipa}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onSpeak(data.word);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              🔊
            </Button>
          </div>

          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex flex-col justify-center items-center text-white p-6"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
            }}
          >
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2">Nghĩa:</h3>
              <p className="text-xl">{data.mean}</p>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="w-80 md:w-96 mt-4 text-center text-sm md:text-base text-gray-600"></div> */}
    </div>
  );
}

const areEqual = (prev: FlashcardCardProps, next: FlashcardCardProps) => {
  // Only re-render when displayed word content changes
  return (
    prev.data.word === next.data.word &&
    prev.data.ipa === next.data.ipa &&
    prev.data.mean === next.data.mean
  );
};

export default memo(FlashcardCardComp, areEqual);
