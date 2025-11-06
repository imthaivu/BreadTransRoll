"use client";

import { useAuth } from "@/lib/auth/context";
import { db } from "@/lib/firebase/client";
import { useBooks, useLessons } from "@/modules/flashcard/hooks";
import { useMutation } from "@tanstack/react-query";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { uploadSpeakingSubmission } from "./services";
import { SPEAKING_MAX_FILE_BYTES } from "./types";

const NODE_ENV = process.env.NODE_ENV;
const MAX_LISTEN_COUNT = 2; // Minimum listens required before submission
const MIN_AUDIO_DURATION = NODE_ENV === "development" ? 0 : 30; // Minimum audio duration in seconds

export function useSpeakingUpload() {
  const { session } = useAuth();
  const studentId = session?.user?.id || "";

  // State management
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recorderResetToken, setRecorderResetToken] = useState(0);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { data: books = [], isLoading: booksLoading } = useBooks();
  const { data: lessons = [], isLoading: lessonsLoading } = useLessons(
    selectedBook!
  );

  // Kiểm tra đã nghe đủ chưa
  const checkHasListenedEnough = async () => {
    if (!studentId || !selectedBook || !selectedLesson) return null;

    const q = query(
      collection(db, "listeningProgress"),
      where("studentId", "==", studentId),
      where("itemKey", "==", selectedBook),
      where("audioId", "==", selectedLesson.toString())
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];

    const listenCount = doc.data().listenCount || 0;
    return listenCount >= MAX_LISTEN_COUNT;
  };

  // Kiểm tra độ dài audio
  const checkAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = document.createElement("audio");
      audio.src = URL.createObjectURL(file);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", (e) => {
        reject(e);
      });
    });
  };


  const handleSubmit = async () => {
    try {
      setAiError(null);
      setIsAIAnalyzing(true);
      await new Promise((resolve) => setTimeout(resolve, 3000));

      if (!selectedFile || !studentId || !selectedBook || !selectedLesson) {
        throw new Error("Dữ liệu nộp bài không đầy đủ.");
      }
      if (selectedFile.size > SPEAKING_MAX_FILE_BYTES) {
        throw new Error("File nộp vượt quá 15MB, vui lòng thử lại.");
      }

      const duration = await checkAudioDuration(selectedFile);
      if (duration < MIN_AUDIO_DURATION) {
        throw new Error("Thời lượng audio quá ngắn, vui lòng thử lại.");
      }

      const isListenEnough = await checkHasListenedEnough();

      if (!isListenEnough) {
        throw new Error(
          `Công nghệ AI phát hiện bài nói của bạn chưa khớp với mẫu.
            👉 Bước 1: Đọc chậm và đánh vần chuẩn từng từ.
            👉 Bước 2: Nghe lại, gạch chân từ/cụm từ khó, chú ý nối âm và nuốt âm như người bản xứ.`
        );
      }

      setAiError(null);
      setIsAIAnalyzing(false);

      return uploadSpeakingSubmission(
        selectedFile,
        studentId,
        session?.user?.name || "Chưa đặt tên",
        selectedBook,
        selectedLesson,
        setUploadProgress
      );
    } catch (error) {
      // Deplay log err
      throw error;
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  const handleBookChange = (bookId: string) => {
    setSelectedBook(bookId);
    setSelectedLesson(null); // Reset lesson when book changes
  };

  const {
    mutate: submit,
    isPending: isUploading,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationFn: handleSubmit,
    onSuccess: (downloadURL) => {
      setSelectedFile(null);
      setUploadProgress(0);
      setRecorderResetToken((x) => x + 1);

      const docId = `${studentId}_${selectedBook}_${selectedLesson}`;
      setLastSubmissionId(docId);
    },
    onError: (error) => {
      setAiError(error.message || "Lỗi không xác định, vui lòng thử lại.");
    },
  });

  // Check if can submit (has file, no need to check listening here)
  const canSubmit =
    selectedBook && selectedLesson && selectedFile && !isUploading;

  // Khi selectLesson thay đổi thì reset lại file
  useEffect(() => {
    setSelectedFile(null);
    setRecorderResetToken((x) => x + 1);
    setAiError(null);
    setIsAIAnalyzing(false);
  }, [selectedLesson]);

  return {
    // Data
    books,
    lessons,
    selectedBook,
    selectedLesson,
    selectedFile,

    // State
    booksLoading,
    lessonsLoading,
    isUploading,
    uploadProgress,
    isSuccess,
    isError,
    error,
    recorderResetToken,
    lastSubmissionId,
    canSubmit,
    isAIAnalyzing,
    aiError,
    setAiError,

    // Actions
    handleBookChange,
    setSelectedLesson,
    setSelectedFile,
    submit,
  };
}
