import { useAuth } from "@/lib/auth/context";
import {
  addOrUpdateReviewWord,
  decreaseReviewCount,
  getBook,
  getBooks,
  getCompletedLessons,
  getLessonStatuses,
  getLessonWords,
  getReviewWords,
  saveQuizResult,
  updateLessonStatus,
} from "@/modules/flashcard/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Book,
  LessonStatus,
  QuizResult,
  ReviewWord,
  SessionAnswer,
  Word,
} from "./types";

const NODE_ENV = process.env.NODE_ENV;

export function useBooks() {
  return useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: getBooks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLessons(bookId: string) {
  return useQuery<number[]>({
    queryKey: ["lessons", bookId],
    queryFn: async () => {
      const book = await getBook(bookId);
      if (!book || !book.lessons) return [];
      // Sửa ở đây để trả về mảng số
      const lessons = book.lessons.map((lesson) => lesson.id);
      return lessons;
    },
    enabled: !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLessonWords(bookId: string, lessonIds: number[]) {
  return useQuery<Word[]>({
    queryKey: ["lessonWords", bookId, lessonIds],
    queryFn: () => getLessonWords(bookId, lessonIds),
    enabled: !!bookId && lessonIds.length > 0, // Sửa ở đây
    staleTime: 5 * 60 * 1000,
  });
}

export function useReviewWords(userId: string) {
  return useQuery<ReviewWord[]>({
    queryKey: ["reviewWords", userId],
    queryFn: () => getReviewWords(userId) as Promise<ReviewWord[]>,
    enabled: !!userId,
  });
}

export function useCompletedLessons(userId: string, bookId: string | null) {
  return useQuery<number[]>({
    queryKey: ["completedLessons", userId, bookId],
    queryFn: () => getCompletedLessons(userId, bookId!),
    enabled: !!userId && !!bookId,
  });
}

export function useLessonStatuses(userId: string, bookId: string | null) {
  return useQuery({
    queryKey: ["lessonStatuses", userId, bookId],
    queryFn: () => getLessonStatuses(userId, bookId!),
    enabled: !!userId && !!bookId,
  });
}

export function useFlashcard() {
  const { session } = useAuth();
  const userId = session?.user?.id || "";
  const isGuest = !session?.user;
  const queryClient = useQueryClient();

  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedLessons, setSelectedLessons] = useState<number[]>([]);
  const [selectedMode, setSelectedMode] = useState<"flashcard" | "quiz">(
    "flashcard"
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongWords, setWrongWords] = useState<Word[]>([]);
  const [deck, setDeck] = useState<Word[]>([]);
  const [quizTimer, setQuizTimer] = useState<NodeJS.Timeout | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);
  const englishVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  const {
    data: books = [],
    isLoading: booksLoading,
    error: booksError,
  } = useBooks();

  const {
    data: lessonsForBook = [],
    isLoading: lessonsLoading,
    error: lessonsError,
  } = useLessons(selectedBook!);

  const {
    data: lessonWords = [],
    isLoading: lessonWordsLoading,
    error: lessonWordsError,
  } = useLessonWords(selectedBook!, selectedLessons);

  const { data: reviewWords = [] } = useReviewWords(userId);

  const { data: completedLessons = [] } = useCompletedLessons(
    userId,
    selectedBook
  );

  const { data: lessonStatuses = new Map() } = useLessonStatuses(
    userId,
    selectedBook
  );

  // Mutations for review words
  const addReviewWordMutation = useMutation({
    mutationFn: (word: Word) => addOrUpdateReviewWord(userId, word),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewWords", userId] });
    },
  });

  const decreaseReviewWordMutation = useMutation({
    mutationFn: (word: Word) => decreaseReviewCount(userId, word),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviewWords", userId] });
    },
  });

  const saveQuizResultMutation = useMutation({
    mutationFn: (resultData: Omit<QuizResult, "lastAttempt">) =>
      saveQuizResult(resultData),
    // We can add onSuccess later to invalidate queries for displaying results
  });

  const updateLessonStatusMutation = useMutation({
    mutationFn: (statusData: Omit<LessonStatus, "lastAttempt">) =>
      updateLessonStatus(statusData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["completedLessons", userId, variables.bookId],
      });
    },
  });

  // Cập nhật sách đã chọn
  const handleSetSelectedBook = useCallback((bookId: string) => {
    setSelectedBook(bookId);
    setSelectedLessons([]); // Reset lessons when choosing a new book
    setIsPlaying(false);
  }, []);

  // Cập nhật lessons đã chọn
  const handleSetSelectedLessons = useCallback((lessons: number[]) => {
    setSelectedLessons(lessons);
    setIsPlaying(false);
  }, []);

  // Cập nhật chế độ
  const handleSetSelectedMode = useCallback((mode: "flashcard" | "quiz") => {
    setSelectedMode(mode);
    setIsPlaying(false);
  }, []);

  // Set to track which words should hide text in quiz mode (20% random)
  const [hiddenWordIndices, setHiddenWordIndices] = useState<Set<number>>(new Set());

  // Bắt đầu học
  const startLearning = useCallback(() => {
    if (selectedLessons.length === 0 || lessonWords.length === 0) {
      return false;
    }

    // Combine and shuffle deck
    const newWords = lessonWords.filter(
      (lw) => !reviewWords.some((rw) => rw.word === lw.word)
    );
    const combinedDeck = [...reviewWords, ...newWords];
    const shuffledDeck = combinedDeck.sort(() => Math.random() - 0.5);

    const finalDeck = isGuest ? shuffledDeck.slice(0, 10) : shuffledDeck;

    // In quiz mode, randomly select 20% of words to hide text (listen-only)
    if (selectedMode === "quiz" && finalDeck.length > 0) {
      const hiddenCount = Math.max(1, Math.floor(finalDeck.length * 0.2)); // At least 1 word
      const indices = Array.from({ length: finalDeck.length }, (_, i) => i);
      // Shuffle indices and take first hiddenCount
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      const hiddenIndices = new Set(indices.slice(0, hiddenCount));
      setHiddenWordIndices(hiddenIndices);
    } else {
      setHiddenWordIndices(new Set());
    }

    setDeck(finalDeck);
    setCurrentIndex(0);
    setScore(0);
    setWrongWords([]);
    setSessionAnswers([]); // Reset session answers
    setIsPlaying(true);
    return true;
  }, [lessonWords, selectedLessons, isGuest, reviewWords, selectedMode]);

  // Xử lý câu trả lời
  const handleAnswer = useCallback(
    (isCorrect: boolean, word?: Word) => {
      const currentWord = word || deck[currentIndex];
      if (!currentWord) return;

      // Record the answer for final calculation
      const newSessionAnswers = [
        ...sessionAnswers,
        { word: currentWord, isCorrect },
      ];
      setSessionAnswers(newSessionAnswers);

      if (isCorrect) {
        setScore((prev) => prev + 1);
        if (
          selectedMode === "quiz" &&
          reviewWords.some((rw) => rw.word === currentWord.word)
        ) {
          decreaseReviewWordMutation.mutate(currentWord);
        }
      } else {
        setWrongWords((prev) => [...prev, currentWord]);
        addReviewWordMutation.mutate(currentWord);
      }

      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);

      if (nextIndex >= deck.length) {
        setIsPlaying(false);

        // Save quiz result if the mode is 'quiz'
        if (selectedMode === "quiz" && selectedBook) {
          // Calculate and save result for each lesson
          selectedLessons.forEach((lessonId) => {
            const wordsForThisLessonInDeck = deck.filter(
              (d) => d.lesson === lessonId
            );
            const totalWords = wordsForThisLessonInDeck.length;
            if (totalWords === 0) return;

            const answersForThisLesson = newSessionAnswers.filter(
              (ans) => ans.word.lesson === lessonId
            );
            const correctCount = answersForThisLesson.filter(
              (ans) => ans.isCorrect
            ).length;

            const accuracy = Math.round((correctCount / totalWords) * 100);
            const isCompleted = accuracy >= 90;

            const resultData: Omit<QuizResult, "lastAttempt"> = {
              userId,
              bookId: selectedBook,
              lessonId,
              accuracy,
              score: correctCount,
              totalWords,
              isCompleted,
            };
            saveQuizResultMutation.mutate(resultData);

            // Also update the lesson status
            const statusData: Omit<LessonStatus, "lastAttempt"> = {
              userId,
              bookId: selectedBook,
              lessonId,
              isCompleted,
              lastAccuracy: accuracy,
            };
            updateLessonStatusMutation.mutate(statusData);
          });
        }
      }
    },
    [
      currentIndex,
      deck,
      selectedMode,
      reviewWords,
      addReviewWordMutation,
      decreaseReviewWordMutation,
      sessionAnswers,
      selectedBook,
      selectedLessons,
      userId,
      saveQuizResultMutation,
      updateLessonStatusMutation,
    ]
  );

  // Load and pick an English voice (iOS-safe)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const pickEnglishVoice = (voices: SpeechSynthesisVoice[]) => {
      const preferLangs = ["en-US", "en-GB", "en_US", "en_GB"];
      const preferNames = [
        "Samantha",
        "Alex",
        "Victoria",
        "Daniel",
        "Moira",
        "Fred",
        "Serena",
      ];
      return (
        voices.find((v) => preferLangs.includes(v.lang)) ||
        voices.find((v) => v.lang?.toLowerCase().startsWith("en")) ||
        voices.find((v) => preferNames.some((n) => v.name.includes(n))) ||
        voices[0] ||
        null
      );
    };

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length) {
        englishVoiceRef.current = pickEnglishVoice(voices);
        return true;
      }
      return false;
    };

    if (!loadVoices()) {
      const iv = setInterval(() => {
        if (loadVoices()) clearInterval(iv);
      }, 250);
      // iOS đôi khi không bắn voiceschanged

      speechSynthesis.onvoiceschanged = () => {
        if (loadVoices()) clearInterval(iv);
      };
      return () => clearInterval(iv);
    }
  }, []);

  // Phát âm luôn dùng giọng tiếng Anh nếu có
  const speak = useCallback((text: string, lang: string = "en-US") => {
    // nếu là trình duyệt không hỗ trợ speechSynthesis thì return luôn
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    speechSynthesis.cancel(); // hủy các từ đang đọc

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;

    const chosen = englishVoiceRef.current;
    if (chosen) {
      utter.voice = chosen;
      utter.lang = chosen.lang;
    }

    speechSynthesis.speak(utter);
  }, []);

  // Reset trạng thái
  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setScore(0);
    setWrongWords([]);
    setDeck([]);
    setSessionAnswers([]); // Reset session answers
    if (quizTimer) {
      clearTimeout(quizTimer);
      setQuizTimer(null);
    }
  }, [quizTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || currentIndex >= deck.length) return;

      if (selectedMode === "flashcard") {
        if (e.key === "ArrowRight") {
          handleAnswer(true);
        } else if (e.key === "ArrowLeft") {
          handleAnswer(false);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, currentIndex, deck.length, selectedMode, handleAnswer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (quizTimer) {
        clearTimeout(quizTimer);
      }
    };
  }, [quizTimer]);

  // Thêm từ vào review words (dùng khi lật thẻ)
  const addToReviewWords = useCallback(
    (word: Word) => {
      if (!isGuest) {
        addReviewWordMutation.mutate(word);
      }
    },
    [addReviewWordMutation, isGuest]
  );

  return {
    // Data
    books: books,
    lessonsForBook,
    reviewWords,
    completedLessons,
    lessonStatuses,
    selectedBook,
    selectedLessons,
    selectedMode,
    deck,
    currentIndex,
    score,
    wrongWords,
    isPlaying,
    quizTimer,
    hiddenWordIndices, // Track which words should hide text in quiz mode

    // Loading states
    isLoading: booksLoading || lessonsLoading || lessonWordsLoading,

    // Error states
    booksError,
    lessonWordsError: lessonWordsError || lessonsError,

    // Actions
    setSelectedBook: handleSetSelectedBook,
    setSelectedLessons: handleSetSelectedLessons,
    setSelectedMode: handleSetSelectedMode,
    startLearning,
    handleAnswer,
    speak,
    reset,
    addToReviewWords, // Thêm từ vào review words
  };
}
