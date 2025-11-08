"use client";

import { Button } from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import {
  AudioRecorder,
  SubmissionControls,
  useSpeakingUpload,
} from "@/modules/speaking-upload/";
import { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default function SpeakingUploadPage() {
  const {
    books,
    lessons,
    selectedBook,
    selectedLesson,
    selectedFile,
    booksLoading,
    lessonsLoading,
    isUploading,
    isSuccess,
    isError,
    error,
    handleBookChange,
    setSelectedLesson,
    setSelectedFile,
    submit,
    recorderResetToken,
    canSubmit,
  } = useSpeakingUpload();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSubmitClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
    submit();
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    if (selectedFile && !isUploading) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () =>
        window.removeEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {};
  }, [selectedFile, isUploading]);

  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.STUDENT]}>
        <div className="bg-white min-h-screen flex justify-center items-start">
          <div className="w-full max-w-2xl space-y-4 flex flex-col items-center">
            <div className="text-center">
              <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
                Nộp bài nói
              </h1>
            </div>

            <SubmissionControls
              books={books}
              lessons={lessons}
              selectedBook={selectedBook}
              selectedLesson={selectedLesson}
              onBookChange={handleBookChange}
              onLessonChange={setSelectedLesson}
              booksLoading={booksLoading}
              lessonsLoading={lessonsLoading}
              disabled={isUploading}
            />

            <AudioRecorder
              key={recorderResetToken}
              onRecordingComplete={setSelectedFile}
              disabled={!selectedBook || !selectedLesson || isUploading}
            />

            {/* Error Message */}
            {isError && (
              <div
                className="p-4 text-sm text-red-700 bg-red-100 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Lỗi!</span>{" "}
                {error?.message || "Đã có lỗi xảy ra khi nộp bài."}
              </div>
            )}

            {isSuccess && (
              <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">
                <span className="font-medium">Thành công!</span> Bạn đã nộp bài
                thành công.
              </div>
            )}

            <div className="pt-4 text-center">
              <Button
                onClick={handleSubmitClick}
                disabled={!canSubmit}
                className="w-full sm:w-auto px-8 py-3 text-lg"
              >
                {isUploading ? "Đang xử lý..." : "Nộp bài"}
              </Button>
            </div>

            {/* Confirmation Dialog */}
            <ConfirmDialog
              isOpen={showConfirmDialog}
              onClose={() => setShowConfirmDialog(false)}
              onConfirm={handleConfirmSubmit}
              title="Xác nhận nộp bài"
              message={
                <>
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      ⚠️ Lưu ý quan trọng:
                    </p>
                    <p className="text-sm text-yellow-700">
                      Nếu bạn nghe không tập trung, nói lại không chuẩn sẽ được
                      BreadTrans cho học phụ đạo.
                    </p>
                  </div>
                  <p className="text-base font-medium text-gray-800">
                    Bạn có chắc chắn đã nghe kĩ trước khi nói chưa?
                  </p>
                </>
              }
              confirmText="Có, tôi chắc chắn"
              cancelText="Hủy"
              confirmVariant="primary"
              icon={<FiAlertTriangle className="text-yellow-500" />}
            />
          </div>
        </div>
      </RequireRole>
    </RequireAuth>
  );
}
