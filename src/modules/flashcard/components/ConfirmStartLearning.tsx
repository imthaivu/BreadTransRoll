import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface ConfirmStartLearningProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: "flashcard" | "quiz";
}

export const ConfirmStartLearning = ({
  open,
  onClose,
  onConfirm,
  mode,
}: ConfirmStartLearningProps) => {
  const isFlashcardMode = mode === "flashcard";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isFlashcardMode ? "Xác nhận bắt đầu Flashcard" : "Xác nhận bắt đầu Quiz"}
      maxWidth="md"
      closeOnOverlayClick={false}
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          {isFlashcardMode
            ? "Flashcard chỉ giúp ôn từ / phát âm mẫu, Không nên học từ mới qua Flashcard nhé. Hãy học từ mới qua bài đọc tiếng anh mỗi ngày ."
            : "Tôi đã đọc bài kĩ, và phát âm chuẩn bài này rồi."}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Xác nhận
          </Button>
        </div>
      </div>
    </Modal>
  );
};

