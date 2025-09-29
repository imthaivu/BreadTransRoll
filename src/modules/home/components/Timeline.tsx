"use client";

import { motion } from "framer-motion";
import "./Timeline.css";
import Image from "next/image";

const timelineData = [
  {
    id: "month-1",
    title: "Sau tháng đầu tiên",
    items: [
      "Lấy gốc ngữ pháp cơ bản.",
      "Vững phiên âm IPA, tăng tốc học từ mới.",
      "Nghe và phát âm chuẩn từ vựng phổ biến.",
    ],
  },
  {
    id: "month-6",
    title: "Sau 6 tháng",
    items: [
      "Điểm tiếng Anh trên trường loại khá.",
      "Tự tập hát tiếng Anh bài bất kì.",
      "Giao tiếp chậm cơ bản với người nước ngoài.",
    ],
  },
  {
    id: "year-1",
    title: "Sau 1 năm",
    items: [
      "Điểm tiếng Anh trên trường loại giỏi.",
      "Giao tiếp cơ bản với người nước ngoài.",
    ],
  },
  {
    id: "year-1-6",
    title: "Sau 1 năm 6 tháng",
    items: [
      "Top HS giỏi tiếng Anh trong lớp.",
      "Làm được ~80% đề thi tuyển sinh 10.",
      "Tự tin giao tiếp với người nước ngoài.",
    ],
  },
  {
    id: "year-2",
    title: "Sau 2 năm",
    items: [
      "Top HS giỏi tiếng Anh trong trường.",
      "Ngữ pháp từ vựng đủ đạt được trên 50% đề thi ĐH.",
      "Có thể nghe được 60% bản tin VOA.",
    ],
  },
  {
    id: "year-2-6",
    title: "Sau 2 năm 6 tháng",
    items: [
      "Xem phim bản xứ hiểu ~50%.",
      "Ngữ pháp từ vựng đủ đạt được trên 60% đề thi ĐH.",
      "IELTS 4.5.",
    ],
  },
  {
    id: "year-3",
    title: "Sau 3 năm",
    items: [
      "Xem phim bản xứ hiểu ~60%.",
      "Ngữ pháp từ vựng đủ đạt được trên 80% đề thi ĐH.",
      "IELTS 6.0 (nghe đọc ~7 và nói viết ~5).",
    ],
  },
  {
    id: "year-3-6",
    title: "Sau 3 năm 6 tháng",
    items: ["IELTS 6.5 với nghe đọc >7 và nói viết >5."],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: "easeOut" as const,
    },
  }),
};

export default function Timeline() {
  return (
    <section className="mb-8">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-4"
        >
          <h3 className="text-4xl font-black text-blue-900 mb-4">Lộ Trình</h3>
          <p className="text-lg text-blue-900 max-w-2xl mx-auto">
            Hành trình học tiếng Anh từ cơ bản đến thành thạo với Doraemon
          </p>
        </motion.div>

        <div className="timeline">
          {timelineData.map((item, index) => (
            <motion.div
              key={item.id}
              className={`card-about ${item.id} my-4 p-2 md:p-4`}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={index}
            >
              <h2 className="text-2xl font-bold text-blue-900 mb-4">
                {item.title}
              </h2>
              <ul className="space-y-2">
                {item.items.map((listItem, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-blue-800 flex items-start gap-2"
                  >
                    <span className="text-blue-500 mt-1">✓</span>
                    <span>{listItem}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-4 mt-4"
        >
          <h3 className="text-4xl font-black text-blue-900 mb-4">
            Toàn bộ giáo trình nước ngoài
          </h3>
          <div className="w-full min-h-[100px] relative aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden border-4 border-blue-200 shadow-lg">
            <Image src="/assets/images/tai-lieu.png" alt="Tài liệu" fill />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
