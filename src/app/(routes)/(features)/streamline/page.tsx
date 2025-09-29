"use client";

import AudioPlayer from "@/components/streamline/AudioPlayer";
import BookSelector from "@/components/streamline/BookSelector";
import PageMotion, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/PageMotion";
import { STREAMLINE_BOOKS, StreamlineBook } from "@/constants/streamline";
import { useAuth } from "@/lib/auth/context";
import { useState } from "react";

const MAX_GUEST_LESSONS = 10;

export default function StreamlinePage() {
  const { role, signInWithGoogle } = useAuth();
  const [selectedBook, setSelectedBook] = useState<StreamlineBook | null>(
    STREAMLINE_BOOKS[0]
  );
  const [currentLesson, setCurrentLesson] = useState(0);

  const handleBookSelect = (book: StreamlineBook) => {
    setSelectedBook(book);
    setCurrentLesson(0);
  };

  const handleLessonSelect = (index: number) => {
    setCurrentLesson(index);
  };

  const isGuest = !role || role === "guest";
  const audioFiles = selectedBook
    ? isGuest
      ? selectedBook.audioFiles.slice(0, MAX_GUEST_LESSONS)
      : selectedBook.audioFiles
    : [];

  return (
    <PageMotion showLoading={false}>
      <div className="bg-white min-h-[calc(100vh-140px)] overflow-x-hidden">
        <StaggerContainer>
          <StaggerItem>
            <div>
              <BookSelector
                selectedBook={selectedBook}
                onBookSelect={handleBookSelect}
              />

              {isGuest && (
                <div className="text-center p-4 my-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm md:text-base text-yellow-800">
                    Bạn đang xem trước với tư cách khách.{" "}
                    <button
                      onClick={signInWithGoogle}
                      className="font-semibold underline hover:text-yellow-900"
                    >
                      Đăng nhập
                    </button>{" "}
                    để truy cập toàn bộ bài học!
                  </p>
                </div>
              )}

              {selectedBook && (
                <AudioPlayer
                  key={selectedBook.id}
                  audioFiles={audioFiles}
                  onLessonSelect={handleLessonSelect}
                  currentLesson={currentLesson}
                  missingLessons={selectedBook.missingLessons}
                  trackingContext={{
                    module: "streamline",
                    itemKey: String(selectedBook.id),
                  }}
                />
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageMotion>
  );
}
