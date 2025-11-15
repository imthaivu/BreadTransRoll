"use client";

import AudioPlayer from "@/components/streamline/AudioPlayer";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { LESSONS_1000_BOOKS, Lessons1000Book } from "@/constants/lessons1000";
import { STREAMLINE_BOOKS, StreamlineBook } from "@/constants/streamline";
import { useBooks, useLessons } from "@/modules/flashcard";
import { cn } from "@/utils";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiAward, FiCheckCircle, FiDelete, FiPlay, FiUser } from "react-icons/fi";
import { useClassMembers, useClassProgress } from "../hooks";
import { AudioPlayerWithDuration } from "./AudioPlayerWithDuration";

export function OverallProgressTable({ classId }: { classId: string }) {
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [listeningAudio, setListeningAudio] = useState<{
    url: string;
    studentName: string;
  } | null>(null);

  const { data: books } = useBooks();
  const {
    data: activities,
    isLoading,
    error,
  } = useClassProgress(classId, selectedBook, selectedLesson);
  const { data: lessons } = useLessons(selectedBook);
  const { data: members } = useClassMembers(classId);
  const students = useMemo(
    () => members?.filter((m) => m.role === "student"),
    [members]
  );

  // Map book ID to StreamlineBook or Lessons1000Book
  const audioBookData = useMemo<{
    type: "streamline" | "lessons1000";
    book: StreamlineBook | Lessons1000Book;
    audioFiles: string[];
    missingLessons: number[];
  } | null>(() => {
    if (!selectedBook) return null;
    
    const bookId = parseInt(selectedBook);
    
    // Streamline books: ID 1-4
    if (bookId >= 1 && bookId <= 4) {
      const streamlineBook = STREAMLINE_BOOKS.find((b) => b.id === bookId);
      if (streamlineBook) {
        return {
          type: "streamline" as const,
          book: streamlineBook,
          audioFiles: streamlineBook.audioFiles,
          missingLessons: streamlineBook.missingLessons,
        };
      }
    }
    
    // Lessons1000 books: ID 5-16
    if (bookId >= 5 && bookId <= 16) {
      const lessons1000Book = LESSONS_1000_BOOKS.find((b) => b.id === bookId);
      if (lessons1000Book) {
        return {
          type: "lessons1000" as const,
          book: lessons1000Book,
          audioFiles: lessons1000Book.audioFiles,
          missingLessons: [], // Lessons1000 doesn't have missingLessons
        };
      }
    }
    
    return null;
  }, [selectedBook]);

  // Check if selected lesson is missing or invalid
  const isLessonMissing = useMemo(() => {
    if (!selectedLesson || !audioBookData) return false;
    const lessonNum = parseInt(selectedLesson);
    return audioBookData.missingLessons.includes(lessonNum);
  }, [selectedLesson, audioBookData]);

  // Set currentLesson when selectedLesson changes
  useEffect(() => {
    if (selectedLesson && audioBookData) {
      const lessonNum = parseInt(selectedLesson);
      // Lesson numbers are 1-based, but array indices are 0-based
      const lessonIndex = lessonNum - 1;
      
      if (lessonIndex >= 0 && lessonIndex < audioBookData.audioFiles.length) {
        setCurrentLesson(lessonIndex);
      }
    }
  }, [selectedLesson, audioBookData]);

  const studentProgressData = useMemo(() => {
    if (!students || !selectedBook || !selectedLesson) {
      return [];
    }

    return students.map((student) => {
      const studentActivities = activities?.filter(
        (activity) => activity.student.id === student.id
      );

      const listeningActivity = studentActivities?.find(
        (a) => a.type === "listening"
      );
      const speakingActivity = studentActivities?.find(
        (a) => a.type === "speaking"
      );
      const quizActivity = studentActivities?.find((a) => a.type === "quiz");

      // Use the timestamp from the most recent activity for that student on that lesson
      const latestTimestamp = studentActivities?.reduce((latest, current) => {
        return current.timestamp > latest ? current.timestamp : latest;
      }, new Date(0));

      return {
        student,
        lessonDetails: { book: selectedBook, lesson: selectedLesson },
        listenCount: listeningActivity?.listenCount ?? 0,
        hasSpeakingSubmission: !!speakingActivity,
        speakingSubmissionUrl: speakingActivity?.sourceUrl ?? null,
        speakingFileDeleted: speakingActivity?.fileDeleted ?? false,
        speakingTimestamp: speakingActivity?.timestamp ?? null,
        quizScore: quizActivity?.score,
        isQuizCompleted: quizActivity?.isCompleted,
        quizTimestamp: quizActivity?.timestamp ?? null,
        timestamp: latestTimestamp === new Date(0) ? null : latestTimestamp,
      };
    });
  }, [students, selectedBook, selectedLesson, activities]);

  if (isLoading) return <div>Đang tải dữ liệu tổng hợp...</div>;
  if (error) return <div>Có lỗi xảy ra khi tải dữ liệu.</div>;

  const hasSelection = selectedBook && selectedLesson;

  return (
    <>
      <div className="p-4 bg-white dark:bg-gray-800 border border-border rounded-lg">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Book Selection */}
          <div className="flex items-center">
            <select
              value={selectedBook || ""}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                setSelectedLesson(""); // Reset lesson when book changes
              }}
              className="w-full md:w-auto px-2 py-1.5 h-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn sách --</option>
              {books &&
                books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Lesson Selection */}
          <div className="flex items-center">
            <Button
              onClick={() => setShowLessonModal(true)}
              variant="outline"
              className="w-full md:w-auto justify-center px-3 py-1.5 text-sm h-10 min-w-[150px]"
              disabled={!selectedBook}
            >
              {selectedLesson
                ? `Bài ${
                    lessons?.find((l) => l.toString() === selectedLesson) ??
                    selectedLesson
                  }`
                : "Chọn Bài học"}
            </Button>

            {selectedLesson && (
              <Button
                onClick={() => {
                  setSelectedBook("");
                  setSelectedLesson("");
                }}
                variant="ghost"
                className="ml-2 px-2 py-1.5 h-10"
                size="sm"
                aria-label="Xóa lựa chọn bài học"
              >
                <FiDelete className="text-red-400" />{" "}
                <span className="ml-2">Xóa lựa chọn</span>
              </Button>
            )}
          </div>
        </div>

        {/* Audio Player for Reference - Only show when book and lesson are selected */}
        {hasSelection && audioBookData && audioBookData.audioFiles.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                🎧 Bài nghe mẫu
              </h3>
            </div>
            {isLessonMissing ? (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Bài học {selectedLesson} không có file audio.
                </p>
              </div>
            ) : (
              <AudioPlayer
                key={`${selectedBook}-${selectedLesson}`}
                audioFiles={audioBookData.audioFiles}
                onLessonSelect={setCurrentLesson}
                currentLesson={currentLesson}
                missingLessons={audioBookData.missingLessons}
                hideLessonList={true}
                trackingContext={{
                  module: audioBookData.type,
                  itemKey: selectedBook,
                }}
              />
            )}
          </div>
        )}

        <div>
          {!hasSelection ? (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {students?.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-3 h-3 text-gray-500" />
                      </div>
                      {student.name}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Học sinh
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {students?.map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <FiUser className="w-3 h-3 text-gray-500" />
                          </div>
                          {student.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : studentProgressData.length === 0 ? (
            <p className="text-muted p-4 text-center">
              Không có dữ liệu tiến độ cho lựa chọn này.
            </p>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {studentProgressData.map((progress) => (
                  <div
                    key={progress.student.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3"
                  >
                    <div className="flex items-center gap-2 font-medium pb-2 border-b border-gray-200 dark:border-gray-600">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-4 h-4 text-gray-500" />
                      </div>
                      <span>{progress.student.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Số lần nghe:
                        </span>
                        <span className="ml-2 font-medium">
                          {progress.listenCount > 0 ? progress.listenCount : "—"}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Nộp bài nói:
                        </span>
                        <span className="ml-2">
                          {progress.hasSpeakingSubmission ? (
                            <FiCheckCircle className="inline text-green-500" />
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Quiz Accuracy:
                        </span>
                        <span className="ml-2 font-medium">
                          {progress.quizScore !== undefined
                            ? `${progress.quizScore}%`
                            : "—"}
                          {progress.isQuizCompleted && (
                            <FiAward className="inline ml-1 text-green-500" />
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Audio:
                        </span>
                        <span className="ml-2">
                          {progress?.speakingSubmissionUrl ? (
                            progress.speakingFileDeleted ? (
                              <span className="text-xs text-gray-500 italic">
                                File đã xóa
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setListeningAudio({
                                    url: progress.speakingSubmissionUrl!,
                                    studentName: progress.student.name,
                                  })
                                }
                                aria-label={`Nghe bài nói của ${progress.student.name}`}
                                className="p-1"
                              >
                                <FiPlay className="h-4 w-4" />
                              </Button>
                            )
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Ngày nộp Quiz:
                        </span>
                        <span className="ml-2">
                          {progress.quizTimestamp
                            ? progress.quizTimestamp.toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Chưa nộp"}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Ngày nộp Audio:
                        </span>
                        <span className="ml-2">
                          {progress.speakingTimestamp
                            ? progress.speakingTimestamp.toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Chưa nộp"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                        Học sinh
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[80px]">
                        Số lần nghe
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[80px]">
                        Nộp bài nói
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                        Quiz Accuracy
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                        Ngày nộp Quiz
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                        Ngày nộp Audio
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[80px]">
                        Audio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {studentProgressData.map((progress) => (
                      <tr key={progress.student.id}>
                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                            <FiUser className="w-3 h-3 text-gray-500" />
                          </div>
                          {progress.student.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {progress.listenCount > 0 ? progress.listenCount : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {progress.hasSpeakingSubmission ? (
                            <FiCheckCircle className="mx-auto text-green-500" />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {progress.quizScore !== undefined
                            ? `${progress.quizScore}%`
                            : "—"}
                          {progress.isQuizCompleted && (
                            <FiAward className="inline ml-1 text-green-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {progress.quizTimestamp
                            ? progress.quizTimestamp.toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Chưa nộp"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {progress.speakingTimestamp
                            ? progress.speakingTimestamp.toLocaleString("vi-VN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Chưa nộp"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {progress?.speakingSubmissionUrl ? (
                            progress.speakingFileDeleted ? (
                              <span className="text-xs text-gray-500 italic">
                                File đã xóa
                              </span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setListeningAudio({
                                    url: progress.speakingSubmissionUrl!,
                                    studentName: progress.student.name,
                                  })
                                }
                                aria-label={`Nghe bài nói của ${progress.student.name}`}
                              >
                                <FiPlay className="h-5 w-5" />
                              </Button>
                            )
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lesson Selection Modal */}
      <Modal
        open={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        title={`Chọn Lessons cho Sách ${
          (books &&
            books.find((b) => b.id.toString() === selectedBook)?.name) ||
          ""
        }`}
      >
        {lessons && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto p-2">
              {lessons.map((lesson) => {
                const lessonNum = Number(lesson);
                const isSelected = lessonNum.toString() === selectedLesson;

                return (
                  <Button
                    className={cn("border rounded-md p-2", {
                      "bg-blue-500 text-white": isSelected,
                      "hover:bg-blue-100": !isSelected,
                    })}
                    onClick={() => {
                      setSelectedLesson(lessonNum.toString());
                      setShowLessonModal(false); // Close modal on selection
                    }}
                    variant="outline"
                    key={lesson}
                  >
                    {lesson}
                  </Button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                onClick={() => {
                  setSelectedLesson(""); // Clear selection
                  setShowLessonModal(false);
                }}
                variant="ghost"
              >
                Xóa lựa chọn
              </Button>
              <Button
                onClick={() => {
                  setShowLessonModal(false);
                }}
              >
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Audio Player Modal */}
      <Modal
        open={!!listeningAudio}
        onClose={() => setListeningAudio(null)}
        title={`Bài nói của ${listeningAudio?.studentName}`}
        maxWidth="md"
      >
        {listeningAudio?.url && (
          <div className="p-4">
            <AudioPlayerWithDuration
              src={listeningAudio.url}
              autoPlay
              className="w-full"
            />
          </div>
        )}
      </Modal>
    </>
  );
}
