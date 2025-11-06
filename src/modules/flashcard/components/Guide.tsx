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
            <p>Chú ý:</p>
            <ul>
              <li>6.0 → 1</li>
              <li>6.1 → 2</li>
              <li>6.2 → 3</li>
              <li>6.3 → 4</li>
              <li>6.4 → 5</li>
              <li>6.5 → 6</li>
              <li>6.6 → 7</li>

              <br />

              <li>7.0 → 8</li>
              <li>7.1 → 9</li>
              <li>7.2 → 10</li>
              <li>7.3 → 11</li>
              <li>7.4 → 12</li>
              <li>7.5 → 13</li>
              <li>7.6 → 14</li>

              <br />

              <li>8.0 → 15</li>
              <li>8.1 → 16</li>
              <li>8.2 → 17</li>
              <li>8.3 → 18</li>
              <li>8.4 → 19</li>
              <li>8.5 → 20</li>
              <li>8.6 → 21</li>

              <br />

              <li>9.0 → 22</li>
              <li>9.1 → 23</li>
              <li>9.2 → 24</li>
              <li>9.3 → 25</li>
              <li>9.4 → 26</li>
              <li>9.5 → 27</li>
              <li>9.6 → 28</li>

              <br />

              <li>10.0 → 29</li>
              <li>10.1 → 30</li>
              <li>10.2 → 31</li>
              <li>10.3 → 32</li>
              <li>10.4 → 33</li>
              <li>10.5 → 34</li>
              <li>10.6 → 35</li>
              <li>10.7 → 36</li>
              <li>10.8 → 37</li>

              <br />

              <li>11.0 → 38</li>
              <li>11.1 → 39</li>
              <li>11.2 → 40</li>
              <li>11.3 → 41</li>
              <li>11.4 → 42</li>
              <li>11.5 → 43</li>
              <li>11.6 → 44</li>
              <li>11.7 → 45</li>
              <li>11.8 → 46</li>

              <br />

              <li>12.0 → 47</li>
              <li>12.1 → 48</li>
              <li>12.2 → 49</li>
              <li>12.3 → 50</li>
              <li>12.4 → 51</li>
              <li>12.5 → 52</li>
              <li>12.6 → 53</li>
              <li>12.7 → 54</li>
              <li>12.8 → 55</li>
            </ul>
          </div>
          <div className="pt-2 sm:pt-4 text-right">
            <Button onClick={() => setShowGuideModal(false)}>Đã hiểu</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
