import { Card } from "@/components/ui/Card";

import { playSound } from "@/lib/audio/soundManager";
import { Word } from "..";
import FlashcardCard from "./FlashcardCard";
import QuizCard from "./QuizCard";

interface LearningViewProps {
  mode: "flashcard" | "quiz";
  deck: Word[];
  currentIndex: number;
  score: number;
  wrongWordsCount: number;
  onAnswer: (isCorrect: boolean, word?: Word) => void;
  onSpeak: (text: string) => void;
  hiddenWordIndices?: Set<number>; // Indices of words that should hide text in quiz mode
}

export const LearningView = ({
  mode,
  deck,
  currentIndex,
  score,
  wrongWordsCount,
  onAnswer,
  onSpeak,
  hiddenWordIndices = new Set(),
}: LearningViewProps) => {
  const currentWord = deck[currentIndex];
  const hideWord = mode === "quiz" && hiddenWordIndices.has(currentIndex);
  const accuracy =
    currentIndex > 0 ? Math.round((score / currentIndex) * 100) : 0;
  const progressPercent = ((currentIndex + 1) / deck.length) * 100;

  return (
    <Card className="md:p-4 md:mb-4 shadow-none border-none relative h-full">
      {/* Card Display */}
      <div className="mb-6 flex justify-center items-center">
        {mode === "flashcard" ? (
          <FlashcardCard
            key={currentWord.word}
            data={currentWord}
            onAnswer={onAnswer}
            onSpeak={onSpeak}
          />
        ) : (
          <QuizCard
            data={currentWord}
            allData={deck}
            onAnswer={onAnswer}
            timer={3}
            onSpeak={onSpeak}
            playSound={playSound}
            hideWord={hideWord}
          />
        )}
      </div>

      {/* Score Display */}
      {mode === "flashcard" && (
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {wrongWordsCount}
            </div>
            <div className="text-sm text-gray-600 md:text-base">Từ sai</div>
          </div>
        </div>
      )}

      {/* Progress Bars Container */}
      <div className="max-w-xs mx-auto space-y-3">
        {/* Progress Bar - Completion */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs md:text-base">
            <span className="font-medium text-gray-700">Tiến độ</span>
            <span className="text-gray-600">
              {currentIndex + 1} / {deck.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
        {/* Progress Bar - Accuracy */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs md:text-base">
            <span className="font-medium text-gray-700">Chính xác</span>
            <span className="text-gray-600">{accuracy}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${accuracy}%`,
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
