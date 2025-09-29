import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Book } from "@/modules/flashcard/types";
import { useState } from "react";

interface SubmissionControlsProps {
  books: Book[];
  lessons: number[];
  selectedBook: string | null;
  selectedLesson: number | null;
  onBookChange: (bookId: string) => void;
  onLessonChange: (lessonId: number) => void;
  booksLoading: boolean;
  lessonsLoading: boolean;
  disabled: boolean;
}

export const SubmissionControls = ({
  books,
  lessons,
  selectedBook,
  selectedLesson,
  onBookChange,
  onLessonChange,
  booksLoading,
  lessonsLoading,
  disabled,
}: SubmissionControlsProps) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex flex-wrap flex-row gap-4 w-full items-center mx-auto justify-center">
        <div className="min-w-[200px] flex items-center gap-4">
          <label
            htmlFor="book-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Chọn sách
          </label>

          <select
            id="book-select"
            value={selectedBook || ""}
            onChange={(e) => onBookChange(e.target.value)}
            disabled={booksLoading || disabled}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-10"
          >
            <option value="">
              {booksLoading ? "Đang tải sách..." : "-- Chọn một cuốn sách --"}
            </option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
          <label
            htmlFor="lesson-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Chọn bài học
          </label>

          <Button
            className="h-10 w-[100px]"
            onClick={() => {
              if (lessons.length > 0) {
                setShowModal(true);
              }
            }}
            disabled={
              !selectedBook ||
              lessonsLoading ||
              disabled ||
              lessons.length === 0
            }
          >
            {selectedLesson ? `Bài ${selectedLesson}` : "Chọn bài học"}
          </Button>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Chọn bài học"
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {lessons.map((lesson) => (
            <Button
              key={lesson}
              className="w-full h-10"
              onClick={() => {
                onLessonChange(lesson);
                setShowModal(false);
              }}
            >
              {lesson}
            </Button>
          ))}
        </div>
      </Modal>
    </>
  );
};
