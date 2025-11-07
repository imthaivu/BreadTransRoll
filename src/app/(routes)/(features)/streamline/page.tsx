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
  const { role, signInWithGoogle, session } = useAuth();
  const isNotLoggedIn = !session?.user;
  const isGuestAfterLogin = session?.user && role === "guest";
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
              <div className="text-center">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Sách Streamline English
              </h1>
            </div>
              <BookSelector
                selectedBook={selectedBook}
                onBookSelect={handleBookSelect}
              />

              {isGuest && (
                <div className="text-center p-3 my-3 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg sm:p-4 sm:my-4">
                <p className="text-sm md:text-base text-yellow-800">
                  {isGuestAfterLogin
                    ? "Vui lòng liên hệ BreadTrans để kích hoạt tài khoản"
                    : "Bạn đang xem 1 phần bài học. Tham gia để truy cập trọn vẹn!"}
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
