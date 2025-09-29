"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useState } from "react";

export const Guide = () => {
  const [showGuideModal, setShowGuideModal] = useState(false);

  return (
    <>
      <div className="text-center md:py-2">
        <Button
          variant="ghost"
          onClick={() => setShowGuideModal(true)}
          className="text-blue-600 hover:text-blue-800"
        >
          <span className="mr-2">💡</span>
          Xem hướng dẫn
        </Button>
      </div>

      <Modal
        open={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Hướng dẫn sử dụng Flashcard"
      >
        <div className="space-y-2 sm:space-y-4 text-gray-700">
          <div>
            <h4 className="font-semibold text-lg mb-2">
              Bắt đầu một phiên học:
            </h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <strong>Chọn sách:</strong> Chọn một cuốn sách từ danh sách.
              </li>
              <li>
                <strong>Chọn lessons:</strong> Nhấn vào nút &quot;Chọn
                Lessons&quot; và chọn một hoặc nhiều bài học bạn muốn ôn tập.
              </li>
              <li>
                <strong>Chọn chế độ:</strong> Lựa chọn giữa
                &quot;Flashcard&quot; hoặc &quot;Quiz&quot;.
              </li>
              <li>
                <strong>Bắt đầu:</strong> Nhấn nút &quot;Bắt đầu học&quot; để
                vào giao diện học tập.
              </li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">🃏 Chế độ Flashcard:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Lật thẻ:</strong> Nhấp vào giữa thẻ để xem nghĩa của từ.
              </li>
              <li>
                <strong>Trả lời:</strong> Kéo thẻ sang{" "}
                <strong className="text-green-600">phải</strong> nếu bạn đã biết
                từ, hoặc sang <strong className="text-red-600">trái</strong> nếu
                chưa biết.
              </li>
              <li>
                <strong>Phím tắt:</strong> Sử dụng phím mũi tên{" "}
                <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                  ←
                </kbd>{" "}
                (chưa biết) và{" "}
                <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                  →
                </kbd>{" "}
                (biết).
              </li>
              <li>
                <strong>Nghe lại:</strong> Nhấp vào biểu tượng loa 🔊 để nghe
                lại phát âm.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">🧠 Chế độ Quiz:</h4>
            <p>
              Chọn câu trả lời đúng cho từ vựng được hiển thị trước khi hết thời
              gian.
            </p>
          </div>
          <div className="pt-2 sm:pt-4 text-right">
            <Button onClick={() => setShowGuideModal(false)}>Đã hiểu</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
