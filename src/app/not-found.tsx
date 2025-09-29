"use client";

import { Button } from "@/components/ui/Button";
import PageMotion, {
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/PageMotion";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageMotion showLoading={false}>
      <div className="bg-white min-h-screen flex items-center justify-center">
        <StaggerContainer>
          <StaggerItem>
            <div className="text-center">
              {/* 404 Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="mb-8"
              >
                <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
                <div className="text-6xl mb-4">😵</div>
              </motion.div>

              {/* Error Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Oops! Trang không tìm thấy
                </h1>
                <p className="text-lg text-gray-600 mb-2">
                  Xin lỗi, trang bạn đang tìm kiếm không tồn tại
                </p>
                <p className="text-gray-500">
                  Có thể trang đã bị xóa, đổi tên hoặc tạm thời không khả dụng
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Link href="/">
                  <Button
                    variant="primary"
                    className="flex items-center gap-2 px-6 py-3"
                  >
                    <Home className="w-5 h-5" />
                    Về trang chủ
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Quay lại
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-6 py-3"
                >
                  <Search className="w-5 h-5" />
                  Tải lại trang
                </Button>
              </motion.div>

              {/* Helpful Links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12"
              >
                <p className="text-gray-500 mb-4">
                  Hoặc thử các trang phổ biến:
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/streamline"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Streamline
                  </Link>
                  <Link
                    href="/lessons1000"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    1000 Bài luyện
                  </Link>
                  <Link
                    href="/grammar"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Ngữ pháp
                  </Link>
                  <Link
                    href="/classes"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Lớp học
                  </Link>
                </div>
              </motion.div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageMotion>
  );
}
