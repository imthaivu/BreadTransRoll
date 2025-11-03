"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { RequireAuth, RequireRole } from "@/lib/auth/guard";
import { UserRole } from "@/lib/auth/types";
import { AdminModal } from "@/modules/admin";
import {
  AudioRecorder,
  SubmissionControls,
  useSpeakingUpload,
} from "@/modules/speaking-upload/";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SpeakingUploadPage() {
  const router = useRouter();
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
    isAIAnalyzing,
    aiError,
    setAiError,
    showSpinPopup,
    setShowSpinPopup,
  } = useSpeakingUpload();

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
            <div className="text-center pt-4 mb-4 sm:pt-8 sm:mb-8">
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

            {/* { && (
              <div className="w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-blue-700">
                    Đang tải lên...
                  </span>
                  <span className="text-sm font-medium text-blue-700">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )} */}

            {/* Fake AI Analysis Loading */}

            <Modal
              open={isAIAnalyzing}
              onClose={() => {}}
              title="AI Phân Tích Bài Nói"
              hideCloseButton
              showHeader={false}
              maxWidth="md"
              className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
            >
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center"></div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  AI đang phân tích...
                </h3>

                <div className="space-y-2 text-sm text-purple-700">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    <span>Đang so sánh với mẫu chuẩn</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <span>Phân tích phát âm và ngữ điệu</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                    <span>Đánh giá độ chính xác</span>
                  </div>
                </div>
              </div>
            </Modal>

            {/* AI Error Message */}
            {!isAIAnalyzing && aiError && (
              <div className="w-full max-w-md p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <span className="ml-2 text-lg font-semibold text-red-800">
                      AI Phân Tích
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                    <p className="text-sm text-red-700 whitespace-pre-line">
                      {aiError}
                    </p>
                  </div>

                  <div className="relative w-full h-60 rounded-xl mt-4 overflow-hidden">
                    <Image
                      src={"/assets/images/error-submit-speaking.jpg"}
                      alt="Error Submit Speaking"
                      fill
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Regular Error Message */}
            {isError && !aiError && (
              <div
                className="p-4 text-sm text-red-700 bg-red-100 rounded-lg"
                role="alert"
              >
                <span className="font-medium">Lỗi!</span>{" "}
                {error?.message || "Đã có lỗi xảy ra khi nộp bài."}
              </div>
            )}

            {isSuccess && !isAIAnalyzing && (
              <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">
                <span className="font-medium">Thành công!</span> Bạn đã nộp bài
                thành công.
              </div>
            )}

            <div className="pt-4 text-center">
              <Button
                onClick={() => submit()}
                disabled={!canSubmit}
                className="w-full sm:w-auto px-8 py-3 text-lg"
              >
                {isUploading ? "Đang xử lý..." : "Nộp bài"}
              </Button>
            </div>
          </div>
        </div>

        {/* Spin Popup Modal */}
        <Modal
          open={showSpinPopup}
          onClose={() => setShowSpinPopup(false)}
          title="🎉 Chúc mừng!"
          maxWidth="md"
        >
          <div className="text-center p-6">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎊</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">
                Bạn đã hoàn thành đủ điều kiện!
              </h3>
              <p className="text-gray-600 mb-4">
                Bạn đã hoàn thành quiz với độ chính xác cao và nộp bài nói thành
                công. Hãy thử vận may của bạn tại vòng quay bánh rán!
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => {
                  setShowSpinPopup(false);
                  router.push("/spin-dorayaki");
                }}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-full"
              >
                🎯 Đi quay bánh rán ngay!
              </Button>

              <Button
                onClick={() => setShowSpinPopup(false)}
                variant="outline"
                className="w-full"
              >
                Để sau
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Lưu ý:</strong> Bạn có thể quay bánh rán bất cứ lúc
                nào từ menu chính
              </p>
            </div>
          </div>
        </Modal>
      </RequireRole>
    </RequireAuth>
  );
}
