"use client";

import { Button } from "@/components/ui/Button";
import { useCallback, useEffect, useRef, useState } from "react";
import { Word } from "../types";
import { cn } from "@/utils";

interface QuizCardProps {
  data: Word;
  allData: Word[];
  onAnswer: (isCorrect: boolean, word?: Word) => void;
  timer?: number;
  onSpeak: (text: string) => void;
  playSound: (soundName: "correct" | "wrong") => void;
}

export default function QuizCard({
  data,
  allData,
  onAnswer,
  timer = 10,
  onSpeak,
  playSound,
}: QuizCardProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(timer);
  const [isAnswered, setIsAnswered] = useState(false);
  const timeOutRef = useRef(false);

  useEffect(() => {
    setIsAnswered(false);
    setSelectedOption(null);
    setTimeLeft(timer);
    timeOutRef.current = false;

    const correctAnswer = data.mean;
    // Build a unique pool of wrong answers (exclude current), then shuffle and pick
    const wrongPool = Array.from(
      new Set(
        allData.filter((d) => d.mean !== correctAnswer).map((d) => d.mean)
      )
    );
    for (let i = wrongPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongPool[i], wrongPool[j]] = [wrongPool[j], wrongPool[i]];
    }
    const wrongAnswers = wrongPool.slice(0, 2);

    const allOptions = [correctAnswer, ...wrongAnswers];
    const shuffled = allOptions.sort(() => Math.random() - 0.5);
    setOptions(shuffled);
  }, [data.word, data.mean, allData, timer]);

  useEffect(() => {
    const speakTimeout = setTimeout(() => {
      onSpeak(data.word);
    }, 200);

    return () => clearTimeout(speakTimeout);
  }, [data.word, onSpeak]);

  useEffect(() => {
    if (isAnswered) {
      return;
    }

    if (timeLeft <= 0) {
      if (!timeOutRef.current) {
        timeOutRef.current = true;
        setIsAnswered(true);
        playSound("wrong");

        setTimeout(() => {
          onAnswer(false, data);
        }, 500);
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isAnswered, onAnswer, data, playSound]);

  const handleAnswer = useCallback(
    (option: string) => {
      if (isAnswered) return;

      setSelectedOption(option);
      setIsAnswered(true);

      const isCorrect = option === data.mean;
      playSound(isCorrect ? "correct" : "wrong");

      setTimeout(() => {
        onAnswer(isCorrect, data);
      }, 1000);
    },
    [isAnswered, data, onAnswer, playSound]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex justify-center items-center">
      <div className="w-full">
        <div className="md:p-6 mb-6 w-full">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mt-2">
              {data.word}
            </h2>
            <p className="text-lg text-gray-600">{data.ipa}</p>
          </div>

          <div className="absolute top-0 right-0 text-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSpeak(data.word)}
              className="px-4 py-2"
            >
              🔊
            </Button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => {
              let buttonClass =
                "w-full p-3 text-left rounded-lg border transition-all ";

              if (isAnswered) {
                if (selectedOption !== null) {
                  if (option === data.mean) {
                    buttonClass +=
                      "bg-green-100 border-green-500 text-green-800";
                  } else if (option === selectedOption) {
                    buttonClass += "bg-red-100 border-red-500 text-red-800";
                  } else {
                    buttonClass += "bg-gray-100 border-gray-300 text-gray-600";
                  }
                } else {
                  buttonClass += "bg-gray-100 border-gray-300 text-gray-600";
                }
              } else {
                buttonClass +=
                  "bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50";
              }

              return (
                <button
                  key={index}
                  className={cn("select-none", buttonClass)}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                >
                  <span className="font-medium">
                    {String.fromCharCode(65 + index)}.
                  </span>{" "}
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
