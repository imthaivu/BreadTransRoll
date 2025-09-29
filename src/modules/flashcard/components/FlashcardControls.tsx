import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth/context";

interface Book {
  value: string;
  label: string;
}

interface FlashcardControlsProps {
  isPlaying: boolean;
  selectedBook: string | null;
  setSelectedBook: (bookId: string) => void;
  booksList: Book[];
  onShowLessonModal: () => void;
  onShowReviewModal: () => void;
  reviewWordCount: number;
  selectedLessons: number[];
  selectedMode: "flashcard" | "quiz";
  setSelectedMode: (mode: "flashcard" | "quiz") => void;
  onStart: () => void;
}

export const FlashcardControls = ({
  isPlaying,
  selectedBook,
  setSelectedBook,
  booksList,
  onShowLessonModal,
  onShowReviewModal,
  reviewWordCount,
  selectedLessons,
  selectedMode,
  setSelectedMode,
  onStart,
}: FlashcardControlsProps) => {
  return (
    <Card className="border-none shadow-none">
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-row md:items-center md:justify-center md:gap-4">
        {/* Review Button */}
        <Button
          onClick={onShowReviewModal}
          variant="outline"
          className="w-full md:w-auto justify-center px-3 py-1.5 text-sm"
          disabled={isPlaying || reviewWordCount === 0}
        >
          📖 Ôn từ ({reviewWordCount})
        </Button>

        {/* Book Selection */}
        <div className="flex items-center">
          <select
            value={selectedBook || ""}
            onChange={(e) => setSelectedBook(e.target.value)}
            className="w-full md:w-auto px-2 py-1.5 h-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPlaying}
          >
            <option value="">-- Chọn sách --</option>
            {booksList.map((book) => (
              <option key={book.value} value={book.value}>
                {book.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lesson Selection */}
        <div className="flex items-center">
          <Button
            onClick={onShowLessonModal}
            variant="outline"
            className="w-full md:w-auto justify-center px-3 py-1.5 text-sm h-10"
            disabled={isPlaying || !selectedBook}
          >
            {selectedLessons.length > 0
              ? `${selectedLessons.length} lessons`
              : "Chọn Lessons"}
          </Button>
        </div>

        {/* Mode Selection */}
        <div className="flex items-center">
          <select
            value={selectedMode}
            onChange={(e) =>
              setSelectedMode(e.target.value as "flashcard" | "quiz")
            }
            className="w-full md:w-auto h-10 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPlaying}
          >
            <option value="flashcard">🃏 Flashcard</option>
            <option value="quiz">🧠 Quiz</option>
          </select>
        </div>

        {/* Start Button */}
        <div className="col-span-2 flex justify-center md:col-span-1">
          <Button
            onClick={onStart}
            className="md:w-auto px-4 py-1.5 h-10 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            disabled={
              isPlaying || !selectedBook || selectedLessons.length === 0
            }
          >
            🚀 Bắt đầu
          </Button>
        </div>
      </div>
    </Card>
  );
};
