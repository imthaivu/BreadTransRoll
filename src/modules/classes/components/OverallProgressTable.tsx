"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useBooks, useLessons } from "@/modules/flashcard";
import { cn } from "@/utils";
import Image from "next/image";
import { useMemo, useState } from "react";
import { FiAward, FiCheckCircle, FiDelete, FiPlay } from "react-icons/fi";
import { useClassMembers, useClassProgress } from "../hooks";

export function OverallProgressTable({ classId }: { classId: string }) {
  const [selectedBook, setSelectedBook] = useState<string>("");
  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [showLessonModal, setShowLessonModal] = useState(false);
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
        quizScore: quizActivity?.score,
        isQuizCompleted: quizActivity?.isCompleted,
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

        <div className="overflow-x-auto">
          {!hasSelection ? (
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
                      {student.avatarUrl && (
                        <Image
                          src={student.avatarUrl}
                          alt={student.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      {student.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : studentProgressData.length === 0 ? (
            <p className="text-muted p-4 text-center">
              Không có dữ liệu tiến độ cho lựa chọn này.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                    Học sinh
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                    Bài học
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[120px]">
                    Ngày nộp bài
                  </th>
                  {/* Audio */}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[80px]">
                    Audio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {studentProgressData.map((progress) => (
                  <tr key={progress.student.id}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      {progress.student.avatarUrl && (
                        <Image
                          src={progress.student.avatarUrl}
                          alt={progress.student.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      {progress.student.name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-bold">
                        {
                          books?.find(
                            (b) =>
                              b.id.toString() === progress.lessonDetails.book
                          )?.name
                        }
                      </span>
                      <span className="text-gray-500">
                        {" "}
                        - {progress.lessonDetails.lesson}
                      </span>
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
                      {progress.timestamp
                        ? progress.timestamp.toLocaleDateString()
                        : "Chưa nộp"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {progress?.speakingSubmissionUrl ? (
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
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <audio
            src={listeningAudio.url}
            controls
            autoPlay
            className="w-full"
            preload="auto"
          />
        )}
      </Modal>
    </>
  );
}
