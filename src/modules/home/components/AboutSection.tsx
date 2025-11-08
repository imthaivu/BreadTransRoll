"use client";

import { motion } from "framer-motion";
import ImportantNotice from "./ImportantNotice";

export default function AboutSection() {
  return (
    <div className="max-w-6xl mx-auto mb-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Course Info Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-gray-50 rounded-xl p-2 md:p-6 border border-gray-200 shadow-md mb-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
              Khóa Học
            </h3>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <div>
                  <h4 className="font-semibold text-secondary-foreground">
                    Ngữ pháp + Thực hành
                  </h4>
                  <p className="text-sm md:text-base text-secondary-foreground">
                    Kết hợp lý thuyết và thực tế
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                <div>
                  <h4 className="font-semibold text-secondary-foreground">
                    Quay video hàng ngày
                  </h4>
                  <p className="text-sm md:text-base text-secondary-foreground">
                    Sửa lỗi phát âm liên tục
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-col flex items-center justify-center w-full text-center h-full  bg-primary rounded-lg p-6 shadow-sm">
              <h4 className="text-4xl text-primary-foreground mb-1">
                Học phí hơn <b>50k</b>/ngày
              </h4>
              <p className="text-xl text-primary-foreground">1.6 triệu/tháng</p>
            </div>
          </div>
        </motion.div>

        <ImportantNotice />
      </motion.div>
    </div>
  );
}
