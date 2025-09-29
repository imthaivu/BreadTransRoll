"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import ImportantNotice from "./ImportantNotice";

export default function AboutSection() {
  const [showQRCode, setShowQRCode] = useState(false);
  const [showZaloQR, setShowZaloQR] = useState(false);

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
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Khóa Học
            </h3>
            <p className="text-gray-600">
              15 buổi/tháng - Học vui, hiệu quả cao
            </p>
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

            <div className="flex-col flex items-center justify-center w-full text-center h-full bg-primary rounded-lg p-6 shadow-sm">
              <h4 className="text-4xl text-primary-foreground mb-1">
                Học phí chỉ <b>50k</b>/ngày
              </h4>
              <p className="text-xl text-primary-foreground">1.5 triệu/tháng</p>
            </div>
          </div>
        </motion.div>

        <ImportantNotice />

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <div className="bg-white rounded-xl p-2 md:p-6 shadow-md border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Liên Hệ & Thanh toán{" "}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Image
                  src={"/assets/images/zalo.png"}
                  alt="Zalo"
                  width={40}
                  height={40}
                  className="mb-2 mx-auto"
                />
                <h4 className="font-semibold text-gray-800 mb-1">Zalo</h4>
                <p className="text-primary font-medium">0377180010</p>
                <p className="text-sm md:text-base text-gray-600">
                  Vũ Quốc Thái
                </p>

                {/* Zalo QR Button */}
                <div className="flex flex-col gap-2 mt-3">
                  <button
                    onClick={() => setShowZaloQR(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors duration-200"
                  >
                    QR Zalo
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <Image
                  src={"/assets/images/vcb.png"}
                  alt="Vietcombank"
                  width={40}
                  height={40}
                  className="mb-2 mx-auto"
                />
                <h4 className="font-semibold text-gray-800 mb-1">Ngân hàng</h4>
                <p className="text-sm md:text-base text-gray-600">1028723537</p>
                <p className="text-sm md:text-base text-gray-600">
                  VU QUOC THAI
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-2 mt-3">
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-colors duration-200"
                  >
                    Hiện mã QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQRCode(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-2 md:p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Mã QR Thanh toán
                </h3>
                <p className="text-gray-600">
                  Quét mã QR để thanh toán nhanh chóng
                </p>
              </div>

              {/* QR Code */}
              <div className="text-center mb-6">
                <div className="bg-gray-50 p-6 rounded-xl inline-block">
                  <Image
                    src={"/assets/images/bank.png"}
                    alt="QR Code"
                    width={250}
                    height={250}
                    className="mx-auto rounded-lg"
                  />
                </div>
              </div>

              {/* Bank Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 text-center">
                  Thông tin chuyển khoản
                </h4>
                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngân hàng:</span>
                    <span className="font-medium">Vietcombank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tài khoản:</span>
                    <span className="font-medium">1028723537</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Chủ tài khoản:</span>
                    <span className="font-medium">VU QUOC THAI</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="text-center">
                <button
                  onClick={() => setShowQRCode(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zalo QR Code Modal */}
      <AnimatePresence>
        {showZaloQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={() => setShowZaloQR(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl p-2 md:p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  QR Code Zalo
                </h3>
                <p className="text-gray-600">Quét mã QR để kết bạn Zalo</p>
              </div>

              {/* QR Code */}
              <div className="text-center mb-6">
                <div className="bg-gray-50 p-6 rounded-xl inline-block">
                  <Image
                    src={"/assets/images/qr-zalo.jpg"}
                    alt="Zalo QR Code"
                    width={250}
                    height={250}
                    className="mx-auto rounded-lg"
                  />
                </div>
              </div>

              {/* Zalo Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2 text-center">
                  Thông tin liên hệ
                </h4>
                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zalo:</span>
                    <span className="font-medium">0377180010</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tên:</span>
                    <span className="font-medium">Vũ Quốc Thái</span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="text-center">
                <button
                  onClick={() => setShowZaloQR(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
