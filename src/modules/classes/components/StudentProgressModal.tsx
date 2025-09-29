"use client";

import { useEffect, useState } from "react";
import { IClassMember } from "@/types";
import Image from "next/image";
import { FiArrowLeft, FiBook, FiX } from "react-icons/fi";
import {
  useBooks,
  useCompletedLessons,
  useLessons,
} from "@/modules/flashcard/hooks";
import { Book } from "@/modules/flashcard/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

// Sub-component to display the lesson grid for a selected book
function LessonGrid({ studentId, book }: { studentId: string; book: Book }) {
  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons(
    book.id.toString()
  );
  const { data: completedLessons = [], isLoading: isLoadingCompleted } =
    useCompletedLessons(studentId, book.id.toString());

  if (isLoadingLessons || isLoadingCompleted) {
    return <p>Đang tải danh sách bài học...</p>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {lessons.map((lessonId) => {
        const isCompleted = completedLessons.includes(lessonId);
        const statusClass = isCompleted
          ? "bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200 border border-green-200"
          : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200";

        return (
          <div
            key={lessonId}
            className={`p-3 rounded-lg text-center text-sm font-medium ${statusClass}`}
          >
            Bài {lessonId}
          </div>
        );
      })}
    </div>
  );
}

interface StudentProgressModalProps {
  student: IClassMember;
  isOpen: boolean;
  onClose: () => void;
}

// Main modal component
export function StudentProgressModal({
  student,
  isOpen,
  onClose,
}: StudentProgressModalProps) {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const { data: books = [], isLoading: isLoadingBooks } = useBooks();

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
  };

  const handleGoBack = () => {
    setSelectedBook(null);
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={selectedBook ? `Bài học trong ${selectedBook.name}` : "Sách"}
    >
      {/* Body */}
      <div className="overflow-y-auto">
        {selectedBook && (
          <Button
            variant="outline"
            className="mb-4"
            onClick={selectedBook ? handleGoBack : onClose}
          >
            {selectedBook && <FiArrowLeft />}
            <span className="ml-2">Quay lại</span>
          </Button>
        )}

        {isLoadingBooks ? (
          <p>Đang tải danh sách sách...</p>
        ) : selectedBook ? (
          // Lesson View
          <LessonGrid studentId={student.id} book={selectedBook} />
        ) : (
          // Book Selection View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => handleSelectBook(book)}
                className="p-4 border rounded-lg flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiBook className="w-8 h-8 text-primary" />
                <span className="font-semibold text-lg">{book.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
