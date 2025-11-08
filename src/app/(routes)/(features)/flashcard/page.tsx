"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StaggerContainer, StaggerItem } from "@/components/ui/PageMotion";
import { playSound } from "@/lib/audio/soundManager";
import { useAuth } from "@/lib/auth/context";
import {
  CompletionScreen,
  Confetti,
  ConfirmExit,
  FlashcardCard,
  FlashcardControls,
  Guide,
  LearningView,
  LessonSelectionGrid,
  ReviewWordsModal,
  StatusDisplay,
  useFlashcard,
} from "@/modules/flashcard";
import { Word } from "@/modules/flashcard/types";
import "@/modules/flashcard/components/flashcard.css";
import { useEffect, useMemo, useState } from "react";

const MAX_LESSONS_GUEST = 10;

export default function FlashcardPage() {
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { role, signInWithGoogle, session } = useAuth();

  const {
    books,
    lessonsForBook, // Lấy lessons từ hook
    reviewWords,
    completedLessons,
    selectedBook,
    selectedLessons,
    selectedMode,
    deck,
    currentIndex,
    score,
    wrongWords,
    isPlaying,
    isLoading,
    booksError,
    lessonWordsError,
    hiddenWordIndices,
    setSelectedBook,
    setSelectedLessons,
    setSelectedMode,
    startLearning,
    handleAnswer,
    speak,
    reset,
  } = useFlashcard();

  const isGuest = !role || role === "guest";
  const isNotLoggedIn = !session?.user;
  const isGuestAfterLogin = session?.user && role === "guest";

  const sampleFlashcardData = useMemo(
    () => ({
      book: "1",
      lesson: 1,
      word: "Vocabulary",
      ipa: "/vəˈkæbjələri/",
      mean: "Từ vựng",
    }),
    []
  );

  // Handle completion
  useEffect(() => {
    if (!isPlaying && deck.length > 0 && currentIndex >= deck.length) {
      playSound("complete");
      setShowCompletion(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [isPlaying, deck.length, currentIndex]);

  // Effect to handle unsaved changes (confirm before exit)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isPlaying) {
        event.preventDefault();
        event.returnValue = ""; // Required for most browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isPlaying]);

  // Handle start learning
  const handleStart = () => {
    playSound("click");
    if (startLearning()) {
      setShowCompletion(false);
      setShowLearningModal(true);
    }
  };

  // Handle answer with sound effects
  const handleAnswerWithSound = (isCorrect: boolean, word?: Word) => {
    // Sounds are now only handled inside the QuizCard component.
    handleAnswer(isCorrect, word);
  };

  const handleCloseLearningModal = () => {
    if (isPlaying && currentIndex < deck.length) {
      setShowConfirmExit(true);
    } else {
      reset();
      setShowLearningModal(false);
      setShowCompletion(false);
    }
  };

  const forceCloseLearningModal = () => {
    reset();
    setShowLearningModal(false);
    setShowCompletion(false);
    setShowConfirmExit(false);
  };

  // Tạo danh sách books và lessons từ data
  const booksList = books.map((book) => ({
    value: book.id.toString(),
    label: book.name,
  }));

  const visibleLessons = isGuest
    ? lessonsForBook.slice(0, MAX_LESSONS_GUEST)
    : lessonsForBook;
  const lessonsList = visibleLessons.map((lesson) => ({
    value: lesson.toString(),
    label: `Lesson ${lesson}`,
  }));

  const handleSelectLesson = (lessonNum: number) => {
    if (selectedLessons.includes(lessonNum)) {
      setSelectedLessons(selectedLessons.filter((l) => l !== lessonNum));
    } else {
      setSelectedLessons([...selectedLessons, lessonNum].sort((a, b) => a - b));
    }
  };

  return (
    <div className="bg-white min-h-[calc(100vh-140px)] overflow-x-hidden">
      <StaggerContainer>
        <StaggerItem>

          <div className="text-center">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
              Flashcard - Học từ vựng hiệu quả
            </h1>
          </div>
        </StaggerItem>

        <StaggerItem>
          <StatusDisplay
            isLoading={isLoading}
            booksError={booksError}
            lessonWordsError={lessonWordsError}
          />
        </StaggerItem>

        {isGuest && !isLoading && (
          <StaggerItem>
            <div className="text-center p-3 my-3 max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg sm:p-4 sm:my-4">
              <p className="text-sm md:text-base text-yellow-800">
                {isGuestAfterLogin
                  ? "Vui lòng liên hệ BreadTrans để kích hoạt tài khoản"
                  : "Bạn đang xem 1 phần bài học. Tham gia để truy cập trọn vẹn!"}
              </p>
            </div>
          </StaggerItem>
        )}

        {/* Controls */}
        {!isLoading && books.length > 0 && (
          <div>
            <FlashcardControls
              isPlaying={isPlaying}
              selectedBook={selectedBook}
              setSelectedBook={setSelectedBook}
              booksList={booksList}
              onShowLessonModal={() => setShowLessonModal(true)}
              onShowReviewModal={() => setShowReviewModal(true)}
              reviewWordCount={reviewWords.length}
              selectedLessons={selectedLessons}
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              onStart={handleStart}
            />
          </div>
        )}

        {/* Sample Flashcard */}
        <StaggerItem>
          <div className="mt-2 sm:mt-6 text-center">
            <div className="flex justify-center mx-2">
              <FlashcardCard
                data={sampleFlashcardData}
                onAnswer={() => {}}
                onSpeak={() => speak(sampleFlashcardData.word)}
              />
            </div>
          </div>
        </StaggerItem>

        {/* Learning Modal */}
        <Modal
          open={showLearningModal}
          onClose={handleCloseLearningModal}
          title={`Kết quả `}
          overlayClassName="bg-black/60"
        >
          <div className="overflow-x-hidden max-w-screen ">
            {/* Learning Interface */}
            {isPlaying && deck.length > 0 && currentIndex < deck.length && (
              <StaggerItem>
                <LearningView
                  mode={selectedMode}
                  deck={deck}
                  currentIndex={currentIndex}
                  score={score}
                  wrongWordsCount={wrongWords.length}
                  onAnswer={handleAnswerWithSound}
                  onSpeak={speak}
                  hiddenWordIndices={hiddenWordIndices}
                />
              </StaggerItem>
            )}

            {/* Stop Button */}
            {isPlaying && !showCompletion && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setShowConfirmExit(true)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  Kết thúc phiên học
                </Button>
              </div>
            )}

            {/* Completion Screen */}
            {showCompletion && (
              <StaggerItem>
                <CompletionScreen
                  deckLength={deck.length}
                  score={score}
                  wrongWords={wrongWords}
                  onRestart={handleStart}
                  onClose={handleCloseLearningModal}
                  bookName={books.find((b) => b.id.toString() === selectedBook)?.name || ""}
                  selectedLessons={selectedLessons}
                />
              </StaggerItem>
            )}
          </div>
        </Modal>

        {/* Confirm Exit Modal */}
        <ConfirmExit
          open={showConfirmExit}
          onClose={() => setShowConfirmExit(false)}
          onConfirm={forceCloseLearningModal}
        />

        {/* Lesson Selection Modal */}
        <Modal
          open={showLessonModal}
          onClose={() => setShowLessonModal(false)}
          title={`Chọn Lessons cho Sách ${
            books.find((b) => b.id.toString() === selectedBook)?.name || ""
          }`}
        >
          <LessonSelectionGrid
            lessons={lessonsList}
            selectedLessons={selectedLessons}
            completedLessons={completedLessons}
            onSelectLesson={handleSelectLesson}
            onClose={() => setShowLessonModal(false)}
          />
        </Modal>

        {/* Review Words Modal */}
        <ReviewWordsModal
          open={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          reviewWords={reviewWords}
        />

        {/* Confetti */}
        <Confetti show={showConfetti} duration={3000} />

        {/* Guide Button */}
        <Guide />
      </StaggerContainer>
    </div>
  );
}
