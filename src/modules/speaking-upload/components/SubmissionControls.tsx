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

          

          <Button
            variant="outline"
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

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Chọn bài học"
      >
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
          {lessons.map((lesson) => (
            <Button
              key={lesson}
              variant={selectedLesson === lesson ? "primary" : "outline"}
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
