"use client";

import { motion } from "framer-motion";

export default function ImportantNotice() {
  return (
    <section className="max-w-4xl mx-auto mb-8">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-2 md:p-4 border border-amber-200 shadow-md"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-amber-800 mb-2 flex items-center justify-center gap-2">
              📌 Lưu ý quan trọng
            </h3>
          </div>

          <div className="mx-auto">
            <p className="text-sm md:text-base text-amber-900 mb-6 leading-relaxed">
              Thầy sẽ bắt đầu vào{" "}
              <strong className="text-amber-800">
                Tiểu chủng viện Giáo phận Phú Cường
              </strong>{" "}
              từ{" "}
              <span className="bg-amber-200 px-2 py-1 rounded font-semibold text-amber-900">
                tháng 9/2027
              </span>
              . Vì vậy, lộ trình học sẽ có điều chỉnh:
            </p>

            <ul className="space-y-4 text-amber-900">
              <li className="flex items-start gap-3 p-4 bg-white/50 rounded-lg border border-amber-100">
                <span className="text-amber-600 font-bold text-xl mt-1">•</span>
                <span className="text-sm md:text-base">
                  Học với{" "}
                  <strong className="text-amber-800">
                    Bạn của Thầy 7.0 IELTS Cử nhân Ngôn ngữ Anh
                  </strong>
                  .
                </span>
              </li>
              <li className="flex items-start gap-3 p-4 bg-white/50 rounded-lg border border-amber-100">
                <span className="text-amber-600 font-bold text-xl mt-1">•</span>
                <span className="text-sm md:text-base">
                  Hoặc học với{" "}
                  <strong className="text-amber-800">Cô Linh</strong> (nếu lúc
                  đó cô đạt IELTS {">"} 6.5).
                </span>
              </li>
              <li className="flex items-start gap-3 p-4 bg-white/50 rounded-lg border border-amber-100">
                <span className="text-amber-600 font-bold text-xl mt-1">•</span>
                <span className="text-sm md:text-base">
                  Nếu bạn tự giác, hoàn toàn có thể học qua{" "}
                  <strong className="text-amber-800">
                    Khóa video thu sẵn IELTS
                  </strong>
                  . Cách này chậm hơn một chút nhưng{" "}
                  <strong className="text-amber-800">
                    tiết kiệm nhiều chi phí cho gia đình
                  </strong>
                  .
                </span>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
