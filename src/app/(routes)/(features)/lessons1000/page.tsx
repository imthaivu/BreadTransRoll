"use client";

import BookSelector from "@/components/lessons1000/BookSelector";
import AudioPlayer from "@/components/streamline/AudioPlayer";
import PageMotion, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/PageMotion";
import { LESSONS_1000_BOOKS, Lessons1000Book } from "@/constants/lessons1000";
import { useAuth } from "@/lib/auth/context";
import { useState } from "react";

const MAX_GUEST_LESSONS = 10;

export default function Lessons1000Page() {
  const { role, signInWithGoogle } = useAuth();
  const [selectedBook, setSelectedBook] = useState<Lessons1000Book | null>(
    LESSONS_1000_BOOKS[0]
  );
  const [currentLesson, setCurrentLesson] = useState(0);

  const handleBookSelect = (book: Lessons1000Book) => {
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
      <div className="bg-white">
        <StaggerContainer>
          <StaggerItem>
            <div>
              <div className="text-center">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Sách 1000 Bài Đọc/Nghe
              </h1>
            </div>
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
                <div className="space-y-8 mt-8">
                  {/* Audio player */}
                  <AudioPlayer
                    key={selectedBook.id}
                    audioFiles={audioFiles}
                    onLessonSelect={handleLessonSelect}
                    currentLesson={currentLesson}
                    missingLessons={[]}
                    trackingContext={{
                      module: "lessons1000",
                      itemKey: String(selectedBook.id),
                    }}
                  />
                </div>
              )}
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageMotion>
  );
}
